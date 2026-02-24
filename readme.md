# Beek Racing - Ski Racer Web App

A full-stack web application for ski racers to manage their profile, track racing events, and analyze ski run videos and images using AI.

## Overview

Beek Racing provides ski racers with a centralized platform to:

- Maintain a detailed **racer profile** (height, weight, ski types, binding measurements, personal records, goals)
- Upload and **analyze ski run videos and images** using AWS Bedrock AI
- Track **racing events** on an interactive calendar
- View an **overview dashboard** summarizing upcoming events and profile stats

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 5.9.x | Type safety |
| Vite | 7.x | Build tool & dev server |
| React Router | 7.x | Client-side routing |
| Tailwind CSS | 4.x | Styling |
| React Markdown | 10.x | Rendering AI analysis output |
| Vitest | 4.x | Unit testing |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.8+ | Runtime |
| FastAPI | 0.115.x | REST API framework |
| SQLAlchemy | 2.0.x | ORM / database access |
| SQLite | — | Local database |
| Pydantic | 2.9.x | Request/response validation |
| Uvicorn | 0.32.x | ASGI server |
| boto3 | latest | AWS Bedrock AI integration |

## Project Structure

```
sample-ski-racer-app/
├── readme.md                    # This file
├── AWS_MIGRATION_STRATEGY.md    # Guide for migrating to AWS
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS config
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/             # API route handlers
│   │   │   ├── racers.py
│   │   │   ├── documents.py
│   │   │   └── events.py
│   │   ├── services/            # Business logic
│   │   │   ├── racer_service.py
│   │   │   ├── document_service.py
│   │   │   └── event_service.py
│   │   └── repositories/        # Data access layer
│   │       ├── racer_repository.py
│   │       ├── document_repository.py
│   │       └── event_repository.py
│   ├── tests/unit/              # Backend unit tests (pytest)
│   ├── data/                    # SQLite database (auto-created)
│   ├── uploads/                 # Uploaded files (auto-created)
│   ├── requirements.txt
│   └── README.md                # Backend-specific setup docs
└── frontend/                    # React/TypeScript frontend
    ├── src/
    │   ├── App.tsx              # Root component & routing
    │   ├── components/          # UI components
    │   │   ├── Overview.tsx     # Home dashboard
    │   │   ├── ProfileForm.tsx  # Edit racer profile
    │   │   ├── ProfileView.tsx  # View racer profile
    │   │   ├── DocumentUploader.tsx
    │   │   ├── VideoAnalysisViewer.tsx
    │   │   ├── Calendar.tsx     # List view of events
    │   │   ├── CalendarGrid.tsx # Monthly grid view
    │   │   ├── EventForm.tsx    # Create/edit events
    │   │   ├── Toast.tsx        # Notification system
    │   │   ├── ConfirmDialog.tsx
    │   │   └── ErrorBoundary.tsx
    │   ├── services/
    │   │   └── api.ts           # API client (fetch wrapper)
    │   └── types/               # Shared TypeScript types
    ├── package.json
    └── README.md                # Frontend-specific Vite docs
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+

### 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Start the development server (auto-reloads on changes)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The SQLite database and uploads directory are created automatically on first run.

Backend URLs:
- API base: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at `http://localhost:5173` by default.

## Features

### Racer Profile
- Create and edit a single racer profile per browser session (stored in `localStorage`)
- Fields: name, height, weight, ski types, binding measurements, personal records, racing goals
- Profile persists across page reloads; a default profile is created automatically on first visit

### Video & Image Analysis (Analyze tab)
- Upload video files or images of ski runs
- Supported formats: PDF, Word (.doc/.docx), JPG/JPEG, PNG — max 10MB per file
- Files are sent to **AWS Bedrock** for AI-powered analysis
- Analysis results are displayed in formatted markdown

### Racing Events Calendar
- Create, edit, and delete racing events
- Two view modes: **monthly grid** and **chronological list**
- Events are sorted chronologically
- Confirm dialog before deletion to prevent accidents

### Overview Dashboard
- Summarizes the racer's profile and upcoming events
- Refreshes automatically when navigating back to the home page

## API Reference

### Racer Profiles

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/racers` | Create a racer profile |
| `GET` | `/api/racers` | List all racers |
| `GET` | `/api/racers/{id}` | Get a racer by ID |
| `PUT` | `/api/racers/{id}` | Update a racer |
| `DELETE` | `/api/racers/{id}` | Delete a racer |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/racers/{id}/documents` | Upload a document |
| `GET` | `/api/racers/{id}/documents` | List documents for a racer |
| `GET` | `/api/documents/{id}` | Get a document by ID |
| `DELETE` | `/api/documents/{id}` | Delete a document |

### Racing Events

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/racers/{id}/events` | Create an event |
| `GET` | `/api/racers/{id}/events` | List events for a racer |
| `PUT` | `/api/events/{id}` | Update an event |
| `DELETE` | `/api/events/{id}` | Delete an event |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root health check |
| `GET` | `/api` | API info |

All error responses include a `detail` field with a descriptive message. HTTP status codes follow standard conventions (200/201 for success, 400/404/422 for client errors, 500 for server errors).

## Running Tests

### Backend

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=html

# Run specific test files
pytest tests/unit/test_racer_routes.py -v
pytest tests/unit/test_document_routes.py -v
pytest tests/unit/test_event_routes.py -v
```

### Frontend

```bash
cd frontend

# Run tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Configuration

### CORS

The backend allows requests from these origins by default (edit `app/main.py` to change):

- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

### Frontend API URL

The frontend uses a `VITE_API_URL` environment variable to locate the backend. Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=http://127.0.0.1:8000
```

If not set, it defaults to `http://127.0.0.1:8000`.

### AWS Bedrock (AI Analysis)

The document/video analysis feature requires AWS credentials with Bedrock access. Set the standard AWS environment variables before starting the backend:

```bash
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_DEFAULT_REGION=us-east-1
```

## Deployment

For deploying to AWS, see [AWS_MIGRATION_STRATEGY.md](./AWS_MIGRATION_STRATEGY.md). It covers two recommended approaches:

- **Serverless** (API Gateway + Lambda + Aurora Serverless + S3 + Amplify) — best for variable traffic
- **Container-based** (ECS Fargate + RDS + S3 + Amplify) — best for consistent workloads

## Troubleshooting

**Backend won't start / import errors**
- Ensure the virtual environment is activated: `source venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`
- Run commands from inside the `backend/` directory

**"Database is locked" error**
- Only one backend instance can run at a time
- Close any SQLite browser tools that may have the file open

**Port already in use**
```bash
uvicorn app.main:app --reload --port 8001
```

**Frontend can't reach the backend**
- Confirm the backend is running on port 8000
- Check that `VITE_API_URL` points to the correct address
- Verify CORS origins in `app/main.py` include your frontend URL
