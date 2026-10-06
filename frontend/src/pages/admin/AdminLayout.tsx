import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  UsersRound,
  ShieldCheck,
  ShieldAlert,
  FolderGit2,
  Megaphone,
} from 'lucide-react';
import { ScrollableTabsContainer } from '../../components/ui/index.js';
import { cn } from '../../utils/cn.js';

export interface AdminTabItem {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const ADMIN_TABS: AdminTabItem[] = [
  {
    id: 'users',
    name: 'Users & Identity',
    path: '/admin/users',
    icon: Users,
    description: 'Account status, activation, system authority',
  },
  {
    id: 'teams',
    name: 'Scrum Teams',
    path: '/admin/teams',
    icon: UsersRound,
    description: 'Cross-functional teams, leads, and rosters',
  },
  {
    id: 'rbac',
    name: 'Access Control & RBAC',
    path: '/admin/rbac',
    icon: ShieldCheck,
    description: 'Directory groups, project roles, and schemes',
  },
  {
    id: 'security',
    name: 'Security & Audit Logs',
    path: '/admin/security',
    icon: ShieldAlert,
    description: 'Authentication telemetry and lockout history',
  },
  {
    id: 'projects',
    name: 'Projects Governance',
    path: '/admin/projects',
    icon: FolderGit2,
    description: 'System-wide project lifecycles and archives',
  },
  {
    id: 'announcements',
    name: 'System Announcements',
    path: '/admin/announcements',
    icon: Megaphone,
    description: 'Live broadcast alerts and downtime notices',
  },
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col min-w-0 space-y-4 animate-in fade-in duration-200">
      {/* ── Navigation Tabs Bar ── */}
      <ScrollableTabsContainer
        as="nav"
        aria-label="Admin Navigation Tabs"
        className="border-b border-[var(--md-sys-color-outline-variant)]/20 w-full"
        railClassName="gap-1 sm:gap-1.5"
      >
        {ADMIN_TABS.map((tab) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.path === '/admin/users' && (location.pathname === '/admin' || location.pathname === '/admin/'));
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              id={`admin-tab-${tab.id}`}
              className={cn(
                'group relative flex items-center gap-2 py-2.5 px-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 border-b-2 -mb-px outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] rounded-t-lg select-none',
                isActive
                  ? 'text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] border-transparent hover:text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container-highest)]/30',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive
                    ? 'text-[var(--md-sys-color-primary)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)]',
                )}
              />
              <span>{tab.name}</span>
            </NavLink>
          );
        })}
      </ScrollableTabsContainer>

      {/* ── Sub-Route Canvas (Rendered via <Outlet />) ─────────────────── */}
      <main className="flex-1 w-full min-w-0" id="admin-subpage-canvas">
        <Outlet />
      </main>
    </div>
  );
};
