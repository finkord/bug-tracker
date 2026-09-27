import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'filled',
  padding = 'md',
  rounded = '2xl',
  children,
  ...props
}) => {
  const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
    filled:
      'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]',
    outlined:
      'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60',
    elevated:
      'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] m3-elevation-1 hover:m3-elevation-2',
  };

  const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-7',
  };

  const roundedStyles: Record<NonNullable<CardProps['rounded']>, string> = {
    sm: 'rounded-[var(--md-sys-shape-corner-small)]',
    md: 'rounded-[var(--md-sys-shape-corner-medium)]',
    lg: 'rounded-[var(--md-sys-shape-corner-large)]',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl',
    '3xl': 'rounded-[28px]',
  };

  return (
    <div
      className={cn(
        'transition-all duration-150',
        variantStyles[variant],
        paddingStyles[padding],
        roundedStyles[rounded],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
