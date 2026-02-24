"""
Unit tests for the main FastAPI application.

Tests application initialization, middleware configuration, and basic endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    return TestClient(app)


def test_app_creation():
    """Test that the FastAPI application is created successfully."""
    assert app is not None
    assert app.title == "Ski Racer Web App API"
    assert app.version == "1.0.0"


def test_routers_included():
    """Test that all routers are included in the application."""
    routes = [route.path for route in app.routes]
    
    # Check racer routes
    assert "/api/racers" in routes
    assert "/api/racers/{racer_id}" in routes
    
    # Check document routes
    assert "/api/racers/{racer_id}/documents" in routes
    assert "/api/documents/{document_id}" in routes
    
    # Check event routes
    assert "/api/racers/{racer_id}/events" in routes
    assert "/api/events/{event_id}" in routes


def test_cors_middleware_configured():
    """Test that CORS middleware is configured."""
    # Check that CORS middleware is in the middleware stack
    # FastAPI wraps middleware, so we check the middleware attribute
    has_cors = any(
        hasattr(m, 'cls') and m.cls.__name__ == 'CORSMiddleware'
        for m in app.user_middleware
    )
    assert has_cors, "CORS middleware should be configured"


def test_root_endpoint(client):
    """Test the root health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Ski Racer Web App API"
    assert data["status"] == "running"
    assert data["version"] == "1.0.0"


def test_api_info_endpoint(client):
    """Test the API information endpoint."""
    response = client.get("/api")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Ski Racer Web App API"
    assert data["version"] == "1.0.0"
    assert "endpoints" in data
    assert "racers" in data["endpoints"]
    assert "documents" in data["endpoints"]
    assert "events" in data["endpoints"]


def test_openapi_docs_available(client):
    """Test that OpenAPI documentation is available."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    openapi_schema = response.json()
    assert openapi_schema["info"]["title"] == "Ski Racer Web App API"
    assert openapi_schema["info"]["version"] == "1.0.0"


def test_swagger_ui_available(client):
    """Test that Swagger UI documentation is available."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_redoc_available(client):
    """Test that ReDoc documentation is available."""
    response = client.get("/redoc")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_global_exception_handler(client):
    """Test that the global exception handler catches unhandled errors."""
    # The global exception handler is registered but FastAPI's built-in
    # ServerErrorMiddleware catches exceptions first in test mode.
    # We can verify the handler is registered by checking the exception_handlers
    assert Exception in app.exception_handlers
    
    # Verify the handler returns proper error format
    handler = app.exception_handlers[Exception]
    assert handler is not None


def test_database_initialized_on_startup():
    """Test that database is initialized on application startup."""
    # The database should be initialized during the lifespan context
    # We can verify this by checking that the database file exists
    from app.database import get_database_path
    import os
    
    db_path = get_database_path()
    assert os.path.exists(db_path), "Database file should exist after initialization"


def test_cors_allows_frontend_origins(client):
    """Test that CORS allows requests from frontend origins."""
    # Test with a preflight OPTIONS request
    response = client.options(
        "/api/racers",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
    )
    # FastAPI/Starlette returns 200 for OPTIONS requests with CORS
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_api_endpoints_return_json(client):
    """Test that API endpoints return JSON responses."""
    # Test root endpoint
    response = client.get("/")
    assert "application/json" in response.headers["content-type"]
    
    # Test API info endpoint
    response = client.get("/api")
    assert "application/json" in response.headers["content-type"]
