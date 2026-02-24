"""
Unit tests for Pydantic schemas.

Tests verify that request/response schemas validate data correctly according
to requirements 2.1, 2.2, 2.3, 5.1, 5.2, 5.3.
"""

import pytest
from datetime import datetime, date
from pydantic import ValidationError

from app.schemas import (
    RacerCreate,
    RacerUpdate,
    RacerResponse,
    DocumentResponse,
    EventCreate,
    EventUpdate,
    EventResponse,
)
from app.models import Racer, Document, Event


# ============================================================================
# RacerCreate Tests
# ============================================================================

def test_racer_create_valid_data():
    """Test that RacerCreate accepts valid data."""
    data = {
        "height": 175.5,
        "weight": 70.0,
        "ski_types": "Slalom, Giant Slalom",
        "binding_measurements": '{"din": 8, "forward_pressure": 3}',
        "personal_records": '{"slalom": "45.2s", "gs": "1:12.5"}',
        "racing_goals": "Qualify for nationals",
    }
    racer = RacerCreate(**data)
    assert racer.height == 175.5
    assert racer.weight == 70.0
    assert racer.ski_types == "Slalom, Giant Slalom"


def test_racer_create_rejects_zero_height():
    """Test that RacerCreate rejects height = 0 (Requirement 2.1)."""
    data = {
        "height": 0,
        "weight": 70.0,
        "ski_types": "Slalom",
        "binding_measurements": '{"din": 8}',
        "personal_records": '{"slalom": "45.2s"}',
        "racing_goals": "Qualify for nationals",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "height" in str(exc_info.value).lower()


def test_racer_create_rejects_negative_height():
    """Test that RacerCreate rejects negative height (Requirement 2.1)."""
    data = {
        "height": -10.0,
        "weight": 70.0,
        "ski_types": "Slalom",
        "binding_measurements": '{"din": 8}',
        "personal_records": '{"slalom": "45.2s"}',
        "racing_goals": "Qualify for nationals",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "height" in str(exc_info.value).lower()


def test_racer_create_rejects_zero_weight():
    """Test that RacerCreate rejects weight = 0 (Requirement 2.2)."""
    data = {
        "height": 175.5,
        "weight": 0,
        "ski_types": "Slalom",
        "binding_measurements": '{"din": 8}',
        "personal_records": '{"slalom": "45.2s"}',
        "racing_goals": "Qualify for nationals",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "weight" in str(exc_info.value).lower()


def test_racer_create_rejects_negative_weight():
    """Test that RacerCreate rejects negative weight (Requirement 2.2)."""
    data = {
        "height": 175.5,
        "weight": -5.0,
        "ski_types": "Slalom",
        "binding_measurements": '{"din": 8}',
        "personal_records": '{"slalom": "45.2s"}',
        "racing_goals": "Qualify for nationals",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "weight" in str(exc_info.value).lower()


def test_racer_create_rejects_empty_ski_types():
    """Test that RacerCreate rejects empty ski_types (Requirement 2.3)."""
    data = {
        "height": 175.5,
        "weight": 70.0,
        "ski_types": "",
        "binding_measurements": '{"din": 8}',
        "personal_records": '{"slalom": "45.2s"}',
        "racing_goals": "Qualify for nationals",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "ski_types" in str(exc_info.value).lower()


def test_racer_create_rejects_whitespace_ski_types():
    """Test that RacerCreate rejects whitespace-only ski_types (Requirement 2.3)."""
    data = {
        "height": 175.5,
        "weight": 70.0,
        "ski_types": "   ",
        "binding_measurements": '{"din": 8}',
        "personal_records": '{"slalom": "45.2s"}',
        "racing_goals": "Qualify for nationals",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "ski_types" in str(exc_info.value).lower()


def test_racer_create_rejects_empty_binding_measurements():
    """Test that RacerCreate rejects empty binding_measurements (Requirement 2.3)."""
    data = {
        "height": 175.5,
        "weight": 70.0,
        "ski_types": "Slalom",
        "binding_measurements": "",
        "personal_records": '{"slalom": "45.2s"}',
        "racing_goals": "Qualify for nationals",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "binding_measurements" in str(exc_info.value).lower()


def test_racer_create_rejects_empty_personal_records():
    """Test that RacerCreate rejects empty personal_records (Requirement 2.3)."""
    data = {
        "height": 175.5,
        "weight": 70.0,
        "ski_types": "Slalom",
        "binding_measurements": '{"din": 8}',
        "personal_records": "",
        "racing_goals": "Qualify for nationals",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "personal_records" in str(exc_info.value).lower()


def test_racer_create_rejects_empty_racing_goals():
    """Test that RacerCreate rejects empty racing_goals (Requirement 2.3)."""
    data = {
        "height": 175.5,
        "weight": 70.0,
        "ski_types": "Slalom",
        "binding_measurements": '{"din": 8}',
        "personal_records": '{"slalom": "45.2s"}',
        "racing_goals": "",
    }
    with pytest.raises(ValidationError) as exc_info:
        RacerCreate(**data)
    assert "racing_goals" in str(exc_info.value).lower()


def test_racer_create_strips_whitespace():
    """Test that RacerCreate strips leading/trailing whitespace from string fields."""
    data = {
        "height": 175.5,
        "weight": 70.0,
        "ski_types": "  Slalom, Giant Slalom  ",
        "binding_measurements": '  {"din": 8}  ',
        "personal_records": '  {"slalom": "45.2s"}  ',
        "racing_goals": "  Qualify for nationals  ",
    }
    racer = RacerCreate(**data)
    assert racer.ski_types == "Slalom, Giant Slalom"
    assert racer.binding_measurements == '{"din": 8}'
    assert racer.personal_records == '{"slalom": "45.2s"}'
    assert racer.racing_goals == "Qualify for nationals"


# ============================================================================
# RacerUpdate Tests
# ============================================================================

def test_racer_update_allows_partial_updates():
    """Test that RacerUpdate allows partial updates with only some fields."""
    data = {"height": 180.0}
    racer = RacerUpdate(**data)
    assert racer.height == 180.0
    assert racer.weight is None
    assert racer.ski_types is None


def test_racer_update_rejects_zero_height():
    """Test that RacerUpdate rejects height = 0 when provided (Requirement 2.1)."""
    data = {"height": 0}
    with pytest.raises(ValidationError) as exc_info:
        RacerUpdate(**data)
    assert "height" in str(exc_info.value).lower()


def test_racer_update_rejects_zero_weight():
    """Test that RacerUpdate rejects weight = 0 when provided (Requirement 2.2)."""
    data = {"weight": 0}
    with pytest.raises(ValidationError) as exc_info:
        RacerUpdate(**data)
    assert "weight" in str(exc_info.value).lower()


def test_racer_update_rejects_empty_ski_types():
    """Test that RacerUpdate rejects empty ski_types when provided (Requirement 2.3)."""
    data = {"ski_types": ""}
    with pytest.raises(ValidationError) as exc_info:
        RacerUpdate(**data)
    assert "ski_types" in str(exc_info.value).lower()


def test_racer_update_allows_all_none():
    """Test that RacerUpdate allows all fields to be None (no update)."""
    racer = RacerUpdate()
    assert racer.height is None
    assert racer.weight is None
    assert racer.ski_types is None


# ============================================================================
# RacerResponse Tests
# ============================================================================

def test_racer_response_from_orm_model():
    """Test that RacerResponse can be created from ORM model."""
    racer = Racer(
        id="test-uuid-123",
        height=175.5,
        weight=70.0,
        ski_types="Slalom, Giant Slalom",
        binding_measurements='{"din": 8}',
        personal_records='{"slalom": "45.2s"}',
        racing_goals="Qualify for nationals",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    response = RacerResponse.model_validate(racer)
    
    assert response.id == "test-uuid-123"
    assert response.height == 175.5
    assert response.weight == 70.0
    assert response.ski_types == "Slalom, Giant Slalom"
    assert response.binding_measurements == '{"din": 8}'
    assert response.personal_records == '{"slalom": "45.2s"}'
    assert response.racing_goals == "Qualify for nationals"
    assert isinstance(response.created_at, datetime)
    assert isinstance(response.updated_at, datetime)


# ============================================================================
# DocumentResponse Tests
# ============================================================================

def test_document_response_from_orm_model():
    """Test that DocumentResponse can be created from ORM model."""
    document = Document(
        id="doc-uuid-456",
        racer_id="racer-uuid-123",
        filename="ski_analysis.pdf",
        file_path="/uploads/ski_analysis.pdf",
        file_type="application/pdf",
        file_size=1024000,
        uploaded_at=datetime.now(),
    )
    
    response = DocumentResponse.model_validate(document)
    
    assert response.id == "doc-uuid-456"
    assert response.racer_id == "racer-uuid-123"
    assert response.filename == "ski_analysis.pdf"
    assert response.file_path == "/uploads/ski_analysis.pdf"
    assert response.file_type == "application/pdf"
    assert response.file_size == 1024000
    assert isinstance(response.uploaded_at, datetime)


# ============================================================================
# EventCreate Tests
# ============================================================================

def test_event_create_valid_data():
    """Test that EventCreate accepts valid data."""
    data = {
        "event_name": "State Championship",
        "event_date": date(2024, 3, 15),
        "location": "Aspen, CO",
        "notes": "Bring extra wax",
    }
    event = EventCreate(**data)
    assert event.event_name == "State Championship"
    assert event.event_date == date(2024, 3, 15)
    assert event.location == "Aspen, CO"
    assert event.notes == "Bring extra wax"


def test_event_create_valid_data_without_notes():
    """Test that EventCreate accepts valid data without optional notes."""
    data = {
        "event_name": "State Championship",
        "event_date": date(2024, 3, 15),
        "location": "Aspen, CO",
    }
    event = EventCreate(**data)
    assert event.event_name == "State Championship"
    assert event.notes is None


def test_event_create_rejects_empty_event_name():
    """Test that EventCreate rejects empty event_name (Requirement 5.1)."""
    data = {
        "event_name": "",
        "event_date": date(2024, 3, 15),
        "location": "Aspen, CO",
    }
    with pytest.raises(ValidationError) as exc_info:
        EventCreate(**data)
    assert "event_name" in str(exc_info.value).lower()


def test_event_create_rejects_whitespace_event_name():
    """Test that EventCreate rejects whitespace-only event_name (Requirement 5.1)."""
    data = {
        "event_name": "   ",
        "event_date": date(2024, 3, 15),
        "location": "Aspen, CO",
    }
    with pytest.raises(ValidationError) as exc_info:
        EventCreate(**data)
    assert "event_name" in str(exc_info.value).lower()


def test_event_create_rejects_empty_location():
    """Test that EventCreate rejects empty location (Requirement 5.3)."""
    data = {
        "event_name": "State Championship",
        "event_date": date(2024, 3, 15),
        "location": "",
    }
    with pytest.raises(ValidationError) as exc_info:
        EventCreate(**data)
    assert "location" in str(exc_info.value).lower()


def test_event_create_rejects_whitespace_location():
    """Test that EventCreate rejects whitespace-only location (Requirement 5.3)."""
    data = {
        "event_name": "State Championship",
        "event_date": date(2024, 3, 15),
        "location": "   ",
    }
    with pytest.raises(ValidationError) as exc_info:
        EventCreate(**data)
    assert "location" in str(exc_info.value).lower()


def test_event_create_accepts_valid_date_format():
    """Test that EventCreate accepts valid date format (Requirement 5.2)."""
    data = {
        "event_name": "State Championship",
        "event_date": date(2024, 3, 15),
        "location": "Aspen, CO",
    }
    event = EventCreate(**data)
    assert event.event_date == date(2024, 3, 15)


def test_event_create_strips_whitespace():
    """Test that EventCreate strips leading/trailing whitespace from string fields."""
    data = {
        "event_name": "  State Championship  ",
        "event_date": date(2024, 3, 15),
        "location": "  Aspen, CO  ",
        "notes": "  Bring extra wax  ",
    }
    event = EventCreate(**data)
    assert event.event_name == "State Championship"
    assert event.location == "Aspen, CO"
    assert event.notes == "Bring extra wax"


def test_event_create_converts_empty_notes_to_none():
    """Test that EventCreate converts empty notes to None."""
    data = {
        "event_name": "State Championship",
        "event_date": date(2024, 3, 15),
        "location": "Aspen, CO",
        "notes": "   ",
    }
    event = EventCreate(**data)
    assert event.notes is None


# ============================================================================
# EventUpdate Tests
# ============================================================================

def test_event_update_allows_partial_updates():
    """Test that EventUpdate allows partial updates with only some fields."""
    data = {"event_name": "Updated Championship"}
    event = EventUpdate(**data)
    assert event.event_name == "Updated Championship"
    assert event.event_date is None
    assert event.location is None


def test_event_update_rejects_empty_event_name():
    """Test that EventUpdate rejects empty event_name when provided (Requirement 5.1)."""
    data = {"event_name": ""}
    with pytest.raises(ValidationError) as exc_info:
        EventUpdate(**data)
    assert "event_name" in str(exc_info.value).lower()


def test_event_update_rejects_empty_location():
    """Test that EventUpdate rejects empty location when provided (Requirement 5.3)."""
    data = {"location": ""}
    with pytest.raises(ValidationError) as exc_info:
        EventUpdate(**data)
    assert "location" in str(exc_info.value).lower()


def test_event_update_allows_all_none():
    """Test that EventUpdate allows all fields to be None (no update)."""
    event = EventUpdate()
    assert event.event_name is None
    assert event.event_date is None
    assert event.location is None
    assert event.notes is None


# ============================================================================
# EventResponse Tests
# ============================================================================

def test_event_response_from_orm_model():
    """Test that EventResponse can be created from ORM model."""
    event = Event(
        id="event-uuid-789",
        racer_id="racer-uuid-123",
        event_name="State Championship",
        event_date=date(2024, 3, 15),
        location="Aspen, CO",
        notes="Bring extra wax",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    response = EventResponse.model_validate(event)
    
    assert response.id == "event-uuid-789"
    assert response.racer_id == "racer-uuid-123"
    assert response.event_name == "State Championship"
    assert response.event_date == date(2024, 3, 15)
    assert response.location == "Aspen, CO"
    assert response.notes == "Bring extra wax"
    assert isinstance(response.created_at, datetime)
    assert isinstance(response.updated_at, datetime)


def test_event_response_from_orm_model_without_notes():
    """Test that EventResponse can be created from ORM model without notes."""
    event = Event(
        id="event-uuid-789",
        racer_id="racer-uuid-123",
        event_name="State Championship",
        event_date=date(2024, 3, 15),
        location="Aspen, CO",
        notes=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    response = EventResponse.model_validate(event)
    
    assert response.notes is None
