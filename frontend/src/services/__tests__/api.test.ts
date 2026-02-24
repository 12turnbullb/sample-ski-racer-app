/**
 * Unit tests for API client service.
 * 
 * Tests specific examples, edge cases, and error conditions for the API client.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createRacer,
  getRacer,
  updateRacer,
  deleteRacer,
  uploadDocument,
  getDocuments,
  deleteDocument,
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  ApiClientError,
} from '../api';
import type {
  RacerProfile,
  RacerProfileCreate,
  RacerProfileUpdate,
  Document,
  RacingEvent,
  RacingEventCreate,
  RacingEventUpdate,
} from '../../types';

// Mock fetch globally
(globalThis as any).fetch = vi.fn();

describe('API Client Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Racer Profile API Tests
  // ============================================================================

  describe('createRacer', () => {
    it('should create a racer profile successfully', async () => {
      const mockProfile: RacerProfileCreate = {
        racerName: 'Test Racer',
        height: 180,
        weight: 75,
        skiTypes: 'Slalom, Giant Slalom',
        bindingMeasurements: '{"din": 10}',
        personalRecords: '{"slalom": "45.2s"}',
        racingGoals: 'Qualify for nationals',
      };

      const mockResponse: RacerProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...mockProfile,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await createRacer(mockProfile);

      expect(result).toEqual(mockResponse);
      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/racers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockProfile),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw ApiClientError on validation failure', async () => {
      const invalidProfile: RacerProfileCreate = {
        racerName: 'Test Racer',
        height: -10,
        weight: 75,
        skiTypes: 'Slalom',
        bindingMeasurements: '{}',
        personalRecords: '{}',
        racingGoals: 'Test',
      };

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Height must be greater than 0' }),
      });

      const error = await createRacer(invalidProfile).catch(e => e);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error.message).toBe('Height must be greater than 0');
    });
  });

  describe('getRacer', () => {
    it('should retrieve a racer profile by ID', async () => {
      const mockProfile: RacerProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        racerName: 'Test Racer',
        height: 180,
        weight: 75,
        skiTypes: 'Slalom',
        bindingMeasurements: '{}',
        personalRecords: '{}',
        racingGoals: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockProfile,
      });

      const result = await getRacer('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockProfile);
      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/racers/123e4567-e89b-12d3-a456-426614174000',
        expect.any(Object)
      );
    });

    it('should throw ApiClientError when racer not found', async () => {
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Racer not found' }),
      });

      const error = await getRacer('nonexistent-id').catch(e => e);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error.message).toBe('Racer not found');
    });
  });

  describe('updateRacer', () => {
    it('should update a racer profile successfully', async () => {
      const updateData: RacerProfileUpdate = {
        height: 185,
        racingGoals: 'Win nationals',
      };

      const mockResponse: RacerProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        racerName: 'Test Racer',
        height: 185,
        weight: 75,
        skiTypes: 'Slalom',
        bindingMeasurements: '{}',
        personalRecords: '{}',
        racingGoals: 'Win nationals',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await updateRacer('123e4567-e89b-12d3-a456-426614174000', updateData);

      expect(result).toEqual(mockResponse);
      expect(result.height).toBe(185);
      expect(result.racingGoals).toBe('Win nationals');
    });
  });

  describe('deleteRacer', () => {
    it('should delete a racer profile successfully', async () => {
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Racer deleted successfully' }),
      });

      await expect(deleteRacer('123e4567-e89b-12d3-a456-426614174000')).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Document API Tests
  // ============================================================================

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockDocument: Document = {
        id: 'doc-123',
        racerId: 'racer-123',
        filename: 'test.pdf',
        filePath: '/uploads/test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedAt: '2024-01-01T00:00:00Z',
      };

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockDocument,
      });

      const result = await uploadDocument('racer-123', mockFile);

      expect(result).toEqual(mockDocument);
      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/racers/racer-123/documents',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should throw ApiClientError on invalid file type', async () => {
      const mockFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Invalid file type' }),
      });

      const error = await uploadDocument('racer-123', mockFile).catch(e => e);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error.message).toBe('Invalid file type');
    });
  });

  describe('getDocuments', () => {
    it('should retrieve all documents for a racer', async () => {
      const mockDocuments: Document[] = [
        {
          id: 'doc-1',
          racerId: 'racer-123',
          filename: 'analysis1.pdf',
          filePath: '/uploads/analysis1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          uploadedAt: '2024-01-02T00:00:00Z',
        },
        {
          id: 'doc-2',
          racerId: 'racer-123',
          filename: 'analysis2.pdf',
          filePath: '/uploads/analysis2.pdf',
          fileType: 'application/pdf',
          fileSize: 2048,
          uploadedAt: '2024-01-01T00:00:00Z',
        },
      ];

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockDocuments,
      });

      const result = await getDocuments('racer-123');

      expect(result).toEqual(mockDocuments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no documents exist', async () => {
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [],
      });

      const result = await getDocuments('racer-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Document deleted successfully' }),
      });

      await expect(deleteDocument('doc-123')).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Racing Event API Tests
  // ============================================================================

  describe('createEvent', () => {
    it('should create a racing event successfully', async () => {
      const mockEventData: RacingEventCreate = {
        eventName: 'Winter Championship',
        eventDate: '2024-02-15',
        location: 'Aspen, CO',
        notes: 'Slalom race',
      };

      const mockEvent: RacingEvent = {
        id: 'event-123',
        racerId: 'racer-123',
        ...mockEventData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockEvent,
      });

      const result = await createEvent('racer-123', mockEventData);

      expect(result).toEqual(mockEvent);
      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/racers/racer-123/events',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockEventData),
        })
      );
    });

    it('should throw ApiClientError on validation failure', async () => {
      const invalidEvent: RacingEventCreate = {
        eventName: '',
        eventDate: '2024-02-15',
        location: 'Aspen',
      };

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Event name cannot be empty' }),
      });

      const error = await createEvent('racer-123', invalidEvent).catch(e => e);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error.message).toBe('Event name cannot be empty');
    });
  });

  describe('getEvents', () => {
    it('should retrieve all events for a racer in chronological order', async () => {
      const mockEvents: RacingEvent[] = [
        {
          id: 'event-1',
          racerId: 'racer-123',
          eventName: 'Spring Race',
          eventDate: '2024-03-15',
          location: 'Vail',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'event-2',
          racerId: 'racer-123',
          eventName: 'Winter Race',
          eventDate: '2024-02-15',
          location: 'Aspen',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockEvents,
      });

      const result = await getEvents('racer-123');

      expect(result).toEqual(mockEvents);
      expect(result).toHaveLength(2);
    });
  });

  describe('updateEvent', () => {
    it('should update a racing event successfully', async () => {
      const updateData: RacingEventUpdate = {
        location: 'Vail, CO',
        notes: 'Updated notes',
      };

      const mockEvent: RacingEvent = {
        id: 'event-123',
        racerId: 'racer-123',
        eventName: 'Winter Championship',
        eventDate: '2024-02-15',
        location: 'Vail, CO',
        notes: 'Updated notes',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockEvent,
      });

      const result = await updateEvent('event-123', updateData);

      expect(result).toEqual(mockEvent);
      expect(result.location).toBe('Vail, CO');
      expect(result.notes).toBe('Updated notes');
    });
  });

  describe('deleteEvent', () => {
    it('should delete a racing event successfully', async () => {
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Event deleted successfully' }),
      });

      await expect(deleteEvent('event-123')).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      ((globalThis as any).fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(getRacer('test-id')).rejects.toThrow(ApiClientError);
      await expect(getRacer('test-id')).rejects.toThrow(
        'Network error: Unable to connect to the backend'
      );
    });

    it('should handle 500 server errors', async () => {
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Database connection failed' }),
      });

      const error = await getRacer('test-id').catch(e => e);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error.message).toBe('Database connection failed');
    });

    it('should handle non-JSON responses', async () => {
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Server error',
      });

      await expect(getRacer('test-id')).rejects.toThrow(ApiClientError);
    });

    it('should handle 204 No Content responses', async () => {
      ((globalThis as any).fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await deleteRacer('test-id');
      expect(result).toBeUndefined();
    });
  });
});
