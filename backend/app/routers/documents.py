"""
Document API routes.

Presigned URL upload flow (production / S3):
  POST /api/racers/{id}/documents/upload-url   → presigned PUT URL + document_id
  POST /api/racers/{id}/documents/{doc_id}/analyze → Bedrock analysis + full DocumentResponse

Legacy single-step upload (local dev):
  POST /api/racers/{id}/documents              → multipart upload + analysis

Shared endpoints:
  GET  /api/racers/{id}/documents              → list documents
  GET  /api/documents/{doc_id}                 → single document
  GET  /api/documents/{doc_id}/url             → presigned GET URL for media viewing
  DELETE /api/documents/{doc_id}               → delete document + S3 object

Requirements: 6.2, 6.4
"""

import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import (
    DocumentResponse,
    UploadUrlRequest,
    UploadUrlResponse,
    DocumentUrlResponse,
)
from app.services.document_service import (
    DocumentService,
    ValidationError as DocumentValidationError,
    NotFoundError,
    DocumentServiceError,
    FileStorageError,
)

router = APIRouter(prefix="/api", tags=["documents"])


# ---------------------------------------------------------------------------
# Presigned URL upload flow
# ---------------------------------------------------------------------------

@router.post(
    "/racers/{racer_id}/documents/upload-url",
    response_model=UploadUrlResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a presigned S3 PUT URL for direct file upload",
)
def get_upload_url(
    racer_id: str,
    body: UploadUrlRequest,
    db: Session = Depends(get_db),
) -> UploadUrlResponse:
    """
    Validate the upload parameters, create a pending DB record, and return a
    presigned S3 PUT URL.  The frontend PUTs the file directly to S3, then
    calls /analyze to trigger Bedrock processing.
    """
    service = DocumentService(db)
    try:
        result = service.create_upload_url(
            racer_id=racer_id,
            filename=body.filename,
            file_type=body.file_type,
            file_size=body.file_size,
        )
        return UploadUrlResponse(**result)
    except DocumentValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileStorageError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL",
        )
    except DocumentServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create document record",
        )


@router.post(
    "/racers/{racer_id}/documents/{document_id}/analyze",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Bedrock analysis for an already-uploaded S3 file",
)
def analyze_document(
    racer_id: str,
    document_id: str,
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """
    Read the uploaded file from S3, run AI form analysis via Bedrock,
    update the document record (status → complete), and return the full result.
    """
    service = DocumentService(db)
    try:
        document = service.analyze_document(document_id)
        return DocumentResponse.model_validate(document)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except FileStorageError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to read file from storage",
        )
    except DocumentServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze document",
        )


# ---------------------------------------------------------------------------
# Presigned GET URL for media viewing
# ---------------------------------------------------------------------------

@router.get(
    "/documents/{document_id}/url",
    response_model=DocumentUrlResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a presigned S3 GET URL for viewing an uploaded file",
)
def get_document_url(
    document_id: str,
    db: Session = Depends(get_db),
) -> DocumentUrlResponse:
    """
    Returns a short-lived (15-minute) presigned GET URL for the file so the
    browser can render the video or image without exposing raw S3 credentials.
    """
    service = DocumentService(db)
    try:
        url = service.get_document_url(document_id)
        return DocumentUrlResponse(url=url, expires_in=900)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except FileStorageError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL",
        )


# ---------------------------------------------------------------------------
# Legacy single-step upload (local dev, no S3 bucket configured)
# ---------------------------------------------------------------------------

@router.post(
    "/racers/{racer_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a video/image for ski form analysis (local dev only)",
)
def upload_document(
    racer_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """
    Single-step multipart upload used during local development (when
    UPLOADS_BUCKET is not configured).  In production, use the presigned
    URL flow instead.
    """
    uploads_bucket = os.environ.get("UPLOADS_BUCKET", "")
    if uploads_bucket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Direct multipart upload is disabled in production. "
                "Use POST /upload-url followed by POST /analyze."
            ),
        )

    service = DocumentService(db)
    try:
        document = service.upload_document(racer_id, file)
        return DocumentResponse.model_validate(document)
    except DocumentValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileStorageError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store document file",
        )
    except DocumentServiceError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document",
        )


# ---------------------------------------------------------------------------
# Shared read / delete
# ---------------------------------------------------------------------------

@router.get(
    "/racers/{racer_id}/documents",
    response_model=List[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all documents for a racer",
)
def get_racer_documents(
    racer_id: str,
    db: Session = Depends(get_db),
) -> List[DocumentResponse]:
    service = DocumentService(db)
    try:
        documents = service.get_documents(racer_id)
        return [DocumentResponse.model_validate(doc) for doc in documents]
    except DocumentServiceError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve documents",
        )


@router.get(
    "/documents/{document_id}",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a specific document by ID",
)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
) -> DocumentResponse:
    service = DocumentService(db)
    try:
        document = service.get_document(document_id)
        return DocumentResponse.model_validate(document)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DocumentServiceError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve document",
        )


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a document and its S3 object",
)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
) -> dict:
    service = DocumentService(db)
    try:
        service.delete_document(document_id)
        return {"message": f"Document {document_id} deleted successfully"}
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DocumentServiceError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document",
        )
