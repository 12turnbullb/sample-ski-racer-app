"""
Unit tests for racer repository database operations.

Tests verify CRUD operations for racer profiles including create, get,
update, delete, and list methods.

Requirements: 1.1, 1.2, 1.3, 1.4
"""

import pytest
from sqlalchemy.orm import Session
from app.repositories.racer_repository import RacerRepository
from app.schemas import RacerCreate, RacerUpdate
from app.models import Racer
from app.database import SessionLocal, init_db


@pytest.fixture(scope="module")
def setup_database():
    """Initialize the database before running tests."""
    init_db()
    yield


@pytest.fixture
def db_session(setup_database):
    """Create a new database session for each test."""
    db = SessionLocal()
    try:
        yield db
    finally:
        # Clean up: delete all racers created during tests
        db.query(Racer).delete()
        db.commit()
        db.close()


@pytest.fixture
def racer_repository(db_session):
    """Create a racer repository instance for testing."""
    return RacerRepository(db_session)


@pytest.fixture
def sample_racer_data():
    """Provide sample valid racer data for testing."""
    return RacerCreate(
        height=175.5,
        weight=70.0,
        ski_types="Slalom, Giant Slalom",
        binding_measurements='{"din": 8.5, "boot_sole_length": 305}',
        personal_records='{"slalom": "45.32s", "giant_slalom": "1:12.45"}',
        racing_goals="Qualify for national championships"
    )


# ============================================================================
# Create Tests
# ============================================================================

def test_create_racer_success(racer_repository, sample_racer_data):
    """Test creating a new racer profile with valid data."""
    # Requirement: 1.1 - Create new Racer_Profile and store in Database
    racer = racer_repository.create(sample_racer_data)
    
    assert racer is not None
    assert racer.id is not None
    assert racer.height == sample_racer_data.height
    assert racer.weight == sample_racer_data.weight
    assert racer.ski_types == sample_racer_data.ski_types
    assert racer.binding_measurements == sample_racer_data.binding_measurements
    assert racer.personal_records == sample_racer_data.personal_records
    assert racer.racing_goals == sample_racer_data.racing_goals
    assert racer.created_at is not None
    assert racer.updated_at is not None


def test_create_racer_generates_unique_ids(racer_repository, sample_racer_data):
    """Test that creating multiple racers generates unique IDs."""
    racer1 = racer_repository.create(sample_racer_data)
    racer2 = racer_repository.create(sample_racer_data)
    
    assert racer1.id != racer2.id


def test_create_racer_with_minimal_data(racer_repository):
    """Test creating a racer with minimal valid data."""
    minimal_data = RacerCreate(
        height=160.0,
        weight=55.0,
        ski_types="Downhill",
        binding_measurements='{"din": 7.0}',
        personal_records='{}',
        racing_goals="Improve technique"
    )
    
    racer = racer_repository.create(minimal_data)
    
    assert racer is not None
    assert racer.height == 160.0
    assert racer.weight == 55.0


# ============================================================================
# Get Tests
# ============================================================================

def test_get_racer_by_id_success(racer_repository, sample_racer_data):
    """Test retrieving a racer profile by ID."""
    # Requirement: 1.2 - Retrieve and display Racer_Profile from Database
    created_racer = racer_repository.create(sample_racer_data)
    
    retrieved_racer = racer_repository.get(created_racer.id)
    
    assert retrieved_racer is not None
    assert retrieved_racer.id == created_racer.id
    assert retrieved_racer.height == created_racer.height
    assert retrieved_racer.weight == created_racer.weight


def test_get_racer_not_found(racer_repository):
    """Test retrieving a non-existent racer returns None."""
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    
    racer = racer_repository.get(non_existent_id)
    
    assert racer is None


def test_get_racer_preserves_all_fields(racer_repository, sample_racer_data):
    """Test that get retrieves all racer fields correctly."""
    created_racer = racer_repository.create(sample_racer_data)
    
    retrieved_racer = racer_repository.get(created_racer.id)
    
    assert retrieved_racer.ski_types == sample_racer_data.ski_types
    assert retrieved_racer.binding_measurements == sample_racer_data.binding_measurements
    assert retrieved_racer.personal_records == sample_racer_data.personal_records
    assert retrieved_racer.racing_goals == sample_racer_data.racing_goals


# ============================================================================
# Update Tests
# ============================================================================

def test_update_racer_single_field(racer_repository, sample_racer_data):
    """Test updating a single field of a racer profile."""
    # Requirement: 1.3 - Modify existing Racer_Profile in Database
    created_racer = racer_repository.create(sample_racer_data)
    
    update_data = RacerUpdate(height=180.0)
    updated_racer = racer_repository.update(created_racer.id, update_data)
    
    assert updated_racer is not None
    assert updated_racer.height == 180.0
    assert updated_racer.weight == sample_racer_data.weight  # Unchanged


