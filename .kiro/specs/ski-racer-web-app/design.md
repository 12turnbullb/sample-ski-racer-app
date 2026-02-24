# Design Document: Ski Racer Web App

## Overview

The ski racer web application is a full-stack web application consisting of a React/TypeScript frontend and a FastAPI Python backend with SQLite database. The application enables ski racers to manage their profiles, upload ski analysis documents, and maintain a racing calendar.

### Architecture Style

The application follows a client-server architecture with clear separation between frontend and backend:

- **Frontend**: Single-page application (SPA) built with React and TypeScript
- **Backend**: RESTful API server built with FastAPI
- **Database**: SQLite for local development and data persistence
- **Communication**: HTTP/JSON over REST API

### Key Design Decisions

1. **Separate Frontend/Backend**: Enables independent development, testing, and potential future deployment flexibility
2. **SQLite**: Lightweight, serverless database ideal for local development with zero configuration
3. **FastAPI**: Modern Python framework with automatic API documentation, type hints, and high performance
4. **TypeScript**: Type safety in frontend reduces runtime errors and improves developer experience
5. **Tailwind CSS**: Utility-first CSS framework for rapid UI development

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React Frontend (TypeScript)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │  │
│  │  │ Profile  │  │ Document │  │ Calendar         │    │  │
│  │  │ Manager  │  │ Uploader │  │ Manager          │    │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │  │
│  │         │              │               │              │  │
│  │         └──────────────┴───────────────┘              │  │
│  │                        │                               │  │
│  │                 ┌──────▼──────┐                        │  │
│  │                 │ API Client  │                        │  │
│  │                 └─────────────┘                        │  │
│  └───────────────────────│─────────────────────────────────┘  │
└────────────────────────────│─────────────────────────────────┘
                             │ HTTP/JSON
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    FastAPI Backend (Python)                   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                    API Routes                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │   │
│  │  │ /racers  │  │ /documents│ │ /events          │    │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │   │
│  └───────────────────────────────────────────────────────┘   │
│                             │                                 │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                  Business Logic                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │   │
│  │  │ Profile  │  │ Document │  │ Event            │    │   │
│  │  │ Service  │  │ Service  │  │ Service          │    │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │   │
│  └───────────────────────────────────────────────────────┘   │
│                             │                                 │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                  Data Access Layer                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │   │
│  │  │ Profile  │  │ Document │  │ Event            │    │   │
│  │  │ Repository│ │ Storage  │  │ Repository       │    │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │   │
│  └───────────────────────────────────────────────────────┘   │
│                             │                                 │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                SQLite Database                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │   │
│  │  │ racers   │  │ documents│  │ events           │    │   │
│  │  │ table    │  │ table    │  │ table            │    │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
ski-racer-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ProfileView.tsx
│   │   │   ├── DocumentUploader.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   ├── Calendar.tsx
│   │   │   └── EventForm.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── routers/
│   │   │   ├── racers.py
│   │   │   ├── documents.py
│   │   │   └── events.py
│   │   ├── services/
│   │   │   ├── racer_service.py
│   │   │   ├── document_service.py
│   │   │   └── event_service.py
│   │   └── repositories/
│   │       ├── racer_repository.py
│   │       ├── document_repository.py
│   │       └── event_repository.py
│   ├── requirements.txt
│   └── venv/
│
└── README.md
```

## Components and Interfaces

### Frontend Components

#### API Client Service

**Purpose**: Centralized HTTP client for all backend communication

**Interface**:
```typescript
interface ApiClient {
  // Racer Profile endpoints
  createRacer(profile: RacerProfile): Promise<RacerProfile>
  getRacer(id: string): Promise<RacerProfile>
  updateRacer(id: string, profile: RacerProfile): Promise<RacerProfile>
  deleteRacer(id: string): Promise<void>
  
  // Document endpoints
  uploadDocument(racerId: string, file: File): Promise<Document>
  getDocuments(racerId: string): Promise<Document[]>
  deleteDocument(id: string): Promise<void>
  
