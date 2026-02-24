# Implementation Plan: Ski Racer Web App

## Overview

This implementation plan breaks down the ski racer web application into incremental coding tasks. The application consists of a FastAPI Python backend with SQLite database and a React/TypeScript frontend with Tailwind CSS. Tasks are organized to build core functionality first, then add features incrementally with testing at each step.

## Tasks

- [x] 1. Set up project structure and development environment
  - Create `backend/` and `frontend/` directories
  - Initialize Python virtual environment in `backend/`
  - Create `backend/requirements.txt` with FastAPI, SQLAlchemy, uvicorn, pytest, hypothesis
  - Initialize React TypeScript project in `frontend/` with Vite
  - Configure Tailwind CSS in frontend
  - Create basic directory structure for both backend and frontend
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2. Implement backend database models and connection
  - [x] 2.1 Create SQLite database configuration and connection
    - Write `backend/app/database.py` with SQLAlchemy setup
    - Configure SQLite database file location
    - Create database session management
    - _Requirements: 7.1, 7.2, 7.3, 8.2_
  
  - [x] 2.2 Define SQLAlchemy models for racers, documents, and events
    - Write `backend/app/models.py` with Racer, Document, and Event models
    - Define relationships and foreign keys
    - Add timestamps and UUID primary keys
    - _Requirements: 1.6, 3.1, 4.5_
  
  - [x] 2.3 Create Pydantic schemas for request/response validation
    - Write `backend/app/schemas.py` with RacerCreate, RacerUpdate, RacerResponse schemas
    - Add DocumentResponse, EventCreate, EventUpdate, EventResponse schemas
    - Include field validation rules
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_

- [ ] 3. Implement racer profile backend logic
  - [x] 3.1 Create racer repository for database operations
    - Write `backend/app/repositories/racer_repository.py`
    - Implement create, get, update, delete, and list methods
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.2 Create racer service with business logic and validation
    - Write `backend/app/services/racer_service.py`
    - Implement validation for height > 0, weight > 0, required fields
    - Add error handling with descriptive messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2_
  
  - [x] 3.3 Create racer API routes
    - Write `backend/app/routers/racers.py`
    - Implement POST /api/racers, GET /api/racers/{id}, PUT /api/racers/{id}, DELETE /api/racers/{id}
    - Add proper HTTP status codes (200, 201, 400, 404, 500)
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 3.4 Write property test for profile CRUD round-trip
    - **Property 1: Profile Creation and Retrieval Round-Trip**
    - **Validates: Requirements 1.1, 1.2**
    - Use hypothesis to generate random valid profile data
    - Test create then retrieve returns equivalent data
  
  - [ ]* 3.5 Write property test for profile update persistence
    - **Property 2: Profile Update Persistence**
    - **Validates: Requirements 1.3**
    - Generate random profiles and random updates
    - Verify updates persist correctly
  
  - [ ]* 3.6 Write property test for profile deletion
    - **Property 3: Profile Deletion Completeness**
    - **Validates: Requirements 1.4**
    - Create profile, delete it, verify it's gone
  
  - [ ]* 3.7 Write property test for profile validation rejection
    - **Property 4: Profile Validation Rejection**
    - **Validates: Requirements 1.5, 2.1, 2.2, 2.3, 2.4**
    - Generate invalid profiles (height ≤ 0, weight ≤ 0, missing fields)
    - Verify rejection with descriptive errors
  
  - [ ]* 3.8 Write unit tests for racer service edge cases
    - Test specific validation scenarios
    - Test error handling for database failures
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2_

- [x] 4. Checkpoint - Ensure racer profile tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement document upload backend logic
  - [x] 5.1 Create document repository for database operations
    - Write `backend/app/repositories/document_repository.py`
    - Implement create, get by racer, get by id, delete methods
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 5.2 Create document service with file storage logic
    - Write `backend/app/services/document_service.py`
    - Implement file upload to disk with unique filenames
    - Add file type validation (PDF, DOC, DOCX, JPG, JPEG, PNG)
    - Add file size validation (max 10MB)
    - Implement file deletion from disk
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 7.2_
  
  - [x] 5.3 Create document API routes
    - Write `backend/app/routers/documents.py`
    - Implement POST /api/racers/{id}/documents, GET /api/racers/{id}/documents
    - Implement GET /api/documents/{id}, DELETE /api/documents/{id}
    - Handle multipart/form-data for file uploads
    - _Requirements: 6.2, 6.4_
  
  - [ ]* 5.4 Write property test for document upload and retrieval
    - **Property 6: Document Upload and Retrieval Round-Trip**
    - **Validates: Requirements 3.1, 3.2**
    - Generate random valid files
    - Test upload then retrieve returns same document metadata
  
  - [ ]* 5.5 Write property test for document deletion
    - **Property 7: Document Deletion Completeness**
    - **Validates: Requirements 3.5**
    - Upload document, delete it, verify it's gone from list and disk
  
  - [ ]* 5.6 Write property test for document upload error handling
    - **Property 8: Document Upload Error Handling**
    - **Validates: Requirements 3.3**
    - Test invalid file types, oversized files
    - Verify descriptive error messages
  
  - [ ]* 5.7 Write unit tests for document service
    - Test specific file types (PDF, DOC, DOCX, images)
    - Test file storage and retrieval
    - _Requirements: 3.4, 7.2_

