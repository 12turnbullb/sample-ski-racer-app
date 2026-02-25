/**
 * Main App Component with Routing
 * 
 * This is the main application entry point that ties all components together.
 * It provides client-side routing between Profile, Documents, and Calendar views,
 * manages racer ID state, and includes a responsive navigation menu.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.6
 * 
 * Features:
 * - React Router for client-side navigation
 * - Routes for Profile, Documents, and Calendar views
 * - Responsive navigation menu with active state indicators
 * - Racer ID state management (creates racer on first load if needed)
 * - Integration of all CRUD components
 * - Tailwind CSS styling
 * - Loading states and error handling
 * - Mobile-friendly hamburger menu
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import ProfileForm from './components/ProfileForm';
import ProfileView from './components/ProfileView';
import DocumentUploader from './components/DocumentUploader';
import VideoAnalysisViewer from './components/VideoAnalysisViewer';
import Calendar from './components/Calendar';
import CalendarGrid from './components/CalendarGrid';
import EventForm from './components/EventForm';
import Overview from './components/Overview';
import ErrorBoundary from './components/ErrorBoundary';
import ConfirmDialog from './components/ConfirmDialog';
import { ToastProvider, useToast } from './components/Toast';
import {
  getRacer,
  createRacer,
  deleteRacer,
  getDocuments,
  deleteDocument,
  getEvents,
  deleteEvent,
} from './services/api';
import type { RacerProfile, Document, RacingEvent } from './types';
import { ApiClientError } from './services/api';

// ============================================================================
// Navigation Component
// ============================================================================

/**
 * Navigation menu component with responsive design.
 * Shows active route highlighting and mobile hamburger menu.
 */
function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/documents', label: 'Analyze', icon: '🎥' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-dark border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🎿</div>
            <Link to="/" className="text-2xl font-barlow-condensed font-bold tracking-wide gradient-text hover:opacity-90 transition-opacity">
              Beek Racing
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-usa-red text-white shadow-usa-red'
                      : 'text-gray-300 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-usa-red transition-all"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-slide-in-up glass-dark border-t border-white/10">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-full text-base font-bold uppercase tracking-wide transition-all ${
                  isActive(item.path)
                    ? 'bg-usa-red text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/8'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

// ============================================================================
// Profile Page Component
// ============================================================================

interface ProfilePageProps {
  racerId: string;
  onRacerDeleted: () => void;
}