  // Event endpoints
  createEvent(event: RacingEvent): Promise<RacingEvent>
  getEvents(racerId: string): Promise<RacingEvent[]>
  updateEvent(id: string, event: RacingEvent): Promise<RacingEvent>
  deleteEvent(id: string): Promise<void>
}
```

#### Profile Manager Component

**Purpose**: UI for creating, viewing, updating, and deleting racer profiles

**Props**:
```typescript
interface ProfileManagerProps {
  racerId?: string
  onSave?: (profile: RacerProfile) => void
  onDelete?: () => void
}
```

#### Document Uploader Component

**Purpose**: UI for uploading and managing ski analysis documents

**Props**:
```typescript
interface DocumentUploaderProps {
  racerId: string
  onUploadComplete?: (document: Document) => void
}
```

#### Calendar Manager Component

**Purpose**: UI for displaying and managing racing events

**Props**:
```typescript
interface CalendarManagerProps {
  racerId: string
  events: RacingEvent[]
  onEventCreate?: (event: RacingEvent) => void
  onEventUpdate?: (event: RacingEvent) => void
  onEventDelete?: (eventId: string) => void
}
```

### Backend API Endpoints

#### Racer Profile Endpoints

```
POST   /api/racers              - Create new racer profile
GET    /api/racers/{id}         - Get racer profile by ID
PUT    /api/racers/{id}         - Update racer profile
DELETE /api/racers/{id}         - Delete racer profile
GET    /api/racers              - List all racer profiles
```

#### Document Endpoints

```
POST   /api/racers/{id}/documents     - Upload document for racer
GET    /api/racers/{id}/documents     - Get all documents for racer
GET    /api/documents/{id}            - Get specific document
DELETE /api/documents/{id}            - Delete document
```

#### Event Endpoints

```
POST   /api/racers/{id}/events   - Create event for racer
GET    /api/racers/{id}/events   - Get all events for racer
PUT    /api/events/{id}          - Update event
DELETE /api/events/{id}          - Delete event
```

### Backend Services

#### Racer Service

**Purpose**: Business logic for racer profile operations

**Interface**:
```python
class RacerService:
    def create_racer(self, racer_data: RacerCreate) -> Racer:
        """Create new racer profile with validation"""
        
    def get_racer(self, racer_id: str) -> Racer:
        """Retrieve racer profile by ID"""
        
    def update_racer(self, racer_id: str, racer_data: RacerUpdate) -> Racer:
        """Update existing racer profile with validation"""
        
    def delete_racer(self, racer_id: str) -> None:
        """Delete racer profile and associated data"""
        
    def validate_racer_data(self, racer_data: RacerCreate | RacerUpdate) -> None:
        """Validate racer profile data"""
