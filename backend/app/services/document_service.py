"""
Document service — S3-backed file storage with Bedrock AI analysis.

File upload uses the presigned URL flow:
  1. create_upload_url()  → presigned PUT URL + pending DB record
  2. Frontend PUTs file directly to S3 (bypasses Lambda)
  3. analyze_document()   → reads from S3, calls Bedrock, updates DB record

For local development (no UPLOADS_BUCKET set), the service falls back to
writing files to disk and reading them from disk for analysis.

Requirements: 3.1, 3.3, 3.4, 3.5, 7.2
"""

import os
import uuid
import logging
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile

import boto3
from botocore.exceptions import ClientError

from app.models import Document
from app.repositories.document_repository import DocumentRepository
from app.services.bedrock_service import BedrockService, BedrockServiceError

logger = logging.getLogger(__name__)

# File validation constants
ALLOWED_FILE_TYPES = {
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
}
ALLOWED_EXTENSIONS = {ext for exts in ALLOWED_FILE_TYPES.values() for ext in exts}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Presigned URL expiry
PRESIGNED_EXPIRY = 900  # 15 minutes

# Local dev fallback upload directory
LOCAL_UPLOAD_DIR = Path("uploads/documents")


class DocumentServiceError(Exception):
    """Base exception for document service errors."""
    pass


class ValidationError(DocumentServiceError):
    """Raised for validation errors (bad file type, size, etc.)."""
    pass


class NotFoundError(DocumentServiceError):
    """Raised when a document is not found."""
    pass


class FileStorageError(DocumentServiceError):
    """Raised for S3 or local I/O errors."""
    pass


