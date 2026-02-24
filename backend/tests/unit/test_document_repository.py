"""
Unit tests for document repository database operations.

Tests verify CRUD operations for document records including create,
get by racer, get by id, and delete methods.

Requirements: 3.1, 3.2, 3.5
"""

import pytest
from sqlalchemy.orm import Session
from app.repositories.document_repository import DocumentRepository
from app.repositories.racer_repository import RacerRepository
from app.schemas import RacerCreate
from app.models import Document, Racer
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
        # Clean up: delete all documents and racers created during tests
        db.query(Document).delete()
        db.query(Racer).delete()
        db.commit()
        db.close()


@pytest.fixture
def document_repository(db_session):
    """Create a document repository instance for testing."""
    return DocumentRepository(db_session)


@pytest.fixture
def racer_repository(db_session):
    """Create a racer repository instance for testing."""
    return RacerRepository(db_session)


@pytest.fixture
def sample_racer(racer_repository):
    """Create a sample racer for document testing."""
    racer_data = RacerCreate(
        height=175.5,
        weight=70.0,
        ski_types="Slalom, Giant Slalom",
        binding_measurements='{"din": 8.5, "boot_sole_length": 305}',
        personal_records='{"slalom": "45.32s", "giant_slalom": "1:12.45"}',
        racing_goals="Qualify for national championships"
    )
    return racer_repository.create(racer_data)


# ============================================================================
# Create Tests
# ============================================================================

def test_create_document_success(document_repository, sample_racer):
    """Test creating a new document record with valid data."""
    # Requirement: 3.1 - Store Ski_Analysis_Document and associate with racer
    document = document_repository.create(
        racer_id=sample_racer.id,
        filename="ski_analysis_2024.pdf",
        file_path="/uploads/ski_analysis_2024.pdf",
        file_type="application/pdf",
        file_size=1024000
    )
    
    assert document is not None
    assert document.id is not None
    assert document.racer_id == sample_racer.id
    assert document.filename == "ski_analysis_2024.pdf"
    assert document.file_path == "/uploads/ski_analysis_2024.pdf"
    assert document.file_type == "application/pdf"
    assert document.file_size == 1024000
    assert document.uploaded_at is not None


def test_create_document_generates_unique_ids(document_repository, sample_racer):
    """Test that creating multiple documents generates unique IDs."""
    doc1 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc1.pdf",
        file_path="/uploads/doc1.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    doc2 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc2.pdf",
        file_path="/uploads/doc2.pdf",
        file_type="application/pdf",
        file_size=2000
    )
    
    assert doc1.id != doc2.id


def test_create_document_with_different_file_types(document_repository, sample_racer):
    """Test creating documents with various file types."""
    # PDF document
    pdf_doc = document_repository.create(
        racer_id=sample_racer.id,
        filename="analysis.pdf",
        file_path="/uploads/analysis.pdf",
        file_type="application/pdf",
        file_size=500000
    )
    
    # Image document
    img_doc = document_repository.create(
        racer_id=sample_racer.id,
        filename="photo.jpg",
        file_path="/uploads/photo.jpg",
        file_type="image/jpeg",
        file_size=250000
    )
    
    # Word document
    doc_doc = document_repository.create(
        racer_id=sample_racer.id,
        filename="report.docx",
        file_path="/uploads/report.docx",
        file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=750000
    )
    
    assert pdf_doc.file_type == "application/pdf"
    assert img_doc.file_type == "image/jpeg"
    assert doc_doc.file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


# ============================================================================
# Get by Racer Tests
# ============================================================================

def test_get_by_racer_empty(document_repository, sample_racer):
    """Test getting documents for a racer with no documents."""
    # Requirement: 3.2 - Retrieve and display all associated Ski_Analysis_Documents
    documents = document_repository.get_by_racer(sample_racer.id)
    
    assert documents is not None
    assert isinstance(documents, list)
    assert len(documents) == 0


def test_get_by_racer_returns_all_documents(document_repository, sample_racer):
    """Test getting all documents for a specific racer."""
    # Create multiple documents for the racer
    doc1 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc1.pdf",
        file_path="/uploads/doc1.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    doc2 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc2.pdf",
        file_path="/uploads/doc2.pdf",
        file_type="application/pdf",
        file_size=2000
    )
    doc3 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc3.pdf",
        file_path="/uploads/doc3.pdf",
        file_type="application/pdf",
        file_size=3000
    )
    
    documents = document_repository.get_by_racer(sample_racer.id)
    
    assert len(documents) == 3
    doc_ids = [d.id for d in documents]
    assert doc1.id in doc_ids
    assert doc2.id in doc_ids
    assert doc3.id in doc_ids


