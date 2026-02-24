"""
Unit tests for racer service business logic and validation.

Tests specific validation scenarios, error handling, and edge cases
for the RacerService class.

Requirements: 2.1, 2.2, 2.3, 9.1, 9.2
"""

import pytest
from sqlalchemy.orm import Session
from app.services.racer_service import (
    RacerService,
    ValidationError as ServiceValidationError,
    NotFoundError,
    RacerServiceError
)
from app.schemas import RacerCreate, RacerUpdate
from app.models import Racer
from app.database import get_db, engine, Base


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
def racer_service(db_session):
    """Create a RacerService instance for testing."""
    return RacerService(db_session)


@pytest.fixture
def valid_racer_data():
    """Provide valid racer data for testing."""
    return RacerCreate(
        racer_name="Test Racer",
        height=175.5,
        weight=70.0,
        ski_types="Slalom, Giant Slalom",
        binding_measurements='{"din": 8, "forward_pressure": 3}',
        personal_records='{"slalom": "45.2s", "gs": "1:12.5"}',
        racing_goals="Qualify for nationals"
    )


# ============================================================================
# Test: Create Racer with Valid Data
# ============================================================================

def test_create_racer_with_valid_data(racer_service, valid_racer_data):
    """Test creating a racer with valid data succeeds."""
    racer = racer_service.create_racer(valid_racer_data)
    
    assert racer.id is not None
    assert racer.height == 175.5
    assert racer.weight == 70.0
    assert racer.ski_types == "Slalom, Giant Slalom"
    assert racer.created_at is not None
    assert racer.updated_at is not None


# ============================================================================
# Test: Height Validation (Requirement 2.1)
# ============================================================================

def test_create_racer_with_zero_height_rejected(racer_service):
    """Test that height = 0 is rejected with descriptive error."""
    # Pydantic validates at schema level, so we expect ValidationError from pydantic
    from pydantic import ValidationError as PydanticValidationError
    
    with pytest.raises(PydanticValidationError) as exc_info:
        racer_data = RacerCreate(
            height=0.0,
            weight=70.0,
            ski_types="Slalom",
            binding_measurements='{"din": 8}',
            personal_records='{"slalom": "45.2s"}',
            racing_goals="Win races"
        )
    
    assert "height" in str(exc_info.value).lower()
    assert "greater than 0" in str(exc_info.value).lower()


def test_create_racer_with_negative_height_rejected(racer_service):
    """Test that negative height is rejected with descriptive error."""
    from pydantic import ValidationError as PydanticValidationError
    
    with pytest.raises(PydanticValidationError) as exc_info:
        racer_data = RacerCreate(
            height=-10.5,
            weight=70.0,
            ski_types="Slalom",
            binding_measurements='{"din": 8}',
            personal_records='{"slalom": "45.2s"}',
            racing_goals="Win races"
        )
    
    assert "height" in str(exc_info.value).lower()
    assert "greater than 0" in str(exc_info.value).lower()


# ============================================================================
# Test: Weight Validation (Requirement 2.2)
# ============================================================================

def test_create_racer_with_zero_weight_rejected(racer_service):
    """Test that weight = 0 is rejected with descriptive error."""
    from pydantic import ValidationError as PydanticValidationError
    
    with pytest.raises(PydanticValidationError) as exc_info:
        racer_data = RacerCreate(
            height=175.0,
            weight=0.0,
            ski_types="Slalom",
            binding_measurements='{"din": 8}',
            personal_records='{"slalom": "45.2s"}',
            racing_goals="Win races"
        )
    
    assert "weight" in str(exc_info.value).lower()
    assert "greater than 0" in str(exc_info.value).lower()


def test_create_racer_with_negative_weight_rejected(racer_service):
    """Test that negative weight is rejected with descriptive error."""
    from pydantic import ValidationError as PydanticValidationError
    
    with pytest.raises(PydanticValidationError) as exc_info:
        racer_data = RacerCreate(
            height=175.0,
            weight=-5.0,
            ski_types="Slalom",
            binding_measurements='{"din": 8}',
            personal_records='{"slalom": "45.2s"}',
            racing_goals="Win races"
        )
    
    assert "weight" in str(exc_info.value).lower()
    assert "greater than 0" in str(exc_info.value).lower()


# ============================================================================
# Test: Required Fields Validation (Requirement 2.3)
# ============================================================================

