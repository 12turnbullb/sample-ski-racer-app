"""
Unit tests for document API routes.

Tests the document API endpoints to ensure proper HTTP status codes,
request/response handling, file upload handling, and error handling.

Requirements: 6.2, 6.4
"""

import pytest
import io
from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from pathlib import Path
import tempfile
import shutil

from app.database import Base, get_db
from app.routers.documents import router
from app.models import Racer, Document


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
def temp_upload_dir():
    """Create a temporary directory for file uploads."""
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    # Cleanup after test
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def client(test_db, temp_upload_dir):
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
    
    # Store temp_upload_dir for use in tests
    app.state.temp_upload_dir = temp_upload_dir
    
    return TestClient(app)


@pytest.fixture
def sample_racer(test_db):
    """Create a sample racer in the database for testing."""
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
def pdf_file():
    """Create a mock PDF file for testing."""
    content = b"%PDF-1.4\n%Test PDF content"
    return ("test_document.pdf", io.BytesIO(content), "application/pdf")


@pytest.fixture
def jpg_file():
    """Create a mock JPG file for testing."""
    content = b"\xff\xd8\xff\xe0\x00\x10JFIF"  # JPEG header
    return ("test_image.jpg", io.BytesIO(content), "image/jpeg")


@pytest.fixture
def invalid_file():
    """Create a mock invalid file type for testing."""
    content = b"Invalid file content"
    return ("test_file.exe", io.BytesIO(content), "application/x-msdownload")


# ============================================================================
# POST /api/racers/{id}/documents - Upload Document Tests
# ============================================================================

def test_upload_document_success_pdf(client, sample_racer, pdf_file, temp_upload_dir):
    """Test successful PDF document upload returns 201 Created."""
    # Override upload directory in the service
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        filename, file_content, content_type = pdf_file
        response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        # Verify response contains all fields
        assert "id" in data
        assert data["racer_id"] == sample_racer.id
        assert data["filename"] == filename
        assert data["file_type"] == content_type
        assert data["file_size"] > 0
        assert "file_path" in data
        assert "uploaded_at" in data
        
        # Verify file was actually saved
        file_path = Path(data["file_path"])
        assert file_path.exists()
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


def test_upload_document_success_jpg(client, sample_racer, jpg_file, temp_upload_dir):
    """Test successful JPG image upload returns 201 Created."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        filename, file_content, content_type = jpg_file
        response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["filename"] == filename
        assert data["file_type"] == content_type
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


def test_upload_document_invalid_file_type_returns_400(client, sample_racer, invalid_file, temp_upload_dir):
    """Test uploading invalid file type returns 400 Bad Request."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        filename, file_content, content_type = invalid_file
        response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not allowed" in response.json()["detail"].lower()
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


def test_upload_document_no_file_returns_422(client, sample_racer):
    """Test uploading without a file returns 422 Unprocessable Entity."""
    response = client.post(f"/api/racers/{sample_racer.id}/documents")
    
    # FastAPI returns 422 when required file parameter is missing
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_upload_document_oversized_file_returns_400(client, sample_racer, temp_upload_dir):
    """Test uploading file larger than 10MB returns 400 Bad Request."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        # Create a file larger than 10MB
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": ("large_file.pdf", io.BytesIO(large_content), "application/pdf")}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "size" in response.json()["detail"].lower()
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


# ============================================================================
# GET /api/racers/{id}/documents - Get Racer Documents Tests
# ============================================================================

def test_get_racer_documents_empty(client, sample_racer):
    """Test getting documents for racer with no documents returns empty list."""
    response = client.get(f"/api/racers/{sample_racer.id}/documents")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_get_racer_documents_with_data(client, sample_racer, pdf_file, jpg_file, temp_upload_dir):
    """Test getting documents returns all uploaded documents for racer."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        # Upload two documents
        filename1, file_content1, content_type1 = pdf_file
        client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename1, file_content1, content_type1)}
        )
        
        filename2, file_content2, content_type2 = jpg_file
        client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename2, file_content2, content_type2)}
        )
        
        # Get all documents
        response = client.get(f"/api/racers/{sample_racer.id}/documents")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert all("id" in doc for doc in data)
        assert all(doc["racer_id"] == sample_racer.id for doc in data)
        
        # Verify documents are ordered by upload date (most recent first)
        assert data[0]["uploaded_at"] >= data[1]["uploaded_at"]
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


