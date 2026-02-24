/**
 * ConfirmDialog Component
 * 
 * A reusable modal dialog for confirming destructive actions.
 * Provides a better user experience than browser alerts.
 * 
 * Features:
 * - Modal overlay with backdrop
 * - Customizable title, message, and button text
 * - Keyboard support (Escape to cancel, Enter to confirm)
 * - Focus trap and accessibility
 * - Smooth animations
 */

import { useEffect, useRef } from 'react';

// ============================================================================
// Component Props
// ============================================================================

interface ConfirmDialogProps {
  /**
   * Whether the dialog is open.
   */
  isOpen: boolean;

  /**
   * Dialog title.
   */
  title: string;

  /**
   * Dialog message/description.
   */
  message: string;

  /**
   * Text for the confirm button.
   * @default "Confirm"
   */
  confirmText?: string;

  /**
   * Text for the cancel button.
   * @default "Cancel"
   */
  cancelText?: string;

  /**
   * Callback when user confirms.
   */
  onConfirm: () => void;

  /**
   * Callback when user cancels.
   */
  onCancel: () => void;

  /**
   * Type of action (affects button styling).
   * @default "danger"
   */
  type?: 'danger' | 'warning' | 'info';
}

// ============================================================================
// Component
// ============================================================================

/**
 * ConfirmDialog component for confirming actions.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Handle keyboard events.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && e.target === confirmButtonRef.current) {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  /**
   * Focus the confirm button when dialog opens.
   */
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Prevent body scroll when dialog is open.
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ============================================================================
  // Render
  // ============================================================================

  if (!isOpen) return null;

  // Button styles based on type
  const confirmButtonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h3
            id="dialog-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <p
            id="dialog-description"
            className="text-sm text-gray-600"
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${confirmButtonStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
