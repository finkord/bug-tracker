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
      badge: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      dot: 'bg-slate-500 dark:bg-slate-400',
    },
    primary: {
      badge: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
      dot: 'bg-blue-600 dark:bg-blue-400',
    },
    secondary: {
      badge: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      dot: 'bg-slate-600 dark:bg-slate-400',
    },
    success: {
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-600 dark:bg-emerald-400',
    },
    warning: {
      badge: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-600 dark:bg-amber-400',
    },
    error: {
      badge: 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-600 dark:bg-rose-400',
    },
    open: {
      badge: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      dot: 'bg-slate-500 dark:bg-slate-400',
    },
    'in-progress': {
      badge: 'bg-blue-100 text-blue-900 border-blue-300 font-semibold dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-blue-600 dark:bg-blue-400',
    },
    review: {
      badge: 'bg-purple-100 text-purple-900 border-purple-300 font-semibold dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
      dot: 'bg-purple-600 dark:bg-purple-400',
    },
    resolved: {
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-600 dark:bg-emerald-400',
    },
    closed: {
      badge: 'bg-zinc-100 text-zinc-800 border-zinc-300 font-semibold dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
      dot: 'bg-zinc-500 dark:bg-zinc-400',
    },
    low: {
      badge: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-500 dark:bg-slate-400',
    },
    medium: {
      badge: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-600 dark:bg-amber-400',
    },
    high: {
      badge: 'bg-orange-100 text-orange-950 border-orange-300 font-semibold dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
      dot: 'bg-orange-600 dark:bg-orange-400',
    },
    critical: {
      badge: 'bg-rose-100 text-rose-950 border-rose-300 font-bold dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-600 dark:bg-rose-400 animate-pulse',
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
