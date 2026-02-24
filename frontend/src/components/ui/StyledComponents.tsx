/**
 * Reusable Styled Components for Futuristic UI
 */

import React from 'react';

// ============================================================================
// Input Components
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-ice-200">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 glass-dark border ${
          error ? 'border-red-500/50' : 'border-white/10'
        } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-ice-200">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 glass-dark border ${
          error ? 'border-red-500/50' : 'border-white/10'
        } rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 focus:outline-none transition-all resize-none ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

// ============================================================================
// Button Components
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-carbon-900 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-ice text-white hover:shadow-neon-blue',
    secondary: 'glass-dark text-ice-200 border border-white/10 hover:bg-white/10',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    ghost: 'text-ice-200 hover:bg-white/5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}

// ============================================================================
// Card Components
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`glass-dark rounded-2xl shadow-glass border border-white/10 p-6 ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// Loading Spinner
// ============================================================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Spinner({ size = 'md', text }: SpinnerProps) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  return (
    <div className="text-center space-y-4">
      <div className={`relative ${sizes[size]} mx-auto`}>
        <div className="absolute inset-0 border-4 border-ice-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-transparent border-t-ice-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      {text && <p className="text-ice-300 font-medium">{text}</p>}
    </div>
  );
}

// ============================================================================
// Alert Components
// ============================================================================

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}

export function Alert({ type, title, message, onClose }: AlertProps) {
  const styles = {
    error: 'border-red-500/30 text-red-400',
    success: 'border-green-500/30 text-green-400',
    warning: 'border-yellow-500/30 text-yellow-400',
    info: 'border-ice-500/30 text-ice-400',
  };

  const icons = {
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`glass-dark border ${styles[type]} rounded-2xl p-4 animate-slide-in-up`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {icons[type]}
          </div>
          <div className="flex-1">
            {title && <h3 className="font-semibold mb-1">{title}</h3>}
            <p className="text-sm text-ice-300">{message}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-ice-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-dark border border-white/10 rounded-2xl p-12 text-center">
      <div className="text-6xl mb-4 animate-float">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-ice-300 mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
