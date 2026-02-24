/**
 * Unit tests for ProfileForm component
 * 
 * Tests form rendering, validation, submission, and error handling.
 * Requirements: 10.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileForm from '../ProfileForm';
import type { RacerProfile } from '../../types';
import * as api from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  createRacer: vi.fn(),
  updateRacer: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    statusCode: number;
    details?: string;
    constructor(statusCode: number, message: string, details?: string) {
      super(message);
      this.statusCode = statusCode;
      this.details = details;
      this.name = 'ApiClientError';
    }
  },
}));

describe('ProfileForm', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const mockProfile: RacerProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    racerName: 'Test Racer',
    height: 175.5,
    weight: 70.2,
    skiTypes: 'Slalom, Giant Slalom',
    bindingMeasurements: 'DIN: 8.5, Boot sole length: 305mm',
    personalRecords: 'Slalom: 1:23.45 (2023-01-15)',
    racingGoals: 'Qualify for nationals',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render create mode with empty form', () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Create Profile')).toBeInTheDocument();
      expect(screen.getByLabelText(/height/i)).toHaveValue(null);
      expect(screen.getByLabelText(/weight/i)).toHaveValue(null);
      expect(screen.getByLabelText(/ski types/i)).toHaveValue('');
      expect(screen.getByLabelText(/binding measurements/i)).toHaveValue('');
      expect(screen.getByLabelText(/personal records/i)).toHaveValue('');
      expect(screen.getByLabelText(/racing goals/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /create profile/i })).toBeInTheDocument();
    });

    it('should render edit mode with populated form', () => {
      render(
        <ProfileForm
          profile={mockProfile}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByLabelText(/height/i)).toHaveValue(175.5);
      expect(screen.getByLabelText(/weight/i)).toHaveValue(70.2);
      expect(screen.getByLabelText(/ski types/i)).toHaveValue('Slalom, Giant Slalom');
      expect(screen.getByLabelText(/binding measurements/i)).toHaveValue('DIN: 8.5, Boot sole length: 305mm');
      expect(screen.getByLabelText(/personal records/i)).toHaveValue('Slalom: 1:23.45 (2023-01-15)');
      expect(screen.getByLabelText(/racing goals/i)).toHaveValue('Qualify for nationals');
      expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
    });

    it('should render all required field indicators', () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators).toHaveLength(6); // All 6 fields are required
    });

    it('should render cancel button', () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error when height is empty', async () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Height is required')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when height is not a number', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const heightInput = screen.getByLabelText(/height/i);
      await user.type(heightInput, 'abc');

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Height must be a valid number')).toBeInTheDocument();
      });
    });

    it('should show error when height is zero', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const heightInput = screen.getByLabelText(/height/i);
      await user.type(heightInput, '0');

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Height must be greater than 0')).toBeInTheDocument();
      });
    });

    it('should show error when height is negative', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const heightInput = screen.getByLabelText(/height/i);
      await user.type(heightInput, '-10');

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Height must be greater than 0')).toBeInTheDocument();
      });
    });

    it('should show error when weight is empty', async () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Weight is required')).toBeInTheDocument();
      });
    });

    it('should show error when weight is not a number', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const weightInput = screen.getByLabelText(/weight/i);
      await user.type(weightInput, 'xyz');

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Weight must be a valid number')).toBeInTheDocument();
      });
    });

    it('should show error when weight is zero', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const weightInput = screen.getByLabelText(/weight/i);
      await user.type(weightInput, '0');

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Weight must be greater than 0')).toBeInTheDocument();
      });
    });

    it('should show error when weight is negative', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const weightInput = screen.getByLabelText(/weight/i);
      await user.type(weightInput, '-5');

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Weight must be greater than 0')).toBeInTheDocument();
      });
    });

    it('should show error when ski types is empty', async () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Ski types are required')).toBeInTheDocument();
      });
    });

    it('should show error when binding measurements is empty', async () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Binding measurements are required')).toBeInTheDocument();
      });
    });

    it('should show error when personal records is empty', async () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Personal records are required')).toBeInTheDocument();
      });
    });

    it('should show error when racing goals is empty', async () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Racing goals are required')).toBeInTheDocument();
      });
    });

    it('should show all validation errors at once', async () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Height is required')).toBeInTheDocument();
        expect(screen.getByText('Weight is required')).toBeInTheDocument();
        expect(screen.getByText('Ski types are required')).toBeInTheDocument();
        expect(screen.getByText('Binding measurements are required')).toBeInTheDocument();
        expect(screen.getByText('Personal records are required')).toBeInTheDocument();
        expect(screen.getByText('Racing goals are required')).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Submit to trigger validation errors
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Height is required')).toBeInTheDocument();
      });

      // Type in height field
      const heightInput = screen.getByLabelText(/height/i);
      await user.type(heightInput, '175');

      // Error should be cleared
      expect(screen.queryByText('Height is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission - Create Mode', () => {
    it('should call createRacer with valid data', async () => {
      const user = userEvent.setup();
      
      const createdProfile: RacerProfile = {
        ...mockProfile,
        id: 'new-id',
      };

      vi.mocked(api.createRacer).mockResolvedValue(createdProfile);

      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Fill in all fields
      await user.type(screen.getByLabelText(/height/i), '175.5');
      await user.type(screen.getByLabelText(/weight/i), '70.2');
      await user.type(screen.getByLabelText(/ski types/i), 'Slalom, Giant Slalom');
      await user.type(screen.getByLabelText(/binding measurements/i), 'DIN: 8.5');
      await user.type(screen.getByLabelText(/personal records/i), 'Slalom: 1:23.45');
      await user.type(screen.getByLabelText(/racing goals/i), 'Qualify for nationals');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.createRacer).toHaveBeenCalledWith({
          height: 175.5,
          weight: 70.2,
          skiTypes: 'Slalom, Giant Slalom',
          bindingMeasurements: 'DIN: 8.5',
          personalRecords: 'Slalom: 1:23.45',
          racingGoals: 'Qualify for nationals',
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(createdProfile);
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: any;
      vi.mocked(api.createRacer).mockImplementation(
        () => new Promise(resolve => { resolvePromise = resolve; })
      );

      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Fill in all fields
      await user.type(screen.getByLabelText(/height/i), '175');
      await user.type(screen.getByLabelText(/weight/i), '70');
      await user.type(screen.getByLabelText(/ski types/i), 'Slalom');
      await user.type(screen.getByLabelText(/binding measurements/i), 'DIN: 8.5');
      await user.type(screen.getByLabelText(/personal records/i), 'Slalom: 1:23.45');
      await user.type(screen.getByLabelText(/racing goals/i), 'Qualify');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      });

      // Check that button is disabled
      expect(submitButton).toBeDisabled();

      // Resolve the promise to clean up
      if (resolvePromise) {
        resolvePromise(mockProfile);
      }
    });

    it('should trim whitespace from text fields', async () => {
      const user = userEvent.setup();
      
      const createdProfile: RacerProfile = {
        ...mockProfile,
        id: 'new-id',
      };

      vi.mocked(api.createRacer).mockResolvedValue(createdProfile);

      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Fill in fields with extra whitespace
      await user.type(screen.getByLabelText(/height/i), '175');
      await user.type(screen.getByLabelText(/weight/i), '70');
      await user.type(screen.getByLabelText(/ski types/i), '  Slalom  ');
      await user.type(screen.getByLabelText(/binding measurements/i), '  DIN: 8.5  ');
      await user.type(screen.getByLabelText(/personal records/i), '  Slalom: 1:23.45  ');
      await user.type(screen.getByLabelText(/racing goals/i), '  Qualify  ');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.createRacer).toHaveBeenCalledWith({
          height: 175,
          weight: 70,
          skiTypes: 'Slalom',
          bindingMeasurements: 'DIN: 8.5',
          personalRecords: 'Slalom: 1:23.45',
          racingGoals: 'Qualify',
        });
      });
    });
  });

  describe('Form Submission - Edit Mode', () => {
    it('should call updateRacer with valid data', async () => {
      const user = userEvent.setup();
      
      const updatedProfile: RacerProfile = {
        ...mockProfile,
        height: 180,
      };

      vi.mocked(api.updateRacer).mockResolvedValue(updatedProfile);

      render(
        <ProfileForm
          profile={mockProfile}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Update height
      const heightInput = screen.getByLabelText(/height/i);
      await user.clear(heightInput);
      await user.type(heightInput, '180');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.updateRacer).toHaveBeenCalledWith(mockProfile.id, {
          height: 180,
          weight: 70.2,
          skiTypes: 'Slalom, Giant Slalom',
          bindingMeasurements: 'DIN: 8.5, Boot sole length: 305mm',
          personalRecords: 'Slalom: 1:23.45 (2023-01-15)',
          racingGoals: 'Qualify for nationals',
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(updatedProfile);
    });

    it('should show loading state during update', async () => {
      // const user = userEvent.setup();
      
      let resolvePromise: any;
      vi.mocked(api.updateRacer).mockImplementation(
        () => new Promise(resolve => { resolvePromise = resolve; })
      );

      render(
        <ProfileForm
          profile={mockProfile}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Submit form without making changes (form is already valid)
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/updating/i)).toBeInTheDocument();
      });

      // Check that button is disabled
      expect(submitButton).toBeDisabled();

      // Resolve the promise to clean up
      if (resolvePromise) {
        resolvePromise(mockProfile);
      }
    });
  });

  describe('Error Handling', () => {
    it('should display API error message', async () => {
      const user = userEvent.setup();
      
      const errorMessage = 'Height must be greater than 0';
      vi.mocked(api.createRacer).mockRejectedValue(
        new api.ApiClientError(400, errorMessage)
      );

      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Fill in all fields
      await user.type(screen.getByLabelText(/height/i), '175');
      await user.type(screen.getByLabelText(/weight/i), '70');
      await user.type(screen.getByLabelText(/ski types/i), 'Slalom');
      await user.type(screen.getByLabelText(/binding measurements/i), 'DIN: 8.5');
      await user.type(screen.getByLabelText(/personal records/i), 'Slalom: 1:23.45');
      await user.type(screen.getByLabelText(/racing goals/i), 'Qualify');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <ProfileForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });
});
