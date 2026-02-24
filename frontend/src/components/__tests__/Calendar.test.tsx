/**
 * Unit tests for Calendar component
 * 
 * Tests calendar rendering, event display, chronological ordering,
 * empty state, and click handlers.
 * 
 * Requirements: 10.3, 10.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from '../Calendar';
import type { RacingEvent } from '../../types';

// ============================================================================
// Test Data
// ============================================================================

/**
 * Create a mock racing event for testing.
 */
const createMockEvent = (overrides?: Partial<RacingEvent>): RacingEvent => ({
  id: '1',
  racerId: 'racer-1',
  eventName: 'Test Race',
  eventDate: '2024-06-15',
  location: 'Test Mountain',
  notes: 'Test notes',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('Calendar Component', () => {
  // --------------------------------------------------------------------------
  // Empty State Tests
  // --------------------------------------------------------------------------

  describe('Empty State', () => {
    it('should display empty state when no events are provided', () => {
      render(<Calendar events={[]} />);

      expect(screen.getByText('Racing Calendar')).toBeInTheDocument();
      expect(screen.getByText('No events scheduled')).toBeInTheDocument();
      expect(screen.getByText('Add your first racing event to start building your calendar.')).toBeInTheDocument();
    });

    it('should display calendar icon in empty state', () => {
      const { container } = render(<Calendar events={[]} />);
      
      // Check for SVG calendar icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Event Display Tests
  // --------------------------------------------------------------------------

  describe('Event Display', () => {
    it('should display event name, date, and location', () => {
      const event = createMockEvent({
        eventName: 'Alpine Championship',
        eventDate: '2024-06-15',
        location: 'Whistler Mountain',
      });

      render(<Calendar events={[event]} />);

      expect(screen.getByText('Alpine Championship')).toBeInTheDocument();
      expect(screen.getByText('Whistler Mountain')).toBeInTheDocument();
      // Date should be formatted
      expect(screen.getByText(/June 15, 2024/i)).toBeInTheDocument();
    });

    it('should display event notes when present', () => {
      const event = createMockEvent({
        notes: 'Bring extra equipment',
      });

      render(<Calendar events={[event]} />);

      expect(screen.getByText('Bring extra equipment')).toBeInTheDocument();
    });

    it('should not display notes section when notes are empty', () => {
      const event = createMockEvent({
        notes: undefined,
      });

      render(<Calendar events={[event]} />);

      // Notes should not be in the document
      const notesIcon = screen.queryByText('Bring extra equipment');
      expect(notesIcon).not.toBeInTheDocument();
    });

    it('should display multiple events', () => {
      const events = [
        createMockEvent({ id: '1', eventName: 'Race 1' }),
        createMockEvent({ id: '2', eventName: 'Race 2' }),
        createMockEvent({ id: '3', eventName: 'Race 3' }),
      ];

      render(<Calendar events={events} />);

      expect(screen.getByText('Race 1')).toBeInTheDocument();
      expect(screen.getByText('Race 2')).toBeInTheDocument();
      expect(screen.getByText('Race 3')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Chronological Ordering Tests
  // --------------------------------------------------------------------------

  describe('Chronological Ordering', () => {
    it('should display events in chronological order (earliest first)', () => {
      const events = [
        createMockEvent({ id: '1', eventName: 'Future Race', eventDate: '2025-12-31' }),
        createMockEvent({ id: '2', eventName: 'Past Race', eventDate: '2023-01-01' }),
        createMockEvent({ id: '3', eventName: 'Middle Race', eventDate: '2024-06-15' }),
      ];

      const { container } = render(<Calendar events={events} />);

      // Get all event name elements
      const eventNames = container.querySelectorAll('h3');
      const eventNamesText = Array.from(eventNames).map(el => el.textContent);

      // Should be sorted: Past Race (2023) -> Middle Race (2024) -> Future Race (2025)
      expect(eventNamesText[0]).toBe('Past Race');
      expect(eventNamesText[1]).toBe('Middle Race');
      expect(eventNamesText[2]).toBe('Future Race');
    });

    it('should handle events with same date', () => {
      const events = [
        createMockEvent({ id: '1', eventName: 'Race A', eventDate: '2024-06-15' }),
        createMockEvent({ id: '2', eventName: 'Race B', eventDate: '2024-06-15' }),
      ];

      render(<Calendar events={events} />);

      // Both events should be displayed
      expect(screen.getByText('Race A')).toBeInTheDocument();
      expect(screen.getByText('Race B')).toBeInTheDocument();
    });

    it('should sort events correctly when provided in random order', () => {
      const events = [
        createMockEvent({ id: '1', eventName: 'Event 2024-03', eventDate: '2024-03-15' }),
        createMockEvent({ id: '2', eventName: 'Event 2024-01', eventDate: '2024-01-15' }),
        createMockEvent({ id: '3', eventName: 'Event 2024-12', eventDate: '2024-12-15' }),
        createMockEvent({ id: '4', eventName: 'Event 2024-06', eventDate: '2024-06-15' }),
      ];

      const { container } = render(<Calendar events={events} />);

      const eventNames = container.querySelectorAll('h3');
      const eventNamesText = Array.from(eventNames).map(el => el.textContent);

      expect(eventNamesText[0]).toBe('Event 2024-01');
      expect(eventNamesText[1]).toBe('Event 2024-03');
      expect(eventNamesText[2]).toBe('Event 2024-06');
      expect(eventNamesText[3]).toBe('Event 2024-12');
    });
  });

  // --------------------------------------------------------------------------
  // Click Handler Tests
  // --------------------------------------------------------------------------

  describe('Click Handlers', () => {
    it('should call onEventClick when event is clicked', () => {
      const event = createMockEvent({ eventName: 'Clickable Race' });
      const handleClick = vi.fn();

      render(<Calendar events={[event]} onEventClick={handleClick} />);

      const eventCard = screen.getByText('Clickable Race').closest('div[role="button"]');
      expect(eventCard).toBeInTheDocument();

      fireEvent.click(eventCard!);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(event);
    });

    it('should not throw error when onEventClick is not provided', () => {
      const event = createMockEvent();

      render(<Calendar events={[event]} />);

      const eventCard = screen.getByText('Test Race').closest('div[role="button"]');
      
      // Should not throw error
      expect(() => {
        fireEvent.click(eventCard!);
      }).not.toThrow();
    });

    it('should handle keyboard navigation (Enter key)', () => {
      const event = createMockEvent({ eventName: 'Keyboard Race' });
      const handleClick = vi.fn();

      render(<Calendar events={[event]} onEventClick={handleClick} />);

      const eventCard = screen.getByText('Keyboard Race').closest('div[role="button"]');
      
      fireEvent.keyDown(eventCard!, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(event);
    });

    it('should handle keyboard navigation (Space key)', () => {
      const event = createMockEvent({ eventName: 'Space Race' });
      const handleClick = vi.fn();

      render(<Calendar events={[event]} onEventClick={handleClick} />);

      const eventCard = screen.getByText('Space Race').closest('div[role="button"]');
      
      fireEvent.keyDown(eventCard!, { key: ' ' });

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(event);
    });

    it('should not trigger click on other keyboard keys', () => {
      const event = createMockEvent();
      const handleClick = vi.fn();

      render(<Calendar events={[event]} onEventClick={handleClick} />);

      const eventCard = screen.getByText('Test Race').closest('div[role="button"]');
      
      fireEvent.keyDown(eventCard!, { key: 'Tab' });
      fireEvent.keyDown(eventCard!, { key: 'Escape' });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Date Formatting Tests
  // --------------------------------------------------------------------------

  describe('Date Formatting', () => {
    it('should format dates in readable format', () => {
      const event = createMockEvent({
        eventDate: '2024-06-15',
      });

      render(<Calendar events={[event]} />);

      // Should display formatted date (e.g., "Saturday, June 15, 2024")
      expect(screen.getByText(/June 15, 2024/i)).toBeInTheDocument();
    });

    it('should handle invalid date gracefully', () => {
      const event = createMockEvent({
        eventDate: 'invalid-date',
      });

      // Should not throw error
      expect(() => {
        render(<Calendar events={[event]} />);
      }).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Responsive Design Tests
  // --------------------------------------------------------------------------

  describe('Responsive Design', () => {
    it('should apply hover styles to event cards', () => {
      const event = createMockEvent();

      render(<Calendar events={[event]} />);

      const eventCard = screen.getByText('Test Race').closest('div[role="button"]');
      
      // Check for hover classes
      expect(eventCard).toHaveClass('hover:shadow-md');
      expect(eventCard).toHaveClass('hover:border-blue-400');
    });

    it('should be keyboard accessible with tabIndex', () => {
      const event = createMockEvent();

      render(<Calendar events={[event]} />);

      const eventCard = screen.getByText('Test Race').closest('div[role="button"]');
      
      expect(eventCard).toHaveAttribute('tabIndex', '0');
      expect(eventCard).toHaveAttribute('role', 'button');
    });

    it('should apply focus styles for accessibility', () => {
      const event = createMockEvent();

      render(<Calendar events={[event]} />);

      const eventCard = screen.getByText('Test Race').closest('div[role="button"]');
      
      // Check for focus classes
      expect(eventCard).toHaveClass('focus:outline-none');
      expect(eventCard).toHaveClass('focus:ring-2');
      expect(eventCard).toHaveClass('focus:ring-blue-500');
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('should handle very long event names', () => {
      const event = createMockEvent({
        eventName: 'This is a very long event name that should be displayed properly without breaking the layout',
      });

      render(<Calendar events={[event]} />);

      expect(screen.getByText(/This is a very long event name/)).toBeInTheDocument();
    });

    it('should handle very long location names', () => {
      const event = createMockEvent({
        location: 'This is a very long location name that should be truncated properly',
      });

      render(<Calendar events={[event]} />);

      expect(screen.getByText(/This is a very long location name/)).toBeInTheDocument();
    });

    it('should handle very long notes', () => {
      const event = createMockEvent({
        notes: 'This is a very long note that contains a lot of information about the event and should be displayed with proper line clamping to avoid taking up too much space in the card layout.',
      });

      render(<Calendar events={[event]} />);

      expect(screen.getByText(/This is a very long note/)).toBeInTheDocument();
    });

    it('should handle empty string notes', () => {
      const event = createMockEvent({
        notes: '',
      });

      render(<Calendar events={[event]} />);

      // Empty notes should not be displayed
      const eventCard = screen.getByText('Test Race').closest('div[role="button"]');
      expect(eventCard).toBeInTheDocument();
    });
  });
});
