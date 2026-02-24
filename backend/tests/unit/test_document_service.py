"""
Unit tests for document service business logic and file storage.

Tests verify file upload, validation, storage, retrieval, and deletion
with proper error handling.

Requirements: 3.1, 3.3, 3.4, 3.5, 7.2
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from io import BytesIO
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.services.document_service import (
    DocumentService,
    ValidationError,
    NotFoundError,
    FileStorageError,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE
)
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
def temp_upload_dir():
    """Create a temporary directory for file uploads during testing."""
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    # Clean up: remove temporary directory and all files
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def document_service(db_session, temp_upload_dir):
    """Create a document service instance for testing."""
    return DocumentService(db_session, upload_dir=temp_upload_dir)


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


def create_upload_file(filename: str, content: bytes, content_type: str) -> UploadFile:
    """Helper function to create a mock UploadFile for testing."""
    file_obj = BytesIO(content)
    # Create UploadFile with headers to set content_type
    upload_file = UploadFile(
        filename=filename,
        file=file_obj,
        headers={"content-type": content_type}
    )
    return upload_file


# ============================================================================
# File Upload Tests
# ============================================================================

def test_upload_document_pdf_success(document_service, sample_racer, temp_upload_dir):
    """Test uploading a valid PDF document."""
    # Requirement: 3.1 - Store Ski_Analysis_Document and associate with racer
    # Requirement: 3.4 - Support PDF format
    content = b"PDF file content"
    upload_file = create_upload_file("analysis.pdf", content, "application/pdf")
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    assert document is not None
    assert document.id is not None
    assert document.racer_id == sample_racer.id
    assert document.filename == "analysis.pdf"
    assert document.file_type == "application/pdf"
    assert document.file_size == len(content)
    assert document.uploaded_at is not None
    
    # Verify file was written to disk
    file_path = Path(document.file_path)
    assert file_path.exists()
    assert file_path.read_bytes() == content


def test_upload_document_docx_success(document_service, sample_racer):
    """Test uploading a valid DOCX document."""
    # Requirement: 3.4 - Support DOCX format
    content = b"DOCX file content"
    upload_file = create_upload_file(
        "report.docx",
        content,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    assert document.filename == "report.docx"
    assert document.file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert Path(document.file_path).exists()


def test_upload_document_doc_success(document_service, sample_racer):
    """Test uploading a valid DOC document."""
    # Requirement: 3.4 - Support DOC format
    content = b"DOC file content"
    upload_file = create_upload_file("report.doc", content, "application/msword")
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    assert document.filename == "report.doc"
    assert document.file_type == "application/msword"
    assert Path(document.file_path).exists()


def test_upload_document_jpg_success(document_service, sample_racer):
    """Test uploading a valid JPG image."""
    # Requirement: 3.4 - Support JPG format
    content = b"JPG image content"
    upload_file = create_upload_file("photo.jpg", content, "image/jpeg")
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    assert document.filename == "photo.jpg"
    assert document.file_type == "image/jpeg"
    assert Path(document.file_path).exists()


def test_upload_document_jpeg_success(document_service, sample_racer):
    """Test uploading a valid JPEG image."""
    # Requirement: 3.4 - Support JPEG format
    content = b"JPEG image content"
    upload_file = create_upload_file("photo.jpeg", content, "image/jpeg")
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    assert document.filename == "photo.jpeg"
    assert document.file_type == "image/jpeg"
    assert Path(document.file_path).exists()


def test_upload_document_png_success(document_service, sample_racer):
    """Test uploading a valid PNG image."""
    # Requirement: 3.4 - Support PNG format
    content = b"PNG image content"
    upload_file = create_upload_file("diagram.png", content, "image/png")
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    assert document.filename == "diagram.png"
    assert document.file_type == "image/png"
    assert Path(document.file_path).exists()


def test_upload_document_generates_unique_filenames(document_service, sample_racer):
    """Test that uploaded files get unique filenames to avoid collisions."""
    # Requirement: 7.2 - Persist file to disk with unique filename
    content = b"File content"
    upload_file1 = create_upload_file("same_name.pdf", content, "application/pdf")
    upload_file2 = create_upload_file("same_name.pdf", content, "application/pdf")
    
    doc1 = document_service.upload_document(sample_racer.id, upload_file1)
    doc2 = document_service.upload_document(sample_racer.id, upload_file2)
    
    # Original filenames should be preserved
    assert doc1.filename == "same_name.pdf"
    assert doc2.filename == "same_name.pdf"
    
    # But file paths should be different
    assert doc1.file_path != doc2.file_path
    
    # Both files should exist on disk
    assert Path(doc1.file_path).exists()
    assert Path(doc2.file_path).exists()


# ============================================================================
# File Validation Tests
# ============================================================================

def test_upload_document_no_file_provided(document_service, sample_racer):
    """Test that uploading without a file raises ValidationError."""
    # Requirement: 3.3 - Return error message describing failure reason
    with pytest.raises(ValidationError) as exc_info:
        document_service.upload_document(sample_racer.id, None)
    
    assert "No file provided" in str(exc_info.value)


def test_upload_document_no_filename(document_service, sample_racer):
    """Test that uploading a file without a filename raises ValidationError."""
    upload_file = UploadFile(filename="", file=BytesIO(b"content"))
    
    with pytest.raises(ValidationError) as exc_info:
        document_service.upload_document(sample_racer.id, upload_file)
    
    assert "No file provided" in str(exc_info.value)


def test_upload_document_invalid_file_type(document_service, sample_racer):
    """Test that uploading an unsupported file type raises ValidationError."""
    # Requirement: 3.3 - Return error message describing failure reason
    # Requirement: 3.4 - Only support specified formats
    content = b"Text file content"
    upload_file = create_upload_file("document.txt", content, "text/plain")
    
    with pytest.raises(ValidationError) as exc_info:
        document_service.upload_document(sample_racer.id, upload_file)
    
    error_message = str(exc_info.value)
    assert "not allowed" in error_message.lower()
    assert ".txt" in error_message


def test_upload_document_invalid_extension(document_service, sample_racer):
    """Test that uploading a file with invalid extension raises ValidationError."""
    content = b"Executable content"
    upload_file = create_upload_file("malware.exe", content, "application/octet-stream")
    
    with pytest.raises(ValidationError) as exc_info:
        document_service.upload_document(sample_racer.id, upload_file)
    
    error_message = str(exc_info.value)
    assert "not allowed" in error_message.lower()


def test_upload_document_no_extension(document_service, sample_racer):
    """Test that uploading a file without extension raises ValidationError."""
    content = b"File content"
    upload_file = create_upload_file("noextension", content, "application/pdf")
    
    with pytest.raises(ValidationError) as exc_info:
        document_service.upload_document(sample_racer.id, upload_file)
    
    assert "no extension" in str(exc_info.value).lower()


def test_upload_document_file_too_large(document_service, sample_racer):
    """Test that uploading a file larger than 10MB raises ValidationError."""
    # Requirement: 3.3 - Return error message describing failure reason
    # Create a file larger than 10MB
    large_content = b"x" * (MAX_FILE_SIZE + 1)
    upload_file = create_upload_file("large.pdf", large_content, "application/pdf")
    
    with pytest.raises(ValidationError) as exc_info:
        document_service.upload_document(sample_racer.id, upload_file)
    
    error_message = str(exc_info.value)
    assert "exceeds maximum" in error_message.lower()
    assert "10MB" in error_message or "10mb" in error_message.lower()


def test_upload_document_max_size_allowed(document_service, sample_racer):
    """Test that uploading a file exactly at 10MB limit succeeds."""
    # Create a file exactly at the limit
    content = b"x" * MAX_FILE_SIZE
    upload_file = create_upload_file("maxsize.pdf", content, "application/pdf")
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    assert document.file_size == MAX_FILE_SIZE
    assert Path(document.file_path).exists()


def test_validate_file_case_insensitive_extension(document_service):
    """Test that file extension validation is case-insensitive."""
    # Test uppercase extension
    upload_file_upper = create_upload_file("FILE.PDF", b"content", "application/pdf")
    document_service.validate_file(upload_file_upper)  # Should not raise
    
    # Test mixed case extension
    upload_file_mixed = create_upload_file("file.PdF", b"content", "application/pdf")
    document_service.validate_file(upload_file_mixed)  # Should not raise


def test_validate_file_accepts_image_jpg_content_type(document_service):
    """Test that image/jpg content type variation is accepted for JPEG files."""
    # Some browsers send image/jpg instead of image/jpeg
    upload_file = create_upload_file("photo.jpg", b"content", "image/jpg")
    document_service.validate_file(upload_file)  # Should not raise


# ============================================================================
# Get Documents Tests
# ============================================================================

def test_get_documents_empty(document_service, sample_racer):
    """Test getting documents for a racer with no documents."""
    # Requirement: 3.2 - Retrieve and display all associated Ski_Analysis_Documents
    documents = document_service.get_documents(sample_racer.id)
    
    assert documents is not None
    assert isinstance(documents, list)
    assert len(documents) == 0


def test_get_documents_returns_all(document_service, sample_racer):
    """Test getting all documents for a racer."""
    # Upload multiple documents
    doc1 = document_service.upload_document(
        sample_racer.id,
        create_upload_file("doc1.pdf", b"content1", "application/pdf")
    )
    doc2 = document_service.upload_document(
        sample_racer.id,
        create_upload_file("doc2.pdf", b"content2", "application/pdf")
    )
    doc3 = document_service.upload_document(
        sample_racer.id,
        create_upload_file("doc3.pdf", b"content3", "application/pdf")
    )
    
    documents = document_service.get_documents(sample_racer.id)
    
    assert len(documents) == 3
    doc_ids = [d.id for d in documents]
    assert doc1.id in doc_ids
    assert doc2.id in doc_ids
    assert doc3.id in doc_ids


def test_get_document_by_id_success(document_service, sample_racer):
    """Test retrieving a specific document by ID."""
    # Requirement: 3.2 - Retrieve and display Ski_Analysis_Documents
    uploaded_doc = document_service.upload_document(
        sample_racer.id,
        create_upload_file("test.pdf", b"content", "application/pdf")
    )
    
    retrieved_doc = document_service.get_document(uploaded_doc.id)
    
    assert retrieved_doc.id == uploaded_doc.id
    assert retrieved_doc.filename == uploaded_doc.filename
    assert retrieved_doc.racer_id == uploaded_doc.racer_id


def test_get_document_not_found(document_service):
    """Test that getting a non-existent document raises NotFoundError."""
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    
    with pytest.raises(NotFoundError) as exc_info:
        document_service.get_document(non_existent_id)
    
    assert "not found" in str(exc_info.value).lower()
    assert non_existent_id in str(exc_info.value)


# ============================================================================
# Delete Document Tests
# ============================================================================

def test_delete_document_success(document_service, sample_racer, temp_upload_dir):
    """Test deleting a document removes both file and database record."""
    # Requirement: 3.5 - Remove Ski_Analysis_Document from storage
    uploaded_doc = document_service.upload_document(
        sample_racer.id,
        create_upload_file("to_delete.pdf", b"content", "application/pdf")
    )
    
    file_path = Path(uploaded_doc.file_path)
    assert file_path.exists()
    
    # Delete the document
    document_service.delete_document(uploaded_doc.id)
    
    # Verify file is deleted from disk
    assert not file_path.exists()
    
    # Verify database record is deleted
    with pytest.raises(NotFoundError):
        document_service.get_document(uploaded_doc.id)


def test_delete_document_not_found(document_service):
    """Test that deleting a non-existent document raises NotFoundError."""
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    
    with pytest.raises(NotFoundError) as exc_info:
        document_service.delete_document(non_existent_id)
    
    assert "not found" in str(exc_info.value).lower()


def test_delete_document_missing_file_still_deletes_record(document_service, sample_racer, temp_upload_dir):
    """Test that deleting a document with missing file still removes database record."""
    uploaded_doc = document_service.upload_document(
        sample_racer.id,
        create_upload_file("test.pdf", b"content", "application/pdf")
    )
    
    # Manually delete the file from disk
    file_path = Path(uploaded_doc.file_path)
    file_path.unlink()
    assert not file_path.exists()
    
    # Delete should still succeed and remove database record
    document_service.delete_document(uploaded_doc.id)
    
    # Verify database record is deleted
    with pytest.raises(NotFoundError):
        document_service.get_document(uploaded_doc.id)


def test_delete_document_removes_from_racer_list(document_service, sample_racer):
    """Test that deleted document no longer appears in racer's document list."""
    doc1 = document_service.upload_document(
        sample_racer.id,
        create_upload_file("doc1.pdf", b"content1", "application/pdf")
    )
    doc2 = document_service.upload_document(
        sample_racer.id,
        create_upload_file("doc2.pdf", b"content2", "application/pdf")
    )
    
    # Delete doc1
    document_service.delete_document(doc1.id)
    
    # Get racer's documents
    documents = document_service.get_documents(sample_racer.id)
    
    assert len(documents) == 1
    assert documents[0].id == doc2.id