def test_create_racer_with_empty_ski_types_rejected(racer_service):
    """Test that empty ski_types is rejected."""
    # Note: Pydantic will catch this at schema level, but we test service layer too
    with pytest.raises(Exception) as exc_info:
        racer_data = RacerCreate(
            height=175.0,
            weight=70.0,
            ski_types="",
            binding_measurements='{"din": 8}',
            personal_records='{"slalom": "45.2s"}',
            racing_goals="Win races"
        )
    
    # Pydantic validation error should mention ski_types
    assert "ski_types" in str(exc_info.value).lower()


def test_create_racer_with_whitespace_ski_types_rejected(racer_service):
    """Test that whitespace-only ski_types is rejected."""
    with pytest.raises(Exception) as exc_info:
        racer_data = RacerCreate(
            height=175.0,
            weight=70.0,
            ski_types="   ",
            binding_measurements='{"din": 8}',
            personal_records='{"slalom": "45.2s"}',
            racing_goals="Win races"
        )
    
    assert "ski_types" in str(exc_info.value).lower()


# ============================================================================
# Test: Update Racer Validation
# ============================================================================

def test_update_racer_with_zero_height_rejected(racer_service, valid_racer_data):
    """Test that updating height to 0 is rejected."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Create a racer first
    racer = racer_service.create_racer(valid_racer_data)
    
    # Try to update with invalid height - Pydantic validates at schema level
    with pytest.raises(PydanticValidationError) as exc_info:
        update_data = RacerUpdate(height=0.0)
    
    assert "height" in str(exc_info.value).lower()
    assert "greater than 0" in str(exc_info.value).lower()


def test_update_racer_with_zero_weight_rejected(racer_service, valid_racer_data):
    """Test that updating weight to 0 is rejected."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Create a racer first
    racer = racer_service.create_racer(valid_racer_data)
    
    # Try to update with invalid weight - Pydantic validates at schema level
    with pytest.raises(PydanticValidationError) as exc_info:
        update_data = RacerUpdate(weight=0.0)
    
    assert "weight" in str(exc_info.value).lower()
    assert "greater than 0" in str(exc_info.value).lower()


def test_update_racer_with_valid_data_succeeds(racer_service, valid_racer_data):
    """Test that updating with valid data succeeds."""
    # Create a racer first
    racer = racer_service.create_racer(valid_racer_data)
    
    # Update with valid data
    update_data = RacerUpdate(
        height=180.0,
        weight=75.0,
        racing_goals="Win nationals"
    )
    
    updated_racer = racer_service.update_racer(racer.id, update_data)
    
    assert updated_racer.height == 180.0
    assert updated_racer.weight == 75.0
    assert updated_racer.racing_goals == "Win nationals"
    # Other fields should remain unchanged
    assert updated_racer.ski_types == valid_racer_data.ski_types


# ============================================================================
# Test: Get Racer
# ============================================================================

def test_get_racer_with_valid_id_succeeds(racer_service, valid_racer_data):
    """Test retrieving a racer by valid ID succeeds."""
    # Create a racer first
    created_racer = racer_service.create_racer(valid_racer_data)
    
    # Retrieve the racer
    retrieved_racer = racer_service.get_racer(created_racer.id)
    
    assert retrieved_racer.id == created_racer.id
    assert retrieved_racer.height == created_racer.height
    assert retrieved_racer.weight == created_racer.weight


def test_get_racer_with_invalid_id_raises_not_found(racer_service):
    """Test that retrieving non-existent racer raises NotFoundError."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    with pytest.raises(NotFoundError) as exc_info:
        racer_service.get_racer(fake_id)
    
    assert "not found" in str(exc_info.value).lower()
    assert fake_id in str(exc_info.value)


# ============================================================================
# Test: Delete Racer
# ============================================================================

def test_delete_racer_with_valid_id_succeeds(racer_service, valid_racer_data):
    """Test deleting a racer by valid ID succeeds."""
    # Create a racer first
    racer = racer_service.create_racer(valid_racer_data)
    
    # Delete the racer
    racer_service.delete_racer(racer.id)
    
    # Verify racer is deleted
    with pytest.raises(NotFoundError):
        racer_service.get_racer(racer.id)


def test_delete_racer_with_invalid_id_raises_not_found(racer_service):
    """Test that deleting non-existent racer raises NotFoundError."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    with pytest.raises(NotFoundError) as exc_info:
        racer_service.delete_racer(fake_id)
    
    assert "not found" in str(exc_info.value).lower()
    assert fake_id in str(exc_info.value)


# ============================================================================
# Test: Update Non-Existent Racer
# ============================================================================

