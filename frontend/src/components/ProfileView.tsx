/**
 * ProfileView Component
 * 
 * A component for displaying racer profile data in a clean, readable format.
 * Shows all profile fields with proper formatting and provides edit/delete actions.
 * 
 * Requirements: 10.1, 10.5
 */

import { useState } from 'react';
import type { RacerProfile } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface ProfileViewProps {
  /** The racer profile to display */
  profile: RacerProfile;
  /** Callback invoked when user clicks edit button */
  onEdit: () => void;
  /** Callback invoked when user confirms delete */
  onDelete: () => void;
}

/**
 * ProfileView component for displaying racer profile data.
 * 
 * Features:
 * - Clean, card-like layout with Tailwind CSS
 * - Formatted numeric values (e.g., "175.5 cm", "70.2 kg")
 * - Responsive design for mobile and desktop
 * - Edit and delete action buttons
 * - Confirmation dialog before delete
 * - Graceful handling of long text content
 */
export default function ProfileView({ profile, onEdit, onDelete }: ProfileViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Handle delete button click - show confirmation dialog
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  /**
   * Handle delete confirmation - invoke callback and close dialog
   */
  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  /**
   * Handle delete cancellation - close dialog
   */
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  /**
   * Format a date string to a more readable format
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 glass-dark rounded-2xl shadow-glass border border-white/10">
        {/* Header with title and action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-barlow-condensed font-bold uppercase gradient-text">Racer Profile</h2>
            <p className="text-lg text-gray-300 mt-1">{profile.racerName}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="btn-primary px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-usa-red focus:ring-offset-2 focus:ring-offset-carbon-900"
            >
              Edit Profile
            </button>
            <button
              onClick={handleDeleteClick}
              className="px-5 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold uppercase tracking-wide text-sm hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-carbon-900 transition-all"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Profile data grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Physical Measurements Section */}
          <div className="glass rounded-xl p-5 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-usa-red/70 uppercase tracking-widest border-b border-white/10 pb-3">
              Physical Measurements
            </h3>

            {/* Height */}
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Height</dt>
              <dd className="mt-1 text-xl font-semibold text-white">
                {profile.height.toFixed(1)} <span className="text-gray-500 text-base font-normal">cm</span>
              </dd>
            </div>

            {/* Weight */}
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</dt>
              <dd className="mt-1 text-xl font-semibold text-white">
                {profile.weight.toFixed(1)} <span className="text-gray-500 text-base font-normal">kg</span>
              </dd>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="glass rounded-xl p-5 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-usa-red/70 uppercase tracking-widest border-b border-white/10 pb-3">
              Equipment
            </h3>

            {/* Ski Types */}
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ski Types</dt>
              <dd className="mt-1 text-base text-white break-words">
                {profile.skiTypes}
              </dd>
            </div>

            {/* Binding Measurements */}
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Binding Measurements</dt>
              <dd className="mt-1 text-base text-white whitespace-pre-wrap break-words">
                {profile.bindingMeasurements}
              </dd>
            </div>
          </div>

          {/* Personal Records Section */}
          <div className="glass rounded-xl p-5 border border-white/10 space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold text-usa-red/70 uppercase tracking-widest border-b border-white/10 pb-3">
              Personal Records
            </h3>
            <div>
              <dd className="text-base text-white whitespace-pre-wrap break-words leading-relaxed">
                {profile.personalRecords}
              </dd>
            </div>
          </div>

          {/* Racing Goals Section */}
          <div className="glass rounded-xl p-5 border border-white/10 space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold text-usa-red/70 uppercase tracking-widest border-b border-white/10 pb-3">
              Racing Goals
            </h3>
            <div>
              <dd className="text-base text-white whitespace-pre-wrap break-words leading-relaxed">
                {profile.racingGoals}
              </dd>
            </div>
          </div>
        </div>

        {/* Metadata footer */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-gray-500">
            <div>
              <span className="font-medium text-gray-400">Created:</span> {formatDate(profile.createdAt)}
            </div>
            <div>
              <span className="font-medium text-gray-400">Last Updated:</span> {formatDate(profile.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone and will also delete all associated documents and events."
        confirmText="Delete Profile"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
