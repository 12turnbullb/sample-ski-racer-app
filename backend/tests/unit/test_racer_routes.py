"""
Unit tests for racer API routes.

Tests the racer API endpoints to ensure proper HTTP status codes,
request/response handling, and error handling.

Requirements: 6.1, 6.4, 6.5, 6.6, 6.7
"""

import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.routers.racers import router
from app.models import Racer


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
def sample_racer_data():
    """Sample valid racer data for testing."""
    return {
        "height": 175.5,
        "weight": 70.0,
        "ski_types": "Slalom, Giant Slalom",
        "binding_measurements": '{"din": 8.5, "boot_sole_length": 305}',
        "personal_records": '[{"event": "Slalom", "time": "1:23.45", "date": "2023-01-15"}]',
        "racing_goals": "Qualify for nationals"
    }


# ============================================================================
# POST /api/racers - Create Racer Tests
# ============================================================================

def test_create_racer_success(client, sample_racer_data):
    """Test successful racer creation returns 201 Created."""
    response = client.post("/api/racers", json=sample_racer_data)
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    
    # Verify response contains all fields
    assert "id" in data
    assert data["height"] == sample_racer_data["height"]
    assert data["weight"] == sample_racer_data["weight"]
    assert data["ski_types"] == sample_racer_data["ski_types"]
    assert data["binding_measurements"] == sample_racer_data["binding_measurements"]
    assert data["personal_records"] == sample_racer_data["personal_records"]
    assert data["racing_goals"] == sample_racer_data["racing_goals"]
    assert "created_at" in data
    assert "updated_at" in data