def test_get_racer_documents_different_racers(client, test_db, pdf_file, temp_upload_dir):
    """Test that documents are properly filtered by racer_id."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        # Create two racers
        racer1 = Racer(
            height=175.5, weight=70.0, ski_types="Slalom",
            binding_measurements='{}', personal_records='[]', racing_goals="Goals"
        )
        racer2 = Racer(
            height=180.0, weight=75.0, ski_types="Giant Slalom",
            binding_measurements='{}', personal_records='[]', racing_goals="Goals"
        )
        test_db.add(racer1)
        test_db.add(racer2)
        test_db.commit()
        test_db.refresh(racer1)
        test_db.refresh(racer2)
        
        # Upload document for racer1
        filename, file_content, content_type = pdf_file
        client.post(
            f"/api/racers/{racer1.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        
        # Get documents for racer2 (should be empty)
        response = client.get(f"/api/racers/{racer2.id}/documents")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
        
        # Get documents for racer1 (should have one document)
        response = client.get(f"/api/racers/{racer1.id}/documents")
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


# ============================================================================
# GET /api/documents/{id} - Get Specific Document Tests
# ============================================================================

def test_get_document_success(client, sample_racer, pdf_file, temp_upload_dir):
    """Test getting specific document by ID returns 200 OK."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        # Upload a document
        filename, file_content, content_type = pdf_file
        upload_response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        document_id = upload_response.json()["id"]
        
        # Get the document
        response = client.get(f"/api/documents/{document_id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == document_id
        assert data["racer_id"] == sample_racer.id
        assert data["filename"] == filename
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


def test_get_document_not_found_returns_404(client):
    """Test getting non-existent document returns 404 Not Found."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/documents/{fake_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


# ============================================================================
# DELETE /api/documents/{id} - Delete Document Tests
# ============================================================================

def test_delete_document_success(client, sample_racer, pdf_file, temp_upload_dir):
    """Test successful document deletion returns 200 OK."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        # Upload a document
        filename, file_content, content_type = pdf_file
        upload_response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        document_id = upload_response.json()["id"]
        file_path = Path(upload_response.json()["file_path"])
        
        # Verify file exists
        assert file_path.exists()
        
        # Delete the document
        response = client.delete(f"/api/documents/{document_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert "deleted successfully" in response.json()["message"].lower()
        
        # Verify document is actually deleted from database
        get_response = client.get(f"/api/documents/{document_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
        
        # Verify file is deleted from disk
        assert not file_path.exists()
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


def test_delete_document_not_found_returns_404(client):
    """Test deleting non-existent document returns 404 Not Found."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.delete(f"/api/documents/{fake_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


def test_delete_document_removes_from_racer_list(client, sample_racer, pdf_file, temp_upload_dir):
    """Test that deleted document no longer appears in racer's document list."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        # Upload a document
        filename, file_content, content_type = pdf_file
        upload_response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        document_id = upload_response.json()["id"]
        
        # Verify document is in racer's list
        list_response = client.get(f"/api/racers/{sample_racer.id}/documents")
        assert len(list_response.json()) == 1
        
        # Delete the document
        client.delete(f"/api/documents/{document_id}")
        
        # Verify document is no longer in racer's list
        list_response = client.get(f"/api/racers/{sample_racer.id}/documents")
        assert len(list_response.json()) == 0
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


# ============================================================================
# HTTP Status Code Tests
# ============================================================================

def test_successful_operations_return_2xx(client, sample_racer, pdf_file, temp_upload_dir):
    """Test that successful operations return 2xx status codes."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        # Upload - should return 201
        filename, file_content, content_type = pdf_file
        upload_response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        assert 200 <= upload_response.status_code < 300
        assert upload_response.status_code == status.HTTP_201_CREATED
        
        document_id = upload_response.json()["id"]
        
        # Get specific document - should return 200
        get_response = client.get(f"/api/documents/{document_id}")
        assert 200 <= get_response.status_code < 300
        assert get_response.status_code == status.HTTP_200_OK
        
        # Get racer documents - should return 200
        list_response = client.get(f"/api/racers/{sample_racer.id}/documents")
        assert 200 <= list_response.status_code < 300
        assert list_response.status_code == status.HTTP_200_OK
        
        # Delete - should return 200
        delete_response = client.delete(f"/api/documents/{document_id}")
        assert 200 <= delete_response.status_code < 300
        assert delete_response.status_code == status.HTTP_200_OK
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


def test_client_errors_return_4xx(client, sample_racer, invalid_file, temp_upload_dir):
    """Test that client errors return 4xx status codes."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        # Invalid file type - should return 400
        filename, file_content, content_type = invalid_file
        response = client.post(
            f"/api/racers/{sample_racer.id}/documents",
            files={"file": (filename, file_content, content_type)}
        )
        assert 400 <= response.status_code < 500
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Not found - should return 404
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/documents/{fake_id}")
        assert 400 <= response.status_code < 500
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Missing file - should return 422
        response = client.post(f"/api/racers/{sample_racer.id}/documents")
        assert 400 <= response.status_code < 500
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    finally:
        document_service.UPLOAD_DIR = original_upload_dir


# ============================================================================
# File Type Validation Tests
# ============================================================================

def test_upload_document_supported_file_types(client, sample_racer, temp_upload_dir):
    """Test that all supported file types can be uploaded."""
    from app.services import document_service
    original_upload_dir = document_service.UPLOAD_DIR
    document_service.UPLOAD_DIR = temp_upload_dir
    
    try:
        supported_files = [
            ("test.pdf", b"%PDF-1.4", "application/pdf"),
            ("test.doc", b"DOC content", "application/msword"),
            ("test.docx", b"DOCX content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            ("test.jpg", b"\xff\xd8\xff\xe0", "image/jpeg"),
            ("test.png", b"\x89PNG", "image/png"),
        ]
        
        for filename, content, content_type in supported_files:
            response = client.post(
                f"/api/racers/{sample_racer.id}/documents",
                files={"file": (filename, io.BytesIO(content), content_type)}
            )
            assert response.status_code == status.HTTP_201_CREATED, \
                f"Failed to upload {filename} with type {content_type}"
    finally:
        document_service.UPLOAD_DIR = original_upload_dir
