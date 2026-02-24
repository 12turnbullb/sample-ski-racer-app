/**
 * Unit tests for EventForm component
 * 
 * Tests form rendering, validation, submission, error handling, and edit mode.
 * Requirements: 10.4, 10.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventForm from '../EventForm';
import type { RacingEvent } from '../../types';
import * as api from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    statusCode: number;
    details?: string;
    
    constructor(statusCode: number, message: string, details?: string) {
      super(message);
      this.name = 'ApiClientError';
      this.statusCode = statusCode;
      this.details = details;
    }
  },
}));

describe('EventForm', () => {
  const mockRacerId = 'racer-123';
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const mockEvent: RacingEvent = {
    id: 'event-123',
    racerId: mockRacerId,
    eventName: 'Aspen Winter Classic',
    eventDate: '2024-02-15',
    location: 'Aspen, Colorado',
    notes: 'Bring extra equipment',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render create mode with empty form', () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading', { name: 'Create Event' })).toBeInTheDocument();
      expect(screen.getByLabelText(/event name/i)).toHaveValue('');
      expect(screen.getByLabelText(/event date/i)).toHaveValue('');
      expect(screen.getByLabelText(/location/i)).toHaveValue('');
      expect(screen.getByLabelText(/notes/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
    });

    it('should render edit mode with populated form', () => {
      render(
        <EventForm
          racerId={mockRacerId}
          event={mockEvent}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Event')).toBeInTheDocument();
      expect(screen.getByLabelText(/event name/i)).toHaveValue('Aspen Winter Classic');
      expect(screen.getByLabelText(/event date/i)).toHaveValue('2024-02-15');
      expect(screen.getByLabelText(/location/i)).toHaveValue('Aspen, Colorado');
      expect(screen.getByLabelText(/notes/i)).toHaveValue('Bring extra equipment');
      expect(screen.getByRole('button', { name: /update event/i })).toBeInTheDocument();
    });

    it('should render all required field indicators', () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators).toHaveLength(3); // Event name, date, and location are required
    });

    it('should render cancel button', () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show notes field as optional', () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const notesLabel = screen.getByText('Notes');
      expect(notesLabel).toBeInTheDocument();
      // Notes label should not have a required indicator
      expect(notesLabel.textContent).not.toContain('*');
    });
  });

  describe('Validation', () => {
    it('should show error when event name is empty', async () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Event name is required')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when event date is empty', async () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Event date is required')).toBeInTheDocument();
      });
    });

    it('should show error when location is empty', async () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Location is required')).toBeInTheDocument();
      });
    });

    it('should accept valid date format', async () => {
      const user = userEvent.setup();
      
      const createdEvent: RacingEvent = {
        ...mockEvent,
        id: 'new-event-id',
      };

      vi.mocked(api.createEvent).mockResolvedValue(createdEvent);

      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in all required fields with valid data
      await user.type(screen.getByLabelText(/event name/i), 'Test Event');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), 'Test Location');

      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      // Should not show date validation errors
      await waitFor(() => {
        expect(api.createEvent).toHaveBeenCalled();
      });

      expect(screen.queryByText(/Date must be in YYYY-MM-DD format/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Invalid date')).not.toBeInTheDocument();
    });

    it('should show all validation errors at once', async () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Event name is required')).toBeInTheDocument();
        expect(screen.getByText('Event date is required')).toBeInTheDocument();
        expect(screen.getByText('Location is required')).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Submit to trigger validation errors
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Event name is required')).toBeInTheDocument();
      });

      // Type in event name field
      const nameInput = screen.getByLabelText(/event name/i);
      await user.type(nameInput, 'Test Event');

      // Error should be cleared
      expect(screen.queryByText('Event name is required')).not.toBeInTheDocument();
    });

    it('should not show error for empty notes field', async () => {
      const user = userEvent.setup();
      
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields only
      await user.type(screen.getByLabelText(/event name/i), 'Test Event');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), 'Test Location');

      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      // Should not show any validation errors
      await waitFor(() => {
        expect(api.createEvent).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission - Create Mode', () => {
    it('should call createEvent with valid data', async () => {
      const user = userEvent.setup();
      
      const createdEvent: RacingEvent = {
        ...mockEvent,
        id: 'new-event-id',
      };

      vi.mocked(api.createEvent).mockResolvedValue(createdEvent);

      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in all fields
      await user.type(screen.getByLabelText(/event name/i), 'Aspen Winter Classic');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), 'Aspen, Colorado');
      await user.type(screen.getByLabelText(/notes/i), 'Bring extra equipment');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.createEvent).toHaveBeenCalledWith(mockRacerId, {
          eventName: 'Aspen Winter Classic',
          eventDate: '2024-02-15',
          location: 'Aspen, Colorado',
          notes: 'Bring extra equipment',
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(createdEvent);
    });

    it('should call createEvent without notes if notes is empty', async () => {
      const user = userEvent.setup();
      
      const createdEvent: RacingEvent = {
        ...mockEvent,
        notes: undefined,
      };

      vi.mocked(api.createEvent).mockResolvedValue(createdEvent);

      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields only
      await user.type(screen.getByLabelText(/event name/i), 'Test Event');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), 'Test Location');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.createEvent).toHaveBeenCalledWith(mockRacerId, {
          eventName: 'Test Event',
          eventDate: '2024-02-15',
          location: 'Test Location',
          notes: undefined,
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: any;
      vi.mocked(api.createEvent).mockImplementation(
        () => new Promise(resolve => { resolvePromise = resolve; })
      );

      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in all fields
      await user.type(screen.getByLabelText(/event name/i), 'Test Event');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), 'Test Location');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      });

      // Check that button is disabled
      expect(submitButton).toBeDisabled();

      // Resolve the promise to clean up
      if (resolvePromise) {
        resolvePromise(mockEvent);
      }
    });

    it('should trim whitespace from text fields', async () => {
      const user = userEvent.setup();
      
      const createdEvent: RacingEvent = {
        ...mockEvent,
        id: 'new-event-id',
      };

      vi.mocked(api.createEvent).mockResolvedValue(createdEvent);

      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in fields with extra whitespace
      await user.type(screen.getByLabelText(/event name/i), '  Test Event  ');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), '  Test Location  ');
      await user.type(screen.getByLabelText(/notes/i), '  Test Notes  ');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.createEvent).toHaveBeenCalledWith(mockRacerId, {
          eventName: 'Test Event',
          eventDate: '2024-02-15',
          location: 'Test Location',
          notes: 'Test Notes',
        });
      });
    });
  });

  describe('Form Submission - Edit Mode', () => {
    it('should call updateEvent with valid data', async () => {
      const user = userEvent.setup();
      
      const updatedEvent: RacingEvent = {
        ...mockEvent,
        eventName: 'Updated Event Name',
      };

      vi.mocked(api.updateEvent).mockResolvedValue(updatedEvent);

      render(
        <EventForm
          racerId={mockRacerId}
          event={mockEvent}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Update event name
      const nameInput = screen.getByLabelText(/event name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Event Name');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.updateEvent).toHaveBeenCalledWith(mockEvent.id, {
          eventName: 'Updated Event Name',
          eventDate: '2024-02-15',
          location: 'Aspen, Colorado',
          notes: 'Bring extra equipment',
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(updatedEvent);
    });

    it('should show loading state during update', async () => {
      // const user = userEvent.setup();
      
      let resolvePromise: any;
      vi.mocked(api.updateEvent).mockImplementation(
        () => new Promise(resolve => { resolvePromise = resolve; })
      );

      render(
        <EventForm
          racerId={mockRacerId}
          event={mockEvent}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update event/i });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/updating/i)).toBeInTheDocument();
      });

      // Check that button is disabled
      expect(submitButton).toBeDisabled();

      // Resolve the promise to clean up
      if (resolvePromise) {
        resolvePromise(mockEvent);
      }
    });

    it('should handle clearing notes in edit mode', async () => {
      const user = userEvent.setup();
      
      const updatedEvent: RacingEvent = {
        ...mockEvent,
        notes: undefined,
      };

      vi.mocked(api.updateEvent).mockResolvedValue(updatedEvent);

      render(
        <EventForm
          racerId={mockRacerId}
          event={mockEvent}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Clear notes field
      const notesInput = screen.getByLabelText(/notes/i);
      await user.clear(notesInput);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.updateEvent).toHaveBeenCalledWith(mockEvent.id, {
          eventName: 'Aspen Winter Classic',
          eventDate: '2024-02-15',
          location: 'Aspen, Colorado',
          notes: undefined,
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display API error message', async () => {
      const user = userEvent.setup();
      
      const errorMessage = 'Event name cannot be empty';
      vi.mocked(api.createEvent).mockRejectedValue(
        new api.ApiClientError(400, errorMessage)
      );

      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in all fields
      await user.type(screen.getByLabelText(/event name/i), 'Test Event');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), 'Test Location');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should display generic error for unexpected errors', async () => {
      const user = userEvent.setup();
      
      vi.mocked(api.createEvent).mockRejectedValue(new Error('Network error'));

      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in all fields
      await user.type(screen.getByLabelText(/event name/i), 'Test Event');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), 'Test Location');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable cancel button during submission', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: any;
      vi.mocked(api.createEvent).mockImplementation(
        () => new Promise(resolve => { resolvePromise = resolve; })
      );

      render(
        <EventForm
          racerId={mockRacerId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in all fields
      await user.type(screen.getByLabelText(/event name/i), 'Test Event');
      await user.type(screen.getByLabelText(/event date/i), '2024-02-15');
      await user.type(screen.getByLabelText(/location/i), 'Test Location');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      // Check that cancel button is disabled
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();

      // Resolve the promise to clean up
      if (resolvePromise) {
        resolvePromise(mockEvent);
      }
    });
  });
});
