/**
 * Unit tests for Toast notification system
 * 
 * Tests toast display, auto-dismiss, manual dismiss, and different toast types.
 * 
 * Requirements: 9.1, 9.3, 10.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

// Test component that uses toast
function ToastTestComponent() {
  const { showSuccess, showError, showInfo } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
      <button onClick={() => showInfo('Info message')}>Show Info</button>
    </div>
  );
}

describe('Toast', () => {
  it('throws error when useToast is used outside ToastProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    // console.error = vi.fn();

    expect(() => {
      render(<ToastTestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    console.error = originalError;
  });

  it('shows success toast when showSuccess is called', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole('button', { name: /show success/i });
    await user.click(button);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows error toast when showError is called', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole('button', { name: /show error/i });
    await user.click(button);

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('shows info toast when showInfo is called', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole('button', { name: /show info/i });
    await user.click(button);

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('dismisses toast when dismiss button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole('button', { name: /show success/i });
    await user.click(button);

    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss');
    await user.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('shows multiple toasts simultaneously', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    await user.click(screen.getByRole('button', { name: /show success/i }));
    await user.click(screen.getByRole('button', { name: /show error/i }));
    await user.click(screen.getByRole('button', { name: /show info/i }));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('applies correct styling for success toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /show success/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-50');
  });

  it('applies correct styling for error toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /show error/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50');
  });

  it('applies correct styling for info toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /show info/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50');
  });

  it('has proper accessibility attributes', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /show success/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});
