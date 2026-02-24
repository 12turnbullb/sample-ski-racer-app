"""
Unit tests for event service business logic and validation.

Tests specific validation scenarios, error handling, and edge cases
for the EventService class.

Requirements: 5.1, 5.2, 5.3, 5.4, 9.1, 9.2
"""

import pytest
from datetime import date
from sqlalchemy.orm import Session
from app.services.event_service import (
    EventService,
    ValidationError as ServiceValidationError,
    NotFoundError,
    EventServiceError
)
from app.schemas import EventCreate, EventUpdate, RacerCreate
from app.models import Event, Racer
from app.database import get_db, engine, Base
from app.repositories.racer_repository import RacerRepository


@pytest.fixture
def db_session():
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Get a database session
    db = next(get_db())
    
    yield db
    
    # Cleanup: rollback any uncommitted changes and close
    db.rollback()
    db.close()
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def event_service(db_session):
    """Create an EventService instance for testing."""
    return EventService(db_session)


@pytest.fixture
def test_racer(db_session):
    """Create a test racer for event associations."""
    racer_repo = RacerRepository(db_session)
    racer_data = RacerCreate(
        height=175.0,
        weight=70.0,
        ski_types="Slalom, Giant Slalom",
        binding_measurements='{"din": 8}',
        personal_records='{"slalom": "45.2s"}',
        racing_goals="Qualify for nationals"
    )
    return racer_repo.create(racer_data)


@pytest.fixture
def valid_event_data():
    """Provide valid event data for testing."""
    return EventCreate(
        event_name="Winter Championship",
        event_date=date(2024, 2, 15),
        location="Aspen, Colorado",
        notes="First race of the season"
    )


# ============================================================================
# Test: Create Event with Valid Data
# ============================================================================

def test_create_event_with_valid_data(event_service, test_racer, valid_event_data):
    """Test creating an event with valid data succeeds."""
    event = event_service.create_event(test_racer.id, valid_event_data)
    
    assert event.id is not None
    assert event.racer_id == test_racer.id
    assert event.event_name == "Winter Championship"
    assert event.event_date == date(2024, 2, 15)
    assert event.location == "Aspen, Colorado"
    assert event.notes == "First race of the season"
    assert event.created_at is not None
    assert event.updated_at is not None


def test_create_event_without_notes(event_service, test_racer):
    """Test creating an event without optional notes succeeds."""
    event_data = EventCreate(
        event_name="Spring Cup",
        event_date=date(2024, 3, 20),
        location="Vail, Colorado",
        notes=None
    )
    
    event = event_service.create_event(test_racer.id, event_data)
    
    assert event.id is not None
    assert event.event_name == "Spring Cup"
    assert event.notes is None


# ============================================================================
# Test: Event Name Validation (Requirement 5.1)
# ============================================================================

def test_create_event_with_empty_name_rejected(event_service, test_racer):
    """Test that empty event name is rejected with descriptive error."""
    from pydantic import ValidationError as PydanticValidationError
    
    with pytest.raises(PydanticValidationError) as exc_info:
        event_data = EventCreate(
            event_name="",
            event_date=date(2024, 2, 15),
            location="Aspen, Colorado"
        )
    
    assert "event_name" in str(exc_info.value).lower()


def test_create_event_with_whitespace_name_rejected(event_service, test_racer):
    """Test that whitespace-only event name is rejected."""
    from pydantic import ValidationError as PydanticValidationError
    
    with pytest.raises(PydanticValidationError) as exc_info:
        event_data = EventCreate(
            event_name="   ",
            event_date=date(2024, 2, 15),
            location="Aspen, Colorado"
        )
    
    assert "event_name" in str(exc_info.value).lower()


# ============================================================================
# Test: Date Validation (Requirement 5.2)
# ============================================================================

