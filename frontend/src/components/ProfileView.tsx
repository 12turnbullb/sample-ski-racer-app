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
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        {/* Header with title and action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Racer Profile</h2>
            <p className="text-lg text-gray-600 mt-1">{profile.racerName}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={handleDeleteClick}
              className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Delete Profile
            </button>
          </div>
        </div>

        {/* Profile data grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Physical Measurements Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Physical Measurements
            </h3>

            {/* Height */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Height</dt>
              <dd className="mt-1 text-base text-gray-900">
                {profile.height.toFixed(1)} cm
              </dd>
            </div>

            {/* Weight */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Weight</dt>
              <dd className="mt-1 text-base text-gray-900">
                {profile.weight.toFixed(1)} kg
              </dd>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Equipment
            </h3>

            {/* Ski Types */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Ski Types</dt>
              <dd className="mt-1 text-base text-gray-900 break-words">
                {profile.skiTypes}
              </dd>
            </div>

            {/* Binding Measurements */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Binding Measurements</dt>
              <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap break-words">
                {profile.bindingMeasurements}
              </dd>
            </div>
          </div>

          {/* Personal Records Section */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Personal Records
            </h3>
            <div>
              <dd className="text-base text-gray-900 whitespace-pre-wrap break-words">
                {profile.personalRecords}
              </dd>
            </div>
          </div>

          {/* Racing Goals Section */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Racing Goals
            </h3>
            <div>
              <dd className="text-base text-gray-900 whitespace-pre-wrap break-words">
                {profile.racingGoals}
              </dd>
            </div>
          </div>
        </div>

        {/* Metadata footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-gray-500">
            <div>
              <span className="font-medium">Created:</span> {formatDate(profile.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {formatDate(profile.updatedAt)}
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
