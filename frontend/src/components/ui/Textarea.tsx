import React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full min-h-[88px] p-3 text-sm rounded-xl transition-all duration-150 resize-y',
          'bg-[var(--md-sys-color-input-bg)] text-[var(--md-sys-color-input-text)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60',
          'border border-[var(--md-sys-color-input-border)]',
          'focus:bg-[var(--md-sys-color-input-focus-bg)] focus:border-[var(--md-sys-color-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error &&
            'border-[var(--md-sys-color-error)] focus:border-[var(--md-sys-color-error)] focus:ring-[var(--md-sys-color-error)]/20',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
