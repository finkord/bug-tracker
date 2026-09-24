import React from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../utils/cn';

export interface DropdownMenuItemConfig {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items?: DropdownMenuItemConfig[];
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
  children?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'end',
  sideOffset = 6,
  className,
  children,
}) => {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>
        {trigger}
      </DropdownPrimitive.Trigger>

      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-50 min-w-[200px] overflow-hidden p-1.5',
            'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]',
            'border border-[var(--md-sys-color-outline-variant)] rounded-xl shadow-lg',
            'animate-in fade-in-50 zoom-in-95 duration-150 focus:outline-none select-none',
            className,
          )}
        >
          {items
            ? items.map((item, index) => {
                if (item.divider) {
                  return (
                    <DropdownPrimitive.Separator
                      key={`divider-${index}`}
                      className="h-px my-1 bg-[var(--md-sys-color-outline-variant)]"
                    />
                  );
                }

                return (
                  <DropdownPrimitive.Item
                    key={index}
                    disabled={item.disabled}
                    onClick={item.onClick}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors',
                      'focus:outline-none focus:bg-[var(--md-sys-color-surface-container-highest)]',
                      item.danger
                        ? 'text-[var(--md-sys-color-error)] focus:bg-[var(--md-sys-color-error-container)] focus:text-[var(--md-sys-color-on-error-container)]'
                        : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)]',
                      item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                    )}
                  >
                    {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                  </DropdownPrimitive.Item>
                );
              })
            : children}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
};

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuContent = DropdownPrimitive.Content;
export const DropdownMenuItem = DropdownPrimitive.Item;
export const DropdownMenuSeparator = DropdownPrimitive.Separator;
export const DropdownMenuLabel = DropdownPrimitive.Label;