- [x] 6. Checkpoint - Ensure document upload tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement racing event backend logic
  - [x] 7.1 Create event repository for database operations
    - Write `backend/app/repositories/event_repository.py`
    - Implement create, get by racer (sorted by date), get by id, update, delete methods
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 7.2 Create event service with business logic and validation
    - Write `backend/app/services/event_service.py`
    - Implement validation for non-empty name, valid date, non-empty location
    - Add error handling with descriptive messages
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 9.1, 9.2_
  
  - [x] 7.3 Create event API routes
    - Write `backend/app/routers/events.py`
    - Implement POST /api/racers/{id}/events, GET /api/racers/{id}/events
    - Implement PUT /api/events/{id}, DELETE /api/events/{id}
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 7.4 Write property test for event CRUD round-trip
    - **Property 9: Event Creation and Retrieval Round-Trip**
    - **Validates: Requirements 4.1, 4.2**
    - Generate random valid events
    - Test create then retrieve returns equivalent data
  
  - [ ]* 7.5 Write property test for event chronological ordering
    - **Property 10: Event Chronological Ordering**
    - **Validates: Requirements 4.2**
    - Create multiple events with random dates
    - Verify retrieval returns them sorted chronologically
  
  - [ ]* 7.6 Write property test for event update persistence
    - **Property 11: Event Update Persistence**
    - **Validates: Requirements 4.3**
    - Generate random events and random updates
    - Verify updates persist correctly
  
  - [ ]* 7.7 Write property test for event deletion
    - **Property 12: Event Deletion Completeness**
    - **Validates: Requirements 4.4**
    - Create event, delete it, verify it's gone
  
  - [ ]* 7.8 Write property test for event validation rejection
    - **Property 14: Event Validation Rejection**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - Generate invalid events (empty name, invalid date, empty location)
    - Verify rejection with descriptive errors
  
  - [ ]* 7.9 Write unit tests for event service edge cases
    - Test specific date formats
    - Test chronological ordering with edge cases
    - _Requirements: 5.2, 4.2_

- [x] 8. Checkpoint - Ensure event management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Wire up backend main application
  - [x] 9.1 Create FastAPI application with all routers
    - Write `backend/app/main.py`
    - Include all routers (racers, documents, events)
    - Add CORS middleware for frontend communication
    - Add error handling middleware
    - Initialize database on startup
    - _Requirements: 6.1, 6.2, 6.3, 9.4_
  
  - [ ]* 9.2 Write property test for HTTP status code correctness
    - **Property 15: HTTP Status Code Correctness**
    - **Validates: Requirements 6.4, 6.5, 6.6, 6.7**
    - Test successful operations return 2xx
    - Test client errors return 4xx
    - Test server errors return 5xx
  
  - [ ]* 9.3 Write property test for data persistence across sessions
    - **Property 16: Data Persistence Across Sessions**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - Create data, simulate backend restart, verify data persists
  
  - [ ]* 9.4 Write property test for error message descriptiveness
    - **Property 17: Error Message Descriptiveness**
    - **Validates: Requirements 9.1, 9.2, 9.4**
    - Generate various error scenarios
    - Verify error messages are descriptive and categorized correctly

- [ ] 10. Implement frontend TypeScript types and API client
  - [x] 10.1 Define TypeScript interfaces for data models
    - Write `frontend/src/types/index.ts`
    - Define RacerProfile, Document, RacingEvent interfaces
    - Match backend schema structure
    - _Requirements: 1.6, 3.1, 4.5_
  
  - [x] 10.2 Create API client service
    - Write `frontend/src/services/api.ts`
    - Implement all API methods using fetch or axios
    - Add error handling and response parsing
    - Include proper headers and content types
    - _Requirements: 6.1, 6.2, 6.3, 9.3_
  
  - [ ]* 10.3 Write unit tests for API client error handling
    - Test network error handling
    - Test API error response parsing
    - _Requirements: 9.3_

