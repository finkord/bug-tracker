import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface SidebarBrandHeaderProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

/**
 * Renders the top brand header in the Super-Sidebar.
 * Features an M3 primary container icon and responsive title.
 */
export const SidebarBrandHeader: React.FC<SidebarBrandHeaderProps> = ({
  collapsed = false,
  onNavigate,
}) => {
  return (
    <div className="h-16 shrink-0 flex items-center border-b border-[var(--md-sys-color-outline-variant)]/15">
      <NavLink
        to="/"
        onClick={onNavigate}
        className="w-full flex items-center group overflow-hidden select-none"
        title="BugTracker Workspace"
      >
        <div className="w-[72px] shrink-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs transition-all duration-150 group-hover:brightness-110">
            <Shield className="w-5 h-5" />
          </div>
        </div>
        <span
          className={`font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)] whitespace-nowrap truncate transition-opacity duration-200 ${
            collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 pr-3'
          }`}
        >
          BugTracker
        </span>
      </NavLink>
    </div>
  );
};
