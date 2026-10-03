import React from 'react';
import { cn } from '../../utils/cn';
import { Flame, ArrowUp, Minus, ArrowDown, ChevronDown, Check } from 'lucide-react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';

export type IssuePriorityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityBadgeProps {
  priority: IssuePriorityType | string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showLabel?: boolean;
  interactive?: boolean;
  onPriorityChange?: (newPriority: IssuePriorityType) => void;
  disabled?: boolean;
  className?: string;
}

interface PriorityConfig {
  label: string;
  badge: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const priorityConfigs: Record<IssuePriorityType, PriorityConfig> = {
  CRITICAL: {
    label: 'Critical',
    badge: 'bg-[var(--md-sys-color-priority-critical-container)] text-[var(--md-sys-color-priority-on-critical-container)] border-transparent font-bold',
    iconColor: 'text-[var(--md-sys-color-priority-critical)]',
    icon: Flame,
  },
  HIGH: {
    label: 'High',
    badge: 'bg-[var(--md-sys-color-priority-high-container)] text-[var(--md-sys-color-priority-on-high-container)] border-transparent font-semibold',
    iconColor: 'text-[var(--md-sys-color-priority-high)]',
    icon: ArrowUp,
  },
  MEDIUM: {
    label: 'Medium',
    badge: 'bg-[var(--md-sys-color-priority-medium-container)] text-[var(--md-sys-color-priority-on-medium-container)] border-transparent font-medium',
    iconColor: 'text-[var(--md-sys-color-priority-medium)]',
    icon: Minus,
  },
  LOW: {
    label: 'Low',
    badge: 'bg-[var(--md-sys-color-priority-low-container)] text-[var(--md-sys-color-priority-on-low-container)] border-transparent font-medium',
    iconColor: 'text-[var(--md-sys-color-priority-low)]',
    icon: ArrowDown,
  },
};

const normalizePriority = (rawPriority: string): IssuePriorityType => {
  const upper = rawPriority.toUpperCase();
  if (upper in priorityConfigs) {
    return upper as IssuePriorityType;
  }
  return 'MEDIUM';
};

const allPriorities: IssuePriorityType[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const sizeStyles: Record<'xs' | 'sm' | 'md', { badge: string; icon: string }> = {
  xs: { badge: 'text-[10px] px-1.5 py-0.5 gap-1', icon: 'w-2.5 h-2.5' },
  sm: { badge: 'text-[11px] px-2 py-0.5 gap-1.5', icon: 'w-3 h-3' },
  md: { badge: 'text-xs px-2.5 py-1 gap-1.5', icon: 'w-3.5 h-3.5' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  interactive = false,
  onPriorityChange,
  disabled = false,
  className,
}) => {
  const normalized = normalizePriority(priority);
  const config = priorityConfigs[normalized];
  const IconComponent = config.icon;
  const currentSize = sizeStyles[size];

  const badgeContent = (
    <span
      className={cn(
        'inline-flex items-center rounded-full border select-none transition-colors whitespace-nowrap shrink-0',
        config.badge,
        currentSize.badge,
        interactive && !disabled && 'cursor-pointer hover:opacity-90 active:scale-[0.98]',
        disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {showIcon && <IconComponent className={cn(currentSize.icon, config.iconColor, 'shrink-0')} />}
      {showLabel && <span className="leading-none">{config.label}</span>}
      {interactive && <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />}
    </span>
  );

  if (!interactive || disabled || !onPriorityChange) {
    return badgeContent;
  }

  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] rounded-full"
        >
          {badgeContent}
        </button>
      </DropdownPrimitive.Trigger>

      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 min-w-[170px] overflow-hidden p-1.5',
            'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]',
            'border border-[var(--md-sys-color-outline-variant)] rounded-xl shadow-xl',
            'animate-in fade-in-50 zoom-in-95 duration-100 focus:outline-none select-none',
          )}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
            Change Priority
          </div>
          {allPriorities.map((pr) => {
            const itemConfig = priorityConfigs[pr];
            const ItemIcon = itemConfig.icon;
            const isCurrent = pr === normalized;
            return (
              <DropdownPrimitive.Item
                key={pr}
                onClick={() => onPriorityChange(pr)}
                className={cn(
                  'flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors',
                  'hover:bg-[var(--md-sys-color-surface-container-highest)] focus:bg-[var(--md-sys-color-surface-container-highest)] focus:outline-none',
                  isCurrent && 'text-[var(--md-sys-color-primary)] font-bold',
                )}
              >
                <div className="flex items-center gap-2">
                  <ItemIcon className={cn('w-3.5 h-3.5 shrink-0', itemConfig.iconColor)} />
                  <span>{itemConfig.label}</span>
                </div>
                {isCurrent && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />}
              </DropdownPrimitive.Item>
            );
          })}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
};
