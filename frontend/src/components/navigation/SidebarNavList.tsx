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
  LogIn,
  UserPlus,
  KeyRound,
} from 'lucide-react';
import { SidebarNavItem, type NavItemConfig } from './SidebarNavItem';
import type { ProjectItem, UserProfile } from '../../api/client';

interface SidebarNavListProps {
  user?: UserProfile | null;
  activeProject?: ProjectItem;
  collapsed?: boolean;
  showCollapsedLabels?: boolean;
  onNavigate?: () => void;
}

/**
 * Renders the primary navigation list for the Super-Sidebar.
 * Supports both authenticated workspace navigation and guest public navigation.
 */
export const SidebarNavList: React.FC<SidebarNavListProps> = ({
  user,
  activeProject,
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

  const boardPath = activeProject ? `/projects/${activeProject.id}/board` : '/projects';
  const backlogPath = activeProject ? `/projects/${activeProject.id}/backlog` : '/projects';

  const navItems: NavItemConfig[] = [
    {
      label: 'Dashboard',
      shortLabel: 'Dash',
      path: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
      activeMatch: (p) => p === '/' || p === '/dashboard',
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
    <nav aria-label="Main Navigation" className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-1">
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

