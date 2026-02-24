"""
Racer repository for database operations.

This module provides data access layer for racer profiles, implementing
CRUD operations (Create, Read, Update, Delete, List) for the Racer model.

Requirements: 1.1, 1.2, 1.3, 1.4
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Racer
from app.schemas import RacerCreate, RacerUpdate


class RacerRepository:
    """
    Repository class for racer profile database operations.
    
    Provides methods for creating, retrieving, updating, deleting, and
    listing racer profiles in the database.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the repository with a database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def create(self, racer_data: RacerCreate) -> Racer:
        """
        Create a new racer profile in the database.
        
        Args:
            racer_data: Validated racer profile data
            
        Returns:
            Racer: The created racer profile with generated id and timestamps
            
        Requirement: 1.1 - Create new Racer_Profile and store in Database
        """
        # Create new Racer instance from schema data
        db_racer = Racer(
            racer_name=racer_data.racer_name,
            height=racer_data.height,
            weight=racer_data.weight,
            ski_types=racer_data.ski_types,
            binding_measurements=racer_data.binding_measurements,
            personal_records=racer_data.personal_records,
            racing_goals=racer_data.racing_goals
        )
        
        # Add to session and commit
        self.db.add(db_racer)
        self.db.commit()
        self.db.refresh(db_racer)
        
        return db_racer
    
    def get(self, racer_id: str) -> Optional[Racer]:
        """
        Retrieve a racer profile by ID.
        
        Args:
            racer_id: UUID of the racer profile
            
        Returns:
            Racer: The racer profile if found, None otherwise
            
        Requirement: 1.2 - Retrieve and display Racer_Profile from Database
        """
        return self.db.query(Racer).filter(Racer.id == racer_id).first()
    
    def update(self, racer_id: str, racer_data: RacerUpdate) -> Optional[Racer]:
        """
        Update an existing racer profile.
        
        Args:
            racer_id: UUID of the racer profile to update
            racer_data: Validated update data (only provided fields will be updated)
            
        Returns:
            Racer: The updated racer profile if found, None otherwise
            
        Requirement: 1.3 - Modify existing Racer_Profile in Database
        """
        # Get existing racer
        db_racer = self.get(racer_id)
        if not db_racer:
            return None
        
        # Update only provided fields
        update_data = racer_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_racer, field, value)
        
        # Commit changes
        self.db.commit()
        self.db.refresh(db_racer)
        
        return db_racer
    
    def delete(self, racer_id: str) -> bool:
        """
        Delete a racer profile from the database.
        
        Due to CASCADE delete configuration in the model, this will also
        delete all associated documents and events.
        
        Args:
            racer_id: UUID of the racer profile to delete
            
        Returns:
            bool: True if racer was deleted, False if not found
            
        Requirement: 1.4 - Remove Racer_Profile from Database
        """
        db_racer = self.get(racer_id)
        if not db_racer:
            return False
        
        self.db.delete(db_racer)
        self.db.commit()
        
        return True
    
    def list(self, skip: int = 0, limit: int = 100) -> List[Racer]:
        """
        List all racer profiles with pagination.
        
        Args:
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            
        Returns:
            List[Racer]: List of racer profiles
        """
        return self.db.query(Racer).offset(skip).limit(limit).all()
