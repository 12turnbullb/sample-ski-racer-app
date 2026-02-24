#!/usr/bin/env python3
"""
One-time migration script: SQLite → Aurora PostgreSQL + S3.

Reads all records from the local SQLite database and inserts them into Aurora.
Also re-uploads any local document files from disk to S3.

Usage:
  1. Temporarily allow external access to Aurora (e.g. via RDS Proxy, Bastion, or
     adding your IP to the security group for the duration of migration).

  2. Set environment variables:
       AURORA_URL=postgresql://user:pass@host:5432/skiapp
       UPLOADS_BUCKET=ski-app-uploads-{account}-{region}
       AWS_PROFILE=your-profile   (or use IAM role)
       AWS_DEFAULT_REGION=us-east-1

  3. Run from the repo root:
       pip install sqlalchemy psycopg2-binary boto3
       python scripts/migrate_sqlite_to_aurora.py

  4. Re-restrict Aurora security group access.
"""

import os
import sys
import sqlite3
import json
import uuid
from pathlib import Path
from datetime import datetime

try:
    from sqlalchemy import create_engine, text
    import boto3
    from botocore.exceptions import ClientError
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install with: pip install sqlalchemy psycopg2-binary boto3")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SQLITE_PATH = Path(__file__).parent.parent / "backend" / "data" / "ski_racer.db"
LOCAL_UPLOADS_DIR = Path(__file__).parent.parent / "backend" / "uploads" / "documents"

AURORA_URL = os.environ.get("AURORA_URL")
UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET")
AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")


def validate_config():
    errors = []
    if not SQLITE_PATH.exists():
        errors.append(f"SQLite database not found at: {SQLITE_PATH}")
    if not AURORA_URL:
        errors.append("AURORA_URL environment variable is not set")
    if not UPLOADS_BUCKET:
        errors.append("UPLOADS_BUCKET environment variable is not set (S3 file migration will be skipped)")
    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        if not AURORA_URL:
            sys.exit(1)


def read_sqlite():
    """Read all records from the SQLite database."""
    conn = sqlite3.connect(str(SQLITE_PATH))
    conn.row_factory = sqlite3.Row

    racers = [dict(r) for r in conn.execute("SELECT * FROM racers").fetchall()]
    documents = [dict(r) for r in conn.execute("SELECT * FROM documents").fetchall()]
    events = [dict(r) for r in conn.execute("SELECT * FROM events").fetchall()]

    conn.close()
    print(f"Read from SQLite: {len(racers)} racers, {len(documents)} documents, {len(events)} events")
    return racers, documents, events


def upload_file_to_s3(s3_client, local_path: Path, s3_key: str) -> bool:
    """Upload a local file to S3. Returns True on success."""
    if not local_path.exists():
        print(f"  WARNING: local file not found, skipping: {local_path}")
        return False
    try:
        s3_client.upload_file(str(local_path), UPLOADS_BUCKET, s3_key)
        print(f"  Uploaded {local_path.name} → s3://{UPLOADS_BUCKET}/{s3_key}")
        return True
    except ClientError as e:
        print(f"  ERROR uploading {local_path}: {e}")
        return False


def migrate(racers, documents, events):
    """Insert all records into Aurora and upload files to S3."""
    aurora_engine = create_engine(AURORA_URL, echo=False)
    s3_client = boto3.client("s3", region_name=AWS_REGION) if UPLOADS_BUCKET else None

    with aurora_engine.begin() as conn:
        # Create tables if they don't exist yet
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS racers (
                id VARCHAR PRIMARY KEY,
                racer_name VARCHAR NOT NULL,
                height FLOAT NOT NULL,
                weight FLOAT NOT NULL,
                ski_types TEXT NOT NULL,
                binding_measurements TEXT NOT NULL,
                personal_records TEXT NOT NULL,
                racing_goals TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS documents (
                id VARCHAR PRIMARY KEY,
                racer_id VARCHAR NOT NULL REFERENCES racers(id) ON DELETE CASCADE,
                filename VARCHAR NOT NULL,
                file_path VARCHAR NOT NULL,
                file_type VARCHAR NOT NULL,
                file_size INTEGER NOT NULL,
                analysis TEXT,
                status VARCHAR DEFAULT 'complete',
                uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS events (
                id VARCHAR PRIMARY KEY,
                racer_id VARCHAR NOT NULL REFERENCES racers(id) ON DELETE CASCADE,
                event_name VARCHAR NOT NULL,
                event_date DATE NOT NULL,
                location VARCHAR NOT NULL,
                notes TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        """))

        # ---- Migrate racers ----
        print("\nMigrating racers…")
        racer_count = 0
        for r in racers:
            conn.execute(text("""
                INSERT INTO racers (id, racer_name, height, weight, ski_types,
                    binding_measurements, personal_records, racing_goals,
                    created_at, updated_at)
                VALUES (:id, :racer_name, :height, :weight, :ski_types,
                    :binding_measurements, :personal_records, :racing_goals,
                    :created_at, :updated_at)
                ON CONFLICT (id) DO NOTHING
            """), {**r})
            racer_count += 1
        print(f"  Inserted {racer_count} racers")

        # ---- Migrate documents (and upload files) ----
        print("\nMigrating documents…")
        doc_count = 0
        for doc in documents:
            new_file_path = doc["file_path"]  # may be updated to S3 key

            if s3_client:
                # Determine local file path from stored path
                local_path = Path(doc["file_path"])
                if not local_path.is_absolute():
                    local_path = Path(__file__).parent.parent / "backend" / local_path

                # Build S3 key
                ext = Path(doc["filename"]).suffix.lower()
                s3_key = f"documents/{doc['id']}{ext}"

                if upload_file_to_s3(s3_client, local_path, s3_key):
                    new_file_path = s3_key

            status = doc.get("status", "complete")
            conn.execute(text("""
                INSERT INTO documents (id, racer_id, filename, file_path, file_type,
                    file_size, analysis, status, uploaded_at)
                VALUES (:id, :racer_id, :filename, :file_path, :file_type,
                    :file_size, :analysis, :status, :uploaded_at)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": doc["id"],
                "racer_id": doc["racer_id"],
                "filename": doc["filename"],
                "file_path": new_file_path,
                "file_type": doc["file_type"],
                "file_size": doc["file_size"],
                "analysis": doc.get("analysis"),
                "status": status,
                "uploaded_at": doc["uploaded_at"],
            })
            doc_count += 1
        print(f"  Inserted {doc_count} documents")

        # ---- Migrate events ----
        print("\nMigrating events…")
        event_count = 0
        for ev in events:
            conn.execute(text("""
                INSERT INTO events (id, racer_id, event_name, event_date, location,
                    notes, created_at, updated_at)
                VALUES (:id, :racer_id, :event_name, :event_date, :location,
                    :notes, :created_at, :updated_at)
                ON CONFLICT (id) DO NOTHING
            """), {**ev})
            event_count += 1
        print(f"  Inserted {event_count} events")

    print("\nMigration complete!")


if __name__ == "__main__":
    print("=== SQLite → Aurora + S3 Migration ===\n")
    validate_config()
    racers, documents, events = read_sqlite()
    migrate(racers, documents, events)
