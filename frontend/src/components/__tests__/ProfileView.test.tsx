/**
 * Unit tests for ProfileView component
 * 
 * Tests component rendering, user interactions, and edge cases.
 * Requirements: 10.1, 10.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileView from '../ProfileView';
import type { RacerProfile } from '../../types';

describe('ProfileView', () => {
  // Mock profile data for testing
  const mockProfile: RacerProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    racerName: 'Test Racer',
    height: 175.5,
    weight: 70.2,
    skiTypes: 'Slalom, Giant Slalom, Super-G',
    bindingMeasurements: 'DIN: 8.5\nBoot sole length: 305mm',
    personalRecords: 'Slalom: 1:23.45 (2023-01-15)\nGS: 1:45.67 (2023-02-20)',
    racingGoals: 'Qualify for national championships and improve slalom time by 2 seconds.',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  // Reset mocks before each test
  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  it('renders profile data correctly', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Check that all profile fields are displayed
    expect(screen.getByText('175.5 cm')).toBeInTheDocument();
    expect(screen.getByText('70.2 kg')).toBeInTheDocument();
    expect(screen.getByText('Slalom, Giant Slalom, Super-G')).toBeInTheDocument();
    expect(screen.getByText(/DIN: 8.5/)).toBeInTheDocument();
    expect(screen.getByText(/Slalom: 1:23.45/)).toBeInTheDocument();
    expect(screen.getByText(/Qualify for national championships/)).toBeInTheDocument();
  });

  it('formats numeric values with one decimal place', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Height and weight should be formatted with .toFixed(1)
    expect(screen.getByText('175.5 cm')).toBeInTheDocument();
    expect(screen.getByText('70.2 kg')).toBeInTheDocument();
  });

  it('displays section headers', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Physical Measurements')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Personal Records')).toBeInTheDocument();
    expect(screen.getByText('Racing Goals')).toBeInTheDocument();
  });

  it('displays edit and delete buttons', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete profile/i })).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('shows confirmation dialog when delete button is clicked', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete profile/i });
    fireEvent.click(deleteButton);

    // Confirmation dialog should appear
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete this profile/i)).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Click delete button to show confirmation
    const deleteButtons = screen.getAllByRole('button', { name: /delete profile/i });
    fireEvent.click(deleteButtons[0]); // Click the first delete button (in header)

    // Click confirm button in dialog (now there are 2 delete buttons)
    const allDeleteButtons = screen.getAllByRole('button', { name: /delete profile/i });
    fireEvent.click(allDeleteButtons[1]); // Click the second one (in dialog)

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('closes confirmation dialog when cancel is clicked', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Click delete button to show confirmation
    const deleteButton = screen.getByRole('button', { name: /delete profile/i });
    fireEvent.click(deleteButton);

    // Click cancel button in dialog
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Dialog should be closed (text should not be in document)
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('handles long text content gracefully', () => {
    const longTextProfile: RacerProfile = {
      ...mockProfile,
      racingGoals: 'A'.repeat(500), // Very long text
      bindingMeasurements: 'B'.repeat(300),
    };

    render(<ProfileView profile={longTextProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Component should render without errors
    expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    expect(screen.getByText('B'.repeat(300))).toBeInTheDocument();
  });

  it('preserves whitespace and line breaks in multi-line fields', () => {
    const multiLineProfile: RacerProfile = {
      ...mockProfile,
      bindingMeasurements: 'Line 1\nLine 2\nLine 3',
      personalRecords: 'Record 1\nRecord 2',
    };

    render(<ProfileView profile={multiLineProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Check that text with line breaks is displayed
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Record 1/)).toBeInTheDocument();
  });

  it('displays created and updated timestamps', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Check that timestamp labels are present
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
  });

  it('handles integer height and weight values', () => {
    const integerProfile: RacerProfile = {
      ...mockProfile,
      height: 180,
      weight: 75,
    };

    render(<ProfileView profile={integerProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Should display with .0 decimal
    expect(screen.getByText('180.0 cm')).toBeInTheDocument();
    expect(screen.getByText('75.0 kg')).toBeInTheDocument();
  });

  it('handles very precise decimal values', () => {
    const preciseProfile: RacerProfile = {
      ...mockProfile,
      height: 175.567,
      weight: 70.234,
    };

    render(<ProfileView profile={preciseProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Should round to one decimal place
    expect(screen.getByText('175.6 cm')).toBeInTheDocument();
    expect(screen.getByText('70.2 kg')).toBeInTheDocument();
  });

  it('handles empty optional fields gracefully', () => {
    const minimalProfile: RacerProfile = {
      ...mockProfile,
      skiTypes: '',
      bindingMeasurements: '',
      personalRecords: '',
      racingGoals: '',
    };

    render(<ProfileView profile={minimalProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Component should render without errors even with empty fields
    expect(screen.getByText('Physical Measurements')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  it('displays warning about cascading delete in confirmation dialog', () => {
    render(<ProfileView profile={mockProfile} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Click delete button to show confirmation
    const deleteButton = screen.getByRole('button', { name: /delete profile/i });
    fireEvent.click(deleteButton);

    // Check that warning about associated data is present
    expect(screen.getByText(/will also delete all associated documents and events/i)).toBeInTheDocument();
  });
});