def test_create_event_with_valid_date_succeeds(event_service, test_racer):
    """Test that valid date format is accepted."""
    event_data = EventCreate(
        event_name="Summer Race",
        event_date=date(2024, 6, 15),
        location="Lake Tahoe"
    )
    
    event = event_service.create_event(test_racer.id, event_data)
    
    assert event.event_date == date(2024, 6, 15)


def test_create_event_with_invalid_date_format_rejected(event_service, test_racer):
    """Test that invalid date format is rejected."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Pydantic will reject invalid date formats at schema level
    with pytest.raises((PydanticValidationError, ValueError, TypeError)):
        event_data = EventCreate(
            event_name="Invalid Date Event",
            event_date="not-a-date",  # type: ignore
            location="Somewhere"
        )


# ============================================================================
# Test: Location Validation (Requirement 5.3)
# ============================================================================

def test_create_event_with_empty_location_rejected(event_service, test_racer):
    """Test that empty location is rejected with descriptive error."""
    from pydantic import ValidationError as PydanticValidationError
    
    with pytest.raises(PydanticValidationError) as exc_info:
        event_data = EventCreate(
            event_name="Championship",
            event_date=date(2024, 2, 15),
            location=""
        )
    
    assert "location" in str(exc_info.value).lower()


def test_create_event_with_whitespace_location_rejected(event_service, test_racer):
    """Test that whitespace-only location is rejected."""
    from pydantic import ValidationError as PydanticValidationError
    
    with pytest.raises(PydanticValidationError) as exc_info:
        event_data = EventCreate(
            event_name="Championship",
            event_date=date(2024, 2, 15),
            location="   "
        )
    
    assert "location" in str(exc_info.value).lower()


# ============================================================================
# Test: Update Event Validation
# ============================================================================

def test_update_event_with_valid_data_succeeds(event_service, test_racer, valid_event_data):
    """Test that updating with valid data succeeds."""
    # Create an event first
    event = event_service.create_event(test_racer.id, valid_event_data)
    
    # Update with valid data
    update_data = EventUpdate(
        event_name="Updated Championship",
        location="New Location"
    )
    
    updated_event = event_service.update_event(event.id, update_data)
    
    assert updated_event.event_name == "Updated Championship"
    assert updated_event.location == "New Location"
    # Date should remain unchanged
    assert updated_event.event_date == valid_event_data.event_date


def test_update_event_with_empty_name_rejected(event_service, test_racer, valid_event_data):
    """Test that updating event name to empty string is rejected."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Create an event first
    event = event_service.create_event(test_racer.id, valid_event_data)
    
    # Try to update with empty name - Pydantic validates at schema level
    with pytest.raises(PydanticValidationError) as exc_info:
        update_data = EventUpdate(event_name="")
    
    assert "event_name" in str(exc_info.value).lower()


