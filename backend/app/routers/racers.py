"""
Racer API routes.

This module implements RESTful API endpoints for racer profile CRUD operations
with proper HTTP status codes and error handling.

Requirements: 6.1, 6.4, 6.5, 6.6, 6.7
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import RacerCreate, RacerUpdate, RacerResponse
from app.services.racer_service import (
    RacerService,
    ValidationError as RacerValidationError,
    NotFoundError,
    RacerServiceError
)

router = APIRouter(prefix="/api/racers", tags=["racers"])


@router.post(
    "",
    response_model=RacerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new racer profile",
    responses={
        201: {"description": "Racer profile created successfully"},
        400: {"description": "Invalid input data - validation failed"},
        500: {"description": "Internal server error"}
    }
)
def create_racer(
    racer_data: RacerCreate,
    db: Session = Depends(get_db)
) -> RacerResponse:
    """
    Create a new racer profile.
    
    Creates a new racer profile with the provided data after validation.
    Returns 201 Created on success with the created profile.
    
    Args:
        racer_data: Racer profile data (validated by Pydantic)
        db: Database session (injected by FastAPI)
        
    Returns:
        RacerResponse: The created racer profile
        
    Raises:
        HTTPException 400: If validation fails (height <= 0, weight <= 0, empty fields)
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.1: RESTful endpoint for creating racer profiles
        - 6.4: Appropriate HTTP status codes
        - 6.5: Return 2xx status code on success (201 Created)
        - 6.6: Return 4xx status code on client error (400 Bad Request)
        - 6.7: Return 5xx status code on server error (500 Internal Server Error)
    """
    service = RacerService(db)
    
    try:
        racer = service.create_racer(racer_data)
        return RacerResponse.model_validate(racer)
    except RacerValidationError as e:
        # Client error - invalid input data
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RacerServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create racer profile"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get(
    "/{racer_id}",
    response_model=RacerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a racer profile by ID",
    responses={
        200: {"description": "Racer profile retrieved successfully"},
        404: {"description": "Racer profile not found"},
        500: {"description": "Internal server error"}
    }
)
def get_racer(
    racer_id: str,
    db: Session = Depends(get_db)
) -> RacerResponse:
    """
    Retrieve a racer profile by ID.
    
    Returns the racer profile with the specified ID.
    Returns 200 OK on success with the profile data.
    
    Args:
        racer_id: UUID of the racer profile
        db: Database session (injected by FastAPI)
        
    Returns:
        RacerResponse: The racer profile
        
    Raises:
        HTTPException 404: If racer profile is not found
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.1: RESTful endpoint for retrieving racer profiles
        - 6.4: Appropriate HTTP status codes
        - 6.5: Return 2xx status code on success (200 OK)
        - 6.6: Return 4xx status code on client error (404 Not Found)
        - 6.7: Return 5xx status code on server error (500 Internal Server Error)
    """
    service = RacerService(db)
    
    try:
        racer = service.get_racer(racer_id)
        return RacerResponse.model_validate(racer)
    except NotFoundError as e:
        # Client error - resource not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except RacerServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve racer profile"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.put(
    "/{racer_id}",
    response_model=RacerResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a racer profile",
    responses={
        200: {"description": "Racer profile updated successfully"},
        400: {"description": "Invalid input data - validation failed"},
        404: {"description": "Racer profile not found"},
        500: {"description": "Internal server error"}
    }
)
def update_racer(
    racer_id: str,
    racer_data: RacerUpdate,
    db: Session = Depends(get_db)
) -> RacerResponse:
    """
    Update an existing racer profile.
    
    Updates the racer profile with the specified ID using the provided data.
    Only provided fields will be updated (partial updates supported).
    Returns 200 OK on success with the updated profile.
    
    Args:
        racer_id: UUID of the racer profile to update
        racer_data: Update data (validated by Pydantic, only provided fields updated)
        db: Database session (injected by FastAPI)
        
    Returns:
        RacerResponse: The updated racer profile
        
    Raises:
        HTTPException 400: If validation fails (height <= 0, weight <= 0, empty fields)
        HTTPException 404: If racer profile is not found
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.1: RESTful endpoint for updating racer profiles
        - 6.4: Appropriate HTTP status codes
        - 6.5: Return 2xx status code on success (200 OK)
        - 6.6: Return 4xx status code on client error (400 Bad Request, 404 Not Found)
        - 6.7: Return 5xx status code on server error (500 Internal Server Error)
    """
    service = RacerService(db)
    
    try:
        racer = service.update_racer(racer_id, racer_data)
        return RacerResponse.model_validate(racer)
    except RacerValidationError as e:
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
    except RacerServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update racer profile"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.delete(
    "/{racer_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a racer profile",
    responses={
        200: {"description": "Racer profile deleted successfully"},
        404: {"description": "Racer profile not found"},
        500: {"description": "Internal server error"}
    }
)
def delete_racer(
    racer_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Delete a racer profile and all associated data.
    
    Deletes the racer profile with the specified ID along with all
    associated documents and events (cascade delete).
    Returns 200 OK on success with a confirmation message.
    
    Args:
        racer_id: UUID of the racer profile to delete
        db: Database session (injected by FastAPI)
        
    Returns:
        dict: Confirmation message
        
    Raises:
        HTTPException 404: If racer profile is not found
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.1: RESTful endpoint for deleting racer profiles
        - 6.4: Appropriate HTTP status codes
        - 6.5: Return 2xx status code on success (200 OK)
        - 6.6: Return 4xx status code on client error (404 Not Found)
        - 6.7: Return 5xx status code on server error (500 Internal Server Error)
    """
    service = RacerService(db)
    
    try:
        service.delete_racer(racer_id)
        return {"message": f"Racer profile {racer_id} deleted successfully"}
    except NotFoundError as e:
        # Client error - resource not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except RacerServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete racer profile"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get(
    "",
    response_model=List[RacerResponse],
    status_code=status.HTTP_200_OK,
    summary="List all racer profiles",
    responses={
        200: {"description": "List of racer profiles retrieved successfully"},
        500: {"description": "Internal server error"}
    }
)
def list_racers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[RacerResponse]:
    """
    List all racer profiles with pagination.
    
    Returns a list of all racer profiles with optional pagination.
    Returns 200 OK on success with the list of profiles.
    
    Args:
        skip: Number of records to skip (for pagination, default: 0)
        limit: Maximum number of records to return (default: 100)
        db: Database session (injected by FastAPI)
        
    Returns:
        List[RacerResponse]: List of racer profiles
        
    Raises:
        HTTPException 500: If database operation fails
        
    Requirements:
        - 6.1: RESTful endpoint for listing racer profiles
        - 6.4: Appropriate HTTP status codes
        - 6.5: Return 2xx status code on success (200 OK)
        - 6.7: Return 5xx status code on server error (500 Internal Server Error)
    """
    service = RacerService(db)
    
    try:
        racers = service.list_racers(skip=skip, limit=limit)
        return [RacerResponse.model_validate(racer) for racer in racers]
    except RacerServiceError as e:
        # Server error - database or other internal error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list racer profiles"
        )
    except Exception as e:
        # Unexpected server error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
