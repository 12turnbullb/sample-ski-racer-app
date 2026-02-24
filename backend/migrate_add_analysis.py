"""
Database migration script to add analysis column to documents table.

This script adds the 'analysis' column to store AI-generated ski form feedback.
"""

import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent / "data" / "ski_racer.db"

def migrate():
    """Add analysis column to documents table."""
    
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        print("No migration needed - database will be created with new schema")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if analysis column already exists
        cursor.execute("PRAGMA table_info(documents)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'analysis' in columns:
            print("Analysis column already exists. No migration needed.")
            return
        
        # Add analysis column
        print("Adding analysis column to documents table...")
        cursor.execute("""
            ALTER TABLE documents 
            ADD COLUMN analysis TEXT
        """)
        
        conn.commit()
        print("Migration completed successfully!")
        print("Analysis column added to documents table.")
        
    except sqlite3.Error as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
