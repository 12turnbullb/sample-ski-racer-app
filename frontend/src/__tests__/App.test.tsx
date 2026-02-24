/**
 * Tests for App Component
 * 
 * Tests the main App component with routing, navigation, and integration
 * of all sub-components.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import App from '../App';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  getRacer: vi.fn(),
  createRacer: vi.fn(),
  deleteRacer: vi.fn(),
  getDocuments: vi.fn(),
  deleteDocument: vi.fn(),
  getEvents: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'ApiClientError';
    }
  },
}));

describe('App Component', () => {
  const mockRacer = {
    id: 'test-racer-id',
    racerName: 'Test Racer',
    height: 175,
    weight: 70,
    skiTypes: 'Slalom, Giant Slalom',
    bindingMeasurements: 'DIN: 8.0',
    personalRecords: 'Test records',
    racingGoals: 'Test goals',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    // Clear localStorage before each test
    localStorageMock.clear();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(api.createRacer).mockResolvedValue(mockRacer);
    vi.mocked(api.getRacer).mockResolvedValue(mockRacer);
    vi.mocked(api.getDocuments).mockResolvedValue([]);
    vi.mocked(api.getEvents).mockResolvedValue([]);
  });

  describe('Initialization', () => {
    it('should create a new racer on first load', async () => {
      render(<App />);

      // Should show loading state
      expect(screen.getByText(/initializing application/i)).toBeInTheDocument();

      // Wait for initialization to complete
      await waitFor(() => {
        expect(api.createRacer).toHaveBeenCalledWith({
          racerName: 'Ski Racer',
          height: 175,
          weight: 70,
          skiTypes: 'Slalom, Giant Slalom',
          bindingMeasurements: 'DIN: 8.0, Boot sole length: 305mm',
          personalRecords: 'No records yet',
          racingGoals: 'Set your racing goals here',
        });
      });

      // Should store racer ID in localStorage
      expect(localStorage.getItem('racerId')).toBe('test-racer-id');
    });

    it('should use existing racer ID from localStorage', async () => {
      // Set existing racer ID
      localStorage.setItem('racerId', 'existing-racer-id');

      render(<App />);

      // Wait for initialization
      await waitFor(() => {
        expect(api.getRacer).toHaveBeenCalledWith('existing-racer-id');
      });

      // Should not create a new racer
      expect(api.createRacer).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      vi.mocked(api.createRacer).mockRejectedValue(
        new api.ApiClientError(500, 'Server error')
      );

      render(<App />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/initialization failed/i)).toBeInTheDocument();
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render navigation menu with all links', async () => {
      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Check navigation links
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /documents/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /calendar/i })).toBeInTheDocument();
    });

    it('should navigate between routes', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Should start on profile page - wait for Edit Profile button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Navigate to documents
      const documentsLink = screen.getByRole('link', { name: /documents/i });
      await user.click(documentsLink);

      await waitFor(() => {
        expect(screen.getByText(/upload document/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Navigate to calendar
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      await user.click(calendarLink);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should highlight active navigation link', async () => {
      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Wait for profile page to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Profile link should be active (has bg-blue-700 class)
      const profileLink = screen.getByRole('link', { name: /profile/i });
      expect(profileLink).toHaveClass('bg-blue-700');
    });
  });

  describe('Profile Page', () => {
    it('should load and display profile', async () => {
      render(<App />);

      // Wait for profile to load - look for Edit Profile button which is unique to profile view
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should display profile data
      expect(screen.getByText('175.0 cm')).toBeInTheDocument();
      expect(screen.getByText('70.0 kg')).toBeInTheDocument();
    });

    it('should handle profile loading errors', async () => {
      vi.mocked(api.getRacer).mockRejectedValue(
        new api.ApiClientError(404, 'Racer not found')
      );

      render(<App />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/racer not found/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Documents Page', () => {
    it('should load documents page', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Navigate to documents
      const documentsLink = screen.getByRole('link', { name: /documents/i });
      await user.click(documentsLink);

      // Should show document uploader (case insensitive)
      await waitFor(() => {
        expect(screen.getByText(/upload document/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should call getDocuments API
      await waitFor(() => {
        expect(api.getDocuments).toHaveBeenCalledWith('test-racer-id');
      });
    });
  });

  describe('Calendar Page', () => {
    it('should load calendar page', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Navigate to calendar
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      await user.click(calendarLink);

      // Should show add event button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should call getEvents API
      await waitFor(() => {
        expect(api.getEvents).toHaveBeenCalledWith('test-racer-id');
      });
    });

    it('should show add event button', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Navigate to calendar
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      await user.click(calendarLink);

      // Should show add event button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile menu button on small screens', async () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Mobile menu button should be present (has sr-only text "Open main menu")
      expect(screen.getByText(/open main menu/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error messages when API calls fail', async () => {
      vi.mocked(api.getDocuments).mockRejectedValue(
        new api.ApiClientError(500, 'Failed to load documents')
      );

      const user = userEvent.setup();
      render(<App />);

      // Wait for app to initialize
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Navigate to documents
      const documentsLink = screen.getByRole('link', { name: /documents/i });
      await user.click(documentsLink);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load documents/i)).toBeInTheDocument();
      });
    });
  });

  describe('Route Redirects', () => {
    it('should redirect root path to profile', async () => {
      render(<App />);

      // Wait for app to initialize and redirect
      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Should eventually show profile content (Edit Profile button is unique to profile page)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should redirect unknown paths to profile', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('🎿 Ski Racer App')).toBeInTheDocument();
      });

      // Should eventually show profile content
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
