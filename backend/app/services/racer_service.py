"""
Racer service with business logic and validation.

This module provides business logic layer for racer profile operations,
implementing validation rules and error handling with descriptive messages.

Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Racer
from app.schemas import RacerCreate, RacerUpdate
from app.repositories.racer_repository import RacerRepository
from pydantic import ValidationError


class RacerServiceError(Exception):
    """Base exception for racer service errors."""
    pass


class ValidationError(RacerServiceError):
    """Exception raised for validation errors."""
    pass


class NotFoundError(RacerServiceError):
    """Exception raised when a racer is not found."""
    pass


class RacerService:
    """
    Service class for racer profile business logic.
    
    Provides methods for creating, retrieving, updating, and deleting racer
    profiles with validation and error handling.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the service with a database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.repository = RacerRepository(db)
    
    def create_racer(self, racer_data: RacerCreate) -> Racer:
        """
        Create a new racer profile with validation.
        
        Validates that height > 0, weight > 0, and all required fields are
        non-empty before creating the profile.
        
        Args:
            racer_data: Validated racer profile data from Pydantic schema
            
        Returns:
            Racer: The created racer profile
            
        Raises:
            ValidationError: If validation fails with descriptive message
            
        Requirements:
            - 2.1: Reject height <= 0
            - 2.2: Reject weight <= 0
            - 2.3: Reject empty required fields
            - 2.4: Return descriptive error messages
            - 9.1: Display user-friendly error messages
            - 9.2: Indicate which fields caused failure
        """
        # Validate height
        if racer_data.height <= 0:
            raise ValidationError(
                f"Height must be greater than 0. Received: {racer_data.height}"
            )
        
        # Validate weight
        if racer_data.weight <= 0:
            raise ValidationError(
                f"Weight must be greater than 0. Received: {racer_data.weight}"
            )
        
        # Validate required fields are non-empty
        # Note: Pydantic schema already validates min_length=1 and strips whitespace,
        # but we add explicit checks for clarity and additional validation
        required_fields = {
            'ski_types': racer_data.ski_types,
            'binding_measurements': racer_data.binding_measurements,
            'personal_records': racer_data.personal_records,
            'racing_goals': racer_data.racing_goals
        }
        
        empty_fields = [
            field_name for field_name, field_value in required_fields.items()
            if not field_value or not field_value.strip()
        ]
        
        if empty_fields:
            raise ValidationError(
                f"Required fields cannot be empty: {', '.join(empty_fields)}"
            )
        
        # Create racer profile in database
        try:
            return self.repository.create(racer_data)
        except Exception as e:
            # Wrap database errors with descriptive message
            raise RacerServiceError(
                f"Failed to create racer profile: {str(e)}"
            ) from e
    
    def get_racer(self, racer_id: str) -> Racer:
        """
        Retrieve a racer profile by ID.
        
        Args:
            racer_id: UUID of the racer profile
            
        Returns:
            Racer: The racer profile
            
        Raises:
            NotFoundError: If racer is not found with descriptive message
            
        Requirements:
            - 9.1: Display user-friendly error messages
            - 9.2: Indicate which resource caused failure
        """
        racer = self.repository.get(racer_id)
        if not racer:
            raise NotFoundError(
                f"Racer profile not found with id: {racer_id}"
            )
        return racer
    
    def update_racer(self, racer_id: str, racer_data: RacerUpdate) -> Racer:
        """
        Update an existing racer profile with validation.
        
        Validates that height > 0, weight > 0 (if provided), and all provided
        fields are non-empty before updating the profile.
        
        Args:
            racer_id: UUID of the racer profile to update
            racer_data: Validated update data (only provided fields will be updated)
            
        Returns:
            Racer: The updated racer profile
            
        Raises:
            NotFoundError: If racer is not found
            ValidationError: If validation fails with descriptive message
            
        Requirements:
            - 2.1: Reject height <= 0
            - 2.2: Reject weight <= 0
            - 2.3: Reject empty required fields
            - 2.4: Return descriptive error messages
            - 9.1: Display user-friendly error messages
            - 9.2: Indicate which fields caused failure
        """
        # Check if racer exists
        existing_racer = self.repository.get(racer_id)
        if not existing_racer:
            raise NotFoundError(
                f"Racer profile not found with id: {racer_id}"
            )
        
        # Validate height if provided
        if racer_data.height is not None and racer_data.height <= 0:
            raise ValidationError(
                f"Height must be greater than 0. Received: {racer_data.height}"
            )
        
        # Validate weight if provided
        if racer_data.weight is not None and racer_data.weight <= 0:
            raise ValidationError(
                f"Weight must be greater than 0. Received: {racer_data.weight}"
            )
        
        # Validate provided string fields are non-empty
        # Note: Pydantic schema already validates this, but we add explicit checks
        provided_fields = racer_data.model_dump(exclude_unset=True)
        empty_fields = []
        
        for field_name in ['ski_types', 'binding_measurements', 'personal_records', 'racing_goals']:
            if field_name in provided_fields:
                field_value = provided_fields[field_name]
                if not field_value or not field_value.strip():
                    empty_fields.append(field_name)
        
        if empty_fields:
            raise ValidationError(
                f"Provided fields cannot be empty: {', '.join(empty_fields)}"
            )
        
        # Update racer profile in database
        try:
            updated_racer = self.repository.update(racer_id, racer_data)
            if not updated_racer:
                # This shouldn't happen since we checked existence above,
                # but handle it just in case
                raise NotFoundError(
                    f"Racer profile not found with id: {racer_id}"
                )
            return updated_racer
        except (ValidationError, NotFoundError):
            # Re-raise our custom exceptions
            raise
        except Exception as e:
            # Wrap database errors with descriptive message
            raise RacerServiceError(
                f"Failed to update racer profile: {str(e)}"
            ) from e
    
    def delete_racer(self, racer_id: str) -> None:
        """
        Delete a racer profile and all associated data.
        
        Args:
            racer_id: UUID of the racer profile to delete
            
        Raises:
            NotFoundError: If racer is not found with descriptive message
            
        Requirements:
            - 9.1: Display user-friendly error messages
            - 9.2: Indicate which resource caused failure
        """
        success = self.repository.delete(racer_id)
        if not success:
            raise NotFoundError(
                f"Racer profile not found with id: {racer_id}"
            )
    
    def list_racers(self, skip: int = 0, limit: int = 100) -> List[Racer]:
        """
        List all racer profiles with pagination.
        
        Args:
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            
        Returns:
            List[Racer]: List of racer profiles
        """
        try:
            return self.repository.list(skip=skip, limit=limit)
        except Exception as e:
            # Wrap database errors with descriptive message
            raise RacerServiceError(
                f"Failed to list racer profiles: {str(e)}"
            ) from e
    
    def validate_racer_data(self, racer_data: RacerCreate | RacerUpdate) -> None:
        """
        Validate racer profile data.
        
        This method can be used to validate data without creating/updating
        a profile in the database.
        
        Args:
            racer_data: Racer profile data to validate
            
        Raises:
            ValidationError: If validation fails with descriptive message
            
        Requirements:
            - 2.1: Reject height <= 0
            - 2.2: Reject weight <= 0
            - 2.3: Reject empty required fields
            - 2.4: Return descriptive error messages
        """
        # Validate height
        height = getattr(racer_data, 'height', None)
        if height is not None and height <= 0:
            raise ValidationError(
                f"Height must be greater than 0. Received: {height}"
            )
        
        # Validate weight
        weight = getattr(racer_data, 'weight', None)
        if weight is not None and weight <= 0:
            raise ValidationError(
                f"Weight must be greater than 0. Received: {weight}"
            )
        
        # For RacerCreate, validate all required fields
        if isinstance(racer_data, RacerCreate):
            required_fields = {
                'ski_types': racer_data.ski_types,
                'binding_measurements': racer_data.binding_measurements,
                'personal_records': racer_data.personal_records,
                'racing_goals': racer_data.racing_goals
            }
            
            empty_fields = [
                field_name for field_name, field_value in required_fields.items()
                if not field_value or not field_value.strip()
            ]
            
            if empty_fields:
                raise ValidationError(
                    f"Required fields cannot be empty: {', '.join(empty_fields)}"
                )
        
        # For RacerUpdate, validate only provided fields
        elif isinstance(racer_data, RacerUpdate):
            provided_fields = racer_data.model_dump(exclude_unset=True)
            empty_fields = []
            
            for field_name in ['ski_types', 'binding_measurements', 'personal_records', 'racing_goals']:
                if field_name in provided_fields:
                    field_value = provided_fields[field_name]
                    if not field_value or not field_value.strip():
                        empty_fields.append(field_name)
            
            if empty_fields:
                raise ValidationError(
                    f"Provided fields cannot be empty: {', '.join(empty_fields)}"
                )