def test_create_racer_invalid_height_returns_400(client, sample_racer_data):
    """Test creating racer with height <= 0 returns 422 (Pydantic validation)."""
    sample_racer_data["height"] = 0
    response = client.post("/api/racers", json=sample_racer_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    # Check that error mentions height
    response_data = response.json()
    assert "detail" in response_data


def test_create_racer_negative_height_returns_400(client, sample_racer_data):
    """Test creating racer with negative height returns 422 (Pydantic validation)."""
    sample_racer_data["height"] = -10.5
    response = client.post("/api/racers", json=sample_racer_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_racer_invalid_weight_returns_400(client, sample_racer_data):
    """Test creating racer with weight <= 0 returns 422 (Pydantic validation)."""
    sample_racer_data["weight"] = 0
    response = client.post("/api/racers", json=sample_racer_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_racer_negative_weight_returns_400(client, sample_racer_data):
    """Test creating racer with negative weight returns 422 (Pydantic validation)."""
    sample_racer_data["weight"] = -5.0
    response = client.post("/api/racers", json=sample_racer_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_racer_empty_ski_types_returns_400(client, sample_racer_data):
    """Test creating racer with empty ski_types returns 422 (Pydantic validation)."""
    sample_racer_data["ski_types"] = ""
    response = client.post("/api/racers", json=sample_racer_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_racer_whitespace_ski_types_returns_400(client, sample_racer_data):
    """Test creating racer with whitespace-only ski_types returns 422 (Pydantic validation)."""
    sample_racer_data["ski_types"] = "   "
    response = client.post("/api/racers", json=sample_racer_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_racer_missing_required_field_returns_422(client, sample_racer_data):
    """Test creating racer with missing required field returns 422 Unprocessable Entity."""
    del sample_racer_data["height"]
    response = client.post("/api/racers", json=sample_racer_data)
    
    # FastAPI/Pydantic returns 422 for missing required fields
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ============================================================================
# GET /api/racers/{id} - Get Racer Tests
# ============================================================================

def test_get_racer_success(client, sample_racer_data):
    """Test successful racer retrieval returns 200 OK."""
    # First create a racer
    create_response = client.post("/api/racers", json=sample_racer_data)
    racer_id = create_response.json()["id"]
    
    # Then retrieve it
    response = client.get(f"/api/racers/{racer_id}")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == racer_id
    assert data["height"] == sample_racer_data["height"]
    assert data["weight"] == sample_racer_data["weight"]


def test_get_racer_not_found_returns_404(client):
    """Test getting non-existent racer returns 404 Not Found."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/racers/{fake_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


# ============================================================================
# PUT /api/racers/{id} - Update Racer Tests
# ============================================================================

def test_update_racer_success(client, sample_racer_data):
    """Test successful racer update returns 200 OK."""
    # First create a racer
    create_response = client.post("/api/racers", json=sample_racer_data)
    racer_id = create_response.json()["id"]
    
    # Update the racer
    update_data = {"height": 180.0, "weight": 75.0}
    response = client.put(f"/api/racers/{racer_id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == racer_id
    assert data["height"] == 180.0
    assert data["weight"] == 75.0
    # Other fields should remain unchanged
    assert data["ski_types"] == sample_racer_data["ski_types"]


def test_update_racer_partial_update(client, sample_racer_data):
    """Test partial update only modifies provided fields."""
    # First create a racer
    create_response = client.post("/api/racers", json=sample_racer_data)
    racer_id = create_response.json()["id"]
    original_weight = create_response.json()["weight"]
    
    # Update only height
    update_data = {"height": 180.0}
    response = client.put(f"/api/racers/{racer_id}", json=update_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["height"] == 180.0
    assert data["weight"] == original_weight  # Should remain unchanged


def test_update_racer_invalid_height_returns_400(client, sample_racer_data):
    """Test updating racer with height <= 0 returns 422 (Pydantic validation)."""
    # First create a racer
    create_response = client.post("/api/racers", json=sample_racer_data)
    racer_id = create_response.json()["id"]
    
    # Try to update with invalid height
    update_data = {"height": 0}
    response = client.put(f"/api/racers/{racer_id}", json=update_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_racer_invalid_weight_returns_400(client, sample_racer_data):
    """Test updating racer with weight <= 0 returns 422 (Pydantic validation)."""
    # First create a racer
    create_response = client.post("/api/racers", json=sample_racer_data)
    racer_id = create_response.json()["id"]
    
    # Try to update with invalid weight
    update_data = {"weight": -5.0}
    response = client.put(f"/api/racers/{racer_id}", json=update_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_update_racer_not_found_returns_404(client):
    """Test updating non-existent racer returns 404 Not Found."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    update_data = {"height": 180.0}
    response = client.put(f"/api/racers/{fake_id}", json=update_data)
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


def test_update_racer_empty_field_returns_400(client, sample_racer_data):
    """Test updating racer with empty field returns 422 (Pydantic validation)."""
    # First create a racer
    create_response = client.post("/api/racers", json=sample_racer_data)
    racer_id = create_response.json()["id"]
    
    # Try to update with empty ski_types
    update_data = {"ski_types": ""}
    response = client.put(f"/api/racers/{racer_id}", json=update_data)
    
    # Pydantic validation errors return 422
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ============================================================================
# DELETE /api/racers/{id} - Delete Racer Tests
# ============================================================================

def test_delete_racer_success(client, sample_racer_data):
    """Test successful racer deletion returns 200 OK."""
    # First create a racer
    create_response = client.post("/api/racers", json=sample_racer_data)
    racer_id = create_response.json()["id"]
    
    # Delete the racer
    response = client.delete(f"/api/racers/{racer_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert "deleted successfully" in response.json()["message"].lower()
    
    # Verify racer is actually deleted
    get_response = client.get(f"/api/racers/{racer_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_racer_not_found_returns_404(client):
    """Test deleting non-existent racer returns 404 Not Found."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.delete(f"/api/racers/{fake_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


# ============================================================================
# GET /api/racers - List Racers Tests
# ============================================================================

def test_list_racers_empty(client):
    """Test listing racers when database is empty returns 200 OK with empty list."""
    response = client.get("/api/racers")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_list_racers_with_data(client, sample_racer_data):
    """Test listing racers returns all created racers."""
    # Create multiple racers
    client.post("/api/racers", json=sample_racer_data)
    
    sample_racer_data_2 = sample_racer_data.copy()
    sample_racer_data_2["height"] = 180.0
    client.post("/api/racers", json=sample_racer_data_2)
    
    # List all racers
    response = client.get("/api/racers")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    assert all("id" in racer for racer in data)


def test_list_racers_pagination(client, sample_racer_data):
    """Test listing racers with pagination parameters."""
    # Create multiple racers
    for i in range(5):
        data = sample_racer_data.copy()
        data["height"] = 170.0 + i
        client.post("/api/racers", json=data)
    
    # Test skip and limit
    response = client.get("/api/racers?skip=2&limit=2")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2


# ============================================================================
# HTTP Status Code Tests
# ============================================================================

def test_successful_operations_return_2xx(client, sample_racer_data):
    """Test that successful operations return 2xx status codes."""
    # Create - should return 201
    create_response = client.post("/api/racers", json=sample_racer_data)
    assert 200 <= create_response.status_code < 300
    assert create_response.status_code == status.HTTP_201_CREATED
    
    racer_id = create_response.json()["id"]
    
    # Get - should return 200
    get_response = client.get(f"/api/racers/{racer_id}")
    assert 200 <= get_response.status_code < 300
    assert get_response.status_code == status.HTTP_200_OK
    
    # Update - should return 200
    update_response = client.put(f"/api/racers/{racer_id}", json={"height": 180.0})
    assert 200 <= update_response.status_code < 300
    assert update_response.status_code == status.HTTP_200_OK
    
    # List - should return 200
    list_response = client.get("/api/racers")
    assert 200 <= list_response.status_code < 300
    assert list_response.status_code == status.HTTP_200_OK
    
    # Delete - should return 200
    delete_response = client.delete(f"/api/racers/{racer_id}")
    assert 200 <= delete_response.status_code < 300
    assert delete_response.status_code == status.HTTP_200_OK


def test_client_errors_return_4xx(client, sample_racer_data):
    """Test that client errors return 4xx status codes."""
    # Invalid data - Pydantic validation returns 422 (which is 4xx)
    invalid_data = sample_racer_data.copy()
    invalid_data["height"] = 0
    response = client.post("/api/racers", json=invalid_data)
    assert 400 <= response.status_code < 500
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    # Not found - should return 404
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/racers/{fake_id}")
    assert 400 <= response.status_code < 500
    assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # Missing required field - should return 422
    incomplete_data = {"height": 175.0}  # Missing other required fields
    response = client.post("/api/racers", json=incomplete_data)
    assert 400 <= response.status_code < 500
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