class DocumentService:
    """
    Service for document upload (presigned URL flow), Bedrock analysis, and deletion.

    In production (UPLOADS_BUCKET set): uses S3 presigned URLs.
    In local dev (no UPLOADS_BUCKET): falls back to disk I/O.
    """

    def __init__(self, db: Session, bedrock_region: str = "us-east-1"):
        self.repository = DocumentRepository(db)
        self.uploads_bucket = os.environ.get("UPLOADS_BUCKET", "")
        self._aws_region = os.environ.get("AWS_REGION_NAME",
                                          os.environ.get("AWS_DEFAULT_REGION", bedrock_region))

        # S3 client (used in production)
        self._s3: Optional[boto3.client] = None

        # Bedrock service
        try:
            self.bedrock_service = BedrockService(region_name=bedrock_region)
        except Exception as e:
            logger.warning(f"Bedrock service not available: {e}")
            self.bedrock_service = None

    @property
    def s3(self):
        """Lazily initialise the S3 client."""
        if self._s3 is None:
            self._s3 = boto3.client("s3", region_name=self._aws_region)
        return self._s3

    # -------------------------------------------------------------------------
    # Presigned URL upload flow (production)
    # -------------------------------------------------------------------------

    def create_upload_url(
        self,
        racer_id: str,
        filename: str,
        file_type: str,
        file_size: int,
    ) -> dict:
        """
        Validate upload parameters, create a pending DB record, and return a
        presigned S3 PUT URL.

        Returns:
            dict with keys: upload_url, document_id, s3_key
        """
        # Validate file type
        ext = self._get_file_extension(filename)
        if ext not in ALLOWED_EXTENSIONS:
            allowed = ', '.join(sorted(ALLOWED_EXTENSIONS))
            raise ValidationError(
                f"File type '{ext}' is not allowed. Allowed types: {allowed}"
            )
        if file_type.lower() not in ALLOWED_FILE_TYPES:
            # Allow common browser variations
            if file_type.lower() not in ('image/jpg', 'image/pjpeg', 'video/x-m4v'):
                allowed = ', '.join(sorted(ALLOWED_FILE_TYPES.keys()))
                raise ValidationError(
                    f"Content type '{file_type}' is not allowed. Allowed: {allowed}"
                )

        # Validate file size
        if file_size > MAX_FILE_SIZE:
            raise ValidationError(
                f"File size ({file_size} bytes) exceeds the 50 MB limit."
            )

        s3_key = f"documents/{uuid.uuid4()}{ext}"

        # Generate presigned PUT URL
        try:
            upload_url = self.s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.uploads_bucket,
                    "Key": s3_key,
                    "ContentType": file_type,
                },
                ExpiresIn=PRESIGNED_EXPIRY,
            )
        except ClientError as e:
            raise FileStorageError(
                f"Failed to generate presigned upload URL: {e}"
            ) from e

        # Create pending DB record (analysis will be populated after confirm)
        try:
            document = self.repository.create(
                racer_id=racer_id,
                filename=filename,
                file_path=s3_key,
                file_type=file_type,
                file_size=file_size,
                analysis=None,
                status="pending",
            )
        except Exception as e:
            raise DocumentServiceError(
                f"Failed to create document record: {e}"
            ) from e

        return {
            "upload_url": upload_url,
            "document_id": document.id,
            "s3_key": s3_key,
        }

    def analyze_document(self, document_id: str) -> Document:
        """
        Read the uploaded file from S3, run Bedrock analysis, and update the
        DB record with the result (status → "complete").
        """
        document = self.get_document(document_id)
        s3_key = document.file_path

        # Read file bytes from S3
        try:
            response = self.s3.get_object(Bucket=self.uploads_bucket, Key=s3_key)
            file_bytes = response["Body"].read()
        except ClientError as e:
            raise FileStorageError(
                f"Failed to read file from S3 (key={s3_key}): {e}"
            ) from e

        # Analyse with Bedrock
        analysis_text = self._run_bedrock_analysis(
            file_bytes, document.file_type, document.filename
        )

        # Update DB record
        updated = self.repository.update(document_id, analysis=analysis_text, status="complete")
        if not updated:
            raise NotFoundError(f"Document not found with id: {document_id}")
        return updated

    def get_document_url(self, document_id: str) -> str:
        """Return a presigned GET URL (15-minute expiry) for viewing the file."""
        document = self.get_document(document_id)
        try:
            url = self.s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.uploads_bucket, "Key": document.file_path},
                ExpiresIn=PRESIGNED_EXPIRY,
            )
            return url
        except ClientError as e:
            raise FileStorageError(
                f"Failed to generate presigned download URL: {e}"
            ) from e

    # -------------------------------------------------------------------------
    # Legacy single-step upload (local dev / backward compat)
    # -------------------------------------------------------------------------

    def upload_document(self, racer_id: str, file: UploadFile) -> Document:
        """
        Upload and analyse in one step (used in local development when there
        is no UPLOADS_BUCKET configured).
        """
        if not file or not file.filename:
            raise ValidationError("No file provided for upload")

        self.validate_file(file)

        ext = self._get_file_extension(file.filename)
        unique_filename = f"{uuid.uuid4()}{ext}"

        # Save to disk
        LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        file_path = LOCAL_UPLOAD_DIR / unique_filename

        try:
            file_content = file.file.read()
            file_size = len(file_content)

            if file_size > MAX_FILE_SIZE:
                raise ValidationError(
                    f"File size ({file_size} bytes) exceeds the 50 MB limit."
                )

            with open(file_path, "wb") as f:
                f.write(file_content)

        except ValidationError:
            raise
        except Exception as e:
            raise FileStorageError(f"Failed to store file to disk: {e}") from e
        finally:
            file.file.seek(0)

        # Analyse with Bedrock (read bytes from disk)
        try:
            file_bytes = file_path.read_bytes()
        except Exception as e:
            file_bytes = b""

        analysis_text = self._run_bedrock_analysis(
            file_bytes, file.content_type or "application/octet-stream", file.filename
        )

        try:
            document = self.repository.create(
                racer_id=racer_id,
                filename=file.filename,
                file_path=str(file_path),
                file_type=file.content_type or "application/octet-stream",
                file_size=file_size,
                analysis=analysis_text,
                status="complete",
            )
            return document
        except Exception as e:
            try:
                if file_path.exists():
                    file_path.unlink()
            except Exception:
                pass
            raise DocumentServiceError(f"Failed to create document record: {e}") from e

    # -------------------------------------------------------------------------
    # Shared read / delete
    # -------------------------------------------------------------------------

    def get_documents(self, racer_id: str) -> List[Document]:
        """Retrieve all documents for a racer."""
        try:
            return self.repository.get_by_racer(racer_id)
        except Exception as e:
            raise DocumentServiceError(f"Failed to retrieve documents: {e}") from e

    def get_document(self, document_id: str) -> Document:
        """Retrieve a single document by ID."""
        document = self.repository.get_by_id(document_id)
        if not document:
            raise NotFoundError(f"Document not found with id: {document_id}")
        return document

    def delete_document(self, document_id: str) -> None:
        """
        Delete a document — removes from S3 (or disk) and the DB record.
        """
        document = self.get_document(document_id)

        if self.uploads_bucket:
            # Production: delete from S3
            try:
                self.s3.delete_object(
                    Bucket=self.uploads_bucket, Key=document.file_path
                )
            except ClientError as e:
                logger.warning(f"Failed to delete S3 object '{document.file_path}': {e}")
        else:
            # Local dev: delete from disk
            try:
                file_path = Path(document.file_path)
                if file_path.exists():
                    file_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete local file '{document.file_path}': {e}")

        success = self.repository.delete(document_id)
        if not success:
            raise NotFoundError(f"Document not found with id: {document_id}")

    # -------------------------------------------------------------------------
    # Validation helpers
    # -------------------------------------------------------------------------

    def validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file type (extension and content-type)."""
        if not file or not file.filename:
            raise ValidationError("No file provided for upload")

        ext = self._get_file_extension(file.filename).lower()
        if ext not in ALLOWED_EXTENSIONS:
            allowed = ', '.join(sorted(ALLOWED_EXTENSIONS))
            raise ValidationError(
                f"File type '{ext}' is not allowed. Allowed types: {allowed}"
            )

        if file.content_type:
            ct = file.content_type.lower()
            if ct not in ALLOWED_FILE_TYPES:
                if ct not in ('image/jpg', 'image/pjpeg', 'video/x-m4v'):
                    allowed = ', '.join(sorted(ALLOWED_FILE_TYPES.keys()))
                    raise ValidationError(
                        f"Content type '{ct}' is not allowed. Allowed: {allowed}"
                    )

    def _get_file_extension(self, filename: str) -> str:
        """Extract lowercase extension from filename (e.g. '.mp4')."""
        if '.' not in filename:
            raise ValidationError(f"Filename '{filename}' has no extension")
        return '.' + filename.rsplit('.', 1)[1].lower()

    def _run_bedrock_analysis(
        self, file_bytes: bytes, file_type: str, filename: str
    ) -> str:
        """Call Bedrock analysis, returning a message on failure."""
        if not self.bedrock_service:
            return (
                "Analysis unavailable: AWS Bedrock is not configured. "
                "Please configure AWS credentials to enable AI-powered ski form analysis."
            )
        try:
            return self.bedrock_service.analyze_ski_form(
                file_bytes=file_bytes,
                file_type=file_type,
                filename=filename,
            )
        except BedrockServiceError as e:
            logger.warning(f"Bedrock analysis failed: {e}")
            return f"Analysis unavailable: {e}"
