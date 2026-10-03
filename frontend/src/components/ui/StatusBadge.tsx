import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown, Check } from 'lucide-react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';

export type IssueStatusType = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'RESOLVED' | 'CLOSED';

export interface StatusBadgeProps {
  status: IssueStatusType | string;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  interactive?: boolean;
  onStatusChange?: (newStatus: IssueStatusType) => void;
  disabled?: boolean;
  className?: string;
}

const statusConfigs: Record<IssueStatusType, { label: string; badge: string; dot: string }> = {
  OPEN: {
    label: 'Open',
    badge: 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]/60',
    dot: 'bg-[var(--md-sys-color-outline)]',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badge: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-transparent',
    dot: 'bg-[var(--md-sys-color-primary)]',
  },
  REVIEW: {
    label: 'In Review',
    badge: 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-transparent',
    dot: 'bg-[var(--md-sys-color-tertiary)]',
  },
  RESOLVED: {
    label: 'Resolved',
    badge: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border-transparent',
    dot: 'bg-[var(--md-sys-color-success)]',
  },
  CLOSED: {
    label: 'Closed',
    badge: 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-transparent opacity-80',
    dot: 'bg-[var(--md-sys-color-outline)] opacity-60',
  },
};

const normalizeStatus = (rawStatus: string): IssueStatusType => {
  const upper = rawStatus.toUpperCase().replace(/\s+/g, '_');
  if (upper in statusConfigs) {
    return upper as IssueStatusType;
  }
  return 'OPEN';
};

const allStatuses: IssueStatusType[] = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED'];

const sizeStyles: Record<'xs' | 'sm' | 'md', string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
  md: 'text-xs px-3 py-1 gap-2',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  dot = true,
  interactive = false,
  onStatusChange,
  disabled = false,
  className,
}) => {
  const normalized = normalizeStatus(status);
  const config = statusConfigs[normalized];

  const badgeContent = (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border select-none transition-colors whitespace-nowrap shrink-0',
        config.badge,
        sizeStyles[size],
        interactive && !disabled && 'cursor-pointer hover:opacity-90 active:scale-[0.98]',
        disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      <span className="leading-none">{config.label}</span>
      {interactive && <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />}
    </span>
  );

  if (!interactive || disabled || !onStatusChange) {
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
            Change Status
          </div>
          {allStatuses.map((st) => {
            const itemConfig = statusConfigs[st];
            const isCurrent = st === normalized;
            return (
              <DropdownPrimitive.Item
                key={st}
                onClick={() => onStatusChange(st)}
                className={cn(
                  'flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors',
                  'hover:bg-[var(--md-sys-color-surface-container-highest)] focus:bg-[var(--md-sys-color-surface-container-highest)] focus:outline-none',
                  isCurrent && 'text-[var(--md-sys-color-primary)] font-bold',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', itemConfig.dot)} />
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