# ============================================================================
# File Storage Tests
# ============================================================================

def test_upload_directory_created_automatically(db_session):
    """Test that upload directory is created if it doesn't exist."""
    # Requirement: 7.2 - Persist file to disk
    with tempfile.TemporaryDirectory() as temp_dir:
        upload_dir = Path(temp_dir) / "new_upload_dir"
        assert not upload_dir.exists()
        
        # Create service - should create directory
        service = DocumentService(db_session, upload_dir=upload_dir)
        
        assert upload_dir.exists()
        assert upload_dir.is_dir()


def test_upload_preserves_file_content(document_service, sample_racer):
    """Test that uploaded file content is preserved exactly."""
    # Requirement: 7.2 - Persist file to disk
    original_content = b"This is the exact content that should be preserved!"
    upload_file = create_upload_file("test.pdf", original_content, "application/pdf")
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    # Read file from disk and verify content
    file_path = Path(document.file_path)
    stored_content = file_path.read_bytes()
    
    assert stored_content == original_content


def test_upload_stores_correct_file_size(document_service, sample_racer):
    """Test that file size is correctly recorded in database."""
    content = b"x" * 12345
    upload_file = create_upload_file("test.pdf", content, "application/pdf")
    
    document = document_service.upload_document(sample_racer.id, upload_file)
    
    assert document.file_size == 12345


