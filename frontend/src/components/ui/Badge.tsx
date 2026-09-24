import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'neutral'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'open'
    | 'in-progress'
    | 'review'
    | 'resolved'
    | 'closed'
    | 'low'
    | 'medium'
    | 'high'
    | 'critical';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variantStyles: Record<NonNullable<BadgeProps['variant']>, { badge: string; dot: string }> = {
    neutral: {
      badge: 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]',
      dot: 'bg-[var(--md-sys-color-outline)]',
    },
    primary: {
      badge: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
      dot: 'bg-[var(--md-sys-color-primary)]',
    },
    secondary: {
      badge: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]',
      dot: 'bg-[var(--md-sys-color-secondary)]',
    },
    success: {
      badge: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]',
      dot: 'bg-[var(--md-sys-color-success)]',
    },
    warning: {
      badge: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]',
      dot: 'bg-[var(--md-sys-color-warning)]',
    },
    error: {
      badge: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]',
      dot: 'bg-[var(--md-sys-color-error)]',
    },
    open: {
      badge: 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]',
      dot: 'bg-[var(--md-sys-color-outline)]',
    },
    'in-progress': {
      badge: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
      dot: 'bg-[var(--md-sys-color-primary)]',
    },
    review: {
      badge: 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]',
      dot: 'bg-[var(--md-sys-color-tertiary)]',
    },
    resolved: {
      badge: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]',
      dot: 'bg-[var(--md-sys-color-success)]',
    },
    closed: {
      badge: 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]',
      dot: 'bg-[var(--md-sys-color-outline)] opacity-60',
    },
    low: {
      badge: 'bg-[var(--md-sys-color-priority-low-container)] text-[var(--md-sys-color-priority-on-low-container)] font-medium',
      dot: 'bg-[var(--md-sys-color-priority-low)]',
    },
    medium: {
      badge: 'bg-[var(--md-sys-color-priority-medium-container)] text-[var(--md-sys-color-priority-on-medium-container)] font-semibold',
      dot: 'bg-[var(--md-sys-color-priority-medium)]',
    },
    high: {
      badge: 'bg-[var(--md-sys-color-priority-high-container)] text-[var(--md-sys-color-priority-on-high-container)] font-bold',
      dot: 'bg-[var(--md-sys-color-priority-high)]',
    },
    critical: {
      badge: 'bg-[var(--md-sys-color-priority-critical-container)] text-[var(--md-sys-color-priority-on-critical-container)] font-bold',
      dot: 'bg-[var(--md-sys-color-priority-critical)] animate-pulse',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.neutral;

  const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-md border select-none transition-colors',
        currentVariant.badge,
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentVariant.dot)} />}
      <span>{children}</span>
    </span>
  );
};
