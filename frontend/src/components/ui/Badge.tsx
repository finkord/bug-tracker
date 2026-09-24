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
      badge: 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]',
      dot: 'bg-[var(--md-sys-color-outline)]',
    },
    primary: {
      badge: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-transparent',
      dot: 'bg-[var(--md-sys-color-primary)]',
    },
    secondary: {
      badge: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-transparent',
      dot: 'bg-[var(--md-sys-color-secondary)]',
    },
    success: {
      badge: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border-transparent',
      dot: 'bg-[var(--md-sys-color-success)]',
    },
    warning: {
      badge: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] border-transparent',
      dot: 'bg-[var(--md-sys-color-warning)]',
    },
    error: {
      badge: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border-transparent',
      dot: 'bg-[var(--md-sys-color-error)]',
    },
    open: {
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
      dot: 'bg-slate-500',
    },
    'in-progress': {
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20',
      dot: 'bg-blue-500',
    },
    review: {
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20',
      dot: 'bg-purple-500',
    },
    resolved: {
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
      dot: 'bg-emerald-500',
    },
    closed: {
      badge: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
      dot: 'bg-zinc-400',
    },
    low: {
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
      dot: 'bg-slate-400',
    },
    medium: {
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20',
      dot: 'bg-amber-500',
    },
    high: {
      badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20',
      dot: 'bg-orange-500',
    },
    critical: {
      badge: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30 font-semibold',
      dot: 'bg-red-500 animate-pulse',
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
        'inline-flex items-center font-medium rounded-md border select-none transition-colors',
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
