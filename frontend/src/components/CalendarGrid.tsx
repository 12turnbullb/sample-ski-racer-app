/**
 * CalendarGrid Component
 * 
 * Displays racing events in a traditional monthly calendar grid view.
 * Shows events on their respective dates with navigation between months.
 * 
 * Features:
 * - Monthly calendar grid with day cells
 * - Events displayed on their dates
 * - Month/year navigation
 * - Today indicator
 * - Click events to view/edit
 * - Delete button on events
 * - Responsive design
 */

import { useState, useMemo } from 'react';
import type { RacingEvent } from '../types';

// ============================================================================
// Component Props
// ============================================================================

interface CalendarGridProps {
  /**
   * Array of racing events to display.
   */
  events: RacingEvent[];

  /**
   * Callback function invoked when an event is clicked.
   */
  onEventClick?: (event: RacingEvent) => void;

  /**
   * Callback function invoked when an event delete button is clicked.
   */
  onEventDelete?: (eventId: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the number of days in a month.
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week (0-6) for the first day of the month.
 */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Get month name from month number (0-11).
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

/**
 * Check if two dates are the same day.
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// ============================================================================
// Component
// ============================================================================

export default function CalendarGrid({ events, onEventClick, onEventDelete }: CalendarGridProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // ============================================================================
  // Navigation
  // ============================================================================

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // ============================================================================
  // Calendar Data
  // ============================================================================

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, RacingEvent[]>();
    
    events.forEach(event => {
      const eventDate = new Date(event.eventDate + 'T00:00:00');
      const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    
    return map;
  }, [events]);

  // Get events for a specific day
  const getEventsForDay = (day: number): RacingEvent[] => {
    const dateKey = `${currentYear}-${currentMonth}-${day}`;
    return eventsByDate.get(dateKey) || [];
  };

  // Check if a day is today
  const isToday = (day: number): boolean => {
    return isSameDay(new Date(currentYear, currentMonth, day), today);
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleEventClick = (e: React.MouseEvent, event: RacingEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (onEventDelete) {
      onEventDelete(eventId);
    }
  };

  // ============================================================================
  // Render Calendar Grid
  // ============================================================================

  // Create array of day cells (including empty cells for alignment)
  const dayCells = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    dayCells.push(
      <div key={`empty-${i}`} className="min-h-24 bg-gray-50 border border-gray-200" />
    );
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const isTodayCell = isToday(day);
    
    dayCells.push(
      <div
        key={day}
        className={`min-h-20 sm:min-h-24 border border-gray-200 p-1 sm:p-2 ${
          isTodayCell ? 'bg-blue-50' : 'bg-white'
        } hover:bg-gray-50 transition-colors`}
      >
        {/* Day number */}
        <div className="flex justify-between items-start mb-1">
          <span
            className={`text-xs sm:text-sm font-medium ${
              isTodayCell
                ? 'bg-blue-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs'
                : 'text-gray-700'
            }`}
          >
            {day}
          </span>
        </div>

        {/* Events for this day */}
        <div className="space-y-0.5 sm:space-y-1">
          {dayEvents.map(event => (
            <div
              key={event.id}
              onClick={(e) => handleEventClick(e, event)}
              className="group relative bg-blue-100 hover:bg-blue-200 rounded px-1 sm:px-2 py-0.5 sm:py-1 cursor-pointer text-xs transition-colors"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-blue-900 font-medium truncate flex-1 text-[10px] sm:text-xs">
                  {event.eventName}
                </span>
                {onEventDelete && (
                  <button
                    onClick={(e) => handleDeleteClick(e, event.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-opacity flex-shrink-0"
                    aria-label="Delete event"
                    title="Delete event"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Calendar header with navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {getMonthName(currentMonth)} {currentYear}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Previous month"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Next month"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar day cells */}
        <div className="grid grid-cols-7">
          {dayCells}
        </div>
      </div>
    </div>
  );
}
