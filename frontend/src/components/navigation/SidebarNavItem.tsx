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
 * Implements M3 capsule active pill and zero-jitter 72px anchor slot.
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

  const navLinkElement = (
    <NavLink
      to={item.path}
      end={item.exact}
      onClick={onNavigate}
      className={`w-full flex items-center rounded-xl overflow-hidden transition-colors group select-none ${
        collapsed && showCollapsedLabels ? 'py-1.5' : 'h-11'
      } ${
        !collapsed && isActive
          ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold shadow-xs'
          : !collapsed
          ? 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
          : ''
      }`}
    >
      {/* Fixed 72px left-anchored slot — stays stationary at x=0 in both states */}
      <div className="w-[72px] shrink-0 flex flex-col items-center justify-center">
        {/* M3 capsule indicator pill highlights the icon */}
        <div
          className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors ${
            collapsed && isActive
              ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-primary)]'
              : collapsed
              ? 'text-[var(--md-sys-color-on-surface-variant)] group-hover:bg-[var(--md-sys-color-surface-container-high)] group-hover:text-[var(--md-sys-color-on-surface)]'
              : isActive
              ? 'text-[var(--md-sys-color-primary)]'
              : 'text-[var(--md-sys-color-on-surface-variant)]'
          }`}
        >
          <Icon className="w-5 h-5 shrink-0" />
        </div>

        {/* Short label text rendered exclusively when collapsed is active AND preference is enabled */}
        {collapsed && showCollapsedLabels && (
          <span
            className={`text-[10px] leading-tight text-center whitespace-nowrap mt-0.5 animate-in fade-in duration-150 ${
              isActive
                ? 'font-bold text-[var(--md-sys-color-on-surface)]'
                : 'font-medium text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            {item.shortLabel}
          </span>
        )}
      </div>

      {/* Full label for expanded drawer mode */}
      <span
        className={`text-xs font-semibold whitespace-nowrap truncate transition-opacity duration-200 ${
          collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 pr-3'
        }`}
      >
        {item.label}
      </span>
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right">
        {navLinkElement}
      </Tooltip>
    );
  }

  return navLinkElement;
};
