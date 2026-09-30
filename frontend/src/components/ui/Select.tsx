import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { error?: boolean; size?: 'sm' | 'md' | 'lg' }
>(({ className, children, error, size = 'md', ...props }, ref) => {
  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs rounded-lg',
    md: 'h-11 px-3.5 text-sm rounded-xl',
    lg: 'h-12 px-4 text-base rounded-xl',
  };

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'w-full flex items-center justify-between gap-2 transition-all duration-150 select-none cursor-pointer',
        'bg-[var(--md-sys-color-input-bg)] text-[var(--md-sys-color-input-text)]',
        'border border-[var(--md-sys-color-input-border)]',
        'focus:bg-[var(--md-sys-color-input-focus-bg)] focus:border-[var(--md-sys-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error && 'border-[var(--md-sys-color-error)] focus:border-[var(--md-sys-color-error)] focus:ring-[var(--md-sys-color-error)]/20',
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="w-4 h-4 text-[var(--md-sys-color-outline)] opacity-70 shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={4}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-xl',
        'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]',
        'border border-[var(--md-sys-color-outline-variant)] shadow-xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 bg-[var(--md-sys-color-surface-container)] cursor-default">
        <ChevronUp className="w-3.5 h-3.5" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport
        className={cn(
          'p-1.5',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 bg-[var(--md-sys-color-surface-container)] cursor-default">
        <ChevronDown className="w-3.5 h-3.5" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-xs font-medium outline-none transition-colors',
      'focus:bg-[var(--md-sys-color-surface-container-highest)] focus:text-[var(--md-sys-color-on-surface)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>

    <span className="absolute right-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[var(--md-sys-color-primary)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-[var(--md-sys-color-outline-variant)]/60', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export const SelectEmpty: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children = 'No options available',
  className,
}) => (
  <div
    className={cn(
      'py-3.5 px-3 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] select-none',
      className,
    )}
  >
    {children}
  </div>
);

/* ─── High-Level Convenience SelectField Component ─────────────────────── */
export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  placeholder = 'Select an option...',
  value,
  defaultValue,
  onValueChange,
  options,
  error,
  helperText,
  disabled,
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider select-none">
          {label}
        </label>
      )}
      <Select
        value={value !== undefined && value !== null ? String(value) : undefined}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled || options.length === 0}
      >
        <SelectTrigger error={Boolean(error)} size={size}>
          <SelectValue placeholder={options.length === 0 ? 'No options available' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectEmpty>{placeholder || 'No options available'}</SelectEmpty>
          ) : (
            options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.icon ? (
                  <span className="flex items-center gap-2">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </span>
                ) : (
                  opt.label
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
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
};
