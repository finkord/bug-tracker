import React from 'react';
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
      <nav aria-label="Guest Navigation" className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden flex flex-col gap-1">
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
          label: 'Team Timesheets',
          shortLabel: 'Timesheets',
          path: `/projects/${projectIdentifier}/timesheets`,
          icon: Clock,
          activeMatch: (p) => p.includes('/timesheets'),
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
      activeMatch: (p) => p === '/' || p === '/dashboard' || p.startsWith('/my-issues'),
    },
    {
      label: 'Search',
      shortLabel: 'Search',
      path: '/search',
      icon: Search,
      activeMatch: (p) => p.startsWith('/search'),
    },
  ];

  // ─── 3. Team Timesheets Navigation Items ─────────────────────────────────
  const timesheetNavItems: NavItemConfig[] = [
    {
      label: 'Team Timesheets',
      shortLabel: 'Timesheets',
      path: '/time-tracking',
      icon: Clock,
      activeMatch: (p) => p.startsWith('/time-tracking'),
    },
  ];

  return (
    <nav aria-label="Main Navigation" className="flex-1 px-3 py-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1">
      {/* ─── 1. Active Project Scope (Top Level - Linear Style) ─── */}
      {isProjectTier && (
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]/60 flex items-center justify-between">
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
        </div>
      )}

      {/* Symmetric divider between Project and Personal sections */}
      {isProjectTier && (
        <div className="py-1 shrink-0" aria-hidden="true">
          <div className="border-t border-[var(--md-sys-color-outline-variant)]/20 mx-1" />
        </div>
      )}

      {/* ─── 2. Personal Section ─── */}
      <div className="flex flex-col gap-1">
        {!collapsed && (
          <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]/60">
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

      {/* ─── 3. Global Team & Time Section (Shown when outside project scope) ─── */}
      {!isProjectTier && (
        <>
          <div className="py-1 shrink-0" aria-hidden="true">
            <div className="border-t border-[var(--md-sys-color-outline-variant)]/20 mx-1" />
          </div>
          <div className="flex flex-col gap-1">
            {!collapsed && (
              <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]/60">
                Team & Time
              </div>
            )}
            {timesheetNavItems.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                collapsed={collapsed}
                showCollapsedLabels={showCollapsedLabels}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </>
      )}
    </nav>
  );
};

