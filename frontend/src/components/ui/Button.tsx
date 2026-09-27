import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'filled'
    | 'tonal'
    | 'outlined'
    | 'outline'
    | 'elevated'
    | 'text'
    | 'ghost'
    | 'danger'
    | 'danger-tonal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'filled',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-full select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap shrink-0 transition-all duration-150';

    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
      filled:
        'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-105 shadow-xs',
      tonal:
        'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:brightness-105',
      outlined:
        'bg-transparent text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-primary)]/8',
      outline:
        'bg-transparent text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-primary)]/8',
      elevated:
        'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] m3-elevation-1 hover:m3-elevation-2 hover:bg-[var(--md-sys-color-primary)]/8',
      text:
        'bg-transparent text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/8',
      ghost:
        'bg-transparent text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]',
      danger:
        'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] hover:brightness-105 shadow-xs',
      'danger-tonal':
        'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] hover:brightness-105',
    };

    const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
      xs: 'h-7 px-3 text-xs gap-1',
      sm: 'h-8 px-3.5 text-xs gap-1.5',
      md: 'h-10 px-5 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      'icon-sm': 'w-8 h-8 p-0 rounded-full justify-center',
      'icon-md': 'w-10 h-10 p-0 rounded-full justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
