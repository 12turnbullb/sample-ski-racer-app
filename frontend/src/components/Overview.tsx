/**
 * Overview Component - Home Page
 * 
 * Displays a welcome message with the racer's name and shows the next upcoming event.
 * Features a futuristic ski-themed design with dynamic gradients and glassmorphism.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { RacerProfile, RacingEvent } from '../types';

interface OverviewProps {
  profile: RacerProfile | null;
  events: RacingEvent[];
  isLoading: boolean;
}

/**
 * Overview component showing welcome message and next event.
 */
export default function Overview({ profile, events, isLoading }: OverviewProps) {
  const [nextEvent, setNextEvent] = useState<RacingEvent | null>(null);

  useEffect(() => {
    if (events.length > 0) {
      // Find the next upcoming event (closest to today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingEvents = events
        .filter(event => new Date(event.eventDate) >= today)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

      setNextEvent(upcomingEvents[0] || null);
    } else {
      setNextEvent(null);
    }
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-ice-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-ice-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-ice-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const racerName = profile?.racerName || 'Racer';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 grid-pattern opacity-30"></div>
      <div className="absolute inset-0 bg-mesh-gradient"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-ice-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Welcome Message */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-block mb-6">
            <div className="text-8xl animate-float">🎿</div>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-4 drop-shadow-lg">
            <span className="gradient-text">Welcome, {racerName}!</span>
          </h1>
          <p className="text-xl md:text-2xl text-ice-200 drop-shadow-md">
            Ready to dominate the slopes?
          </p>
        </div>

        {/* Next Event Card */}
        <div className="w-full max-w-2xl mb-12 animate-slide-in-up">
          {nextEvent ? (
            <div className="glass-dark rounded-2xl shadow-glass border border-white/10 p-8 card-hover">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-3xl mr-3 animate-pulse">📅</span>
                <span className="gradient-text">Next Up</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-3 neon-text">
                    {nextEvent.eventName}
                  </h3>
                  <div className="flex items-center text-ice-200 mb-3">
                    <span className="text-xl mr-3">📍</span>
                    <span className="text-lg">{nextEvent.location}</span>
                  </div>
                  <div className="flex items-center text-ice-200 mb-4">
                    <span className="text-xl mr-3">📆</span>
                    <span className="text-lg font-medium">
                      {new Date(nextEvent.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {nextEvent.notes && (
                    <div className="glass rounded-xl p-4 mt-4 border border-ice-500/20">
                      <p className="text-ice-100">{nextEvent.notes}</p>
                    </div>
                  )}
                </div>
                <Link
                  to="/calendar"
                  className="inline-block w-full text-center px-6 py-3 bg-gradient-ice text-white rounded-xl font-semibold hover:shadow-neon-blue transition-all"
                >
                  View Full Calendar
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass-dark rounded-2xl shadow-glass border border-white/10 p-8 text-center card-hover">
              <div className="text-6xl mb-4 animate-float">📅</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                No Upcoming Events
              </h2>
              <p className="text-ice-300 mb-6">
                You don't have any events scheduled yet. Add your first race to get started!
              </p>
              <Link
                to="/calendar"
                className="inline-block px-6 py-3 bg-gradient-ice text-white rounded-xl font-semibold hover:shadow-neon-blue transition-all"
              >
                Add Event
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <Link
            to="/profile"
            className="group glass-dark rounded-2xl shadow-glass border border-white/10 p-8 card-hover text-center"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👤</div>
            <h3 className="text-xl font-bold text-white mb-2">Profile</h3>
            <p className="text-sm text-ice-300">View and edit your profile</p>
          </Link>
          <Link
            to="/documents"
            className="group glass-dark rounded-2xl shadow-glass border border-white/10 p-8 card-hover text-center"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎥</div>
            <h3 className="text-xl font-bold text-white mb-2">Analyze</h3>
            <p className="text-sm text-ice-300">AI-powered ski form analysis</p>
          </Link>
          <Link
            to="/calendar"
            className="group glass-dark rounded-2xl shadow-glass border border-white/10 p-8 card-hover text-center"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📅</div>
            <h3 className="text-xl font-bold text-white mb-2">Calendar</h3>
            <p className="text-sm text-ice-300">View all racing events</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
