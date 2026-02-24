"""
Event API routes.

This module implements RESTful API endpoints for racing event CRUD operations
with proper HTTP status codes and error handling.

Requirements: 6.3, 6.4
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import EventCreate, EventUpdate, EventResponse
from app.services.event_service import (
    EventService,
    ValidationError as EventValidationError,
    NotFoundError,
    EventServiceError
)

router = APIRouter(prefix="/api", tags=["events"])


@router.post(
    "/racers/{racer_id}/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new racing event for a racer",
    responses={
        201: {"description": "Racing event created successfully"},
        400: {"description": "Invalid input data - validation failed"},
        500: {"description": "Internal server error"}
    }
)
def create_event(
    racer_id: str,
    event_data: EventCreate,
    db: Session = Depends(get_db)
) -> EventResponse:
    """
    Create a new racing event for a racer.
    
    Creates a new racing event with the provided data after validation.
    Returns 201 Created on success with the created event.
    
    Args:
        racer_id: UUID of the racer who owns this event
        event_data: Event data (validated by Pydantic)
        db: Database session (injected by FastAPI)
        
    Returns:
        EventResponse: The created racing event
        
    Raises:
        HTTPException 400: If validation fails (empty name, invalid date, empty location)
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.3: RESTful endpoint for creating racing events
        - 6.4: Appropriate HTTP status codes
    """
    service = EventService(db)
    
    try:
        event = service.create_event(racer_id, event_data)
        return EventResponse.model_validate(event)
    except EventValidationError as e:
        # Client error - invalid input data
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except EventServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create racing event"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get(
    "/racers/{racer_id}/events",
    response_model=List[EventResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all events for a racer",
    responses={
        200: {"description": "Events retrieved successfully"},
        500: {"description": "Internal server error"}
    }
)
def get_racer_events(
    racer_id: str,
    db: Session = Depends(get_db)
) -> List[EventResponse]:
    """
    Retrieve all events for a specific racer.
    
    Returns a list of all racing events associated with the racer,
    ordered chronologically by event date (earliest first).
    Returns 200 OK on success.
    
    Args:
        racer_id: UUID of the racer
        db: Database session (injected by FastAPI)
        
    Returns:
        List[EventResponse]: List of racing events in chronological order
        
    Raises:
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.3: RESTful endpoint for retrieving racing events
        - 6.4: Appropriate HTTP status codes
    """
    service = EventService(db)
    
    try:
        events = service.get_events(racer_id)
        return [EventResponse.model_validate(event) for event in events]
    except EventServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve events"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.put(
    "/events/{event_id}",
    response_model=EventResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a racing event",
    responses={
        200: {"description": "Racing event updated successfully"},
        400: {"description": "Invalid input data - validation failed"},
        404: {"description": "Racing event not found"},
        500: {"description": "Internal server error"}
    }
)
def update_event(
    event_id: str,
    event_data: EventUpdate,
    db: Session = Depends(get_db)
) -> EventResponse:
    """
    Update an existing racing event.
    
    Updates the racing event with the specified ID using the provided data.
    Only provided fields will be updated (partial updates supported).
    Returns 200 OK on success with the updated event.
    
    Args:
        event_id: UUID of the racing event to update
        event_data: Update data (validated by Pydantic, only provided fields updated)
        db: Database session (injected by FastAPI)
        
    Returns:
        EventResponse: The updated racing event
        
    Raises:
        HTTPException 400: If validation fails (empty name, invalid date, empty location)
        HTTPException 404: If racing event is not found
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.3: RESTful endpoint for updating racing events
        - 6.4: Appropriate HTTP status codes
    """
    service = EventService(db)
    
    try:
        event = service.update_event(event_id, event_data)
        return EventResponse.model_validate(event)
    except EventValidationError as e:
        # Client error - invalid input data
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except NotFoundError as e:
        # Client error - resource not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except EventServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update racing event"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.delete(
    "/events/{event_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a racing event",
    responses={
        200: {"description": "Racing event deleted successfully"},
        404: {"description": "Racing event not found"},
        500: {"description": "Internal server error"}
    }
)
def delete_event(
    event_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Delete a racing event.
    
    Deletes the racing event with the specified ID.
    Returns 200 OK on success with a confirmation message.
    
    Args:
        event_id: UUID of the racing event to delete
        db: Database session (injected by FastAPI)
        
    Returns:
        dict: Confirmation message
        
    Raises:
        HTTPException 404: If racing event is not found
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.3: RESTful endpoint for deleting racing events
        - 6.4: Appropriate HTTP status codes
    """
    service = EventService(db)
    
    try:
        service.delete_event(event_id)
        return {"message": f"Racing event {event_id} deleted successfully"}
    except NotFoundError as e:
        # Client error - resource not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except EventServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete racing event"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
