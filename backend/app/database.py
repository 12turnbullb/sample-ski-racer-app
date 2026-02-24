"""
Database configuration and connection management for SQLite.

This module provides SQLAlchemy setup for the ski racer web application,
including database engine, session management, and base model class.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from typing import Generator
import os

# SQLite database file location
# Store database in the backend directory
DATABASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATABASE_FILE = "ski_racer.db"
DATABASE_PATH = os.path.join(DATABASE_DIR, DATABASE_FILE)

# Ensure data directory exists
os.makedirs(DATABASE_DIR, exist_ok=True)

# SQLite database URL
# check_same_thread=False is needed for FastAPI to work with SQLite
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create SQLAlchemy engine
# connect_args is only needed for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False  # Set to True for SQL query logging during development
)

# Create SessionLocal class for database sessions
# Each instance of SessionLocal will be a database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
# All SQLAlchemy models will inherit from this Base class
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that provides a database session.
    
    This function is used as a FastAPI dependency to provide database
    sessions to route handlers. It ensures proper session lifecycle:
    - Creates a new session for each request
    - Yields the session to the route handler
    - Closes the session after the request completes
    
    Yields:
        Session: SQLAlchemy database session
        
    Example:
        @app.get("/racers/{racer_id}")
        def get_racer(racer_id: str, db: Session = Depends(get_db)):
            return db.query(Racer).filter(Racer.id == racer_id).first()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize the database by creating all tables.
    
    This function should be called on application startup to ensure
    all database tables exist. It uses the Base metadata to create
    tables for all registered models.
    
    Note:
        This function is idempotent - it will not recreate existing tables.
        For production use, consider using Alembic for database migrations.
    """
    # Import all models here to ensure they are registered with Base
    # This must be done before calling create_all()
    from app import models  # noqa: F401
    
    Base.metadata.create_all(bind=engine)


def get_database_path() -> str:
    """
    Get the absolute path to the SQLite database file.
    
    Returns:
        str: Absolute path to the database file
    """
    return DATABASE_PATH
