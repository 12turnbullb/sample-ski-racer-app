/**
 * API Client Service for Ski Racer Web App
 * 
 * This module provides a centralized HTTP client for all backend communication.
 * It implements all API methods using fetch with proper error handling, response
 * parsing, headers, and content types.
 * 
 * Requirements: 6.1, 6.2, 6.3, 9.3
 */

import type {
  RacerProfile,
  RacerProfileCreate,
  RacerProfileUpdate,
  Document,
  UploadUrlResponse,
  RacingEvent,
  RacingEventCreate,
  RacingEventUpdate
} from '../types';

/**
 * Base URL for the backend API.
 * Can be configured via environment variable or defaults to localhost:8000.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Custom error class for API errors.
 * Provides structured error information including status code and message.
 */
export class ApiClientError extends Error {
  statusCode: number;
  details?: string;
  
  constructor(
    statusCode: number,
    message: string,
    details?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiClientError';
  }
}

/**
 * Helper function to handle API responses.
 * Parses JSON responses and throws descriptive errors for non-2xx status codes.
 * 
 * @param response - Fetch API response object
 * @returns Parsed JSON data
 * @throws ApiClientError for non-2xx responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }

  // Parse response body
  let data: any;
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { detail: text } : {};
  }

  // Handle error responses
  if (!response.ok) {
    const errorMessage = data?.detail || `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiClientError(
      response.status,
      errorMessage,
      JSON.stringify(data)
    );
  }

  return data as T;
}

/**
 * Helper function to make API requests with proper headers.
 * 
 * @param endpoint - API endpoint path (relative to base URL)
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Parsed response data
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set default headers
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add Content-Type for JSON requests
  if (options.body && typeof options.body === 'string') {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    // Re-throw ApiClientError as-is
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiClientError(
        0,
        'Network error: Unable to connect to the backend. Please check your connection and ensure the backend is running.',
        error.message
      );
    }

    // Handle unexpected errors
    throw new ApiClientError(
      500,
      'An unexpected error occurred',
      error instanceof Error ? error.message : String(error)
    );
  }
}

// ============================================================================
// Racer Profile API Methods
// ============================================================================

/**
 * Create a new racer profile.
 * 
 * @param profile - Racer profile data to create
 * @returns Created racer profile with ID and timestamps
 * @throws ApiClientError on validation failure or server error
 * 
 * Requirements: 6.1 - RESTful endpoint for creating racer profiles
 */