def test_update_racer_multiple_fields(racer_repository, sample_racer_data):
    """Test updating multiple fields of a racer profile."""
    created_racer = racer_repository.create(sample_racer_data)
    
    update_data = RacerUpdate(
        height=182.0,
        weight=75.0,
        racing_goals="Win regional championship"
    )
    updated_racer = racer_repository.update(created_racer.id, update_data)
    
    assert updated_racer is not None
    assert updated_racer.height == 182.0
    assert updated_racer.weight == 75.0
    assert updated_racer.racing_goals == "Win regional championship"
    assert updated_racer.ski_types == sample_racer_data.ski_types  # Unchanged


def test_update_racer_not_found(racer_repository):
    """Test updating a non-existent racer returns None."""
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    update_data = RacerUpdate(height=180.0)
    
    result = racer_repository.update(non_existent_id, update_data)
    
    assert result is None


def test_update_racer_persists_changes(racer_repository, sample_racer_data):
    """Test that updates persist when retrieving the racer again."""
    created_racer = racer_repository.create(sample_racer_data)
    
    update_data = RacerUpdate(weight=72.5)
    racer_repository.update(created_racer.id, update_data)
    
    # Retrieve again to verify persistence
    retrieved_racer = racer_repository.get(created_racer.id)
    
    assert retrieved_racer.weight == 72.5


# ============================================================================
# Delete Tests
# ============================================================================

def test_delete_racer_success(racer_repository, sample_racer_data):
    """Test deleting a racer profile."""
    # Requirement: 1.4 - Remove Racer_Profile from Database
    created_racer = racer_repository.create(sample_racer_data)
    
    result = racer_repository.delete(created_racer.id)
    
    assert result is True
    
    # Verify racer is no longer retrievable
    deleted_racer = racer_repository.get(created_racer.id)
    assert deleted_racer is None


def test_delete_racer_not_found(racer_repository):
    """Test deleting a non-existent racer returns False."""
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    
    result = racer_repository.delete(non_existent_id)
    
    assert result is False


def test_delete_racer_is_permanent(racer_repository, sample_racer_data):
    """Test that deleted racer cannot be retrieved."""
    created_racer = racer_repository.create(sample_racer_data)
    racer_id = created_racer.id
    
    racer_repository.delete(racer_id)
    
    # Multiple attempts to retrieve should all return None
    assert racer_repository.get(racer_id) is None
    assert racer_repository.get(racer_id) is None


# ============================================================================
# List Tests
# ============================================================================

def test_list_racers_empty(racer_repository):
    """Test listing racers when database is empty."""
    racers = racer_repository.list()
    
    assert racers is not None
    assert isinstance(racers, list)
    assert len(racers) == 0


def test_list_racers_returns_all(racer_repository, sample_racer_data):
    """Test listing racers returns all created racers."""
    # Create multiple racers
    racer1 = racer_repository.create(sample_racer_data)
    racer2 = racer_repository.create(sample_racer_data)
    racer3 = racer_repository.create(sample_racer_data)
    
    racers = racer_repository.list()
    
    assert len(racers) == 3
    racer_ids = [r.id for r in racers]
    assert racer1.id in racer_ids
    assert racer2.id in racer_ids
    assert racer3.id in racer_ids


def test_list_racers_with_pagination(racer_repository, sample_racer_data):
    """Test listing racers with skip and limit parameters."""
    # Create 5 racers
    for _ in range(5):
        racer_repository.create(sample_racer_data)
    
    # Get first 2 racers
    first_page = racer_repository.list(skip=0, limit=2)
    assert len(first_page) == 2
    
    # Get next 2 racers
    second_page = racer_repository.list(skip=2, limit=2)
    assert len(second_page) == 2
    
    # Verify they are different racers
    first_ids = [r.id for r in first_page]
    second_ids = [r.id for r in second_page]
    assert not any(id in second_ids for id in first_ids)


def test_list_racers_skip_beyond_count(racer_repository, sample_racer_data):
    """Test listing racers with skip beyond total count returns empty list."""
    racer_repository.create(sample_racer_data)
    
    racers = racer_repository.list(skip=10, limit=10)
    
    assert len(racers) == 0


def test_list_racers_after_delete(racer_repository, sample_racer_data):
    """Test that list does not include deleted racers."""
    racer1 = racer_repository.create(sample_racer_data)
    racer2 = racer_repository.create(sample_racer_data)
    
    # Delete one racer
    racer_repository.delete(racer1.id)
    
    racers = racer_repository.list()
    
    assert len(racers) == 1
    assert racers[0].id == racer2.id
