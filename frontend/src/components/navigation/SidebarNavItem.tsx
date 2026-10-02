import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export interface NavItemConfig {
  label: string;
  shortLabel: string;
  path: string;
  icon: LucideIcon;
  exact?: boolean;
  activeMatch?: (pathname: string) => boolean;
}

interface SidebarNavItemProps {
  item: NavItemConfig;
  collapsed?: boolean;
  showCollapsedLabels?: boolean;
  onNavigate?: () => void;
}

/**
 * Individual navigation item inside the Super-Sidebar.
 * Implements high-density Linear-style compact layout (34px height, 16px icons, 13px text).
 */
export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  collapsed = false,
  showCollapsedLabels = false,
  onNavigate,
}) => {
  const location = useLocation();
  const Icon = item.icon;

  const isActive = item.activeMatch
    ? item.activeMatch(location.pathname)
    : item.exact
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  if (collapsed) {
    const railContent = (
      <NavLink
        to={item.path}
        end={item.exact}
        onClick={onNavigate}
        className={`w-9 h-9 mx-auto rounded-lg flex flex-col items-center justify-center transition-all group select-none ${
          isActive
            ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold shadow-2xs'
            : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
        }`}
        aria-label={item.label}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {showCollapsedLabels && (
          <span className="text-[9px] leading-tight mt-0.5 font-medium truncate max-w-[32px]">
            {item.shortLabel}
          </span>
        )}
      </NavLink>
    );

    return (
      <Tooltip content={item.label} side="right" sideOffset={8}>
        {railContent}
      </Tooltip>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.exact}
      onClick={onNavigate}
      className={`w-full h-[34px] px-2.5 flex items-center gap-2.5 rounded-lg transition-colors select-none text-[13px] ${
        isActive
          ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold shadow-2xs'
          : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] font-medium'
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${
          isActive
            ? 'text-[var(--md-sys-color-primary)]'
            : 'text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)]'
        }`}
      />
      <span className="truncate flex-1 leading-none">{item.label}</span>
    </NavLink>
  );
};