export async function createRacer(
  profile: RacerProfileCreate
): Promise<RacerProfile> {
  // Convert camelCase to snake_case for backend
  const backendProfile = {
    racer_name: profile.racerName,
    height: profile.height,
    weight: profile.weight,
    ski_types: profile.skiTypes,
    binding_measurements: profile.bindingMeasurements,
    personal_records: profile.personalRecords,
    racing_goals: profile.racingGoals,
  };
  
  const response = await apiRequest<any>('/api/racers', {
    method: 'POST',
    body: JSON.stringify(backendProfile),
  });
  
  // Convert snake_case response to camelCase
  return {
    id: response.id,
    racerName: response.racer_name,
    height: response.height,
    weight: response.weight,
    skiTypes: response.ski_types,
    bindingMeasurements: response.binding_measurements,
    personalRecords: response.personal_records,
    racingGoals: response.racing_goals,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Retrieve a racer profile by ID.
 * 
 * @param id - UUID of the racer profile
 * @returns Racer profile data
 * @throws ApiClientError if racer not found or server error
 * 
 * Requirements: 6.1 - RESTful endpoint for retrieving racer profiles
 */
export async function getRacer(id: string): Promise<RacerProfile> {
  const response = await apiRequest<any>(`/api/racers/${id}`);
  
  // Convert snake_case response to camelCase
  return {
    id: response.id,
    racerName: response.racer_name,
    height: response.height,
    weight: response.weight,
    skiTypes: response.ski_types,
    bindingMeasurements: response.binding_measurements,
    personalRecords: response.personal_records,
    racingGoals: response.racing_goals,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Update an existing racer profile.
 * 
 * @param id - UUID of the racer profile to update
 * @param profile - Partial racer profile data to update
 * @returns Updated racer profile
 * @throws ApiClientError on validation failure, not found, or server error
 * 
 * Requirements: 6.1 - RESTful endpoint for updating racer profiles
 */
export async function updateRacer(
  id: string,
  profile: RacerProfileUpdate
): Promise<RacerProfile> {
  // Convert camelCase to snake_case for backend
  const backendProfile: any = {};
  if (profile.racerName !== undefined) backendProfile.racer_name = profile.racerName;
  if (profile.height !== undefined) backendProfile.height = profile.height;
  if (profile.weight !== undefined) backendProfile.weight = profile.weight;
  if (profile.skiTypes !== undefined) backendProfile.ski_types = profile.skiTypes;
  if (profile.bindingMeasurements !== undefined) backendProfile.binding_measurements = profile.bindingMeasurements;
  if (profile.personalRecords !== undefined) backendProfile.personal_records = profile.personalRecords;
  if (profile.racingGoals !== undefined) backendProfile.racing_goals = profile.racingGoals;
  
  const response = await apiRequest<any>(`/api/racers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(backendProfile),
  });
  
  // Convert snake_case response to camelCase
  return {
    id: response.id,
    racerName: response.racer_name,
    height: response.height,
    weight: response.weight,
    skiTypes: response.ski_types,
    bindingMeasurements: response.binding_measurements,
    personalRecords: response.personal_records,
    racingGoals: response.racing_goals,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Delete a racer profile and all associated data.
 * 
 * @param id - UUID of the racer profile to delete
 * @throws ApiClientError if racer not found or server error
 * 
 * Requirements: 6.1 - RESTful endpoint for deleting racer profiles
 */
export async function deleteRacer(id: string): Promise<void> {
  await apiRequest<{ message: string }>(`/api/racers/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Document API Methods
// ============================================================================

/**
 * Upload a document file for a racer.
 * 
 * @param racerId - UUID of the racer who owns this document
 * @param file - File object to upload
 * @returns Document metadata including ID and upload timestamp
 * @throws ApiClientError on validation failure (invalid file type, too large) or server error
 * 
 * Requirements: 6.2 - RESTful endpoint for document upload operations
 */
export async function uploadDocument(
  racerId: string,
  file: File
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/racers/${racerId}/documents`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    });

    const data = await handleResponse<any>(response);
    
    // Convert snake_case response to camelCase
    return {
      id: data.id,
      racerId: data.racer_id,
      filename: data.filename,
      filePath: data.file_path,
      fileType: data.file_type,
      fileSize: data.file_size,
      analysis: data.analysis,
      uploadedAt: data.uploaded_at,
    };
  } catch (error) {
    // Re-throw ApiClientError as-is
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiClientError(
        0,
        'Network error: Unable to connect to the backend. Please check your connection and ensure the backend is running.',
        error.message
      );
    }

    // Handle unexpected errors
    throw new ApiClientError(
      500,
      'An unexpected error occurred during file upload',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Step 1 of the presigned URL upload flow.
 * Requests a presigned S3 PUT URL from the backend.
 *
 * @param racerId  - UUID of the racer
 * @param filename - Original filename (used to derive S3 key extension)
 * @param fileType - MIME type (e.g. "video/mp4")
 * @param fileSize - File size in bytes
 * @returns { uploadUrl, documentId, s3Key }
 */
export async function getUploadUrl(
  racerId: string,
  filename: string,
  fileType: string,
  fileSize: number,
): Promise<UploadUrlResponse> {
  const data = await apiRequest<any>(
    `/api/racers/${racerId}/documents/upload-url`,
    {
      method: 'POST',
      body: JSON.stringify({ filename, file_type: fileType, file_size: fileSize }),
    }
  );
  return {
    uploadUrl: data.upload_url,
    documentId: data.document_id,
    s3Key: data.s3_key,
  };
}

/**
 * Step 3 of the presigned URL upload flow.
 * Triggers Bedrock analysis for a file that has already been PUT to S3.
 *
 * @param racerId    - UUID of the racer
 * @param documentId - UUID returned by getUploadUrl
 * @returns Full document record with AI analysis
 */
export async function analyzeDocument(
  racerId: string,
  documentId: string,
): Promise<Document> {
  const data = await apiRequest<any>(
    `/api/racers/${racerId}/documents/${documentId}/analyze`,
    { method: 'POST' }
  );
  return {
    id: data.id,
    racerId: data.racer_id,
    filename: data.filename,
    filePath: data.file_path,
    fileType: data.file_type,
    fileSize: data.file_size,
    analysis: data.analysis,
    status: data.status,
    uploadedAt: data.uploaded_at,
  };
}

/**
 * Fetch a presigned S3 GET URL for viewing an uploaded file.
 * URLs expire after 15 minutes.
 *
 * @param documentId - UUID of the document
 * @returns Presigned URL string
 */
export async function getDocumentUrl(documentId: string): Promise<string> {
  const data = await apiRequest<any>(`/api/documents/${documentId}/url`);
  return data.url as string;
}

/**
 * Retrieve all documents for a racer.
 *
 * @param racerId - UUID of the racer
 * @returns Array of document metadata, ordered by upload date (most recent first)
 * @throws ApiClientError on server error
 *
 * Requirements: 6.2 - RESTful endpoint for document retrieval operations
 */
export async function getDocuments(racerId: string): Promise<Document[]> {
  const response = await apiRequest<any[]>(`/api/racers/${racerId}/documents`);
  
  // Convert snake_case response to camelCase
  return response.map(doc => ({
    id: doc.id,
    racerId: doc.racer_id,
    filename: doc.filename,
    filePath: doc.file_path,
    fileType: doc.file_type,
    fileSize: doc.file_size,
    analysis: doc.analysis,
    status: doc.status,
    uploadedAt: doc.uploaded_at,
  }));
}

/**
 * Delete a document file and database record.
 * 
 * @param id - UUID of the document to delete
 * @throws ApiClientError if document not found or server error
 * 
 * Requirements: 6.2 - RESTful endpoint for document deletion operations
 */
export async function deleteDocument(id: string): Promise<void> {
  await apiRequest<{ message: string }>(`/api/documents/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Racing Event API Methods
// ============================================================================

/**
 * Create a new racing event for a racer.
 * 
 * @param racerId - UUID of the racer who owns this event
 * @param event - Racing event data to create
 * @returns Created racing event with ID and timestamps
 * @throws ApiClientError on validation failure (empty name, invalid date, empty location) or server error
 * 
 * Requirements: 6.3 - RESTful endpoint for creating racing events
 */
export async function createEvent(
  racerId: string,
  event: RacingEventCreate
): Promise<RacingEvent> {
  // Convert camelCase to snake_case for backend
  const backendEvent = {
    event_name: event.eventName,
    event_date: event.eventDate,
    location: event.location,
    notes: event.notes,
  };
  
  const response = await apiRequest<any>(`/api/racers/${racerId}/events`, {
    method: 'POST',
    body: JSON.stringify(backendEvent),
  });
  
  // Convert snake_case response to camelCase
  return {
    id: response.id,
    racerId: response.racer_id,
    eventName: response.event_name,
    eventDate: response.event_date,
    location: response.location,
    notes: response.notes,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Retrieve all racing events for a racer.
 * 
 * @param racerId - UUID of the racer
 * @returns Array of racing events, ordered chronologically by event date (earliest first)
 * @throws ApiClientError on server error
 * 
 * Requirements: 6.3 - RESTful endpoint for retrieving racing events
 */
export async function getEvents(racerId: string): Promise<RacingEvent[]> {
  const response = await apiRequest<any[]>(`/api/racers/${racerId}/events`);
  
  // Convert snake_case response to camelCase
  return response.map(event => ({
    id: event.id,
    racerId: event.racer_id,
    eventName: event.event_name,
    eventDate: event.event_date,
    location: event.location,
    notes: event.notes,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  }));
}

/**
 * Update an existing racing event.
 * 
 * @param id - UUID of the racing event to update
 * @param event - Partial racing event data to update
 * @returns Updated racing event
 * @throws ApiClientError on validation failure, not found, or server error
 * 
 * Requirements: 6.3 - RESTful endpoint for updating racing events
 */
export async function updateEvent(
  id: string,
  event: RacingEventUpdate
): Promise<RacingEvent> {
  // Convert camelCase to snake_case for backend
  const backendEvent: any = {};
  if (event.eventName !== undefined) backendEvent.event_name = event.eventName;
  if (event.eventDate !== undefined) backendEvent.event_date = event.eventDate;
  if (event.location !== undefined) backendEvent.location = event.location;
  if (event.notes !== undefined) backendEvent.notes = event.notes;
  
  const response = await apiRequest<any>(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(backendEvent),
  });
  
  // Convert snake_case response to camelCase
  return {
    id: response.id,
    racerId: response.racer_id,
    eventName: response.event_name,
    eventDate: response.event_date,
    location: response.location,
    notes: response.notes,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

/**
 * Delete a racing event.
 * 
 * @param id - UUID of the racing event to delete
 * @throws ApiClientError if event not found or server error
 * 
 * Requirements: 6.3 - RESTful endpoint for deleting racing events
 */
export async function deleteEvent(id: string): Promise<void> {
  await apiRequest<{ message: string }>(`/api/events/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Export all API methods as default object
// ============================================================================

export default {
  // Racer methods
  createRacer,
  getRacer,
  updateRacer,
  deleteRacer,
  
  // Document methods
  uploadDocument,
  getUploadUrl,
  analyzeDocument,
  getDocumentUrl,
  getDocuments,
  deleteDocument,
  
  // Event methods
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
};