def test_upload_failure_cleans_up_file(document_service, sample_racer, temp_upload_dir, monkeypatch):
    """Test that if database creation fails, uploaded file is cleaned up."""
    content = b"Test content"
    upload_file = create_upload_file("test.pdf", content, "application/pdf")
    
    # Mock repository.create to raise an exception
    def mock_create(*args, **kwargs):
        raise Exception("Database error")
    
    monkeypatch.setattr(document_service.repository, "create", mock_create)
    
    # Count files before upload attempt
    files_before = list(temp_upload_dir.glob("*"))
    
    # Upload should fail
    with pytest.raises(Exception):
        document_service.upload_document(sample_racer.id, upload_file)
    
    # File should be cleaned up
    files_after = list(temp_upload_dir.glob("*"))
    assert len(files_after) == len(files_before)


# ============================================================================
# Error Message Tests
# ============================================================================

def test_error_messages_are_descriptive(document_service, sample_racer):
    """Test that error messages provide clear information about failures."""
    # Requirement: 3.3 - Return error message describing failure reason
    
    # Test invalid file type error
    try:
        upload_file = create_upload_file("test.txt", b"content", "text/plain")
        document_service.upload_document(sample_racer.id, upload_file)
        assert False, "Should have raised ValidationError"
    except ValidationError as e:
        error_msg = str(e)
        assert "not allowed" in error_msg.lower()
        assert ".txt" in error_msg
    
    # Test file too large error
    try:
        large_content = b"x" * (MAX_FILE_SIZE + 1)
        upload_file = create_upload_file("large.pdf", large_content, "application/pdf")
        document_service.upload_document(sample_racer.id, upload_file)
        assert False, "Should have raised ValidationError"
    except ValidationError as e:
        error_msg = str(e)
        assert "exceeds" in error_msg.lower()
        assert "10" in error_msg  # Should mention 10MB limit
    
    # Test not found error
    try:
        document_service.get_document("nonexistent-id")
        assert False, "Should have raised NotFoundError"
    except NotFoundError as e:
        error_msg = str(e)
        assert "not found" in error_msg.lower()
        assert "nonexistent-id" in error_msg
