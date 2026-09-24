import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { api, type ProjectItem } from '../../api/client';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Layers,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Shield,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  currentProjectId?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentProjectId }) => {
  const { user } = useAuth();
  const { collapsed, toggleSidebar, mobileOpen, closeMobile } = useSidebar();
  const location = useLocation();

  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    if (user) {
      api.getProjects()
        .then((data) => setProjects(data))
        .catch(() => {});
    }
  }, [user]);

  if (!user) {
    return null;
  }

  // Active project selection for dynamic links
  const selectedProject = projects.find((p) => p.id === currentProjectId) || projects[0];
  const boardPath = selectedProject ? `/projects/${selectedProject.id}/board` : '/projects';
  const backlogPath = selectedProject ? `/projects/${selectedProject.id}/backlog` : '/projects';

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Projects',
      path: '/projects',
      icon: FolderKanban,
      exact: true,
    },
    {
      label: 'Kanban Board',
      path: boardPath,
      icon: Kanban,
      activeMatch: (pathname: string) => pathname.includes('/board'),
    },
    {
      label: 'Backlog & Sprints',
      path: backlogPath,
      icon: Layers,
      activeMatch: (pathname: string) => pathname.includes('/backlog'),
    },
    {
      label: 'Advanced Search',
      path: '/search',
      icon: Search,
    },
    {
      label: 'Time Tracking',
      path: '/time-tracking',
      icon: Clock,
    },
  ];

  if (user.systemRole === 'ADMIN') {
    navItems.push({
      label: 'Admin Center',
      path: '/admin',
      icon: ShieldAlert,
      activeMatch: (pathname: string) => pathname.startsWith('/admin'),
    });
  }

  return (
    <>
      {/* Desktop Sidebar Rail / Expanded Drawer */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--md-sys-color-surface-container-low)] transition-all duration-300 ease-in-out shrink-0 select-none z-30 ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {/* Brand & Logo Header backed into Sidebar */}
        {collapsed ? (
          /* Collapsed State: Logo on top, expand button BELOW logo */
          <div className="py-3 px-2 flex flex-col items-center gap-2 border-b border-[var(--md-sys-color-outline-variant)]/30 shrink-0">
            <Link
              to="/"
              className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all"
              title="BugTracker v3"
            >
              <Shield className="w-5 h-5" />
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-2xs transition-all cursor-pointer group"
              title="Expand sidebar navigation"
              aria-label="Expand sidebar navigation"
            >
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        ) : (
          /* Expanded State: Logo on top, collapse button BELOW logo */
          <div className="p-3.5 flex flex-col gap-2.5 border-b border-[var(--md-sys-color-outline-variant)]/30 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 group transition-transform active:scale-95 px-0.5"
            >
              <div className="w-9 h-9 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5 transition-transform group-hover:rotate-12" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-[var(--md-sys-color-on-surface)] leading-none">
                  BugTracker
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-bold mt-0.5">
                  Enterprise v3
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors cursor-pointer"
              title="Collapse sidebar rail"
              aria-label="Collapse sidebar rail"
            >
              <span className="text-[11px]">Collapse menu</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items (M3 Navigation Drawer / Rail) */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.activeMatch
              ? item.activeMatch(location.pathname)
              : item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                } ${collapsed ? 'justify-center px-0 w-11 mx-auto h-11' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[var(--md-sys-color-primary)]' : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Swagger link */}
        <div className="p-3 border-t border-[var(--md-sys-color-outline-variant)]/40 shrink-0 space-y-1">
          {!collapsed ? (
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Swagger OpenAPI Documentation"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)]">API</span>
                <span>Swagger Docs</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          ) : (
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Swagger OpenAPI Documentation"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={closeMobile}
          />

          <div className="relative w-72 max-w-[85vw] bg-[var(--md-sys-color-surface-container-low)] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Mobile Header */}
            <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  BugTracker v3
                </span>
              </div>
              <button
                type="button"
                onClick={closeMobile}
                className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Items */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.activeMatch
                  ? item.activeMatch(location.pathname)
                  : item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={closeMobile}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold shadow-2xs'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
              <a
                href="http://localhost:3000/api/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
              >
                <span>Swagger OpenAPI Docs</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
