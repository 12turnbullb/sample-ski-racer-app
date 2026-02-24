"""
Database configuration and connection management.

Supports both PostgreSQL (Aurora Serverless v2 in production) and SQLite
(local development). In production, credentials are read from AWS Secrets Manager.
"""

import os
import json
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import NullPool
from typing import Generator

logger = logging.getLogger(__name__)


def _get_database_url() -> str:
    """
    Resolve the database URL from environment or Secrets Manager.

    Priority:
    1. DATABASE_URL env var (direct connection string, local dev)
    2. DB_SECRET_ARN env var → fetch credentials from Secrets Manager
    3. SQLite fallback (local dev without any DB config)
    """
    # Direct connection string (local development or CI).
    # Normalise plain postgresql:// to use the pg8000 driver.
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if database_url.startswith("postgresql://") or database_url.startswith("postgres://"):
            database_url = database_url.replace("://", "+pg8000://", 1)
        return database_url

    # Secrets Manager (production Lambda)
    secret_arn = os.getenv("DB_SECRET_ARN")
    if secret_arn:
        try:
            import boto3
            region = os.getenv("AWS_REGION_NAME", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
            client = boto3.client("secretsmanager", region_name=region)
            response = client.get_secret_value(SecretId=secret_arn)
            secret = json.loads(response["SecretString"])
            return (
                f"postgresql+pg8000://{secret['username']}:{secret['password']}"
                f"@{secret['host']}:{secret['port']}/{secret['dbname']}"
            )
        except Exception as e:
            logger.error(f"Failed to fetch DB secret from Secrets Manager: {e}")
            raise

    # SQLite fallback for local development
    db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, "ski_racer.db")
    logger.warning(f"No DATABASE_URL or DB_SECRET_ARN set — using SQLite at {db_path}")
    return f"sqlite:///{db_path}"


DATABASE_URL = _get_database_url()

# Create engine — NullPool for Lambda (avoids connection leaks across invocations)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        echo=False,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables on startup (idempotent)."""
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)


def get_database_url() -> str:
    """Return the resolved database URL (for diagnostics)."""
    return DATABASE_URL
