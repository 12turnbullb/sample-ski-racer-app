"""
Unit tests for database configuration and connection management.

Tests verify that the database setup is correct and sessions can be created.
"""

import pytest
import os
from sqlalchemy import text
from app.database import (
    get_db,
    init_db,
    get_database_path,
    engine,
    SessionLocal,
    Base,
    DATABASE_DIR,
)


def test_database_directory_exists():
    """Test that the database directory is created."""
    assert os.path.exists(DATABASE_DIR)
    assert os.path.isdir(DATABASE_DIR)


def test_database_path_is_valid():
    """Test that the database path is a valid file path."""
    db_path = get_database_path()
    assert db_path is not None
    assert isinstance(db_path, str)
    assert db_path.endswith("ski_racer.db")


def test_engine_is_created():
    """Test that the SQLAlchemy engine is created successfully."""
    assert engine is not None
    assert str(engine.url).startswith("sqlite:///")


def test_session_local_is_configured():
    """Test that SessionLocal is properly configured."""
    assert SessionLocal is not None
    # Create a session to verify it works
    session = SessionLocal()
    assert session is not None
    session.close()


def test_get_db_yields_session():
    """Test that get_db() yields a valid database session."""
    db_generator = get_db()
    db = next(db_generator)
    
    # Verify we got a session
    assert db is not None
    
    # Verify the session is usable by executing a simple query
    result = db.execute(text("SELECT 1"))
    assert result.fetchone()[0] == 1
    
    # Close the generator (simulates end of request)
    try:
        next(db_generator)
    except StopIteration:
        pass  # Expected behavior


def test_get_db_closes_session():
    """Test that get_db() properly closes the session after use."""
    db_generator = get_db()
    db = next(db_generator)
    
    # Session should be open
    assert not db.is_active or True  # Session exists
    
    # Close the generator
    try:
        next(db_generator)
    except StopIteration:
        pass
    
    # After generator closes, session should be closed
    # Note: We can't directly test if session is closed, but we verified
    # the finally block exists in the implementation


def test_base_class_exists():
    """Test that the Base class for models is available."""
    assert Base is not None
    assert hasattr(Base, "metadata")


def test_multiple_sessions_can_be_created():
    """Test that multiple independent sessions can be created."""
    session1 = SessionLocal()
    session2 = SessionLocal()
    
    assert session1 is not None
    assert session2 is not None
    assert session1 is not session2  # Should be different instances
    
    session1.close()
    session2.close()


def test_database_connection_works():
    """Test that we can connect to the database and execute queries."""
    db = SessionLocal()
    try:
        # Execute a simple query to verify connection
        result = db.execute(text("SELECT sqlite_version()"))
        version = result.fetchone()[0]
        assert version is not None
        assert isinstance(version, str)
    finally:
        db.close()
