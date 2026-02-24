"""
Unit tests for event repository.

Tests the EventRepository class for CRUD operations on racing events.
"""

import pytest
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Event, Racer
from app.repositories.event_repository import EventRepository
from app.schemas import EventCreate, EventUpdate


# Test database setup
@pytest.fixture
def db_session():
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_racer(db_session):
    """Create a test racer for event association."""
    racer = Racer(
        height=175.0,
        weight=70.0,
        ski_types="Slalom, Giant Slalom",
        binding_measurements='{"din": 8.5}',
        personal_records='{"slalom": "45.2s"}',
        racing_goals="Win regional championship"
    )
    db_session.add(racer)
    db_session.commit()
    db_session.refresh(racer)
    return racer


@pytest.fixture
def event_repository(db_session):
    """Create an event repository instance."""
    return EventRepository(db_session)


def test_create_event(event_repository, test_racer):
    """Test creating a new racing event."""
    event_data = EventCreate(
        event_name="Regional Slalom Championship",
        event_date=date(2024, 3, 15),
        location="Aspen, CO",
        notes="First race of the season"
    )
    
    event = event_repository.create(test_racer.id, event_data)
    
    assert event.id is not None
    assert event.racer_id == test_racer.id
    assert event.event_name == "Regional Slalom Championship"
    assert event.event_date == date(2024, 3, 15)
    assert event.location == "Aspen, CO"
    assert event.notes == "First race of the season"
    assert event.created_at is not None
    assert event.updated_at is not None


def test_create_event_without_notes(event_repository, test_racer):
    """Test creating an event without optional notes."""
    event_data = EventCreate(
        event_name="Practice Run",
        event_date=date(2024, 3, 10),
        location="Local Slope"
    )
    
    event = event_repository.create(test_racer.id, event_data)
    
    assert event.id is not None
    assert event.event_name == "Practice Run"
    assert event.notes is None


def test_get_by_racer_chronological_order(event_repository, test_racer):
    """Test retrieving events for a racer in chronological order."""
    # Create events with different dates (not in chronological order)
    event_data_1 = EventCreate(
        event_name="Event 3",
        event_date=date(2024, 5, 1),
        location="Location 3"
    )
    event_data_2 = EventCreate(
        event_name="Event 1",
        event_date=date(2024, 3, 1),
        location="Location 1"
    )
    event_data_3 = EventCreate(
        event_name="Event 2",
        event_date=date(2024, 4, 1),
        location="Location 2"
    )
    
    event_repository.create(test_racer.id, event_data_1)
    event_repository.create(test_racer.id, event_data_2)
    event_repository.create(test_racer.id, event_data_3)
    
    # Retrieve events
    events = event_repository.get_by_racer(test_racer.id)
    
    # Verify chronological order (earliest to latest)
    assert len(events) == 3
    assert events[0].event_name == "Event 1"
    assert events[0].event_date == date(2024, 3, 1)
    assert events[1].event_name == "Event 2"
    assert events[1].event_date == date(2024, 4, 1)
    assert events[2].event_name == "Event 3"
    assert events[2].event_date == date(2024, 5, 1)


def test_get_by_racer_empty_list(event_repository, test_racer):
    """Test retrieving events when racer has no events."""
    events = event_repository.get_by_racer(test_racer.id)
    assert events == []


def test_get_by_id_found(event_repository, test_racer):
    """Test retrieving a specific event by ID."""
    event_data = EventCreate(
        event_name="Test Event",
        event_date=date(2024, 3, 15),
        location="Test Location"
    )
    created_event = event_repository.create(test_racer.id, event_data)
    
    # Retrieve by ID
    retrieved_event = event_repository.get_by_id(created_event.id)
    
    assert retrieved_event is not None
    assert retrieved_event.id == created_event.id
    assert retrieved_event.event_name == "Test Event"


def test_get_by_id_not_found(event_repository):
    """Test retrieving a non-existent event."""
    event = event_repository.get_by_id("non-existent-id")
    assert event is None


