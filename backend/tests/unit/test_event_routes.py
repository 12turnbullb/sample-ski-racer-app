"""
Unit tests for event API routes.

Tests the event API endpoints to ensure proper HTTP status codes,
request/response handling, and error handling.

Requirements: 6.3, 6.4
"""

import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import date

from app.database import Base, get_db
from app.routers.events import router
from app.models import Racer, Event


# ============================================================================
# Test Database Setup
# ============================================================================

@pytest.fixture
def test_db():
    """Create a test database for each test."""
    # Use in-memory SQLite database for testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(test_db):
    """Create a test client with the test database."""
    app = FastAPI()
    app.include_router(router)
    
    # Override the get_db dependency
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    return TestClient(app)


@pytest.fixture
def sample_racer(test_db):
    """Create a sample racer for testing events."""
    racer = Racer(
        height=175.5,
        weight=70.0,
        ski_types="Slalom, Giant Slalom",
        binding_measurements='{"din": 8.5, "boot_sole_length": 305}',
        personal_records='[{"event": "Slalom", "time": "1:23.45", "date": "2023-01-15"}]',
        racing_goals="Qualify for nationals"
    )
    test_db.add(racer)
    test_db.commit()
    test_db.refresh(racer)
    return racer


@pytest.fixture
def sample_event_data():
    """Sample valid event data for testing."""
    return {
        "event_name": "Winter Championship",
        "event_date": "2024-02-15",
        "location": "Aspen, Colorado",
        "notes": "First race of the season"
    }


# ============================================================================
# POST /api/racers/{id}/events - Create Event Tests
# ============================================================================

def test_create_event_success(client, sample_racer, sample_event_data):
    """Test successful event creation returns 201 Created."""
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    
    # Verify response contains all fields
    assert "id" in data
    assert data["racer_id"] == sample_racer.id
    assert data["event_name"] == sample_event_data["event_name"]
    assert data["event_date"] == sample_event_data["event_date"]
    assert data["location"] == sample_event_data["location"]
    assert data["notes"] == sample_event_data["notes"]
    assert "created_at" in data
    assert "updated_at" in data


def test_create_event_without_notes(client, sample_racer, sample_event_data):
    """Test creating event without optional notes field."""
    del sample_event_data["notes"]
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["notes"] is None


def test_create_event_empty_name_returns_422(client, sample_racer, sample_event_data):
    """Test creating event with empty name returns 422 (Pydantic validation)."""
    sample_event_data["event_name"] = ""
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_event_whitespace_name_returns_422(client, sample_racer, sample_event_data):
    """Test creating event with whitespace-only name returns 422 (Pydantic validation)."""
    sample_event_data["event_name"] = "   "
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_event_empty_location_returns_422(client, sample_racer, sample_event_data):
    """Test creating event with empty location returns 422 (Pydantic validation)."""
    sample_event_data["location"] = ""
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_event_whitespace_location_returns_422(client, sample_racer, sample_event_data):
    """Test creating event with whitespace-only location returns 422 (Pydantic validation)."""
    sample_event_data["location"] = "   "
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_event_invalid_date_format_returns_422(client, sample_racer, sample_event_data):
    """Test creating event with invalid date format returns 422 (Pydantic validation)."""
    sample_event_data["event_date"] = "15-02-2024"  # Wrong format
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_event_missing_required_field_returns_422(client, sample_racer, sample_event_data):
    """Test creating event with missing required field returns 422 Unprocessable Entity."""
    del sample_event_data["event_name"]
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    
    # FastAPI/Pydantic returns 422 for missing required fields
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ============================================================================
# GET /api/racers/{id}/events - Get Events Tests
# ============================================================================

def test_get_events_empty(client, sample_racer):
    """Test getting events for racer with no events returns empty list."""
    response = client.get(f"/api/racers/{sample_racer.id}/events")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_get_events_success(client, sample_racer, sample_event_data):
    """Test successful event retrieval returns 200 OK."""
    # Create an event
    create_response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    event_id = create_response.json()["id"]
    
    # Get all events for racer
    response = client.get(f"/api/racers/{sample_racer.id}/events")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == event_id
    assert data[0]["event_name"] == sample_event_data["event_name"]


def test_get_events_chronological_order(client, sample_racer):
    """Test events are returned in chronological order (earliest first)."""
    # Create events with different dates
    event1 = {
        "event_name": "Spring Race",
        "event_date": "2024-03-15",
        "location": "Location 1"
    }
    event2 = {
        "event_name": "Winter Race",
        "event_date": "2024-01-10",
        "location": "Location 2"
    }
    event3 = {
        "event_name": "Summer Race",
        "event_date": "2024-06-20",
        "location": "Location 3"
    }
    
    # Create in non-chronological order
    client.post(f"/api/racers/{sample_racer.id}/events", json=event1)
    client.post(f"/api/racers/{sample_racer.id}/events", json=event2)
    client.post(f"/api/racers/{sample_racer.id}/events", json=event3)
    
    # Get all events
    response = client.get(f"/api/racers/{sample_racer.id}/events")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 3
    
    # Verify chronological order (earliest first)
    assert data[0]["event_date"] == "2024-01-10"  # Winter
    assert data[1]["event_date"] == "2024-03-15"  # Spring
    assert data[2]["event_date"] == "2024-06-20"  # Summer


