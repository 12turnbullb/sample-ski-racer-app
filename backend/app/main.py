"""
FastAPI main application for the ski racer web app.

This module creates and configures the FastAPI application with:
- All API routers (racers, documents, events)
- CORS middleware for frontend communication
- Error handling middleware
- Database initialization on startup
- Mangum handler for AWS Lambda deployment

Requirements: 6.1, 6.2, 6.3, 9.4
"""

import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    """Application lifespan manager — initializes DB on startup."""
    logger.info("Starting up application...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

    yield

    logger.info("Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title="Ski Racer Web App API",
    description="RESTful API for managing ski racer profiles, documents, and racing events",
    version="1.0.0",
    lifespan=lifespan
)


# Build allowed origins — always include localhost for dev, add CloudFront domain in prod
_allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

_cloudfront_domain = os.getenv("CLOUDFRONT_DOMAIN", "")
if _cloudfront_domain:
    _allowed_origins.append(f"https://{_cloudfront_domain}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )


# Include all routers
app.include_router(racers.router)
app.include_router(documents.router)
app.include_router(events.router)


# Mount local static files only when running outside Lambda (local dev)
if not os.getenv("LAMBDA_TASK_ROOT"):
    from fastapi.staticfiles import StaticFiles
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["health"])
async def root() -> dict:
    """Health check endpoint."""
    return {"message": "Ski Racer Web App API", "status": "running", "version": "1.0.0"}


@app.get("/api", tags=["health"])
async def api_info() -> dict:
    """API information endpoint."""
    return {
        "message": "Ski Racer Web App API",
        "version": "1.0.0",
        "endpoints": {
            "racers": "/api/racers - Manage racer profiles",
            "documents": "/api/racers/{id}/documents - Upload and manage documents",
            "events": "/api/racers/{id}/events - Manage racing events",
        },
    }


# Lambda handler — Mangum wraps FastAPI for API Gateway proxy integration
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None  # Not running in Lambda
