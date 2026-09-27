import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Layers,
  Clock,
  SlidersHorizontal,
  ShieldAlert,
  Shield,
} from 'lucide-react';
import { SidebarNavItem, type NavItemConfig } from './SidebarNavItem';
import type { ProjectItem, UserProfile } from '../../api/client';

interface SidebarNavListProps {
  user: UserProfile;
  activeProject?: ProjectItem;
  collapsed?: boolean;
  showCollapsedLabels?: boolean;
  onNavigate?: () => void;
}

/**
 * Renders the primary navigation list for the Super-Sidebar.
 */
export const SidebarNavList: React.FC<SidebarNavListProps> = ({
  user,
  activeProject,
  collapsed = false,
  showCollapsedLabels = false,
  onNavigate,
}) => {
  const boardPath = activeProject ? `/projects/${activeProject.id}/board` : '/projects';
  const backlogPath = activeProject ? `/projects/${activeProject.id}/backlog` : '/projects';

  const navItems: NavItemConfig[] = [
    {
      label: 'Dashboard',
      shortLabel: 'Dash',
      path: '/',
      icon: LayoutDashboard,
      exact: true,
      activeMatch: (p) => p === '/',
    },
    {
      label: 'Projects',
      shortLabel: 'Projects',
      path: '/projects',
      icon: FolderKanban,
      exact: true,
      activeMatch: (p) => p === '/projects',
    },
    {
      label: 'Kanban Board',
      shortLabel: 'Kanban',
      path: boardPath,
      icon: Kanban,
      activeMatch: (p) => p.includes('/board'),
    },
    {
      label: 'Backlog & Sprints',
      shortLabel: 'Backlog',
      path: backlogPath,
      icon: Layers,
      activeMatch: (p) => p.includes('/backlog'),
    },
    {
      label: 'Filters & Search',
      shortLabel: 'Search',
      path: '/search',
      icon: SlidersHorizontal,
      activeMatch: (p) => p.startsWith('/search'),
    },
    {
      label: 'Time Tracking',
      shortLabel: 'Time',
      path: '/time-tracking',
      icon: Clock,
      activeMatch: (p) => p.startsWith('/time-tracking'),
    },
  ];

  const isUserAdmin =
    user.isAdmin ||
    user.groups?.some((g: string) => ['administrators', 'admin', 'admins'].includes(g.toLowerCase())) ||
    user.systemRole === 'ADMIN';

  if (isUserAdmin) {
    navItems.push({
      label: 'Admin Center',
      shortLabel: 'Admin',
      path: '/admin',
      icon: ShieldAlert,
      activeMatch: (p) => p === '/admin' || p.startsWith('/admin/dashboard'),
    });
    navItems.push({
      label: 'Access & RBAC',
      shortLabel: 'RBAC',
      path: '/admin/rbac',
      icon: Shield,
      activeMatch: (p) => p.startsWith('/admin/rbac'),
    });
  }

  return (
    <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-1">
      {navItems.map((item) => (
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
};
