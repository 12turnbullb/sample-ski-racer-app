"""
FastAPI main application for the ski racer web app.

This module creates and configures the FastAPI application with:
- All API routers (racers, documents, events)
- CORS middleware for frontend communication
- Static file serving for uploaded media
- Error handling middleware
- Database initialization on startup

Requirements: 6.1, 6.2, 6.3, 9.4
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
import logging
from dotenv import load_dotenv

load_dotenv()

from app.database import init_db
from app.routers import racers, documents, events

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events for the FastAPI application.
    On startup, initializes the database by creating all tables.
    
    Args:
        app: FastAPI application instance
        
    Yields:
        None: Control to the application
        
    Requirements:
        - 7.1, 7.2, 7.3, 7.4: Initialize database on startup for data persistence
    """
    # Startup: Initialize database
    logger.info("Starting up application...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    yield
    
    # Shutdown: Cleanup if needed
    logger.info("Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title="Ski Racer Web App API",
    description="RESTful API for managing ski racer profiles, documents, and racing events",
    version="1.0.0",
    lifespan=lifespan
)


# Configure CORS middleware for frontend communication
# This allows the React frontend to make requests to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default dev server
        "http://localhost:3000",  # Alternative React dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)


# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for unhandled errors.
    
    Catches any unhandled exceptions and returns a standardized error response
    with a 500 Internal Server Error status code. Logs the full error details
    server-side but returns a generic message to the client.
    
    Args:
        request: The incoming request that caused the error
        exc: The exception that was raised
        
    Returns:
        JSONResponse: Standardized error response
        
    Requirements:
        - 6.7: Return 5xx status code on server error
        - 9.4: Distinguish between client errors and server errors
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred. Please try again later."
        }
    )


# Include all routers
app.include_router(racers.router)
app.include_router(documents.router)
app.include_router(events.router)


# Mount static files for uploaded media
# This allows the frontend to access uploaded images and videos
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Root endpoint for health check
@app.get(
    "/",
    tags=["health"],
    summary="Health check endpoint",
    responses={
        200: {"description": "API is running"}
    }
)
async def root() -> dict:
    """
    Root endpoint for health check.
    
    Returns a simple message indicating the API is running.
    Useful for monitoring and verifying the backend is accessible.
    
    Returns:
        dict: Status message
    """
    return {
        "message": "Ski Racer Web App API",
        "status": "running",
        "version": "1.0.0"
    }


# API info endpoint
@app.get(
    "/api",
    tags=["health"],
    summary="API information endpoint",
    responses={
        200: {"description": "API information"}
    }
)
async def api_info() -> dict:
    """
    API information endpoint.
    
    Returns information about available API endpoints and their purposes.
    
    Returns:
        dict: API information
    """
    return {
        "message": "Ski Racer Web App API",
        "version": "1.0.0",
        "endpoints": {
            "racers": "/api/racers - Manage racer profiles",
            "documents": "/api/racers/{id}/documents - Upload and manage documents",
            "events": "/api/racers/{id}/events - Manage racing events"
        },
        "docs": "/docs - Interactive API documentation (Swagger UI)",
        "redoc": "/redoc - Alternative API documentation (ReDoc)"
    }