function ProfilePage({ racerId, onRacerDeleted }: ProfilePageProps) {
  const [profile, setProfile] = useState<RacerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [racerId]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRacer(racerId);
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        showError(err.message);
      } else {
        setError('Failed to load profile');
        showError('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (savedProfile: RacerProfile) => {
    setProfile(savedProfile);
    setIsEditing(false);
    showSuccess('Profile saved successfully');
  };

  const handleDelete = async () => {
    try {
      await deleteRacer(racerId);
      showSuccess('Profile deleted successfully');
      onRacerDeleted();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        showError(err.message);
      } else {
        setError('Failed to delete profile');
        showError('Failed to delete profile');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-usa-red/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-usa-red rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-usa-navy-medium rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="glass-dark border border-red-500/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Profile</h3>
              <p className="text-ice-300">{error}</p>
              <button
                onClick={loadProfile}
                className="mt-4 btn-primary px-6 py-2.5 font-bold"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing || !profile) {
    return (
      <ProfileForm
        profile={profile || undefined}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <ProfileView
      profile={profile}
      onEdit={() => setIsEditing(true)}
      onDelete={handleDelete}
    />
  );
}

// ============================================================================
// Documents Page Component
// ============================================================================

interface DocumentsPageProps {
  racerId: string;
}

function DocumentsPage({ racerId }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [racerId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDocuments(racerId);
      setDocuments(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        showError(err.message);
      } else {
        setError('Failed to load documents');
        showError('Failed to load documents');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (document: Document) => {
    setDocuments((prev) => [document, ...prev]);
    showSuccess('Document uploaded successfully');
  };

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      showSuccess('Document deleted successfully');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        showError(err.message);
      } else {
        setError('Failed to delete document');
        showError('Failed to delete document');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {/* Error message */}
      {error && (
        <div className="glass-dark border border-red-500/30 rounded-2xl p-4 animate-slide-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Document uploader */}
      <DocumentUploader racerId={racerId} onUploadComplete={handleUploadComplete} />

      {/* Video/Image analysis viewer */}
      <VideoAnalysisViewer
        documents={documents}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}

// ============================================================================
// Calendar Page Component
// ============================================================================

interface CalendarPageProps {
  racerId: string;
}

function CalendarPage({ racerId }: CalendarPageProps) {
  const [events, setEvents] = useState<RacingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<RacingEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const { showSuccess, showError } = useToast();

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [racerId]);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEvents(racerId);
      setEvents(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        showError(err.message);
      } else {
        setError('Failed to load events');
        showError('Failed to load events');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (event: RacingEvent) => {
    setSelectedEvent(event);
  };

  const handleEventSave = (event: RacingEvent) => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? event : e))
      );
      showSuccess('Event updated successfully');
    } else {
      // Add new event
      setEvents((prev) => [...prev, event]);
      showSuccess('Event created successfully');
    }
    setSelectedEvent(null);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setSelectedEvent(null);
    setIsCreating(false);
  };

  const handleEventDelete = async (eventId: string) => {
    setEventToDelete(eventId);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEvent(eventToDelete);
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete));
      showSuccess('Event deleted successfully');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        showError(err.message);
      } else {
        setError('Failed to delete event');
        showError('Failed to delete event');
      }
    } finally {
      setEventToDelete(null);
    }
  };

  const cancelDelete = () => {
    setEventToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-usa-red/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-usa-red rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-usa-navy-medium rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-400 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  // Show event form when creating or editing
  if (isCreating || selectedEvent) {
    return (
      <EventForm
        racerId={racerId}
        event={selectedEvent || undefined}
        onSave={handleEventSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Error message */}
      {error && (
        <div className="glass-dark border border-red-500/30 rounded-2xl p-4 animate-slide-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header with Add Event button and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-barlow-condensed font-bold uppercase gradient-text">Racing Events</h2>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="inline-flex rounded-full glass-dark p-1 border border-white/15">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-1.5 text-sm font-bold uppercase tracking-wide rounded-full transition-all ${
                viewMode === 'calendar'
                  ? 'bg-usa-red text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/8'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 text-sm font-bold uppercase tracking-wide rounded-full transition-all ${
                viewMode === 'list'
                  ? 'bg-usa-red text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/8'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </span>
            </button>
          </div>

          {/* Add Event button */}
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-usa-red focus:ring-offset-2 focus:ring-offset-carbon-900"
          >
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </span>
          </button>
        </div>
      </div>

      {/* Calendar or List view */}
      {viewMode === 'calendar' ? (
        <CalendarGrid 
          events={events} 
          onEventClick={handleEventClick} 
          onEventDelete={handleEventDelete} 
        />
      ) : (
        <Calendar 
          events={events} 
          onEventClick={handleEventClick} 
          onEventDelete={handleEventDelete} 
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={eventToDelete !== null}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

// ============================================================================
// Main App Component
// ============================================================================

/**
 * Main App component with routing and state management.
 * 
 * Manages racer ID state and provides routing between views.
 * Creates a default racer profile on first load if none exists.
 */
function AppContent() {
  const location = useLocation();
  const [racerId, setRacerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<RacerProfile | null>(null);
  const [events, setEvents] = useState<RacingEvent[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const { showError, showInfo } = useToast();

  // Initialize racer on mount
  useEffect(() => {
    initializeRacer();
  }, []);

  // Load profile and events when racerId changes
  useEffect(() => {
    if (racerId) {
      loadData();
    }
  }, [racerId]);

  // Reload data when navigating to home page
  useEffect(() => {
    if (racerId && location.pathname === '/') {
      loadData();
    }
  }, [location.pathname, racerId]);

  /**
   * Load profile and events data.
   */
  const loadData = async () => {
    if (!racerId) return;
    
    setIsLoadingData(true);
    try {
      const [profileData, eventsData] = await Promise.all([
        getRacer(racerId),
        getEvents(racerId),
      ]);
      setProfile(profileData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  /**
   * Initialize racer ID.
   * Checks localStorage for existing racer ID, or creates a new racer.
   */
  const initializeRacer = async () => {
    setIsInitializing(true);
    setInitError(null);

    try {
      // Check if we have a stored racer ID
      const storedRacerId = localStorage.getItem('racerId');

      if (storedRacerId) {
        // Verify the racer still exists
        try {
          await getRacer(storedRacerId);
          setRacerId(storedRacerId);
          setIsInitializing(false);
          return;
        } catch (err) {
          // Racer doesn't exist anymore, clear storage
          localStorage.removeItem('racerId');
          showInfo('Creating a new profile...');
        }
      }

      // Create a new racer with default values
      const newRacer = await createRacer({
        racerName: 'Ski Racer',
        height: 175,
        weight: 70,
        skiTypes: 'Slalom, Giant Slalom',
        bindingMeasurements: 'DIN: 8.0, Boot sole length: 305mm',
        personalRecords: 'No records yet',
        racingGoals: 'Set your racing goals here',
      });

      // Store racer ID
      localStorage.setItem('racerId', newRacer.id);
      setRacerId(newRacer.id);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setInitError(err.message);
        showError(err.message);
      } else {
        const errorMsg = 'Failed to initialize application. Please check that the backend is running.';
        setInitError(errorMsg);
        showError(errorMsg);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Handle racer deletion.
   * Creates a new racer after deletion.
   */
  const handleRacerDeleted = () => {
    localStorage.removeItem('racerId');
    setRacerId(null);
    initializeRacer();
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-usa-red/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-usa-red rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-usa-navy-medium rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl animate-float">🎿</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-barlow-condensed font-bold uppercase gradient-text">Beek Racing</p>
            <p className="text-gray-400">Initializing your racing platform...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (initError || !racerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-dark rounded-2xl shadow-glass border border-white/10 p-8">
          <div className="text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>
              <svg
                className="relative w-16 h-16 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Initialization Failed
              </h2>
              <p className="text-gray-300">
                {initError || 'Failed to initialize application'}
              </p>
            </div>
            <button
              onClick={initializeRacer}
              className="w-full btn-primary px-6 py-3 focus:outline-none focus:ring-2 focus:ring-usa-red focus:ring-offset-2 focus:ring-offset-carbon-900"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main app with routing
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="py-8">
        <Routes>
          <Route 
            path="/" 
            element={<Overview profile={profile} events={events} isLoading={isLoadingData} />} 
          />
          <Route
            path="/profile"
            element={<ProfilePage racerId={racerId} onRacerDeleted={handleRacerDeleted} />}
          />
          <Route
            path="/documents"
            element={<DocumentsPage racerId={racerId} />}
          />
          <Route
            path="/calendar"
            element={<CalendarPage racerId={racerId} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/**
 * Root App component with BrowserRouter, ErrorBoundary, and ToastProvider.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
