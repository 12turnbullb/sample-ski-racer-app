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
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/30 focus:ring-red-500',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full hover:bg-yellow-500/30 focus:ring-yellow-500',
    info: 'btn-primary focus:ring-usa-red',
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative glass-dark border border-white/10 rounded-2xl shadow-glass max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h3
            id="dialog-title"
            className="text-lg font-barlow-condensed font-bold uppercase text-white"
          >
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <p
            id="dialog-description"
            className="text-sm text-gray-300"
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-gray-200 glass border border-white/15 rounded-full hover:bg-white/10 hover:border-usa-red/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-usa-red/50 focus:ring-offset-carbon-900 transition-all"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-carbon-900 transition-all ${confirmButtonStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
