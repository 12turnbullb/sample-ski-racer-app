# Ski Racer Web App - Backend

FastAPI backend server for the ski racer web application.

## Features

- **RESTful API** for racer profiles, documents, and racing events
- **SQLite database** for data persistence
- **Automatic API documentation** (Swagger UI and ReDoc)
- **CORS support** for frontend communication
- **Comprehensive error handling** with descriptive messages
- **Type safety** with Pydantic schemas

## Requirements

- Python 3.8 or higher
- Virtual environment (recommended)

## Setup

1. **Create and activate virtual environment:**

```bash
# Create virtual environment
python -m venv venv

# Activate on macOS/Linux
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Initialize database:**

The database will be automatically initialized when you start the server for the first time. The SQLite database file will be created at `backend/data/ski_racer.db`.

## Running the Server

### Development Mode

Start the server with auto-reload enabled:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The server will be available at:
- API: http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### Production Mode

Start the server without auto-reload:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Racer Profiles

- `POST /api/racers` - Create new racer profile
- `GET /api/racers` - List all racer profiles
- `GET /api/racers/{id}` - Get racer profile by ID
- `PUT /api/racers/{id}` - Update racer profile
- `DELETE /api/racers/{id}` - Delete racer profile

### Documents

- `POST /api/racers/{id}/documents` - Upload document for racer
- `GET /api/racers/{id}/documents` - Get all documents for racer
- `GET /api/documents/{id}` - Get specific document
- `DELETE /api/documents/{id}` - Delete document

### Racing Events

- `POST /api/racers/{id}/events` - Create event for racer
- `GET /api/racers/{id}/events` - Get all events for racer (chronologically sorted)
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event

### Health Check

- `GET /` - Root health check endpoint
- `GET /api` - API information endpoint

## Testing

### Run All Tests

```bash
pytest
```

### Run Specific Test Files

```bash
# Unit tests
pytest tests/unit/test_main.py -v
pytest tests/unit/test_racer_routes.py -v
pytest tests/unit/test_document_routes.py -v
pytest tests/unit/test_event_routes.py -v

# Service tests
pytest tests/unit/test_racer_service.py -v
pytest tests/unit/test_document_service.py -v
pytest tests/unit/test_event_service.py -v
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

### Test Server Startup

```bash
python test_server_startup.py
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── routers/             # API route handlers
│   │   ├── racers.py
│   │   ├── documents.py
│   │   └── events.py
│   ├── services/            # Business logic
│   │   ├── racer_service.py
│   │   ├── document_service.py
│   │   └── event_service.py
│   └── repositories/        # Data access layer
│       ├── racer_repository.py
│       ├── document_repository.py
│       └── event_repository.py
├── tests/
│   └── unit/                # Unit tests
├── data/                    # SQLite database (auto-created)
├── uploads/                 # Uploaded documents (auto-created)
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Configuration

### CORS Settings

The application is configured to allow requests from:
- http://localhost:5173 (Vite default)
- http://localhost:3000 (React default)
- http://127.0.0.1:5173
- http://127.0.0.1:3000

To modify CORS settings, edit `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://your-frontend-url:port"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Database Location

The SQLite database is stored at `backend/data/ski_racer.db`. To change the location, edit `app/database.py`:

```python
DATABASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
```

### File Upload Settings

Document uploads are stored in `backend/uploads/`. Maximum file size is 10MB. Supported formats:
- PDF (.pdf)
- Word documents (.doc, .docx)
- Images (.jpg, .jpeg, .png)

To modify these settings, edit `app/services/document_service.py`.

## Error Handling

The API returns standardized error responses:

### Success (2xx)
- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST

### Client Errors (4xx)
- `400 Bad Request` - Validation error
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Invalid request format

### Server Errors (5xx)
- `500 Internal Server Error` - Unexpected server error

All errors include a `detail` field with a descriptive message.

## Development

### Adding New Endpoints

1. Create route handler in `app/routers/`
2. Create service logic in `app/services/`
3. Create repository methods in `app/repositories/`
4. Add tests in `tests/unit/`
5. Include router in `app/main.py`

### Database Migrations

For production use, consider using Alembic for database migrations:

```bash
pip install alembic
alembic init alembic
```

## Troubleshooting

### Database Locked Error

If you get a "database is locked" error, ensure:
- Only one server instance is running
- Close any database browser tools
- Check file permissions on the database file

### Import Errors

If you get import errors, ensure:
- Virtual environment is activated
- All dependencies are installed: `pip install -r requirements.txt`
- You're running commands from the `backend/` directory

### Port Already in Use

If port 8000 is already in use, specify a different port:

```bash
uvicorn app.main:app --reload --port 8001
```

## License

This project is part of the ski racer web application.
