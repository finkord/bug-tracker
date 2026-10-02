import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  Layers,
  Clock,
  Search,
  Settings,
  LogIn,
  UserPlus,
  KeyRound,
  UserCheck,
  Compass,
} from 'lucide-react';
import { SidebarNavItem, type NavItemConfig } from './SidebarNavItem';
import type { ProjectItem, UserProfile } from '../../api/client';

interface SidebarNavListProps {
  user?: UserProfile | null;
  activeProject?: ProjectItem;
  projectId?: number;
  collapsed?: boolean;
  showCollapsedLabels?: boolean;
  onNavigate?: () => void;
}

/**
 * Cockpit Hybrid Navigation list for the Super-Sidebar.
 *
 * Architecture:
 * 1. Personal Cockpit: Always present (Dashboard, My Issues, Search, Saved Filters Tree).
 * 2. Active Project Views: Displayed when inside a project scope (Board, Backlog, Settings).
 * 3. Workspace Utilities: Permanent links (Projects, Time Tracking, Admin Center).
 */
export const SidebarNavList: React.FC<SidebarNavListProps> = ({
  user,
  activeProject,
  projectId,
  collapsed = false,
  showCollapsedLabels = false,
  onNavigate,
}) => {
  const location = useLocation();

  if (!user) {
    const guestItems: NavItemConfig[] = [
      {
        label: 'Overview',
        shortLabel: 'Home',
        path: '/',
        icon: LayoutDashboard,
        exact: true,
        activeMatch: (p) => p === '/',
      },
      {
        label: 'Sign In',
        shortLabel: 'Login',
        path: '/login',
        icon: LogIn,
        exact: true,
        activeMatch: (p) => p.startsWith('/login'),
      },
      {
        label: 'Create Account',
        shortLabel: 'Register',
        path: '/register',
        icon: UserPlus,
        exact: true,
        activeMatch: (p) => p.startsWith('/register'),
      },
      {
        label: 'Forgot Password',
        shortLabel: 'Reset',
        path: '/forgot-password',
        icon: KeyRound,
        exact: true,
        activeMatch: (p) => p.startsWith('/forgot-password') || p.startsWith('/reset-password'),
      },
    ];

    return (
      <nav aria-label="Guest Navigation" className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-1">
        {guestItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            item={item}
            collapsed={collapsed}
            showCollapsedLabels={showCollapsedLabels}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    );
  }

  // ─── 1. Active Project Context Items (Top Level - Direct Project Scope) ─
  const effectiveProjectId = activeProject?.id ?? projectId;
  const isProjectTier = Boolean(effectiveProjectId);
  const projectIdentifier = activeProject?.key || effectiveProjectId;

  const projectNavItems: NavItemConfig[] = isProjectTier
    ? [
        {
          label: 'Overview',
          shortLabel: 'Overview',
          path: `/projects/${projectIdentifier}`,
          exact: true,
          icon: Compass,
          activeMatch: (p) =>
            p === `/projects/${projectIdentifier}` ||
            p === `/projects/${effectiveProjectId}`,
        },
        {
          label: 'Kanban Board',
          shortLabel: 'Kanban',
          path: `/projects/${projectIdentifier}/board`,
          icon: Kanban,
          activeMatch: (p) => p.includes('/board'),
        },
        {
          label: 'Backlog & Sprints',
          shortLabel: 'Backlog',
          path: `/projects/${projectIdentifier}/backlog`,
          icon: Layers,
          activeMatch: (p) => p.includes('/backlog'),
        },
        {
          label: 'Project Settings',
          shortLabel: 'Settings',
          path: `/projects/${projectIdentifier}/settings`,
          icon: Settings,
          activeMatch: (p) => p.includes('/settings'),
        },
      ]
    : [];

  // ─── 2. Personal Navigation Items (Daily Personal Workflow) ───────────────
  const personalNavItems: NavItemConfig[] = [
    {
      label: 'Dashboard',
      shortLabel: 'Dash',
      path: '/dashboard',
      exact: true,
      icon: LayoutDashboard,
      activeMatch: (p) => p === '/' || p === '/dashboard',
    },
    {
      label: 'My Issues',
      shortLabel: 'Mine',
      path: '/my-issues',
      icon: UserCheck,
      activeMatch: (p) => p.startsWith('/my-issues'),
    },
    {
      label: 'Advanced Search',
      shortLabel: 'Search',
      path: '/search',
      icon: Search,
      activeMatch: (p) => p.startsWith('/search'),
    },
  ];

  // ─── 3. Utilities Navigation Items ─────────────────────────────────────────
  const utilityNavItems: NavItemConfig[] = [
    {
      label: 'Time Tracking',
      shortLabel: 'Time',
      path: '/time-tracking',
      icon: Clock,
      activeMatch: (p) => p.startsWith('/time-tracking'),
    },
  ];



  return (
    <nav aria-label="Main Navigation" className="flex-1 px-2 py-2 overflow-y-auto overflow-x-hidden space-y-1">
      {/* ─── 1. Active Project Scope (Top Level - Linear Style) ─── */}
      {isProjectTier && (
        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]/60 flex items-center justify-between">
              <span className="truncate">{activeProject?.name || 'Project Views'}</span>
            </div>
          )}
          {projectNavItems.map((item) => (
            <SidebarNavItem
              key={item.label}
              item={item}
              collapsed={collapsed}
              showCollapsedLabels={showCollapsedLabels}
              onNavigate={onNavigate}
            />
          ))}
          <div className="my-1.5 border-t border-[var(--md-sys-color-outline-variant)]/15" />
        </div>
      )}

      {/* ─── 2. Personal Section ─── */}
      <div className="space-y-0.5">
        {!collapsed && (
          <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]/60">
            Personal
          </div>
        )}
        {personalNavItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            item={item}
            collapsed={collapsed}
            showCollapsedLabels={showCollapsedLabels}
            onNavigate={onNavigate}
          />
        ))}

      </div>

      {/* ─── 3. Utilities Section (Bottom of Nav List) ─── */}
      <div className="pt-1.5 space-y-0.5">
        <div className="my-1.5 border-t border-[var(--md-sys-color-outline-variant)]/15" />
        {!collapsed && (
          <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]/60">
            Utilities
          </div>
        )}
        {utilityNavItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            item={item}
            collapsed={collapsed}
            showCollapsedLabels={showCollapsedLabels}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
};

