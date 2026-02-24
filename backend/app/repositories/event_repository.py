"""
Event repository for database operations.

This module provides data access layer for racing events, implementing
CRUD operations (Create, Read, Update, Delete) for the Event model.

Requirements: 4.1, 4.2, 4.3, 4.4
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Event
from app.schemas import EventCreate, EventUpdate


class EventRepository:
    """
    Repository class for racing event database operations.
    
    Provides methods for creating, retrieving, updating, and deleting
    racing events in the database.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the repository with a database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def create(self, racer_id: str, event_data: EventCreate) -> Event:
        """
        Create a new racing event in the database.
        
        Args:
            racer_id: UUID of the racer who owns this event
            event_data: Validated event data
            
        Returns:
            Event: The created event with generated id and timestamps
            
        Requirement: 4.1 - Add Racing_Event to Database
        """
        # Create new Event instance from schema data
        db_event = Event(
            racer_id=racer_id,
            event_name=event_data.event_name,
            event_date=event_data.event_date,
            location=event_data.location,
            notes=event_data.notes
        )
        
        # Add to session and commit
        self.db.add(db_event)
        self.db.commit()
        self.db.refresh(db_event)
        
        return db_event
    
    def get_by_racer(self, racer_id: str) -> List[Event]:
        """
        Retrieve all events for a specific racer, sorted by date.
        
        Events are returned in chronological order (earliest to latest)
        to help racers plan their racing season.
        
        Args:
            racer_id: UUID of the racer
            
        Returns:
            List[Event]: List of events associated with the racer,
                        ordered by event date (earliest first)
            
        Requirement: 4.2 - Retrieve and display all Racing_Events in chronological order
        """
        return (
            self.db.query(Event)
            .filter(Event.racer_id == racer_id)
            .order_by(Event.event_date.asc())
            .all()
        )
    
    def get_by_id(self, event_id: str) -> Optional[Event]:
        """
        Retrieve a specific event by its ID.
        
        Args:
            event_id: UUID of the event
            
        Returns:
            Event: The event if found, None otherwise
            
        Requirement: 4.2 - Retrieve and display Racing_Events
        """
        return self.db.query(Event).filter(Event.id == event_id).first()
    
    def update(self, event_id: str, event_data: EventUpdate) -> Optional[Event]:
        """
        Update an existing racing event.
        
        Args:
            event_id: UUID of the event to update
            event_data: Validated update data (only provided fields will be updated)
            
        Returns:
            Event: The updated event if found, None otherwise
            
        Requirement: 4.3 - Modify existing Racing_Event in Database
        """
        # Get existing event
        db_event = self.get_by_id(event_id)
        if not db_event:
            return None
        
        # Update only provided fields
        update_data = event_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_event, field, value)
        
        # Commit changes
        self.db.commit()
        self.db.refresh(db_event)
        
        return db_event
    
    def delete(self, event_id: str) -> bool:
        """
        Delete a racing event from the database.
        
        Args:
            event_id: UUID of the event to delete
            
        Returns:
            bool: True if event was deleted, False if not found
            
        Requirement: 4.4 - Remove Racing_Event from Database
        """
        db_event = self.get_by_id(event_id)
        if not db_event:
            return False
        
        self.db.delete(db_event)
        self.db.commit()
        
        return True
