/**
 * TypeScript type definitions for the ski racer web app.
 * 
 * These interfaces match the backend schema structure defined in backend/app/schemas.py
 * and provide type safety for frontend data handling.
 */

// ============================================================================
// Racer Profile Interfaces
// ============================================================================

/**
 * Interface for racer profile data.
 * 
 * Represents a complete racer profile with all fields including system-generated
 * timestamps and ID. This matches the RacerResponse schema from the backend.
 * 
 * @property id - UUID primary key
 * @property racerName - Name of the ski racer
 * @property height - Height in centimeters (must be > 0)
 * @property weight - Weight in kilograms (must be > 0)
 * @property skiTypes - Comma-separated list of ski types
 * @property bindingMeasurements - JSON string with binding measurements
 * @property personalRecords - JSON string with personal records
 * @property racingGoals - Text description of racing goals
 * @property createdAt - ISO timestamp when record was created
 * @property updatedAt - ISO timestamp when record was last updated
 */
export interface RacerProfile {
  id: string;
  racerName: string;
  height: number;
  weight: number;
  skiTypes: string;
  bindingMeasurements: string;
  personalRecords: string;
  racingGoals: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for creating a new racer profile.
 * 
 * Contains only the fields required for profile creation (no id or timestamps).
 * This matches the RacerCreate schema from the backend.
 */
export interface RacerProfileCreate {
  racerName: string;
  height: number;
  weight: number;
  skiTypes: string;
  bindingMeasurements: string;
  personalRecords: string;
  racingGoals: string;
}

/**
 * Interface for updating an existing racer profile.
 * 
 * All fields are optional to allow partial updates.
 * This matches the RacerUpdate schema from the backend.
 */
export interface RacerProfileUpdate {
  racerName?: string;
  height?: number;
  weight?: number;
  skiTypes?: string;
  bindingMeasurements?: string;
  personalRecords?: string;
  racingGoals?: string;
}

// ============================================================================
// Document Interfaces
// ============================================================================

/**
 * Interface for document metadata.
 * 
 * Represents metadata about an uploaded ski video/image with AI analysis.
 * This matches the DocumentResponse schema from the backend.
 * 
 * @property id - UUID primary key
 * @property racerId - Foreign key to racer profile
 * @property filename - Original filename of uploaded file
 * @property filePath - Path to stored file on disk
 * @property fileType - MIME type of the file
 * @property fileSize - Size of file in bytes
 * @property analysis - AI-generated ski form analysis
 * @property uploadedAt - ISO timestamp when file was uploaded
 */
export interface Document {
  id: string;
  racerId: string;
  filename: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  analysis?: string;
  uploadedAt: string;
}

// ============================================================================
// Racing Event Interfaces
// ============================================================================

/**
 * Interface for racing event data.
 * 
 * Represents a complete racing event with all fields including system-generated
 * timestamps and ID. This matches the EventResponse schema from the backend.
 * 
 * @property id - UUID primary key
 * @property racerId - Foreign key to racer profile
 * @property eventName - Name of the racing event
 * @property eventDate - Date of the racing event (ISO format: YYYY-MM-DD)
 * @property location - Location where the event takes place
 * @property notes - Optional notes about the event
 * @property createdAt - ISO timestamp when record was created
 * @property updatedAt - ISO timestamp when record was last updated
 */
export interface RacingEvent {
  id: string;
  racerId: string;
  eventName: string;
  eventDate: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for creating a new racing event.
 * 
 * Contains only the fields required for event creation (no id or timestamps).
 * This matches the EventCreate schema from the backend.
 */
export interface RacingEventCreate {
  eventName: string;
  eventDate: string;
  location: string;
  notes?: string;
}

/**
 * Interface for updating an existing racing event.
 * 
 * All fields are optional to allow partial updates.
 * This matches the EventUpdate schema from the backend.
 */
export interface RacingEventUpdate {
  eventName?: string;
  eventDate?: string;
  location?: string;
  notes?: string;
}

// ============================================================================
// API Error Response Interface
// ============================================================================

/**
 * Interface for API error responses.
 * 
 * Provides a consistent structure for error messages from the backend.
 * 
 * @property detail - Error message or details about the failure
 */
export interface ApiError {
  detail: string;
}
