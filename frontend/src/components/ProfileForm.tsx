/**
 * ProfileForm Component
 * 
 * A form component for creating and editing racer profiles.
 * Supports both create and edit modes with client-side validation,
 * loading states, and error handling.
 * 
 * Requirements: 10.1, 10.5
 */

import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { RacerProfile, RacerProfileCreate, RacerProfileUpdate } from '../types';
import { createRacer, updateRacer } from '../services/api';
import { ApiClientError } from '../services/api';

interface ProfileFormProps {
  /** Optional existing profile for edit mode */
  profile?: RacerProfile;
  /** Callback invoked when profile is successfully saved */
  onSave: (profile: RacerProfile) => void;
  /** Callback invoked when user cancels the form */
  onCancel: () => void;
}

interface FormData {
  racerName: string;
  height: string;
  weight: string;
  skiTypes: string;
  bindingMeasurements: string;
  personalRecords: string;
  racingGoals: string;
}

interface FormErrors {
  racerName?: string;
  height?: string;
  weight?: string;
  skiTypes?: string;
  bindingMeasurements?: string;
  personalRecords?: string;
  racingGoals?: string;
  general?: string;
}

/**
 * ProfileForm component for creating and editing racer profiles.
 * 
 * Features:
 * - Client-side validation (height > 0, weight > 0, non-empty required fields)
 * - Loading state during API calls
 * - Inline error messages for each field
 * - General error message for API failures
 * - Responsive design with Tailwind CSS
 * - Support for both create and edit modes
 */
