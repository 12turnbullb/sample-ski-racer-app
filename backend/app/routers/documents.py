"""
Document API routes.

This module implements RESTful API endpoints for document upload and retrieval
operations with proper HTTP status codes and error handling.

Requirements: 6.2, 6.4
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import DocumentResponse
from app.services.document_service import (
    DocumentService,
    ValidationError as DocumentValidationError,
    NotFoundError,
    DocumentServiceError,
    FileStorageError
)

router = APIRouter(prefix="/api", tags=["documents"])


@router.post(
    "/racers/{racer_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a video/image for ski form analysis",
    responses={
        201: {"description": "Video/image uploaded and analyzed successfully"},
        400: {"description": "Invalid file - validation failed"},
        500: {"description": "Internal server error"}
    }
)
def upload_document(
    racer_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> DocumentResponse:
    """
    Upload a video or image file for AI-powered ski form analysis.
    
    Accepts multipart/form-data file upload (MP4, MOV, JPG, PNG), analyzes
    the ski form using Amazon Bedrock, and stores the file with analysis results.
    Returns 201 Created on success.
    
    Args:
        racer_id: UUID of the racer who owns this document
        file: Uploaded video/image file (multipart/form-data)
        db: Database session (injected by FastAPI)
        
    Returns:
        DocumentResponse: The uploaded document metadata with AI analysis
        
    Raises:
        HTTPException 400: If file validation fails (invalid type, too large, missing)
        HTTPException 500: If file storage or database operation fails
        
    Requirements:
        - 6.2: RESTful endpoint for video/image upload operations
        - 6.4: Appropriate HTTP status codes
    """
    service = DocumentService(db)
    
    try:
        document = service.upload_document(racer_id, file)
        return DocumentResponse.model_validate(document)
    except DocumentValidationError as e:
        # Client error - invalid file
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except FileStorageError as e:
        # Server error - file storage failed
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store document file"
        )
    except DocumentServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get(
    "/racers/{racer_id}/documents",
    response_model=List[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all documents for a racer",
    responses={
        200: {"description": "Documents retrieved successfully"},
        500: {"description": "Internal server error"}
    }
)
def get_racer_documents(
    racer_id: str,
    db: Session = Depends(get_db)
) -> List[DocumentResponse]:
    """
    Retrieve all documents for a specific racer.
    
    Returns a list of all documents associated with the racer,
    ordered by upload date (most recent first).
    Returns 200 OK on success.
    
    Args:
        racer_id: UUID of the racer
        db: Database session (injected by FastAPI)
        
    Returns:
        List[DocumentResponse]: List of document metadata
        
    Raises:
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.2: RESTful endpoint for document retrieval operations
        - 6.4: Appropriate HTTP status codes
    """
    service = DocumentService(db)
    
    try:
        documents = service.get_documents(racer_id)
        return [DocumentResponse.model_validate(doc) for doc in documents]
    except DocumentServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve documents"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get(
    "/documents/{document_id}",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a specific document by ID",
    responses={
        200: {"description": "Document retrieved successfully"},
        404: {"description": "Document not found"},
        500: {"description": "Internal server error"}
    }
)
def get_document(
    document_id: str,
    db: Session = Depends(get_db)
) -> DocumentResponse:
    """
    Retrieve a specific document by ID.
    
    Returns the document metadata for the specified document ID.
    Returns 200 OK on success.
    
    Args:
        document_id: UUID of the document
        db: Database session (injected by FastAPI)
        
    Returns:
        DocumentResponse: The document metadata
        
    Raises:
        HTTPException 404: If document is not found
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.2: RESTful endpoint for document retrieval operations
        - 6.4: Appropriate HTTP status codes
    """
    service = DocumentService(db)
    
    try:
        document = service.get_document(document_id)
        return DocumentResponse.model_validate(document)
    except NotFoundError as e:
        # Client error - resource not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except DocumentServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve document"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a document",
    responses={
        200: {"description": "Document deleted successfully"},
        404: {"description": "Document not found"},
        500: {"description": "Internal server error"}
    }
)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Delete a document file and database record.
    
    Deletes both the file from disk and the database record.
    Returns 200 OK on success with a confirmation message.
    
    Args:
        document_id: UUID of the document to delete
        db: Database session (injected by FastAPI)
        
    Returns:
        dict: Confirmation message
        
    Raises:
        HTTPException 404: If document is not found
        HTTPException 500: If deletion operation fails
        
    Requirements:
        - 6.2: RESTful endpoint for document deletion operations
        - 6.4: Appropriate HTTP status codes
    """
    service = DocumentService(db)
    
    try:
        service.delete_document(document_id)
        return {"message": f"Document {document_id} deleted successfully"}
    except NotFoundError as e:
        # Client error - resource not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except DocumentServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