```

#### Document Service

**Purpose**: Business logic for document upload and storage

**Interface**:
```python
class DocumentService:
    def upload_document(self, racer_id: str, file: UploadFile) -> Document:
        """Upload and store document file"""
        
    def get_documents(self, racer_id: str) -> List[Document]:
        """Retrieve all documents for a racer"""
        
    def get_document(self, document_id: str) -> Document:
        """Retrieve specific document"""
        
    def delete_document(self, document_id: str) -> None:
        """Delete document file and database record"""
        
    def validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file type and size"""
```

#### Event Service

**Purpose**: Business logic for racing event operations

**Interface**:
```python
class EventService:
    def create_event(self, racer_id: str, event_data: EventCreate) -> Event:
        """Create new racing event with validation"""
        
    def get_events(self, racer_id: str) -> List[Event]:
        """Retrieve all events for a racer, sorted by date"""
        
    def update_event(self, event_id: str, event_data: EventUpdate) -> Event:
        """Update existing event with validation"""
        
    def delete_event(self, event_id: str) -> None:
        """Delete racing event"""
        
    def validate_event_data(self, event_data: EventCreate | EventUpdate) -> None:
        """Validate event data"""
```

## Data Models

### Racer Profile

```python
class Racer(BaseModel):
    id: str                    # UUID
    height: float              # in centimeters
    weight: float              # in kilograms
    ski_types: str             # comma-separated list
    binding_measurements: str  # JSON string with measurements
    personal_records: str      # JSON string with PRs
    racing_goals: str          # text description
    created_at: datetime
    updated_at: datetime
```

**TypeScript equivalent**:
```typescript
interface RacerProfile {
  id: string
  height: number
  weight: number
  skiTypes: string[]
  bindingMeasurements: {
    [key: string]: number
  }
  personalRecords: {
    event: string
    time: string
    date: string
  }[]
  racingGoals: string
  createdAt: string
  updatedAt: string
}
```

### Document

```python
class Document(BaseModel):
    id: str              # UUID
    racer_id: str        # Foreign key to Racer
    filename: str        # Original filename
    file_path: str       # Path to stored file
    file_type: str       # MIME type
    file_size: int       # Size in bytes
    uploaded_at: datetime
```

**TypeScript equivalent**:
```typescript
interface Document {
  id: string
  racerId: string
  filename: string
  filePath: string
  fileType: string
  fileSize: number
  uploadedAt: string
}
```

### Racing Event

```python
class Event(BaseModel):
    id: str              # UUID
    racer_id: str        # Foreign key to Racer
    event_name: str      # Name of the race
    event_date: date     # Date of the race
    location: str        # Race location
    notes: str           # Optional notes
    created_at: datetime
    updated_at: datetime
```

**TypeScript equivalent**:
```typescript
interface RacingEvent {
  id: string
  racerId: string
  eventName: string
  eventDate: string
  location: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Database Schema

```sql
CREATE TABLE racers (
    id TEXT PRIMARY KEY,
    height REAL NOT NULL,
    weight REAL NOT NULL,
    ski_types TEXT NOT NULL,
    binding_measurements TEXT NOT NULL,
    personal_records TEXT NOT NULL,
    racing_goals TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    racer_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (racer_id) REFERENCES racers(id) ON DELETE CASCADE
);

CREATE TABLE events (
    id TEXT PRIMARY KEY,
    racer_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (racer_id) REFERENCES racers(id) ON DELETE CASCADE
);

CREATE INDEX idx_documents_racer_id ON documents(racer_id);
CREATE INDEX idx_events_racer_id ON events(racer_id);
CREATE INDEX idx_events_date ON events(event_date);
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Profile Creation and Retrieval Round-Trip

*For any* valid racer profile data, creating a profile and then retrieving it should return equivalent profile data with all fields preserved.

**Validates: Requirements 1.1, 1.2**

### Property 2: Profile Update Persistence

*For any* existing racer profile and any valid update data, updating the profile should result in the database containing the new values when subsequently retrieved.

**Validates: Requirements 1.3**

### Property 3: Profile Deletion Completeness

*For any* existing racer profile, deleting the profile should result in the profile no longer being retrievable and all associated documents and events also being removed.

**Validates: Requirements 1.4**

### Property 4: Profile Validation Rejection

*For any* invalid racer profile data (height ≤ 0, weight ≤ 0, or missing required fields), the system should reject the creation or update request and return a descriptive error message indicating the specific validation failure.

**Validates: Requirements 1.5, 2.1, 2.2, 2.3, 2.4**

### Property 5: Profile Structure Completeness

*For any* successfully created racer profile, the profile should contain all required fields: height, weight, ski types, binding measurements, personal records, and racing goals.

**Validates: Requirements 1.6**

### Property 6: Document Upload and Retrieval Round-Trip

*For any* valid document file uploaded for a racer, retrieving the racer's documents should include that document with the same filename, file type, and file size.

**Validates: Requirements 3.1, 3.2**

### Property 7: Document Deletion Completeness

*For any* uploaded document, deleting the document should result in it no longer appearing in the racer's document list and the file being removed from storage.

**Validates: Requirements 3.5**

### Property 8: Document Upload Error Handling

*For any* invalid document upload (unsupported file type, file too large, or missing file), the system should reject the upload and return a descriptive error message.

**Validates: Requirements 3.3**

### Property 9: Event Creation and Retrieval Round-Trip

*For any* valid racing event data, creating an event and then retrieving the racer's events should include that event with all fields preserved.

**Validates: Requirements 4.1, 4.2**

### Property 10: Event Chronological Ordering

*For any* set of racing events for a racer, retrieving the events should return them sorted in chronological order by event date (earliest to latest).

**Validates: Requirements 4.2**

### Property 11: Event Update Persistence

*For any* existing racing event and any valid update data, updating the event should result in the database containing the new values when subsequently retrieved.

**Validates: Requirements 4.3**

### Property 12: Event Deletion Completeness

*For any* existing racing event, deleting the event should result in it no longer appearing in the racer's event list.

**Validates: Requirements 4.4**

### Property 13: Event Structure Completeness

*For any* successfully created racing event, the event should contain all required fields: event name, date, location, and optional notes field.

**Validates: Requirements 4.5**

### Property 14: Event Validation Rejection

*For any* invalid racing event data (empty event name, invalid date format, or empty location), the system should reject the creation or update request and return a descriptive error message.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 15: HTTP Status Code Correctness

*For any* API operation, successful operations should return 2xx status codes, client errors should return 4xx status codes, and server errors should return 5xx status codes.

**Validates: Requirements 6.4, 6.5, 6.6, 6.7**

### Property 16: Data Persistence Across Sessions

*For any* data (racer profiles, documents, or events) stored in the system, restarting the backend should not result in data loss—all previously stored data should remain retrievable.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 17: Error Message Descriptiveness

*For any* operation that fails, the system should return a non-empty error message that describes the specific failure and distinguishes between client errors (validation, not found) and server errors (database, file system).

**Validates: Requirements 9.1, 9.2, 9.4**

## Error Handling

### Validation Errors

**Profile Validation**:
- Height must be greater than 0
- Weight must be greater than 0
- All required fields must be non-empty
- Return 400 Bad Request with specific field errors

**Event Validation**:
- Event name must be non-empty
- Date must be valid ISO format (YYYY-MM-DD)
- Location must be non-empty
- Return 400 Bad Request with specific field errors

**Document Validation**:
- File must be present
- File type must be in allowed list: PDF, DOC, DOCX, JPG, JPEG, PNG
- File size must be under 10MB
- Return 400 Bad Request with specific error

### Not Found Errors

- Racer ID not found: 404 Not Found
- Document ID not found: 404 Not Found
- Event ID not found: 404 Not Found
- Include resource type and ID in error message

### Server Errors

- Database connection failures: 500 Internal Server Error
- File system errors: 500 Internal Server Error
- Unexpected exceptions: 500 Internal Server Error
- Log full error details server-side
- Return generic error message to client (don't expose internals)

### Frontend Error Handling

- Display user-friendly error messages in UI
- Show validation errors inline on forms
- Show toast/notification for operation failures
- Distinguish between network errors and API errors
- Provide retry options for network failures

## Testing Strategy

### Dual Testing Approach

The application will use both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**:
- **Backend (Python)**: Use `hypothesis` library for property-based testing
- **Frontend (TypeScript)**: Use `fast-check` library for property-based testing

**Test Configuration**:
- Each property test must run minimum 100 iterations
- Each test must include a comment tag referencing the design property
- Tag format: `# Feature: ski-racer-web-app, Property {number}: {property_text}`

**Property Test Implementation**:
- Each correctness property listed above must be implemented as a single property-based test
- Tests should generate random valid inputs using the testing library's generators
- Tests should verify the property holds for all generated inputs

### Backend Testing

**Unit Tests**:
- Test specific validation scenarios (zero height, negative weight, empty fields)
- Test error handling for database failures
- Test file upload with specific file types
- Test API endpoint responses with known inputs
- Use `pytest` as the testing framework

**Property Tests**:
- Generate random valid racer profiles and test CRUD operations
- Generate random valid events and test chronological ordering
- Generate random invalid inputs and verify rejection
- Generate random file uploads and test storage/retrieval
- Test persistence by creating data, simulating restart, and verifying data exists

**Integration Tests**:
- Test full API request/response cycles
- Test database transactions and rollbacks
- Test file system operations
- Use `pytest` with `httpx` for API testing

### Frontend Testing

**Unit Tests**:
- Test component rendering with specific props
- Test form validation with known invalid inputs
- Test API client error handling
- Test state management
- Use `vitest` and `@testing-library/react`

**Property Tests**:
- Generate random profile data and test form submission
- Generate random events and test calendar display
- Test API client with various response scenarios
- Verify UI state consistency across operations

**End-to-End Tests**:
- Test complete user workflows (create profile, upload document, add event)
- Test error scenarios (network failures, validation errors)
- Use `playwright` or `cypress` for E2E testing

### Test Organization

**Backend**:
```
backend/
├── tests/
│   ├── unit/
│   │   ├── test_racer_service.py
│   │   ├── test_document_service.py
│   │   └── test_event_service.py
│   ├── property/
│   │   ├── test_racer_properties.py
│   │   ├── test_document_properties.py
│   │   └── test_event_properties.py
│   └── integration/
│       ├── test_racer_api.py
│       ├── test_document_api.py
│       └── test_event_api.py
```

**Frontend**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── ProfileForm.test.tsx
│   │   │   ├── DocumentUploader.test.tsx
│   │   │   └── Calendar.test.tsx
│   │   └── __property_tests__/
│   │       ├── ProfileForm.property.test.ts
│   │       └── Calendar.property.test.ts
```

### Testing Priorities

1. **Critical Path**: Profile CRUD, Document upload/retrieval, Event CRUD
2. **Data Integrity**: Validation, persistence, deletion cascades
3. **Error Handling**: All error scenarios return appropriate messages
4. **API Contracts**: All endpoints follow RESTful conventions
5. **UI Responsiveness**: Forms validate, errors display, loading states work

### Continuous Testing

- Run unit tests on every code change
- Run property tests before commits
- Run integration tests before merging to main
- Run E2E tests before releases
- Maintain minimum 80% code coverage for backend
- Maintain minimum 70% code coverage for frontend
