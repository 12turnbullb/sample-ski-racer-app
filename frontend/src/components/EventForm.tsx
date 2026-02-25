/**
 * EventForm Component
 * 
 * A form component for creating and editing racing events.
 * Supports both create and edit modes with client-side validation,
 * loading states, and error handling.
 * 
 * Requirements: 10.4, 10.5
 */

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { RacingEvent, RacingEventCreate, RacingEventUpdate } from '../types';
import { createEvent, updateEvent } from '../services/api';
import { ApiClientError } from '../services/api';

interface EventFormProps {
  /** UUID of the racer who owns this event */
  racerId: string;
  /** Optional existing event for edit mode */
  event?: RacingEvent;
  /** Callback invoked when event is successfully saved */
  onSave: (event: RacingEvent) => void;
  /** Callback invoked when user cancels the form */
  onCancel: () => void;
}

interface FormData {
  eventName: string;
  eventDate: string;
  location: string;
  notes: string;
}

interface FormErrors {
  eventName?: string;
  eventDate?: string;
  location?: string;
  general?: string;
}

/**
 * EventForm component for creating and editing racing events.
 * 
 * Features:
 * - Client-side validation (non-empty name, valid date, non-empty location)
 * - Loading state during API calls
 * - Inline error messages for each field
 * - General error message for API failures
 * - Responsive design with Tailwind CSS
 * - Support for both create and edit modes
 */
export default function EventForm({ racerId, event, onSave, onCancel }: EventFormProps) {
  // Initialize form data from event prop (edit mode) or empty values (create mode)
  const [formData, setFormData] = useState<FormData>({
    eventName: event?.eventName || '',
    eventDate: event?.eventDate || '',
    location: event?.location || '',
    notes: event?.notes || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle input field changes.
   * Clears the error for the changed field.
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Validate form data before submission.
   * Returns true if all validations pass, false otherwise.
   * Sets error messages for invalid fields.
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate event name
    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }

    // Validate event date
    if (!formData.eventDate.trim()) {
      newErrors.eventDate = 'Event date is required';
    } else {
      // Check if date is valid ISO format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.eventDate)) {
        newErrors.eventDate = 'Date must be in YYYY-MM-DD format';
      } else {
        // Check if date is a valid calendar date
        const date = new Date(formData.eventDate);
        if (isNaN(date.getTime())) {
          newErrors.eventDate = 'Invalid date';
        }
      }
    }

    // Validate location
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission.
   * Validates form data, calls appropriate API method (create or update),
   * and invokes onSave callback on success.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear general error
    setErrors(prev => ({ ...prev, general: undefined }));

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API
      const eventData: RacingEventCreate | RacingEventUpdate = {
        eventName: formData.eventName.trim(),
        eventDate: formData.eventDate.trim(),
        location: formData.location.trim(),
        notes: formData.notes.trim() || undefined,
      };

      let savedEvent: RacingEvent;

      if (event) {
        // Edit mode: update existing event
        savedEvent = await updateEvent(event.id, eventData);
      } else {
        // Create mode: create new event
        savedEvent = await createEvent(racerId, eventData as RacingEventCreate);
      }

      // Success: invoke callback
      onSave(savedEvent);
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiClientError) {
        setErrors(prev => ({
          ...prev,
          general: error.message,
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          general: 'An unexpected error occurred. Please try again.',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="glass-dark rounded-2xl shadow-glass border border-white/10 p-8">
        <h2 className="text-3xl font-barlow-condensed font-bold uppercase mb-8 gradient-text">
          {event ? 'Edit Event' : 'Create Event'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General error message */}
          {errors.general && (
            <div className="glass-dark border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Event Name field */}
          <div>
            <label htmlFor="eventName" className="block text-sm font-semibold text-gray-300 mb-2">
              Event Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              className={`w-full px-4 py-3 glass-dark border ${
                errors.eventName ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-gray-500 focus:border-usa-red focus:ring-2 focus:ring-usa-red/40 focus:outline-none transition-all`}
              placeholder="e.g., Aspen Winter Classic"
              disabled={isLoading}
            />
            {errors.eventName && (
              <p className="mt-2 text-sm text-red-400">{errors.eventName}</p>
            )}
          </div>

          {/* Event Date field */}
          <div>
            <label htmlFor="eventDate" className="block text-sm font-semibold text-gray-300 mb-2">
              Event Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 glass-dark border ${
                errors.eventDate ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-gray-500 focus:border-usa-red focus:ring-2 focus:ring-usa-red/40 focus:outline-none transition-all [color-scheme:dark]`}
              disabled={isLoading}
            />
            {errors.eventDate && (
              <p className="mt-2 text-sm text-red-400">{errors.eventDate}</p>
            )}
          </div>

          {/* Location field */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-300 mb-2">
              Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full px-4 py-3 glass-dark border ${
                errors.location ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-gray-500 focus:border-usa-red focus:ring-2 focus:ring-usa-red/40 focus:outline-none transition-all`}
              placeholder="e.g., Aspen, Colorado"
              disabled={isLoading}
            />
            {errors.location && (
              <p className="mt-2 text-sm text-red-400">{errors.location}</p>
            )}
          </div>

          {/* Notes field (optional) */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 glass-dark border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-usa-red focus:ring-2 focus:ring-usa-red/40 focus:outline-none transition-all resize-none"
              placeholder="Add any additional notes about this event (optional)"
              disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Optional notes about the event
            </p>
          </div>

          {/* Form actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 btn-primary px-6 py-3 focus:outline-none focus:ring-2 focus:ring-usa-red focus:ring-offset-2 focus:ring-offset-carbon-900 ${
                isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {event ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <span>{event ? 'Update Event' : 'Create Event'}</span>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className={`flex-1 px-6 py-3 rounded-full font-bold uppercase tracking-wide border transition-all focus:outline-none focus:ring-2 focus:ring-usa-red/50 focus:ring-offset-2 focus:ring-offset-carbon-900 ${
                isLoading
                  ? 'glass-dark text-gray-500 border-white/10 cursor-not-allowed opacity-50'
                  : 'glass-dark text-gray-200 border-white/15 hover:bg-white/10 hover:border-usa-red/30'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