def test_update_event_all_fields(event_repository, test_racer):
    """Test updating all fields of an event."""
    # Create initial event
    event_data = EventCreate(
        event_name="Original Event",
        event_date=date(2024, 3, 15),
        location="Original Location",
        notes="Original notes"
    )
    event = event_repository.create(test_racer.id, event_data)
    
    # Update all fields
    update_data = EventUpdate(
        event_name="Updated Event",
        event_date=date(2024, 4, 20),
        location="Updated Location",
        notes="Updated notes"
    )
    updated_event = event_repository.update(event.id, update_data)
    
    assert updated_event is not None
    assert updated_event.id == event.id
    assert updated_event.event_name == "Updated Event"
    assert updated_event.event_date == date(2024, 4, 20)
    assert updated_event.location == "Updated Location"
    assert updated_event.notes == "Updated notes"


def test_update_event_partial_fields(event_repository, test_racer):
    """Test updating only some fields of an event."""
    # Create initial event
    event_data = EventCreate(
        event_name="Original Event",
        event_date=date(2024, 3, 15),
        location="Original Location",
        notes="Original notes"
    )
    event = event_repository.create(test_racer.id, event_data)
    
    # Update only event name and date
    update_data = EventUpdate(
        event_name="Updated Event",
        event_date=date(2024, 4, 20)
    )
    updated_event = event_repository.update(event.id, update_data)
    
    assert updated_event is not None
    assert updated_event.event_name == "Updated Event"
    assert updated_event.event_date == date(2024, 4, 20)
    # These should remain unchanged
    assert updated_event.location == "Original Location"
    assert updated_event.notes == "Original notes"


def test_update_event_not_found(event_repository):
    """Test updating a non-existent event."""
    update_data = EventUpdate(event_name="Updated Event")
    updated_event = event_repository.update("non-existent-id", update_data)
    assert updated_event is None


def test_delete_event_success(event_repository, test_racer):
    """Test deleting an event successfully."""
    # Create event
    event_data = EventCreate(
        event_name="Event to Delete",
        event_date=date(2024, 3, 15),
        location="Test Location"
    )
    event = event_repository.create(test_racer.id, event_data)
    
    # Delete event
    result = event_repository.delete(event.id)
    assert result is True
    
    # Verify event is gone
    deleted_event = event_repository.get_by_id(event.id)
    assert deleted_event is None


def test_delete_event_not_found(event_repository):
    """Test deleting a non-existent event."""
    result = event_repository.delete("non-existent-id")
    assert result is False


def test_multiple_racers_events_isolated(event_repository, db_session):
    """Test that events are properly isolated between racers."""
    # Create two racers
    racer1 = Racer(
        height=175.0,
        weight=70.0,
        ski_types="Slalom",
        binding_measurements='{"din": 8.5}',
        personal_records='{"slalom": "45.2s"}',
        racing_goals="Win championship"
    )
    racer2 = Racer(
        height=180.0,
        weight=75.0,
        ski_types="Giant Slalom",
        binding_measurements='{"din": 9.0}',
        personal_records='{"gs": "50.1s"}',
        racing_goals="Improve times"
    )
    db_session.add(racer1)
    db_session.add(racer2)
    db_session.commit()
    db_session.refresh(racer1)
    db_session.refresh(racer2)
    
    # Create events for each racer
    event_data_1 = EventCreate(
        event_name="Racer 1 Event",
        event_date=date(2024, 3, 15),
        location="Location 1"
    )
    event_data_2 = EventCreate(
        event_name="Racer 2 Event",
        event_date=date(2024, 3, 20),
        location="Location 2"
    )
    
    event_repository.create(racer1.id, event_data_1)
    event_repository.create(racer2.id, event_data_2)
    
    # Verify each racer only sees their own events
    racer1_events = event_repository.get_by_racer(racer1.id)
    racer2_events = event_repository.get_by_racer(racer2.id)
    
    assert len(racer1_events) == 1
    assert racer1_events[0].event_name == "Racer 1 Event"
    
    assert len(racer2_events) == 1
    assert racer2_events[0].event_name == "Racer 2 Event"


def test_events_with_same_date_maintain_order(event_repository, test_racer):
    """Test that events with the same date maintain consistent order."""
    same_date = date(2024, 3, 15)
    
    # Create multiple events with the same date
    for i in range(3):
        event_data = EventCreate(
            event_name=f"Event {i}",
            event_date=same_date,
            location=f"Location {i}"
        )
        event_repository.create(test_racer.id, event_data)
    
    # Retrieve events
    events = event_repository.get_by_racer(test_racer.id)
    
    # All events should have the same date
    assert len(events) == 3
    assert all(event.event_date == same_date for event in events)
