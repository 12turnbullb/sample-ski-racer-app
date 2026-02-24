"""
Database migration script to add racer_name column to racers table.

This script adds the racer_name column to existing racer records.
Run this script once after updating the models.
"""

import sqlite3
import os

# Database path
DATABASE_DIR = os.path.join(os.path.dirname(__file__), "data")
DATABASE_FILE = "ski_racer.db"
DATABASE_PATH = os.path.join(DATABASE_DIR, DATABASE_FILE)


def migrate_add_racer_name():
    """Add racer_name column to racers table if it doesn't exist."""
    
    if not os.path.exists(DATABASE_PATH):
        print(f"Database not found at {DATABASE_PATH}")
        print("No migration needed - database will be created with new schema.")
        return
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(racers)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'racer_name' in columns:
            print("Column 'racer_name' already exists. No migration needed.")
            return
        
        print("Adding 'racer_name' column to racers table...")
        
        # Add the column with a default value
        cursor.execute("""
            ALTER TABLE racers 
            ADD COLUMN racer_name TEXT NOT NULL DEFAULT 'Ski Racer'
        """)
        
        conn.commit()
        print("Migration completed successfully!")
        print("Note: Existing racers have been given the default name 'Ski Racer'.")
        print("You can update their names through the profile edit form.")
        
    except sqlite3.Error as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    migrate_add_racer_name()
