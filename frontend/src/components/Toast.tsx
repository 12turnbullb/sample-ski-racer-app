/**
 * Toast Notification System
 * 
 * Provides toast notifications for user feedback on operations.
 * Supports success, error, and info message types with auto-dismiss.
 * 
 * Requirements: 9.1, 9.3, 10.5
 * 
 * Features:
 * - Success messages (green)
 * - Error messages (red)
 * - Info messages (blue)
 * - Auto-dismiss after 5 seconds
 * - Manual dismiss option
 * - Multiple toasts support
 * - Animated entrance/exit
 * - Styled with Tailwind CSS
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  dismissToast: (id: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Hook to access toast context.
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// Provider Component
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider component.
 * Wraps the application to provide toast notification functionality.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Show a toast notification.
   */
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, type, message };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  }, []);

  /**
   * Show a success toast.
   */
  const showSuccess = useCallback((message: string) => {
    showToast('success', message);
  }, [showToast]);

  /**
   * Show an error toast.
   */
  const showError = useCallback((message: string) => {
    showToast('error', message);
  }, [showToast]);

  /**
   * Show an info toast.
   */
  const showInfo = useCallback((message: string) => {
    showToast('info', message);
  }, [showToast]);

  /**
   * Dismiss a toast by ID.
   */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value: ToastContextValue = {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    dismissToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Toast Container Component
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

/**
 * ToastContainer component.
 * Renders all active toasts in a fixed position.
 */
function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ============================================================================
// Toast Item Component
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

/**
 * ToastItem component.
 * Renders a single toast notification.
 */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, type, message } = toast;

  // Style based on toast type
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✓',
      iconBg: 'bg-green-100',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '✕',
      iconBg: 'bg-red-100',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ',
      iconBg: 'bg-blue-100',
    },
  };

  const style = styles[type];

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 pointer-events-auto animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className={`${style.iconBg} rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}>
          <span className={`${style.text} font-bold text-lg`}>{style.icon}</span>
        </div>

        {/* Message */}
        <div className={`ml-3 flex-1 ${style.text}`}>
          <p className="text-sm font-medium">{message}</p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => onDismiss(id)}
          className={`ml-3 flex-shrink-0 ${style.text} hover:opacity-70 focus:outline-none`}
          aria-label="Dismiss"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
