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

  const isRailWithMicroLabel = collapsed && showCollapsedLabels;

  return (
    <Tooltip content={collapsed ? item.label : undefined} side="right" sideOffset={8}>
      <NavLink
        to={item.path}
        end={item.exact}
        onClick={onNavigate}
        className={`h-9 flex items-center rounded-xl transition-all duration-200 select-none text-[13px] shrink-0 overflow-hidden ${
          collapsed ? 'w-9' : 'w-full pr-2.5'
        } ${
          isActive
            ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold shadow-2xs'
            : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] font-medium'
        }`}
        aria-label={item.label}
      >
        {/* Strictly anchored 36x36px icon slot permanently aligned at X=30px center line */}
        <div
          className={`w-9 h-9 shrink-0 flex ${
            isRailWithMicroLabel ? 'flex-col justify-center' : 'items-center justify-center'
          }`}
        >
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive
                ? 'text-[var(--md-sys-color-primary)]'
                : 'text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          />
          {isRailWithMicroLabel && (
            <span className="text-[9px] leading-tight mt-0.5 font-medium truncate max-w-[32px]">
              {item.shortLabel}
            </span>
          )}
        </div>

        {/* Smoothly collapsing text label without layout shift */}
        <span
          className={`whitespace-nowrap truncate leading-none transition-all duration-200 ease-in-out ${
            collapsed
              ? 'w-0 opacity-0 ml-0 pointer-events-none'
              : 'flex-1 ml-1.5 opacity-100'
          }`}
        >
          {item.label}
        </span>
      </NavLink>
    </Tooltip>
  );
};
