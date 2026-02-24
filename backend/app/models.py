"""
SQLAlchemy models for the ski racer web application.

This module defines the database models for racers, documents, and events,
including relationships, foreign keys, and timestamps.
"""

from sqlalchemy import Column, String, Float, Integer, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from app.database import Base


def generate_uuid() -> str:
    """Generate a new UUID string for use as primary key."""
    return str(uuid.uuid4())


class Racer(Base):
    """
    Racer profile model representing a ski racer.
    
    Stores physical measurements, equipment details, personal records,
    and racing goals for a ski racer.
    
    Attributes:
        id: UUID primary key
        racer_name: Name of the ski racer
        height: Height in centimeters (must be > 0)
        weight: Weight in kilograms (must be > 0)
        ski_types: Comma-separated list of ski types
        binding_measurements: JSON string with binding measurements
        personal_records: JSON string with personal records
        racing_goals: Text description of racing goals
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
        documents: Relationship to associated documents
        events: Relationship to associated racing events
    """
    __tablename__ = "racers"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    racer_name = Column(String, nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    ski_types = Column(Text, nullable=False)
    binding_measurements = Column(Text, nullable=False)
    personal_records = Column(Text, nullable=False)
    racing_goals = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    documents = relationship("Document", back_populates="racer", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="racer", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Racer(id={self.id}, racer_name={self.racer_name}, height={self.height}, weight={self.weight})>"


class Document(Base):
    """
    Document model representing an uploaded ski video/image analysis.
    
    Stores metadata about uploaded video/image files including filename, file path,
    file type, file size, and AI-generated analysis. Associated with a racer profile.
    
    Attributes:
        id: UUID primary key
        racer_id: Foreign key to racer profile
        filename: Original filename of uploaded file
        file_path: Path to stored file on disk
        file_type: MIME type of the file
        file_size: Size of file in bytes
        analysis: AI-generated analysis of ski form from Bedrock
        uploaded_at: Timestamp when file was uploaded
        racer: Relationship to parent racer
    """
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    racer_id = Column(String, ForeignKey("racers.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    analysis = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    racer = relationship("Racer", back_populates="documents")
    
    def __repr__(self) -> str:
        return f"<Document(id={self.id}, filename={self.filename}, racer_id={self.racer_id})>"


class Event(Base):
    """
    Event model representing a racing event in the calendar.
    
    Stores information about ski racing competitions including name,
    date, location, and optional notes. Associated with a racer profile.
    
    Attributes:
        id: UUID primary key
        racer_id: Foreign key to racer profile
        event_name: Name of the racing event
        event_date: Date of the racing event
        location: Location where the event takes place
        notes: Optional notes about the event
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
        racer: Relationship to parent racer
    """
    __tablename__ = "events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    racer_id = Column(String, ForeignKey("racers.id", ondelete="CASCADE"), nullable=False)
    event_name = Column(String, nullable=False)
    event_date = Column(Date, nullable=False)
    location = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    racer = relationship("Racer", back_populates="events")
    
    def __repr__(self) -> str:
        return f"<Event(id={self.id}, event_name={self.event_name}, event_date={self.event_date})>"
