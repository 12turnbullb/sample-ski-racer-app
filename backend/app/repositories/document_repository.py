"""
Document repository for database operations.

This module provides data access layer for document records, implementing
CRUD operations (Create, Read, Delete) for the Document model.

Requirements: 3.1, 3.2, 3.5
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Document


class DocumentRepository:
    """
    Repository class for document database operations.
    
    Provides methods for creating, retrieving, and deleting document
    records in the database. Note: Documents are not updated, only
    created and deleted.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the repository with a database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def create(
        self,
        racer_id: str,
        filename: str,
        file_path: str,
        file_type: str,
        file_size: int,
        analysis: str = None
    ) -> Document:
        """
        Create a new document record in the database.
        
        Args:
            racer_id: UUID of the racer who owns this document
            filename: Original filename of the uploaded file
            file_path: Path where the file is stored on disk
            file_type: MIME type of the file
            file_size: Size of the file in bytes
            analysis: AI-generated analysis of ski form (optional)
            
        Returns:
            Document: The created document record with generated id and timestamp
            
        Requirement: 3.1 - Store video/image and associate with racer
        """
        # Create new Document instance
        db_document = Document(
            racer_id=racer_id,
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
            analysis=analysis
        )
        
        # Add to session and commit
        self.db.add(db_document)
        self.db.commit()
        self.db.refresh(db_document)
        
        return db_document
    
    def get_by_racer(self, racer_id: str) -> List[Document]:
        """
        Retrieve all documents for a specific racer.
        
        Args:
            racer_id: UUID of the racer
            
        Returns:
            List[Document]: List of documents associated with the racer,
                           ordered by upload date (most recent first)
            
        Requirement: 3.2 - Retrieve and display all associated Ski_Analysis_Documents
        """
        return (
            self.db.query(Document)
            .filter(Document.racer_id == racer_id)
            .order_by(Document.uploaded_at.desc())
            .all()
        )
    
    def get_by_id(self, document_id: str) -> Optional[Document]:
        """
        Retrieve a specific document by its ID.
        
        Args:
            document_id: UUID of the document
            
        Returns:
            Document: The document if found, None otherwise
            
        Requirement: 3.2 - Retrieve and display Ski_Analysis_Documents
        """
        return self.db.query(Document).filter(Document.id == document_id).first()
    
    def delete(self, document_id: str) -> bool:
        """
        Delete a document record from the database.
        
        Note: This only deletes the database record. The caller is responsible
        for deleting the actual file from disk.
        
        Args:
            document_id: UUID of the document to delete
            
        Returns:
            bool: True if document was deleted, False if not found
            
        Requirement: 3.5 - Remove Ski_Analysis_Document from storage
        """
        db_document = self.get_by_id(document_id)
        if not db_document:
            return False
        
        self.db.delete(db_document)
        self.db.commit()
        
        return True
