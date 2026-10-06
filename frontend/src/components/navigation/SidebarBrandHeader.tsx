import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useSidebar, type BrandStyle } from '../../store';

interface SidebarBrandHeaderProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  brandStyle?: BrandStyle;
}

const BRAND_STYLE_MAP: Record<
  BrandStyle,
  {
    iconBg: string;
    iconColor: string;
    textStyle: string;
  }
> = {
  vibrant: {
    iconBg:
      'bg-gradient-to-br from-[var(--md-sys-color-primary)] via-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)] group-hover:shadow-[0_0_16px_rgba(99,102,241,0.55)] group-hover:brightness-110',
    iconColor: 'text-white drop-shadow-xs',
    textStyle:
      'font-extrabold text-[14.5px] bg-gradient-to-r from-[var(--md-sys-color-primary)] via-indigo-500 to-cyan-400 bg-clip-text text-transparent',
  },
  metallic: {
    iconBg:
      'bg-gradient-to-br from-slate-800 via-slate-900 to-black dark:from-slate-700 dark:via-zinc-800 dark:to-zinc-950 text-slate-100 ring-1 ring-white/20 border border-white/10 shadow-xs group-hover:ring-white/40',
    iconColor: 'text-slate-200 group-hover:text-white',
    textStyle:
      'font-bold text-[14.5px] bg-gradient-to-r from-slate-900 via-slate-600 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent',
  },
  indigo: {
    iconBg: 'bg-indigo-600 text-white shadow-xs',
    iconColor: 'text-white',
    textStyle: 'font-bold text-[14.5px] text-indigo-500 dark:text-indigo-400',
  },
  blue: {
    iconBg: 'bg-blue-600 text-white shadow-xs',
    iconColor: 'text-white',
    textStyle: 'font-bold text-[14.5px] text-blue-500 dark:text-blue-400',
  },
  emerald: {
    iconBg: 'bg-emerald-600 text-white shadow-xs',
    iconColor: 'text-white',
    textStyle: 'font-bold text-[14.5px] text-emerald-500 dark:text-emerald-400',
  },
  amber: {
    iconBg: 'bg-amber-600 text-white shadow-xs',
    iconColor: 'text-white',
    textStyle: 'font-bold text-[14.5px] text-amber-500 dark:text-amber-400',
  },
  rose: {
    iconBg: 'bg-rose-600 text-white shadow-xs',
    iconColor: 'text-white',
    textStyle: 'font-bold text-[14.5px] text-rose-500 dark:text-rose-400',
  },
  purple: {
    iconBg: 'bg-purple-600 text-white shadow-xs',
    iconColor: 'text-white',
    textStyle: 'font-bold text-[14.5px] text-purple-500 dark:text-purple-400',
  },
  cyan: {
    iconBg: 'bg-cyan-600 text-white shadow-xs',
    iconColor: 'text-white',
    textStyle: 'font-bold text-[14.5px] text-cyan-500 dark:text-cyan-400',
  },
  violet: {
    iconBg: 'bg-violet-600 text-white shadow-xs',
    iconColor: 'text-white',
    textStyle: 'font-bold text-[14.5px] text-violet-500 dark:text-violet-400',
  },
};

/**
 * Renders the top brand header in the Super-Sidebar.
 * Features an M3 primary container icon and responsive title with selectable aesthetics.
 */
export const SidebarBrandHeader: React.FC<SidebarBrandHeaderProps> = ({
  collapsed = false,
  onNavigate,
  brandStyle: propBrandStyle,
}) => {
  const { brandStyle: storeBrandStyle } = useSidebar();
  const activeStyle: BrandStyle = propBrandStyle || storeBrandStyle || 'vibrant';
  const config = BRAND_STYLE_MAP[activeStyle] || BRAND_STYLE_MAP.vibrant;

  return (
    <div className="h-11 shrink-0 px-2 flex items-center border-b border-[var(--md-sys-color-outline-variant)]/15">
      <NavLink
        to="/"
        onClick={onNavigate}
        className={`w-full h-8 flex items-center rounded-lg group select-none transition-colors ${
          collapsed ? 'justify-center px-0' : 'px-2'
        }`}
        title="BugTracker Workspace"
      >
        {/* Icon slot aligned with SidebarProjectSwitcher and SidebarNavItem icon column (18px from edge) */}
        <div className={`shrink-0 flex items-center justify-center ${collapsed ? '' : 'mr-2.5'}`}>
          <div
            className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${config.iconBg}`}
          >
            <Shield className={`w-3.5 h-3.5 transition-colors ${config.iconColor}`} />
          </div>
        </div>

        {/* Fancy Gradient or Themed Typography */}
        <span
          className={`tracking-tight whitespace-nowrap truncate transition-opacity duration-200 ${
            collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 pr-1'
          } ${config.textStyle}`}
        >
          BugTracker
        </span>
      </NavLink>
    </div>
  );
};
