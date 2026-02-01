'use client';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button';
  lines?: number;
}

/**
 * Reusable loading skeleton component for consistent loading states
 */
export function LoadingSkeleton({ className = '', variant = 'text', lines = 1 }: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-[#14161a] via-[#1a1d21] to-[#14161a] bg-[length:200%_100%] rounded';

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} h-32 w-full ${className}`} />
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`${baseClasses} h-10 w-10 rounded-full ${className}`} />
    );
  }

  if (variant === 'button') {
    return (
      <div className={`${baseClasses} h-10 w-24 ${className}`} />
    );
  }

  // Text variant with multiple lines
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} h-4`}
          style={{ width: i === lines - 1 && lines > 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * Full-page loading screen with branding
 */
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Spinner */}
        <div className="w-12 h-12 border-2 border-[var(--color-gold)]/20 border-t-[var(--color-gold)] rounded-full animate-spin" />
      </div>
      <p className="text-sm text-[var(--color-muted)] animate-pulse">{message}</p>
    </div>
  );
}

/**
 * Inline loading spinner
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-current/20 border-t-current rounded-full animate-spin`}
    />
  );
}