def test_get_events_multiple_racers(client, test_db, sample_event_data):
    """Test events are filtered by racer_id."""
    # Create two racers
    racer1 = Racer(
        height=175.5,
        weight=70.0,
        ski_types="Slalom",
        binding_measurements='{}',
        personal_records='[]',
        racing_goals="Goals 1"
    )
    racer2 = Racer(
        height=180.0,
        weight=75.0,
        ski_types="Giant Slalom",
        binding_measurements='{}',
        personal_records='[]',
        racing_goals="Goals 2"
    )
    test_db.add(racer1)
    test_db.add(racer2)
    test_db.commit()
    test_db.refresh(racer1)
    test_db.refresh(racer2)
    
    # Create events for each racer
    client.post(f"/api/racers/{racer1.id}/events", json=sample_event_data)
    
    event2_data = sample_event_data.copy()
    event2_data["event_name"] = "Different Event"
    client.post(f"/api/racers/{racer2.id}/events", json=event2_data)
    
    # Get events for racer1
    response = client.get(f"/api/racers/{racer1.id}/events")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["event_name"] == sample_event_data["event_name"]


# ============================================================================
# PUT /api/events/{id} - Update Event Tests
# ============================================================================

def test_update_event_success(client, sample_racer, sample_event_data):
    """Test successful event update returns 200 OK."""
    # Create an event
    create_response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    event_id = create_response.json()["id"]
    
    # Update the event
    update_data = {
        "event_name": "Updated Championship",
        "location": "Vail, Colorado"
    }
    response = client.put(f"/api/events/{event_id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == event_id
    assert data["event_name"] == "Updated Championship"
    assert data["location"] == "Vail, Colorado"
    # Other fields should remain unchanged
    assert data["event_date"] == sample_event_data["event_date"]


def test_update_event_partial_update(client, sample_racer, sample_event_data):
    """Test partial update only modifies provided fields."""
    # Create an event
    create_response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    event_id = create_response.json()["id"]
    original_location = create_response.json()["location"]
    
    # Update only event name
    update_data = {"event_name": "New Name"}
    response = client.put(f"/api/events/{event_id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["event_name"] == "New Name"
    assert data["location"] == original_location  # Should remain unchanged


def test_update_event_empty_name_returns_422(client, sample_racer, sample_event_data):
    """Test updating event with empty name returns 422 (Pydantic validation)."""
    # Create an event
    create_response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    event_id = create_response.json()["id"]
    
    # Try to update with empty name
    update_data = {"event_name": ""}
    response = client.put(f"/api/events/{event_id}", json=update_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_event_empty_location_returns_422(client, sample_racer, sample_event_data):
    """Test updating event with empty location returns 422 (Pydantic validation)."""
    # Create an event
    create_response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    event_id = create_response.json()["id"]
    
    # Try to update with empty location
    update_data = {"location": ""}
    response = client.put(f"/api/events/{event_id}", json=update_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_event_invalid_date_returns_422(client, sample_racer, sample_event_data):
    """Test updating event with invalid date format returns 422 (Pydantic validation)."""
    # Create an event
    create_response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    event_id = create_response.json()["id"]
    
    # Try to update with invalid date
    update_data = {"event_date": "invalid-date"}
    response = client.put(f"/api/events/{event_id}", json=update_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_event_not_found_returns_404(client):
    """Test updating non-existent event returns 404 Not Found."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    update_data = {"event_name": "New Name"}
    response = client.put(f"/api/events/{fake_id}", json=update_data)
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


# ============================================================================
# DELETE /api/events/{id} - Delete Event Tests
# ============================================================================

def test_delete_event_success(client, sample_racer, sample_event_data):
    """Test successful event deletion returns 200 OK."""
    # Create an event
    create_response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    event_id = create_response.json()["id"]
    
    # Delete the event
    response = client.delete(f"/api/events/{event_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert "deleted successfully" in response.json()["message"].lower()
    
    # Verify event is actually deleted
    get_response = client.get(f"/api/racers/{sample_racer.id}/events")
    assert get_response.status_code == status.HTTP_200_OK
    assert len(get_response.json()) == 0


def test_delete_event_not_found_returns_404(client):
    """Test deleting non-existent event returns 404 Not Found."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.delete(f"/api/events/{fake_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


# ============================================================================
# HTTP Status Code Tests
# ============================================================================

def test_successful_operations_return_2xx(client, sample_racer, sample_event_data):
    """Test that successful operations return 2xx status codes."""
    # Create - should return 201
    create_response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=sample_event_data
    )
    assert 200 <= create_response.status_code < 300
    assert create_response.status_code == status.HTTP_201_CREATED
    
    event_id = create_response.json()["id"]
    
    # Get - should return 200
    get_response = client.get(f"/api/racers/{sample_racer.id}/events")
    assert 200 <= get_response.status_code < 300
    assert get_response.status_code == status.HTTP_200_OK
    
    # Update - should return 200
    update_response = client.put(
        f"/api/events/{event_id}",
        json={"event_name": "Updated Name"}
    )
    assert 200 <= update_response.status_code < 300
    assert update_response.status_code == status.HTTP_200_OK
    
    # Delete - should return 200
    delete_response = client.delete(f"/api/events/{event_id}")
    assert 200 <= delete_response.status_code < 300
    assert delete_response.status_code == status.HTTP_200_OK


def test_client_errors_return_4xx(client, sample_racer, sample_event_data):
    """Test that client errors return 4xx status codes."""
    # Invalid data - Pydantic validation returns 422 (which is 4xx)
    invalid_data = sample_event_data.copy()
    invalid_data["event_name"] = ""
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=invalid_data
    )
    assert 400 <= response.status_code < 500
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    # Not found - should return 404
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.delete(f"/api/events/{fake_id}")
    assert 400 <= response.status_code < 500
    assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # Missing required field - should return 422
    incomplete_data = {"event_name": "Test"}  # Missing other required fields
    response = client.post(
        f"/api/racers/{sample_racer.id}/events",
        json=incomplete_data
    )
    assert 400 <= response.status_code < 500
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
