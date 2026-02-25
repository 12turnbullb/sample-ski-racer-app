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
      <div key={`empty-${i}`} className="min-h-24 bg-carbon-950/30 border border-white/5" />
    );
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const isTodayCell = isToday(day);

    dayCells.push(
      <div
        key={day}
        className={`min-h-20 sm:min-h-24 border border-white/5 p-1 sm:p-2 transition-colors ${
          isTodayCell ? 'bg-usa-red/10 border-usa-red/20' : 'bg-carbon-900/20 hover:bg-white/5'
        }`}
      >
        {/* Day number */}
        <div className="flex justify-between items-start mb-1">
          <span
            className={`text-xs sm:text-sm font-medium ${
              isTodayCell
                ? 'bg-usa-red text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold'
                : 'text-gray-400'
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
              className="group relative bg-usa-red/15 hover:bg-usa-red/25 border border-usa-red/25 rounded px-1 sm:px-2 py-0.5 sm:py-1 cursor-pointer text-xs transition-all"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-red-100 font-medium truncate flex-1 text-[10px] sm:text-xs">
                  {event.eventName}
                </span>
                {onEventDelete && (
                  <button
                    onClick={(e) => handleDeleteClick(e, event.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity flex-shrink-0"
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
      <div className="glass-dark rounded-xl border border-white/10 p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-barlow-condensed font-bold uppercase tracking-wide text-white">
            {getMonthName(currentMonth)} {currentYear}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-gray-200 glass border border-white/15 rounded-full hover:bg-white/10 hover:border-usa-red/30 transition-all"
            >
              Today
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
              aria-label="Previous month"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
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
      <div className="glass-dark rounded-xl border border-white/10 overflow-hidden">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 bg-white/5 border-b border-white/10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs sm:text-sm font-bold uppercase text-gray-500 border-r border-white/5 last:border-r-0"
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
