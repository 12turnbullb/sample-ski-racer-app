/**
 * Overview Component - Home Page
 *
 * Displays a welcome message with the racer's name and shows the next upcoming event.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { RacerProfile, RacingEvent } from '../types';

interface OverviewProps {
  profile: RacerProfile | null;
  events: RacingEvent[];
  isLoading: boolean;
}

export default function Overview({ profile, events, isLoading }: OverviewProps) {
  const [nextEvent, setNextEvent] = useState<RacingEvent | null>(null);

  useEffect(() => {
    if (events.length > 0) {
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
            <div className="absolute inset-0 border-4 border-usa-red/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-usa-red rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const racerName = profile?.racerName || 'Racer';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 grid-pattern opacity-20"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Welcome Message */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-block mb-4 text-6xl">🎿</div>
          <h1 className="text-5xl md:text-7xl font-barlow-condensed font-bold uppercase mb-3 tracking-tight">
            <span className="gradient-text">Welcome, {racerName}!</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300">
            Ready to dominate the slopes?
          </p>
        </div>

        {/* Next Event Card */}
        <div className="w-full max-w-2xl mb-12 animate-slide-in-up">
          {nextEvent ? (
            <div className="glass-dark rounded-2xl border border-usa-red/25 p-8 card-hover">
              <h2 className="text-lg font-barlow-condensed font-bold uppercase tracking-widest text-usa-red/80 mb-4">
                Next Up
              </h2>
              <div className="space-y-4">
                <h3 className="text-3xl font-barlow-condensed font-bold text-white">
                  {nextEvent.eventName}
                </h3>
                <div className="flex items-center text-gray-300 gap-2">
                  <span>📍</span>
                  <span>{nextEvent.location}</span>
                </div>
                <div className="flex items-center text-gray-300 gap-2">
                  <span>📆</span>
                  <span className="font-medium">
                    {new Date(nextEvent.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {nextEvent.notes && (
                  <div className="glass rounded-xl p-4 border border-white/10">
                    <p className="text-gray-200 text-sm">{nextEvent.notes}</p>
                  </div>
                )}
                <Link
                  to="/calendar"
                  className="inline-block w-full text-center btn-primary px-6 py-3"
                >
                  View Full Calendar
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass-dark rounded-2xl border border-white/10 p-8 text-center card-hover">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-2xl font-barlow-condensed font-bold uppercase text-white mb-3">
                No Upcoming Events
              </h2>
              <p className="text-gray-400 mb-6">
                You don't have any events scheduled yet. Add your first race to get started!
              </p>
              <Link
                to="/calendar"
                className="inline-block btn-primary px-6 py-3"
              >
                Add Event
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {[
            { to: '/profile', icon: '👤', label: 'Profile', desc: 'View and edit your profile' },
            { to: '/documents', icon: '🎥', label: 'Analyze', desc: 'AI-powered ski form analysis' },
            { to: '/calendar', icon: '📅', label: 'Calendar', desc: 'View all racing events' },
          ].map(({ to, icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="group glass-dark rounded-2xl border border-white/10 p-7 card-hover text-center"
            >
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="text-lg font-barlow-condensed font-bold uppercase tracking-wide text-white mb-1">{label}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
