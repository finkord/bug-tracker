import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'filled' | 'tonal' | 'outline';
  };
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl select-none transition-colors',
        'border border-dashed border-[var(--md-sys-color-outline-variant)]/60',
        'bg-[var(--md-sys-color-surface-container-low)]',
        compact ? 'p-6 space-y-2' : 'p-10 space-y-3.5',
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl shrink-0',
            'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]',
            compact ? 'w-10 h-10 [&>svg]:w-5 [&>svg]:h-5' : 'w-14 h-14 [&>svg]:w-7 [&>svg]:h-7',
          )}
        >
          {icon}
        </div>
      )}

      <div className={cn('space-y-1 max-w-sm', compact ? 'px-2' : 'px-4')}>
        <h4
          className={cn(
            'font-semibold text-[var(--md-sys-color-on-surface)]',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {title}
        </h4>
        {description && (
          <p
            className={cn(
              'text-[var(--md-sys-color-on-surface-variant)] leading-relaxed',
              compact ? 'text-[11px]' : 'text-xs',
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-1">
          <Button
            variant={action.variant || 'tonal'}
            size={compact ? 'sm' : 'md'}
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};
