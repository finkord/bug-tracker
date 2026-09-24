import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'filled',
  padding = 'md',
  rounded = 'xl',
  children,
  ...props
}) => {
  const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
    outlined:
      'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]',
    filled:
      'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]',
    elevated:
      'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm',
  };

  const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };

  const roundedStyles: Record<NonNullable<CardProps['rounded']>, string> = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-[24px]',
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
