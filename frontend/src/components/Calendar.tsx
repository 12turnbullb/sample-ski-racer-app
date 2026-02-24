/**
 * Calendar Component
 * 
 * Displays racing events in a chronological list/timeline view.
 * Shows events sorted by date with event details and click handlers.
 * 
 * Requirements: 10.3, 10.5
 * 
 * Features:
 * - Display events in chronological order (earliest first)
 * - Show event name, date, and location for each event
 * - Format dates in a readable format
 * - Handle empty state (no events)
 * - Provide visual feedback on hover/click
 * - Use card-like layout for each event
 * - Responsive design with Tailwind CSS
 * - Click handler for viewing event details
 */

import type { RacingEvent } from '../types';

// ============================================================================
// Component Props
// ============================================================================

interface CalendarProps {
  /**
   * Array of racing events to display.
   * Events will be sorted chronologically by date (earliest first).
   */
  events: RacingEvent[];

  /**
   * Callback function invoked when an event is clicked.
   * Receives the clicked event object.
   */
  onEventClick?: (event: RacingEvent) => void;

  /**
   * Callback function invoked when an event delete button is clicked.
   * Receives the event ID to delete.
   */
  onEventDelete?: (eventId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Calendar component for displaying racing events in chronological order.
 * 
 * @param props - Component props
 * @returns React component
 */
export default function Calendar({ events, onEventClick, onEventDelete }: CalendarProps) {
  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Format event date for display.
   * 
   * @param dateString - ISO date string (YYYY-MM-DD)
   * @returns Formatted date string (e.g., "Monday, January 15, 2024")
   */
  const formatEventDate = (dateString: string): string => {
    try {
      const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Format event date for short display (used in mobile view).
   * 
   * @param dateString - ISO date string (YYYY-MM-DD)
   * @returns Short formatted date string (e.g., "Jan 15, 2024")
   */
  const formatShortDate = (dateString: string): string => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Get relative time description for an event.
   * 
   * @param dateString - ISO date string (YYYY-MM-DD)
   * @returns Relative time string (e.g., "Today", "Tomorrow", "In 5 days", "2 days ago")
   */
  const getRelativeTime = (dateString: string): string => {
    try {
      const eventDate = new Date(dateString + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Tomorrow';
      } else if (diffDays === -1) {
        return 'Yesterday';
      } else if (diffDays > 1 && diffDays <= 7) {
        return `In ${diffDays} days`;
      } else if (diffDays < -1 && diffDays >= -7) {
        return `${Math.abs(diffDays)} days ago`;
      } else if (diffDays > 7) {
        return `In ${Math.ceil(diffDays / 7)} weeks`;
      } else {
        return `${Math.ceil(Math.abs(diffDays) / 7)} weeks ago`;
      }
    } catch {
      return '';
    }
  };

  /**
   * Determine if an event is in the past.
   * 
   * @param dateString - ISO date string (YYYY-MM-DD)
   * @returns True if event date is before today
   */
  const isPastEvent = (dateString: string): boolean => {
    try {
      const eventDate = new Date(dateString + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return eventDate < today;
    } catch {
      return false;
    }
  };

  /**
   * Sort events chronologically by date (earliest first).
   * 
   * @param events - Array of racing events
   * @returns Sorted array of events
   */
  const sortEventsByDate = (events: RacingEvent[]): RacingEvent[] => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.eventDate + 'T00:00:00');
      const dateB = new Date(b.eventDate + 'T00:00:00');
      return dateA.getTime() - dateB.getTime();
    });
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle event card click.
   * 
   * @param event - The clicked event
   */
  const handleEventClick = (event: RacingEvent) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  /**
   * Handle event delete button click.
   * 
   * @param e - Mouse event
   * @param eventId - ID of the event to delete
   */
  const handleDeleteClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation(); // Prevent event card click
    if (onEventDelete) {
      onEventDelete(eventId);
    }
  };

  /**
   * Handle keyboard navigation for event cards.
   * 
   * @param e - Keyboard event
   * @param event - The event associated with the card
   */
  const handleKeyDown = (e: React.KeyboardEvent, event: RacingEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleEventClick(event);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Sort events chronologically
  const sortedEvents = sortEventsByDate(events);

  // Empty state
  if (sortedEvents.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No events scheduled
          </h3>
          <p className="text-sm text-gray-500">
            Add your first racing event to start building your calendar.
          </p>
        </div>
      </div>
    );
  }

  // Event list
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Event cards */}
      <div className="space-y-3">
        {sortedEvents.map((event) => {
          const past = isPastEvent(event.eventDate);
          const relativeTime = getRelativeTime(event.eventDate);

          return (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              onKeyDown={(e) => handleKeyDown(e, event)}
              role="button"
              tabIndex={0}
              className={`
                bg-white border rounded-lg p-4 cursor-pointer
                transition-all duration-200
                hover:shadow-md hover:border-blue-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${past ? 'border-gray-200 opacity-75' : 'border-gray-300'}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Event info */}
                <div className="flex-1 min-w-0">
                  {/* Event name */}
                  <h3 className={`text-lg font-semibold mb-2 ${past ? 'text-gray-600' : 'text-gray-900'}`}>
                    {event.eventName}
                  </h3>

                  {/* Event details */}
                  <div className="space-y-1">
                    {/* Date */}
                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="h-4 w-4 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="hidden sm:inline">{formatEventDate(event.eventDate)}</span>
                      <span className="sm:hidden">{formatShortDate(event.eventDate)}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="h-4 w-4 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>

                    {/* Notes (if present) */}
                    {event.notes && (
                      <div className="flex items-start text-sm text-gray-600 mt-2">
                        <svg
                          className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="line-clamp-2">{event.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Relative time badge and delete button */}
                <div className="flex flex-col items-end gap-2">
                  {/* Delete button */}
                  {onEventDelete && (
                    <button
                      onClick={(e) => handleDeleteClick(e, event.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Delete event"
                      title="Delete event"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}

                  {/* Relative time badge */}
                  {relativeTime && (
                    <span
                      className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${past 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-blue-100 text-blue-800'
                        }
                      `}
                    >
                      {relativeTime}
                    </span>
                  )}
                </div>
              </div>

              {/* Past event indicator */}
              {past && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500 italic">Past event</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