def test_update_event_with_empty_location_rejected(event_service, test_racer, valid_event_data):
    """Test that updating location to empty string is rejected."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Create an event first
    event = event_service.create_event(test_racer.id, valid_event_data)
    
    # Try to update with empty location - Pydantic validates at schema level
    with pytest.raises(PydanticValidationError) as exc_info:
        update_data = EventUpdate(location="")
    
    assert "location" in str(exc_info.value).lower()


def test_update_event_date_succeeds(event_service, test_racer, valid_event_data):
    """Test that updating event date succeeds."""
    # Create an event first
    event = event_service.create_event(test_racer.id, valid_event_data)
    
    # Update date
    new_date = date(2024, 3, 20)
    update_data = EventUpdate(event_date=new_date)
    
    updated_event = event_service.update_event(event.id, update_data)
    
    assert updated_event.event_date == new_date


# ============================================================================
# Test: Get Events
# ============================================================================

def test_get_events_returns_all_events_for_racer(event_service, test_racer):
    """Test retrieving all events for a racer."""
    # Create multiple events
    event1_data = EventCreate(
        event_name="Event 1",
        event_date=date(2024, 2, 15),
        location="Location 1"
    )
    event2_data = EventCreate(
        event_name="Event 2",
        event_date=date(2024, 3, 20),
        location="Location 2"
    )
    
    event1 = event_service.create_event(test_racer.id, event1_data)
    event2 = event_service.create_event(test_racer.id, event2_data)
    
    # Retrieve events
    events = event_service.get_events(test_racer.id)
    
    assert len(events) == 2
    event_ids = [e.id for e in events]
    assert event1.id in event_ids
    assert event2.id in event_ids


def test_get_events_returns_chronological_order(event_service, test_racer):
    """Test that events are returned in chronological order (earliest first)."""
    # Create events with different dates (not in chronological order)
    event_march = EventCreate(
        event_name="March Event",
        event_date=date(2024, 3, 15),
        location="Location"
    )
    event_january = EventCreate(
        event_name="January Event",
        event_date=date(2024, 1, 10),
        location="Location"
    )
    event_february = EventCreate(
        event_name="February Event",
        event_date=date(2024, 2, 20),
        location="Location"
    )
    
    # Create in non-chronological order
    event_service.create_event(test_racer.id, event_march)
    event_service.create_event(test_racer.id, event_january)
    event_service.create_event(test_racer.id, event_february)
    
    # Retrieve events
    events = event_service.get_events(test_racer.id)
    
    # Verify chronological order
    assert len(events) == 3
    assert events[0].event_date == date(2024, 1, 10)
    assert events[1].event_date == date(2024, 2, 20)
    assert events[2].event_date == date(2024, 3, 15)


def test_get_events_returns_empty_list_for_racer_with_no_events(event_service, test_racer):
    """Test that retrieving events for racer with no events returns empty list."""
    events = event_service.get_events(test_racer.id)
    
    assert events == []


# ============================================================================
# Test: Get Event by ID
# ============================================================================

def test_get_event_with_valid_id_succeeds(event_service, test_racer, valid_event_data):
    """Test retrieving an event by valid ID succeeds."""
    # Create an event first
    created_event = event_service.create_event(test_racer.id, valid_event_data)
    
    # Retrieve the event
    retrieved_event = event_service.get_event(created_event.id)
    
    assert retrieved_event.id == created_event.id
    assert retrieved_event.event_name == created_event.event_name
    assert retrieved_event.event_date == created_event.event_date
    assert retrieved_event.location == created_event.location


def test_get_event_with_invalid_id_raises_not_found(event_service):
    """Test that retrieving non-existent event raises NotFoundError."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    with pytest.raises(NotFoundError) as exc_info:
        event_service.get_event(fake_id)
    
    assert "not found" in str(exc_info.value).lower()
    assert fake_id in str(exc_info.value)


# ============================================================================
# Test: Delete Event
# ============================================================================

def test_delete_event_with_valid_id_succeeds(event_service, test_racer, valid_event_data):
    """Test deleting an event by valid ID succeeds."""
    # Create an event first
    event = event_service.create_event(test_racer.id, valid_event_data)
    
    # Delete the event
    event_service.delete_event(event.id)
    
    # Verify event is deleted
    with pytest.raises(NotFoundError):
        event_service.get_event(event.id)


def test_delete_event_with_invalid_id_raises_not_found(event_service):
    """Test that deleting non-existent event raises NotFoundError."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    with pytest.raises(NotFoundError) as exc_info:
        event_service.delete_event(fake_id)
    
    assert "not found" in str(exc_info.value).lower()
    assert fake_id in str(exc_info.value)


# ============================================================================
# Test: Update Non-Existent Event
# ============================================================================

def test_update_nonexistent_event_raises_not_found(event_service):
    """Test that updating non-existent event raises NotFoundError."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    update_data = EventUpdate(event_name="Updated Name")
    
    with pytest.raises(NotFoundError) as exc_info:
        event_service.update_event(fake_id, update_data)
    
    assert "not found" in str(exc_info.value).lower()
    assert fake_id in str(exc_info.value)