export default function ProfileForm({ profile, onSave, onCancel }: ProfileFormProps) {
  // Initialize form data from profile prop (edit mode) or empty values (create mode)
  const [formData, setFormData] = useState<FormData>({
    racerName: profile?.racerName || '',
    height: profile?.height.toString() || '',
    weight: profile?.weight.toString() || '',
    skiTypes: profile?.skiTypes || '',
    bindingMeasurements: profile?.bindingMeasurements || '',
    personalRecords: profile?.personalRecords || '',
    racingGoals: profile?.racingGoals || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle input field changes.
   * Clears the error for the changed field.
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Validate form data before submission.
   * Returns true if all validations pass, false otherwise.
   * Sets error messages for invalid fields.
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate racer name
    if (!formData.racerName.trim()) {
      newErrors.racerName = 'Racer name is required';
    }

    // Validate height
    const height = parseFloat(formData.height);
    if (!formData.height.trim()) {
      newErrors.height = 'Height is required';
    } else if (isNaN(height)) {
      newErrors.height = 'Height must be a valid number';
    } else if (height <= 0) {
      newErrors.height = 'Height must be greater than 0';
    }

    // Validate weight
    const weight = parseFloat(formData.weight);
    if (!formData.weight.trim()) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(weight)) {
      newErrors.weight = 'Weight must be a valid number';
    } else if (weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    }

    // Validate required text fields
    if (!formData.skiTypes.trim()) {
      newErrors.skiTypes = 'Ski types are required';
    }

    if (!formData.bindingMeasurements.trim()) {
      newErrors.bindingMeasurements = 'Binding measurements are required';
    }

    if (!formData.personalRecords.trim()) {
      newErrors.personalRecords = 'Personal records are required';
    }

    if (!formData.racingGoals.trim()) {
      newErrors.racingGoals = 'Racing goals are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission.
   * Validates form data, calls appropriate API method (create or update),
   * and invokes onSave callback on success.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear general error
    setErrors(prev => ({ ...prev, general: undefined }));

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API
      const profileData: RacerProfileCreate | RacerProfileUpdate = {
        racerName: formData.racerName.trim(),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        skiTypes: formData.skiTypes.trim(),
        bindingMeasurements: formData.bindingMeasurements.trim(),
        personalRecords: formData.personalRecords.trim(),
        racingGoals: formData.racingGoals.trim(),
      };

      let savedProfile: RacerProfile;

      if (profile) {
        // Edit mode: update existing profile
        savedProfile = await updateRacer(profile.id, profileData);
      } else {
        // Create mode: create new profile
        savedProfile = await createRacer(profileData as RacerProfileCreate);
      }

      // Success: invoke callback
      onSave(savedProfile);
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiClientError) {
        setErrors(prev => ({
          ...prev,
          general: error.message,
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          general: 'An unexpected error occurred. Please try again.',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="glass-dark rounded-2xl shadow-glass border border-white/10 p-8">
        <h2 className="text-3xl font-bold mb-8 gradient-text">
          {profile ? 'Edit Profile' : 'Create Profile'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General error message */}
          {errors.general && (
            <div className="glass-dark border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Racer Name field */}
          <div>
            <label htmlFor="racerName" className="block text-sm font-semibold text-ice-200 mb-2">
              Racer Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="racerName"
              name="racerName"
              value={formData.racerName}
              onChange={handleChange}
              className={`w-full px-4 py-3 glass-dark border ${
                errors.racerName ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all`}
              placeholder="Enter your name"
              disabled={isLoading}
            />
            {errors.racerName && (
              <p className="mt-2 text-sm text-red-400">{errors.racerName}</p>
            )}
          </div>

          {/* Height field */}
          <div>
            <label htmlFor="height" className="block text-sm font-semibold text-ice-200 mb-2">
              Height (cm) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              id="height"
              name="height"
              value={formData.height}
              onChange={handleChange}
              step="0.1"
              className={`w-full px-4 py-3 glass-dark border ${
                errors.height ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all`}
              placeholder="Enter height in centimeters"
              disabled={isLoading}
            />
            {errors.height && (
              <p className="mt-2 text-sm text-red-400">{errors.height}</p>
            )}
          </div>

          {/* Weight field */}
          <div>
            <label htmlFor="weight" className="block text-sm font-semibold text-ice-200 mb-2">
              Weight (kg) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.1"
              className={`w-full px-4 py-3 glass-dark border ${
                errors.weight ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all`}
              placeholder="Enter weight in kilograms"
              disabled={isLoading}
            />
            {errors.weight && (
              <p className="mt-2 text-sm text-red-400">{errors.weight}</p>
            )}
          </div>

          {/* Ski Types field */}
          <div>
            <label htmlFor="skiTypes" className="block text-sm font-semibold text-ice-200 mb-2">
              Ski Types <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="skiTypes"
              name="skiTypes"
              value={formData.skiTypes}
              onChange={handleChange}
              className={`w-full px-4 py-3 glass-dark border ${
                errors.skiTypes ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all`}
              placeholder="e.g., Slalom, Giant Slalom, Super-G"
              disabled={isLoading}
            />
            {errors.skiTypes && (
              <p className="mt-2 text-sm text-red-400">{errors.skiTypes}</p>
            )}
            <p className="mt-2 text-xs text-ice-400">
              Enter ski types separated by commas
            </p>
          </div>

          {/* Binding Measurements field */}
          <div>
            <label htmlFor="bindingMeasurements" className="block text-sm font-semibold text-ice-200 mb-2">
              Binding Measurements <span className="text-red-400">*</span>
            </label>
            <textarea
              id="bindingMeasurements"
              name="bindingMeasurements"
              value={formData.bindingMeasurements}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 glass-dark border ${
                errors.bindingMeasurements ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all resize-none`}
              placeholder="e.g., DIN: 8.5, Boot sole length: 305mm"
              disabled={isLoading}
            />
            {errors.bindingMeasurements && (
              <p className="mt-2 text-sm text-red-400">{errors.bindingMeasurements}</p>
            )}
            <p className="mt-2 text-xs text-ice-400">
              Enter binding measurements and settings
            </p>
          </div>

          {/* Personal Records field */}
          <div>
            <label htmlFor="personalRecords" className="block text-sm font-semibold text-ice-200 mb-2">
              Personal Records <span className="text-red-400">*</span>
            </label>
            <textarea
              id="personalRecords"
              name="personalRecords"
              value={formData.personalRecords}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-3 glass-dark border ${
                errors.personalRecords ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all resize-none`}
              placeholder="e.g., Slalom: 1:23.45 (2023-01-15), GS: 1:45.67 (2023-02-20)"
              disabled={isLoading}
            />
            {errors.personalRecords && (
              <p className="mt-2 text-sm text-red-400">{errors.personalRecords}</p>
            )}
            <p className="mt-2 text-xs text-ice-400">
              Enter your personal best times for different events
            </p>
          </div>

          {/* Racing Goals field */}
          <div>
            <label htmlFor="racingGoals" className="block text-sm font-semibold text-ice-200 mb-2">
              Racing Goals <span className="text-red-400">*</span>
            </label>
            <textarea
              id="racingGoals"
              name="racingGoals"
              value={formData.racingGoals}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-3 glass-dark border ${
                errors.racingGoals ? 'border-red-500/50' : 'border-white/10'
              } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all resize-none`}
              placeholder="Describe your racing goals and objectives for the season"
              disabled={isLoading}
            />
            {errors.racingGoals && (
              <p className="mt-2 text-sm text-red-400">{errors.racingGoals}</p>
            )}
          </div>

          {/* Form actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-carbon-900 ${
                isLoading
                  ? 'bg-ice-600/50 cursor-not-allowed'
                  : 'bg-gradient-ice hover:shadow-neon-blue'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {profile ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <span>{profile ? 'Update Profile' : 'Create Profile'}</span>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-carbon-900 ${
                isLoading
                  ? 'glass-dark text-ice-400 border-white/10 cursor-not-allowed opacity-50'
                  : 'glass-dark text-ice-200 border-white/10 hover:bg-white/10'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
