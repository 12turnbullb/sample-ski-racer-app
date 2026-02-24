"""
Document service with business logic, file storage, and AI analysis.

This module provides business logic layer for video/image upload, storage,
and AI-powered ski form analysis using Amazon Bedrock.

Requirements: 3.1, 3.3, 3.4, 3.5, 7.2
"""

import os
import uuid
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.models import Document
from app.repositories.document_repository import DocumentRepository
from app.services.bedrock_service import BedrockService, BedrockServiceError


# File validation constants - Updated for video and image analysis
ALLOWED_FILE_TYPES = {
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png']
}

# Flatten allowed extensions for easy checking
ALLOWED_EXTENSIONS = {ext for exts in ALLOWED_FILE_TYPES.values() for ext in exts}

# Maximum file size: 50MB in bytes (increased for video files)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Default upload directory
UPLOAD_DIR = Path("uploads/documents")


class DocumentServiceError(Exception):
    """Base exception for document service errors."""
    pass


class ValidationError(DocumentServiceError):
    """Exception raised for validation errors."""
    pass


class NotFoundError(DocumentServiceError):
    """Exception raised when a document is not found."""
    pass


class FileStorageError(DocumentServiceError):
    """Exception raised for file storage errors."""
    pass


class DocumentService:
    """
    Service class for video/image upload, storage, and AI analysis.
    
    Provides methods for uploading, analyzing, retrieving, and deleting
    ski form videos/images with AI-powered feedback from Amazon Bedrock.
    """
    
    def __init__(self, db: Session, upload_dir: Optional[Path] = None, bedrock_region: str = "us-east-1"):
        """
        Initialize the service with a database session, upload directory, and Bedrock client.
        
        Args:
            db: SQLAlchemy database session
            upload_dir: Directory for storing uploaded files (defaults to UPLOAD_DIR)
            bedrock_region: AWS region for Bedrock service
        """
        self.repository = DocumentRepository(db)
        self.upload_dir = upload_dir or UPLOAD_DIR
        
        # Initialize Bedrock service (may be None if AWS not configured)
        try:
            self.bedrock_service = BedrockService(region_name=bedrock_region)
        except Exception as e:
            print(f"Warning: Bedrock service not available: {str(e)}")
            self.bedrock_service = None
        
        # Ensure upload directory exists
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def upload_document(self, racer_id: str, file: UploadFile) -> Document:
        """
        Upload and analyze a video/image file with AI-powered ski form feedback.
        
        Validates file type and size, stores the file to disk with a unique
        filename, analyzes the content using Amazon Bedrock, and creates a 
        database record with the analysis.
        
        Args:
            racer_id: UUID of the racer who owns this document
            file: Uploaded file from FastAPI
            
        Returns:
            Document: The created document record with metadata and AI analysis
            
        Raises:
            ValidationError: If file validation fails (type, size, missing file)
            FileStorageError: If file storage to disk fails
            
        Requirements:
            - 3.1: Store video/image and associate with racer
            - 3.3: Return error message describing failure reason
            - 3.4: Support MP4, MOV, JPG, JPEG, PNG formats
            - 7.2: Persist file to disk
        """
        # Validate file is present
        if not file or not file.filename:
            raise ValidationError("No file provided for upload")
        
        # Validate file type
        self.validate_file(file)
        
        # Generate unique filename to avoid collisions
        file_extension = self._get_file_extension(file.filename)
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = self.upload_dir / unique_filename
        
        # Read file content and validate size
        try:
            file_content = file.file.read()
            file_size = len(file_content)
            
            # Validate file size
            if file_size > MAX_FILE_SIZE:
                raise ValidationError(
                    f"File size ({file_size} bytes) exceeds maximum allowed size "
                    f"({MAX_FILE_SIZE} bytes / 50MB)"
                )
            
            # Write file to disk
            with open(file_path, 'wb') as f:
                f.write(file_content)
                
        except ValidationError:
            # Re-raise validation errors
            raise
        except Exception as e:
            # Wrap file I/O errors
            raise FileStorageError(
                f"Failed to store file to disk: {str(e)}"
            ) from e
        finally:
            # Reset file pointer for potential reuse
            file.file.seek(0)
        
        # Analyze the video/image with Bedrock
        analysis_text = None
        if self.bedrock_service:
            try:
                analysis_text = self.bedrock_service.analyze_ski_form(
                    file_path=str(file_path),
                    file_type=file.content_type or 'application/octet-stream',
                    filename=file.filename
                )
            except BedrockServiceError as e:
                # Log the error but don't fail the upload
                # Store a message indicating analysis failed
                analysis_text = f"Analysis unavailable: {str(e)}"
                print(f"Warning: Bedrock analysis failed: {str(e)}")
        else:
            analysis_text = "Analysis unavailable: AWS Bedrock is not configured. Please configure AWS credentials to enable AI-powered ski form analysis."
        
        # Create database record with analysis
        try:
            document = self.repository.create(
                racer_id=racer_id,
                filename=file.filename,
                file_path=str(file_path),
                file_type=file.content_type or 'application/octet-stream',
                file_size=file_size,
                analysis=analysis_text
            )
            return document
            
        except Exception as e:
            # If database creation fails, clean up the uploaded file
            try:
                if file_path.exists():
                    file_path.unlink()
            except Exception:
                pass  # Best effort cleanup
            
            raise DocumentServiceError(
                f"Failed to create document record: {str(e)}"
            ) from e
    
    def get_documents(self, racer_id: str) -> List[Document]:
        """
        Retrieve all documents for a racer.
        
        Args:
            racer_id: UUID of the racer
            
        Returns:
            List[Document]: List of documents associated with the racer
            
        Requirement: 3.2 - Retrieve and display all associated Ski_Analysis_Documents
        """
        try:
            return self.repository.get_by_racer(racer_id)
        except Exception as e:
            raise DocumentServiceError(
                f"Failed to retrieve documents: {str(e)}"
            ) from e
    
    def get_document(self, document_id: str) -> Document:
        """
        Retrieve a specific document by ID.
        
        Args:
            document_id: UUID of the document
            
        Returns:
            Document: The document record
            
        Raises:
            NotFoundError: If document is not found
            
        Requirement: 3.2 - Retrieve and display Ski_Analysis_Documents
        """
        document = self.repository.get_by_id(document_id)
        if not document:
            raise NotFoundError(
                f"Document not found with id: {document_id}"
            )
        return document
    
    def delete_document(self, document_id: str) -> None:
        """
        Delete a document file and database record.
        
        Removes both the file from disk and the database record. If the file
        doesn't exist on disk, still removes the database record.
        
        Args:
            document_id: UUID of the document to delete
            
        Raises:
            NotFoundError: If document is not found in database
            
        Requirement: 3.5 - Remove Ski_Analysis_Document from storage
        """
        # Get document record to find file path
        document = self.get_document(document_id)
        
        # Delete file from disk (best effort - don't fail if file missing)
        try:
            file_path = Path(document.file_path)
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            # Log warning but continue with database deletion
            # In production, this should use proper logging
            print(f"Warning: Failed to delete file from disk: {str(e)}")
        
        # Delete database record
        success = self.repository.delete(document_id)
        if not success:
            raise NotFoundError(
                f"Document not found with id: {document_id}"
            )
    
    def validate_file(self, file: UploadFile) -> None:
        """
        Validate uploaded file type and size.
        
        Checks that the file has an allowed extension and content type.
        File size validation is performed during upload to avoid reading
        large files into memory unnecessarily.
        
        Args:
            file: Uploaded file from FastAPI
            
        Raises:
            ValidationError: If file type is not allowed
            
        Requirements:
            - 3.3: Return error message describing failure reason
            - 3.4: Support MP4, MOV, JPG, JPEG, PNG formats
        """
        if not file or not file.filename:
            raise ValidationError("No file provided for upload")
        
        # Get file extension
        file_extension = self._get_file_extension(file.filename).lower()
        
        # Check if extension is allowed
        if file_extension not in ALLOWED_EXTENSIONS:
            allowed_list = ', '.join(sorted(ALLOWED_EXTENSIONS))
            raise ValidationError(
                f"File type '{file_extension}' is not allowed. "
                f"Allowed types: {allowed_list}"
            )
        
        # Validate content type if provided
        if file.content_type:
            content_type = file.content_type.lower()
            
            # Check if content type is in our allowed list
            if content_type not in ALLOWED_FILE_TYPES:
                # Some browsers may send different content types
                # Allow common variations
                if content_type in ['image/jpg', 'image/pjpeg', 'video/x-m4v']:
                    # These are acceptable variations
                    return
                
                allowed_types = ', '.join(sorted(ALLOWED_FILE_TYPES.keys()))
                raise ValidationError(
                    f"File content type '{content_type}' is not allowed. "
                    f"Allowed types: {allowed_types}"
                )
    
    def _get_file_extension(self, filename: str) -> str:
        """
        Extract file extension from filename.
        
        Args:
            filename: Original filename
            
        Returns:
            str: File extension including the dot (e.g., '.pdf')
            
        Raises:
            ValidationError: If filename has no extension
        """
        if '.' not in filename:
            raise ValidationError(
                f"Filename '{filename}' has no extension"
            )
        
        # Get extension (including the dot)
        extension = '.' + filename.rsplit('.', 1)[1].lower()
        return extension
