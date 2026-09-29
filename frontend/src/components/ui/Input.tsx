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

/**
 * Material Design 3 Outlined Text Field component.
 * Features 8px corner radius, tokenized colors, interactive focus ring, and ARIA a11y.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider select-none m3-typescale-label-medium"
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
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full h-11 px-3.5 text-sm transition-all duration-150',
              'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]',
              'border border-[var(--md-sys-color-outline-variant)] rounded-[var(--md-sys-shape-corner-small,8px)]',
              'placeholder:text-[var(--md-sys-color-on-surface-variant)]/60',
              'hover:border-[var(--md-sys-color-outline)]',
              'focus:bg-[var(--md-sys-color-surface-container-low)] dark:focus:bg-[var(--md-sys-color-surface-container-highest)] focus:border-2 focus:border-[var(--md-sys-color-primary)] focus:outline-none',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-2 border-[var(--md-sys-color-error)] focus:border-[var(--md-sys-color-error)]',
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
          <p
            id={errorId}
            className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-error)] font-medium mt-0.5 m3-typescale-body-small"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 m3-typescale-body-small"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
