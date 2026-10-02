import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useSidebar } from '../../store';

interface SidebarBrandHeaderProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  brandStyle?: 'vibrant' | 'metallic';
}

/**
 * Renders the top brand header in the Super-Sidebar.
 * Features an M3 primary container icon and responsive title with selectable fancy aesthetics.
 */
export const SidebarBrandHeader: React.FC<SidebarBrandHeaderProps> = ({
  collapsed = false,
  onNavigate,
  brandStyle: propBrandStyle,
}) => {
  const { brandStyle: storeBrandStyle } = useSidebar();
  const activeStyle = propBrandStyle || storeBrandStyle || 'vibrant';

  const isMetallic = activeStyle === 'metallic';

  return (
    <div className="h-11 shrink-0 px-2 flex items-center border-b border-[var(--md-sys-color-outline-variant)]/15">
      <NavLink
        to="/"
        onClick={onNavigate}
        className={`w-full h-8 flex items-center rounded-lg group select-none transition-colors ${collapsed ? 'justify-center px-0' : 'px-2'
          }`}
        title="BugTracker Workspace"
      >
        {/* Icon slot aligned with SidebarProjectSwitcher and SidebarNavItem icon column (18px from edge) */}
        <div className={`shrink-0 flex items-center justify-center ${collapsed ? '' : 'mr-2.5'}`}>
          <div
            className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${isMetallic
              ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-black dark:from-slate-700 dark:via-zinc-800 dark:to-zinc-950 text-slate-100 ring-1 ring-white/20 border border-white/10 shadow-xs group-hover:ring-white/40'
              : 'bg-gradient-to-br from-[var(--md-sys-color-primary)] via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)] group-hover:shadow-[0_0_16px_rgba(99,102,241,0.55)] group-hover:brightness-110'
              }`}
          >
            <Shield
              className={`w-3.5 h-3.5 transition-colors ${isMetallic ? 'text-slate-200 group-hover:text-white' : 'text-white drop-shadow-xs'
                }`}
            />
          </div>
        </div>

        {/* Fancy Gradient Typography */}
        <span
          className={`tracking-tight whitespace-nowrap truncate transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 pr-1'
            } ${isMetallic
              ? 'font-bold text-[14.5px] bg-gradient-to-r from-slate-900 via-slate-600 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent'
              : 'font-extrabold text-[14.5px] bg-gradient-to-r from-[var(--md-sys-color-primary)] via-indigo-500 to-cyan-400 bg-clip-text text-transparent'
            }`}
        >
          BugTracker
        </span>
      </NavLink>
    </div>
  );
};
