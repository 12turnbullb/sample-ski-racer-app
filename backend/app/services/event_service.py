"""
Event service with business logic and validation.

This module provides business logic layer for racing event operations,
implementing validation rules and error handling with descriptive messages.

Requirements: 5.1, 5.2, 5.3, 5.4, 9.1, 9.2
"""

from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.models import Event
from app.schemas import EventCreate, EventUpdate
from app.repositories.event_repository import EventRepository


class EventServiceError(Exception):
    """Base exception for event service errors."""
    pass


class ValidationError(EventServiceError):
    """Exception raised for validation errors."""
    pass


class NotFoundError(EventServiceError):
    """Exception raised when an event is not found."""
    pass


class EventService:
    """
    Service class for racing event business logic.
    
    Provides methods for creating, retrieving, updating, and deleting racing
    events with validation and error handling.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the service with a database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.repository = EventRepository(db)
    
    def create_event(self, racer_id: str, event_data: EventCreate) -> Event:
        """
        Create a new racing event with validation.
        
        Validates that event name is non-empty, date is valid, and location
        is non-empty before creating the event.
        
        Args:
            racer_id: UUID of the racer who owns this event
            event_data: Validated event data from Pydantic schema
            
        Returns:
            Event: The created racing event
            
        Raises:
            ValidationError: If validation fails with descriptive message
            
        Requirements:
            - 5.1: Reject empty event name
            - 5.2: Reject invalid date format
            - 5.3: Reject empty location
            - 5.4: Return descriptive error messages
            - 9.1: Display user-friendly error messages
            - 9.2: Indicate which fields caused failure
        """
        # Validate event name is non-empty
        # Note: Pydantic schema already validates min_length=1 and strips whitespace,
        # but we add explicit checks for clarity and additional validation
        if not event_data.event_name or not event_data.event_name.strip():
            raise ValidationError(
                "Event name cannot be empty"
            )
        
        # Validate location is non-empty
        if not event_data.location or not event_data.location.strip():
            raise ValidationError(
                "Location cannot be empty"
            )
        
        # Validate date is valid
        # Note: Pydantic schema already validates date format (YYYY-MM-DD),
        # but we add explicit check for additional validation
        if not isinstance(event_data.event_date, date):
            raise ValidationError(
                f"Invalid date format. Expected ISO format (YYYY-MM-DD)"
            )
        
        # Create event in database
        try:
            return self.repository.create(racer_id, event_data)
        except Exception as e:
            # Wrap database errors with descriptive message
            raise EventServiceError(
                f"Failed to create racing event: {str(e)}"
            ) from e
    
    def get_events(self, racer_id: str) -> List[Event]:
        """
        Retrieve all events for a racer, sorted by date.
        
        Events are returned in chronological order (earliest to latest)
        to help racers plan their racing season.
        
        Args:
            racer_id: UUID of the racer
            
        Returns:
            List[Event]: List of events associated with the racer,
                        ordered by event date (earliest first)
            
        Requirement: 4.2 - Retrieve and display all Racing_Events in chronological order
        """
        try:
            return self.repository.get_by_racer(racer_id)
        except Exception as e:
            raise EventServiceError(
                f"Failed to retrieve events: {str(e)}"
            ) from e
    
    def get_event(self, event_id: str) -> Event:
        """
        Retrieve a specific event by ID.
        
        Args:
            event_id: UUID of the event
            
        Returns:
            Event: The event
            
        Raises:
            NotFoundError: If event is not found with descriptive message
            
        Requirements:
            - 9.1: Display user-friendly error messages
            - 9.2: Indicate which resource caused failure
        """
        event = self.repository.get_by_id(event_id)
        if not event:
            raise NotFoundError(
                f"Racing event not found with id: {event_id}"
            )
        return event
    
    def update_event(self, event_id: str, event_data: EventUpdate) -> Event:
        """
        Update an existing racing event with validation.
        
        Validates that event name and location are non-empty (if provided)
        and date is valid before updating the event.
        
        Args:
            event_id: UUID of the event to update
            event_data: Validated update data (only provided fields will be updated)
            
        Returns:
            Event: The updated racing event
            
        Raises:
            NotFoundError: If event is not found
            ValidationError: If validation fails with descriptive message
            
        Requirements:
            - 5.1: Reject empty event name
            - 5.2: Reject invalid date format
            - 5.3: Reject empty location
            - 5.4: Return descriptive error messages
            - 9.1: Display user-friendly error messages
            - 9.2: Indicate which fields caused failure
        """
        # Check if event exists
        existing_event = self.repository.get_by_id(event_id)
        if not existing_event:
            raise NotFoundError(
                f"Racing event not found with id: {event_id}"
            )
        
        # Validate provided fields
        provided_fields = event_data.model_dump(exclude_unset=True)
        
        # Validate event name if provided
        if 'event_name' in provided_fields:
            event_name = provided_fields['event_name']
            if not event_name or not event_name.strip():
                raise ValidationError(
                    "Event name cannot be empty"
                )
        
        # Validate location if provided
        if 'location' in provided_fields:
            location = provided_fields['location']
            if not location or not location.strip():
                raise ValidationError(
                    "Location cannot be empty"
                )
        
        # Validate date if provided
        if 'event_date' in provided_fields:
            event_date = provided_fields['event_date']
            if not isinstance(event_date, date):
                raise ValidationError(
                    f"Invalid date format. Expected ISO format (YYYY-MM-DD)"
                )
        
        # Update event in database
        try:
            updated_event = self.repository.update(event_id, event_data)
            if not updated_event:
                # This shouldn't happen since we checked existence above,
                # but handle it just in case
                raise NotFoundError(
                    f"Racing event not found with id: {event_id}"
                )
            return updated_event
        except (ValidationError, NotFoundError):
            # Re-raise our custom exceptions
            raise
        except Exception as e:
            # Wrap database errors with descriptive message
            raise EventServiceError(
                f"Failed to update racing event: {str(e)}"
            ) from e
    
    def delete_event(self, event_id: str) -> None:
        """
        Delete a racing event.
        
        Args:
            event_id: UUID of the event to delete
            
        Raises:
            NotFoundError: If event is not found with descriptive message
            
        Requirements:
            - 9.1: Display user-friendly error messages
            - 9.2: Indicate which resource caused failure
        """
        success = self.repository.delete(event_id)
        if not success:
            raise NotFoundError(
                f"Racing event not found with id: {event_id}"
            )
    
    def validate_event_data(self, event_data: EventCreate | EventUpdate) -> None:
        """
        Validate racing event data.
        
        This method can be used to validate data without creating/updating
        an event in the database.
        
        Args:
            event_data: Event data to validate
            
        Raises:
            ValidationError: If validation fails with descriptive message
            
        Requirements:
            - 5.1: Reject empty event name
            - 5.2: Reject invalid date format
            - 5.3: Reject empty location
            - 5.4: Return descriptive error messages
        """
        # For EventCreate, validate all required fields
        if isinstance(event_data, EventCreate):
            # Validate event name
            if not event_data.event_name or not event_data.event_name.strip():
                raise ValidationError(
                    "Event name cannot be empty"
                )
            
            # Validate location
            if not event_data.location or not event_data.location.strip():
                raise ValidationError(
                    "Location cannot be empty"
                )
            
            # Validate date
            if not isinstance(event_data.event_date, date):
                raise ValidationError(
                    f"Invalid date format. Expected ISO format (YYYY-MM-DD)"
                )
        
        # For EventUpdate, validate only provided fields
        elif isinstance(event_data, EventUpdate):
            provided_fields = event_data.model_dump(exclude_unset=True)
            
            # Validate event name if provided
            if 'event_name' in provided_fields:
                event_name = provided_fields['event_name']
                if not event_name or not event_name.strip():
                    raise ValidationError(
                        "Event name cannot be empty"
                    )
            
            # Validate location if provided
            if 'location' in provided_fields:
                location = provided_fields['location']
                if not location or not location.strip():
                    raise ValidationError(
                        "Location cannot be empty"
                    )
            
            # Validate date if provided
            if 'event_date' in provided_fields:
                event_date = provided_fields['event_date']
                if not isinstance(event_date, date):
                    raise ValidationError(
                        f"Invalid date format. Expected ISO format (YYYY-MM-DD)"
                    )