- [ ] 11. Implement racer profile frontend components
  - [x] 11.1 Create ProfileForm component
    - Write `frontend/src/components/ProfileForm.tsx`
    - Add form fields for height, weight, ski types, binding measurements, PRs, goals
    - Implement client-side validation
    - Handle form submission and errors
    - _Requirements: 10.1, 10.5_
  
  - [x] 11.2 Create ProfileView component
    - Write `frontend/src/components/ProfileView.tsx`
    - Display racer profile data
    - Add edit and delete buttons
    - _Requirements: 10.1, 10.5_
  
  - [ ]* 11.3 Write unit tests for ProfileForm component
    - Test form rendering
    - Test validation
    - Test submission
    - _Requirements: 10.1_
  
  - [ ]* 11.4 Write property test for profile form validation
    - Generate random invalid inputs
    - Verify client-side validation catches them
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 12. Implement document upload frontend components
  - [x] 12.1 Create DocumentUploader component
    - Write `frontend/src/components/DocumentUploader.tsx`
    - Add file input with drag-and-drop support
    - Show upload progress
    - Handle upload errors
    - _Requirements: 10.2, 10.5_
  
  - [x] 12.2 Create DocumentList component
    - Write `frontend/src/components/DocumentList.tsx`
    - Display list of uploaded documents
    - Add download and delete buttons
    - _Requirements: 10.2, 10.5_
  
  - [ ]* 12.3 Write unit tests for document components
    - Test file selection
    - Test upload handling
    - Test document list rendering
    - _Requirements: 10.2_

- [ ] 13. Implement racing calendar frontend components
  - [x] 13.1 Create Calendar component
    - Write `frontend/src/components/Calendar.tsx`
    - Display events in calendar view
    - Show events chronologically
    - Add click handlers for event details
    - _Requirements: 10.3, 10.5_
  
  - [x] 13.2 Create EventForm component
    - Write `frontend/src/components/EventForm.tsx`
    - Add form fields for event name, date, location, notes
    - Implement client-side validation
    - Handle form submission and errors
    - _Requirements: 10.4, 10.5_
  
  - [ ]* 13.3 Write unit tests for calendar components
    - Test calendar rendering
    - Test event form validation
    - Test event creation and editing
    - _Requirements: 10.3, 10.4_
  
  - [ ]* 13.4 Write property test for event chronological display
    - Generate random events
    - Verify calendar displays them in order
    - _Requirements: 4.2_

- [ ] 14. Wire up frontend main application
  - [x] 14.1 Create main App component with routing
    - Write `frontend/src/App.tsx`
    - Set up routing for profile, documents, calendar views
    - Add navigation menu
    - Integrate all components
    - Apply Tailwind CSS styling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_
  
  - [x] 14.2 Add global error handling and loading states
    - Implement error boundary component
    - Add loading spinners for async operations
    - Show toast notifications for success/error
    - _Requirements: 9.1, 9.3, 10.5_

- [ ] 15. Final checkpoint and integration testing
  - [ ]* 15.1 Write integration tests for complete workflows
    - Test create profile → upload document → add event workflow
    - Test update and delete operations
    - Test error scenarios end-to-end
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 4.1, 4.2_
  
  - [ ] 15.2 Ensure all tests pass
    - Run all backend unit tests, property tests, and integration tests
    - Run all frontend unit tests and property tests
    - Verify minimum code coverage (80% backend, 70% frontend)
    - Ask the user if questions arise.

- [ ] 16. Create development documentation
  - [ ] 16.1 Write README with setup instructions
    - Document backend setup (venv, requirements.txt, database initialization)
    - Document frontend setup (npm install, environment variables)
    - Document how to run both servers
    - Add API documentation link
    - _Requirements: 8.1, 8.5_
  
  - [ ]* 16.2 Add code comments and docstrings
    - Add docstrings to all Python functions and classes
    - Add JSDoc comments to TypeScript functions and components
    - Document complex business logic
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties with minimum 100 iterations each
- Unit tests validate specific examples and edge cases
- The implementation follows a backend-first approach, then frontend, then integration
- CORS must be configured in backend to allow frontend communication during local development