# ============================================================================
# Test: Validate Event Data Method
# ============================================================================

def test_validate_event_data_with_valid_create_data(event_service, valid_event_data):
    """Test validate_event_data with valid EventCreate data."""
    # Should not raise any exception
    event_service.validate_event_data(valid_event_data)


def test_validate_event_data_with_valid_update_data(event_service):
    """Test validate_event_data with valid EventUpdate data."""
    update_data = EventUpdate(
        event_name="Updated Event",
        location="New Location"
    )
    
    # Should not raise any exception
    event_service.validate_event_data(update_data)


# ============================================================================
# Test: Error Message Descriptiveness (Requirement 9.1, 9.2)
# ============================================================================

def test_error_messages_are_descriptive(event_service):
    """Test that error messages are descriptive and indicate specific failures."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Test event name validation error message at Pydantic level
    with pytest.raises(PydanticValidationError) as exc_info:
        event_data = EventCreate(
            event_name="",
            event_date=date(2024, 2, 15),
            location="Location"
        )
    
    error_message = str(exc_info.value)
    # Error message should be descriptive
    assert len(error_message) > 10
    # Should mention the field
    assert "event_name" in error_message.lower()


def test_not_found_error_messages_are_descriptive(event_service):
    """Test that NotFoundError messages are descriptive."""
    fake_id = "nonexistent-event-12345"
    
    with pytest.raises(NotFoundError) as exc_info:
        event_service.get_event(fake_id)
    
    error_message = str(exc_info.value)
    # Should mention what wasn't found
    assert "not found" in error_message.lower()
    # Should include the ID
    assert fake_id in error_message


def test_validation_error_messages_indicate_field(event_service):
    """Test that validation errors indicate which field caused the failure."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Test location validation error
    with pytest.raises(PydanticValidationError) as exc_info:
        event_data = EventCreate(
            event_name="Event",
            event_date=date(2024, 2, 15),
            location=""
        )
    
    error_message = str(exc_info.value)
    # Should indicate the specific field
    assert "location" in error_message.lower()


# ============================================================================
# Test: Edge Cases
# ============================================================================

def test_create_event_with_past_date_succeeds(event_service, test_racer):
    """Test that creating an event with a past date is allowed."""
    past_date = date(2020, 1, 1)
    event_data = EventCreate(
        event_name="Past Event",
        event_date=past_date,
        location="Historical Location"
    )
    
    event = event_service.create_event(test_racer.id, event_data)
    
    assert event.event_date == past_date


def test_create_event_with_future_date_succeeds(event_service, test_racer):
    """Test that creating an event with a future date is allowed."""
    future_date = date(2030, 12, 31)
    event_data = EventCreate(
        event_name="Future Event",
        event_date=future_date,
        location="Future Location"
    )
    
    event = event_service.create_event(test_racer.id, event_data)
    
    assert event.event_date == future_date


def test_create_multiple_events_same_date_succeeds(event_service, test_racer):
    """Test that creating multiple events on the same date is allowed."""
    same_date = date(2024, 5, 15)
    
    event1_data = EventCreate(
        event_name="Morning Event",
        event_date=same_date,
        location="Location 1"
    )
    event2_data = EventCreate(
        event_name="Afternoon Event",
        event_date=same_date,
        location="Location 2"
    )
    
    event1 = event_service.create_event(test_racer.id, event1_data)
    event2 = event_service.create_event(test_racer.id, event2_data)
    
    assert event1.event_date == same_date
    assert event2.event_date == same_date
    assert event1.id != event2.id


def test_update_event_notes_to_none_succeeds(event_service, test_racer, valid_event_data):
    """Test that updating notes to None succeeds."""
    # Create an event with notes
    event = event_service.create_event(test_racer.id, valid_event_data)
    assert event.notes is not None
    
    # Update notes to None
    update_data = EventUpdate(notes=None)
    updated_event = event_service.update_event(event.id, update_data)
    
    assert updated_event.notes is None