def test_get_by_racer_orders_by_upload_date_desc(document_repository, sample_racer):
    """Test that documents are returned in reverse chronological order (most recent first)."""
    import time
    
    # Create documents with delays to ensure different timestamps
    doc1 = document_repository.create(
        racer_id=sample_racer.id,
        filename="oldest.pdf",
        file_path="/uploads/oldest.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    time.sleep(1.1)  # Delay to ensure different timestamp (SQLite has 1-second precision)
    
    doc2 = document_repository.create(
        racer_id=sample_racer.id,
        filename="middle.pdf",
        file_path="/uploads/middle.pdf",
        file_type="application/pdf",
        file_size=2000
    )
    time.sleep(1.1)  # Delay to ensure different timestamp
    
    doc3 = document_repository.create(
        racer_id=sample_racer.id,
        filename="newest.pdf",
        file_path="/uploads/newest.pdf",
        file_type="application/pdf",
        file_size=3000
    )
    
    documents = document_repository.get_by_racer(sample_racer.id)
    
    # Most recent should be first
    assert documents[0].id == doc3.id
    assert documents[1].id == doc2.id
    assert documents[2].id == doc1.id


def test_get_by_racer_filters_by_racer_id(document_repository, racer_repository):
    """Test that get_by_racer only returns documents for the specified racer."""
    # Create two racers
    racer1_data = RacerCreate(
        height=175.0,
        weight=70.0,
        ski_types="Slalom",
        binding_measurements='{"din": 8.5}',
        personal_records='{}',
        racing_goals="Win"
    )
    racer2_data = RacerCreate(
        height=180.0,
        weight=75.0,
        ski_types="Downhill",
        binding_measurements='{"din": 9.0}',
        personal_records='{}',
        racing_goals="Compete"
    )
    racer1 = racer_repository.create(racer1_data)
    racer2 = racer_repository.create(racer2_data)
    
    # Create documents for each racer
    doc1 = document_repository.create(
        racer_id=racer1.id,
        filename="racer1_doc.pdf",
        file_path="/uploads/racer1_doc.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    doc2 = document_repository.create(
        racer_id=racer2.id,
        filename="racer2_doc.pdf",
        file_path="/uploads/racer2_doc.pdf",
        file_type="application/pdf",
        file_size=2000
    )
    
    # Get documents for racer1
    racer1_docs = document_repository.get_by_racer(racer1.id)
    
    assert len(racer1_docs) == 1
    assert racer1_docs[0].id == doc1.id
    assert racer1_docs[0].racer_id == racer1.id
    
    # Get documents for racer2
    racer2_docs = document_repository.get_by_racer(racer2.id)
    
    assert len(racer2_docs) == 1
    assert racer2_docs[0].id == doc2.id
    assert racer2_docs[0].racer_id == racer2.id


# ============================================================================
# Get by ID Tests
# ============================================================================

def test_get_by_id_success(document_repository, sample_racer):
    """Test retrieving a document by its ID."""
    # Requirement: 3.2 - Retrieve and display Ski_Analysis_Documents
    created_doc = document_repository.create(
        racer_id=sample_racer.id,
        filename="test.pdf",
        file_path="/uploads/test.pdf",
        file_type="application/pdf",
        file_size=5000
    )
    
    retrieved_doc = document_repository.get_by_id(created_doc.id)
    
    assert retrieved_doc is not None
    assert retrieved_doc.id == created_doc.id
    assert retrieved_doc.racer_id == created_doc.racer_id
    assert retrieved_doc.filename == created_doc.filename
    assert retrieved_doc.file_path == created_doc.file_path
    assert retrieved_doc.file_type == created_doc.file_type
    assert retrieved_doc.file_size == created_doc.file_size


def test_get_by_id_not_found(document_repository):
    """Test retrieving a non-existent document returns None."""
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    
    document = document_repository.get_by_id(non_existent_id)
    
    assert document is None


def test_get_by_id_preserves_all_fields(document_repository, sample_racer):
    """Test that get_by_id retrieves all document fields correctly."""
    created_doc = document_repository.create(
        racer_id=sample_racer.id,
        filename="complete_test.pdf",
        file_path="/uploads/complete_test.pdf",
        file_type="application/pdf",
        file_size=123456
    )
    
    retrieved_doc = document_repository.get_by_id(created_doc.id)
    
    assert retrieved_doc.filename == "complete_test.pdf"
    assert retrieved_doc.file_path == "/uploads/complete_test.pdf"
    assert retrieved_doc.file_type == "application/pdf"
    assert retrieved_doc.file_size == 123456
    assert retrieved_doc.uploaded_at is not None


# ============================================================================
# Delete Tests
# ============================================================================

def test_delete_document_success(document_repository, sample_racer):
    """Test deleting a document record."""
    # Requirement: 3.5 - Remove Ski_Analysis_Document from storage
    created_doc = document_repository.create(
        racer_id=sample_racer.id,
        filename="to_delete.pdf",
        file_path="/uploads/to_delete.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    
    result = document_repository.delete(created_doc.id)
    
    assert result is True
    
    # Verify document is no longer retrievable
    deleted_doc = document_repository.get_by_id(created_doc.id)
    assert deleted_doc is None


def test_delete_document_not_found(document_repository):
    """Test deleting a non-existent document returns False."""
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    
    result = document_repository.delete(non_existent_id)
    
    assert result is False


def test_delete_document_removes_from_racer_list(document_repository, sample_racer):
    """Test that deleted document no longer appears in racer's document list."""
    doc1 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc1.pdf",
        file_path="/uploads/doc1.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    doc2 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc2.pdf",
        file_path="/uploads/doc2.pdf",
        file_type="application/pdf",
        file_size=2000
    )
    
    # Delete doc1
    document_repository.delete(doc1.id)
    
    # Get racer's documents
    documents = document_repository.get_by_racer(sample_racer.id)
    
    assert len(documents) == 1
    assert documents[0].id == doc2.id


def test_delete_document_is_permanent(document_repository, sample_racer):
    """Test that deleted document cannot be retrieved."""
    created_doc = document_repository.create(
        racer_id=sample_racer.id,
        filename="permanent_delete.pdf",
        file_path="/uploads/permanent_delete.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    doc_id = created_doc.id
    
    document_repository.delete(doc_id)
    
    # Multiple attempts to retrieve should all return None
    assert document_repository.get_by_id(doc_id) is None
    assert document_repository.get_by_id(doc_id) is None


def test_delete_multiple_documents(document_repository, sample_racer):
    """Test deleting multiple documents."""
    doc1 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc1.pdf",
        file_path="/uploads/doc1.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    doc2 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc2.pdf",
        file_path="/uploads/doc2.pdf",
        file_type="application/pdf",
        file_size=2000
    )
    doc3 = document_repository.create(
        racer_id=sample_racer.id,
        filename="doc3.pdf",
        file_path="/uploads/doc3.pdf",
        file_type="application/pdf",
        file_size=3000
    )
    
    # Delete two documents
    result1 = document_repository.delete(doc1.id)
    result2 = document_repository.delete(doc2.id)
    
    assert result1 is True
    assert result2 is True
    
    # Only doc3 should remain
    documents = document_repository.get_by_racer(sample_racer.id)
    assert len(documents) == 1
    assert documents[0].id == doc3.id


# ============================================================================
# Cascade Delete Tests
# ============================================================================

def test_cascade_delete_when_racer_deleted(document_repository, racer_repository):
    """Test that documents are automatically deleted when racer is deleted."""
    # Create a racer
    racer_data = RacerCreate(
        height=175.0,
        weight=70.0,
        ski_types="Slalom",
        binding_measurements='{"din": 8.5}',
        personal_records='{}',
        racing_goals="Win"
    )
    racer = racer_repository.create(racer_data)
    
    # Create documents for the racer
    doc1 = document_repository.create(
        racer_id=racer.id,
        filename="doc1.pdf",
        file_path="/uploads/doc1.pdf",
        file_type="application/pdf",
        file_size=1000
    )
    doc2 = document_repository.create(
        racer_id=racer.id,
        filename="doc2.pdf",
        file_path="/uploads/doc2.pdf",
        file_type="application/pdf",
        file_size=2000
    )
    
    # Delete the racer
    racer_repository.delete(racer.id)
    
    # Documents should be automatically deleted due to CASCADE
    assert document_repository.get_by_id(doc1.id) is None
    assert document_repository.get_by_id(doc2.id) is None
    assert len(document_repository.get_by_racer(racer.id)) == 0
