import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: 'pills' | 'underline' }
>(({ className, variant = 'pills', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center select-none overflow-x-auto max-w-full no-scrollbar shrink-0',
      variant === 'pills' &&
        'p-1 gap-1 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/20',
      variant === 'underline' &&
        'border-b border-[var(--md-sys-color-outline-variant)]/30 gap-4 sm:gap-6 w-full min-w-0',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { variant?: 'pills' | 'underline'; size?: 'sm' | 'md' }
>(({ className, variant = 'pills', size = 'md', ...props }, ref) => {
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg font-medium',
    md: 'text-xs sm:text-sm px-4 py-2 rounded-lg font-semibold',
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] disabled:pointer-events-none disabled:opacity-50',
        variant === 'pills' && [
          sizeStyles[size],
          'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)]/50',
          'data-[state=active]:bg-[var(--md-sys-color-surface-container-lowest)] dark:data-[state=active]:bg-[var(--md-sys-color-surface-container-lowest)] data-[state=active]:text-[var(--md-sys-color-on-surface)] data-[state=active]:shadow-xs',
        ],
        variant === 'underline' && [
          'py-3 text-sm font-medium border-b-2 border-transparent -mb-px text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-all',
          'data-[state=active]:border-[var(--md-sys-color-primary)] data-[state=active]:text-[var(--md-sys-color-primary)] data-[state=active]:font-bold',
        ],
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] animate-in fade-in-50 duration-150',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