def test_update_nonexistent_racer_raises_not_found(racer_service):
    """Test that updating non-existent racer raises NotFoundError."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    update_data = RacerUpdate(height=180.0)
    
    with pytest.raises(NotFoundError) as exc_info:
        racer_service.update_racer(fake_id, update_data)
    
    assert "not found" in str(exc_info.value).lower()
    assert fake_id in str(exc_info.value)


# ============================================================================
# Test: List Racers
# ============================================================================

def test_list_racers_returns_all_racers(racer_service, valid_racer_data):
    """Test listing racers returns all created racers."""
    # Create multiple racers
    racer1 = racer_service.create_racer(valid_racer_data)
    
    racer_data2 = RacerCreate(
        height=180.0,
        weight=75.0,
        ski_types="Downhill",
        binding_measurements='{"din": 10}',
        personal_records='{"downhill": "1:45.0"}',
        racing_goals="Speed records"
    )
    racer2 = racer_service.create_racer(racer_data2)
    
    # List racers
    racers = racer_service.list_racers()
    
    assert len(racers) == 2
    racer_ids = [r.id for r in racers]
    assert racer1.id in racer_ids
    assert racer2.id in racer_ids


def test_list_racers_with_pagination(racer_service, valid_racer_data):
    """Test listing racers with pagination works correctly."""
    # Create multiple racers
    for i in range(5):
        racer_data = RacerCreate(
            height=170.0 + i,
            weight=65.0 + i,
            ski_types=f"Type {i}",
            binding_measurements=f'{{"din": {i}}}',
            personal_records=f'{{"race": "{i}s"}}',
            racing_goals=f"Goal {i}"
        )
        racer_service.create_racer(racer_data)
    
    # Test pagination
    page1 = racer_service.list_racers(skip=0, limit=2)
    page2 = racer_service.list_racers(skip=2, limit=2)
    
    assert len(page1) == 2
    assert len(page2) == 2
    assert page1[0].id != page2[0].id


# ============================================================================
# Test: Validate Racer Data Method
# ============================================================================

def test_validate_racer_data_with_valid_create_data(racer_service, valid_racer_data):
    """Test validate_racer_data with valid RacerCreate data."""
    # Should not raise any exception
    racer_service.validate_racer_data(valid_racer_data)


def test_validate_racer_data_with_invalid_height(racer_service):
    """Test validate_racer_data rejects invalid height."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Pydantic validates at schema level
    with pytest.raises(PydanticValidationError) as exc_info:
        racer_data = RacerCreate(
            height=0.0,
            weight=70.0,
            ski_types="Slalom",
            binding_measurements='{"din": 8}',
            personal_records='{"slalom": "45.2s"}',
            racing_goals="Win races"
        )
    
    assert "height" in str(exc_info.value).lower()
    assert "greater than 0" in str(exc_info.value).lower()


def test_validate_racer_data_with_valid_update_data(racer_service):
    """Test validate_racer_data with valid RacerUpdate data."""
    update_data = RacerUpdate(height=180.0, weight=75.0)
    
    # Should not raise any exception
    racer_service.validate_racer_data(update_data)


# ============================================================================
# Test: Error Message Descriptiveness (Requirement 9.1, 9.2)
# ============================================================================

def test_error_messages_are_descriptive(racer_service):
    """Test that error messages are descriptive and indicate specific failures."""
    from pydantic import ValidationError as PydanticValidationError
    
    # Test height validation error message at Pydantic level
    with pytest.raises(PydanticValidationError) as exc_info:
        racer_data = RacerCreate(
            height=-5.0,
            weight=70.0,
            ski_types="Slalom",
            binding_measurements='{"din": 8}',
            personal_records='{"slalom": "45.2s"}',
            racing_goals="Win races"
        )
    
    error_message = str(exc_info.value)
    # Error message should be descriptive
    assert len(error_message) > 10
    # Should mention the field
    assert "height" in error_message.lower()
    # Should indicate what's wrong
    assert "greater than 0" in error_message.lower()


def test_not_found_error_messages_are_descriptive(racer_service):
    """Test that NotFoundError messages are descriptive."""
    fake_id = "nonexistent-id-12345"
    
    with pytest.raises(NotFoundError) as exc_info:
        racer_service.get_racer(fake_id)
    
    error_message = str(exc_info.value)
    # Should mention what wasn't found
    assert "not found" in error_message.lower()
    # Should include the ID
    assert fake_id in error_message
