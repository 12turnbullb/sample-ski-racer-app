"""
Pydantic schemas for request/response validation.

This module defines the Pydantic models used for API request validation
and response serialization. These schemas ensure data integrity and provide
automatic validation for the FastAPI endpoints.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime, date
from typing import Optional


# ============================================================================
# Racer Schemas
# ============================================================================

class RacerCreate(BaseModel):
    """
    Schema for creating a new racer profile.
    
    Validates that height and weight are positive values and all required
    fields are provided.
    
    Attributes:
        racer_name: Name of the ski racer
        height: Height in centimeters (must be > 0)
        weight: Weight in kilograms (must be > 0)
        ski_types: Comma-separated list of ski types
        binding_measurements: JSON string with binding measurements
        personal_records: JSON string with personal records
        racing_goals: Text description of racing goals
    """
    racer_name: str = Field(..., min_length=1, description="Name of the ski racer")
    height: float = Field(..., gt=0, description="Height in centimeters (must be > 0)")
    weight: float = Field(..., gt=0, description="Weight in kilograms (must be > 0)")
    ski_types: str = Field(..., min_length=1, description="Comma-separated list of ski types")
    binding_measurements: str = Field(..., min_length=1, description="JSON string with binding measurements")
    personal_records: str = Field(..., min_length=1, description="JSON string with personal records")
    racing_goals: str = Field(..., min_length=1, description="Text description of racing goals")
    
    @field_validator('racer_name', 'ski_types', 'binding_measurements', 'personal_records', 'racing_goals')
    @classmethod
    def validate_non_empty(cls, v: str, info) -> str:
        """Validate that string fields are not empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} cannot be empty or whitespace-only")
        return v.strip()


class RacerUpdate(BaseModel):
    """
    Schema for updating an existing racer profile.
    
    All fields are optional to allow partial updates. When provided,
    height and weight must be positive values.
    
    Attributes:
        racer_name: Name of the ski racer
        height: Height in centimeters (must be > 0 if provided)
        weight: Weight in kilograms (must be > 0 if provided)
        ski_types: Comma-separated list of ski types
        binding_measurements: JSON string with binding measurements
        personal_records: JSON string with personal records
        racing_goals: Text description of racing goals
    """
    racer_name: Optional[str] = Field(None, min_length=1, description="Name of the ski racer")
    height: Optional[float] = Field(None, gt=0, description="Height in centimeters (must be > 0)")
    weight: Optional[float] = Field(None, gt=0, description="Weight in kilograms (must be > 0)")
    ski_types: Optional[str] = Field(None, min_length=1, description="Comma-separated list of ski types")
    binding_measurements: Optional[str] = Field(None, min_length=1, description="JSON string with binding measurements")
    personal_records: Optional[str] = Field(None, min_length=1, description="JSON string with personal records")
    racing_goals: Optional[str] = Field(None, min_length=1, description="Text description of racing goals")
    
    @field_validator('racer_name', 'ski_types', 'binding_measurements', 'personal_records', 'racing_goals')
    @classmethod
    def validate_non_empty(cls, v: Optional[str], info) -> Optional[str]:
        """Validate that string fields are not empty or whitespace-only when provided."""
        if v is not None:
            if not v.strip():
                raise ValueError(f"{info.field_name} cannot be empty or whitespace-only")
            return v.strip()
        return v


class RacerResponse(BaseModel):
    """
    Schema for racer profile responses.
    
    Represents the complete racer profile data returned by the API,
    including system-generated fields like id and timestamps.
    
    Attributes:
        id: UUID primary key
        racer_name: Name of the ski racer
        height: Height in centimeters
        weight: Weight in kilograms
        ski_types: Comma-separated list of ski types
        binding_measurements: JSON string with binding measurements
        personal_records: JSON string with personal records
        racing_goals: Text description of racing goals
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    racer_name: str
    height: float
    weight: float
    ski_types: str
    binding_measurements: str
    personal_records: str
    racing_goals: str
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Document Schemas
# ============================================================================

class DocumentResponse(BaseModel):
    """
    Schema for document responses.
    
    Represents metadata about an uploaded video/image with AI analysis.
    
    Attributes:
        id: UUID primary key
        racer_id: Foreign key to racer profile
        filename: Original filename of uploaded file
        file_path: Path to stored file on disk
        file_type: MIME type of the file
        file_size: Size of file in bytes
        analysis: AI-generated ski form analysis
        uploaded_at: Timestamp when file was uploaded
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    racer_id: str
    filename: str
    file_path: str
    file_type: str
    file_size: int
    analysis: Optional[str]
    uploaded_at: datetime


# ============================================================================
# Event Schemas
# ============================================================================

class EventCreate(BaseModel):
    """
    Schema for creating a new racing event.
    
    Validates that event name and location are non-empty and date is valid.
    
    Attributes:
        event_name: Name of the racing event (must be non-empty)
        event_date: Date of the racing event (ISO format: YYYY-MM-DD)
        location: Location where the event takes place (must be non-empty)
        notes: Optional notes about the event
    """
    event_name: str = Field(..., min_length=1, description="Name of the racing event")
    event_date: date = Field(..., description="Date of the racing event (ISO format: YYYY-MM-DD)")
    location: str = Field(..., min_length=1, description="Location where the event takes place")
    notes: Optional[str] = Field(None, description="Optional notes about the event")
    
    @field_validator('event_name', 'location')
    @classmethod
    def validate_non_empty(cls, v: str, info) -> str:
        """Validate that string fields are not empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} cannot be empty or whitespace-only")
        return v.strip()
    
    @field_validator('notes')
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        """Validate and strip notes if provided."""
        if v is not None:
            return v.strip() if v.strip() else None
        return v


class EventUpdate(BaseModel):
    """
    Schema for updating an existing racing event.
    
    All fields are optional to allow partial updates. When provided,
    event name and location must be non-empty.
    
    Attributes:
        event_name: Name of the racing event (must be non-empty if provided)
        event_date: Date of the racing event (ISO format: YYYY-MM-DD)
        location: Location where the event takes place (must be non-empty if provided)
        notes: Optional notes about the event
    """
    event_name: Optional[str] = Field(None, min_length=1, description="Name of the racing event")
    event_date: Optional[date] = Field(None, description="Date of the racing event (ISO format: YYYY-MM-DD)")
    location: Optional[str] = Field(None, min_length=1, description="Location where the event takes place")
    notes: Optional[str] = Field(None, description="Optional notes about the event")
    
    @field_validator('event_name', 'location')
    @classmethod
    def validate_non_empty(cls, v: Optional[str], info) -> Optional[str]:
        """Validate that string fields are not empty or whitespace-only when provided."""
        if v is not None:
            if not v.strip():
                raise ValueError(f"{info.field_name} cannot be empty or whitespace-only")
            return v.strip()
        return v
    
    @field_validator('notes')
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        """Validate and strip notes if provided."""
        if v is not None:
            return v.strip() if v.strip() else None
        return v


class EventResponse(BaseModel):
    """
    Schema for racing event responses.
    
    Represents the complete racing event data returned by the API,
    including system-generated fields like id and timestamps.
    
    Attributes:
        id: UUID primary key
        racer_id: Foreign key to racer profile
        event_name: Name of the racing event
        event_date: Date of the racing event
        location: Location where the event takes place
        notes: Optional notes about the event
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    racer_id: str
    event_name: str
    event_date: date
    location: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
