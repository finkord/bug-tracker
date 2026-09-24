import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--md-sys-color-outline)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 px-3.5 text-sm transition-all duration-150',
              'bg-[var(--md-sys-color-input-bg)] text-[var(--md-sys-color-input-text)]',
              'border border-[var(--md-sys-color-input-border)] rounded-xl',
              'placeholder:text-[var(--md-sys-color-input-placeholder)]',
              'focus:bg-[var(--md-sys-color-input-focus-bg)] focus:border-[var(--md-sys-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[var(--md-sys-color-error)] focus:border-[var(--md-sys-color-error)] focus:ring-[var(--md-sys-color-error)]/20',
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-error)] font-medium mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
