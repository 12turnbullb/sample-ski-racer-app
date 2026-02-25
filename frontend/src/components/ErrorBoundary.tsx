/**
 * ErrorBoundary Component
 * 
 * A React error boundary that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of
 * crashing the whole application.
 * 
 * Requirements: 9.1, 9.3
 * 
 * Features:
 * - Catches unhandled errors in React component tree
 * - Displays user-friendly error message
 * - Provides retry functionality
 * - Logs errors for debugging
 * - Styled with Tailwind CSS
 */

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary class component.
 * 
 * Note: Error boundaries must be class components as React doesn't support
 * error boundaries with hooks yet.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Update state when an error is caught.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details for debugging.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  /**
   * Reset error state to retry rendering.
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-dark border border-white/10 rounded-2xl shadow-glass p-8">
            <div className="text-center">
              {/* Error icon */}
              <svg
                className="mx-auto h-12 w-12 text-red-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>

              {/* Error message */}
              <h2 className="text-xl font-bold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-300 mb-4">
                An unexpected error occurred. Please try again.
              </p>

              {/* Error details (in development) */}
              {import.meta.env.DEV && (
                <div className="mb-4 p-3 glass border border-red-500/30 rounded-xl text-left">
                  <p className="text-sm font-mono text-red-400 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Retry button */}
              <button
                onClick={this.resetError}
                className="btn-primary px-6 py-3 focus:outline-none focus:ring-2 focus:ring-usa-red focus:ring-offset-2 focus:ring-offset-carbon-900"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
