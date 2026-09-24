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
      shortLabel: 'Dash',
      path: '/',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Projects',
      shortLabel: 'Projects',
      path: '/projects',
      icon: FolderKanban,
      exact: true,
    },
    {
      label: 'Kanban Board',
      shortLabel: 'Kanban',
      path: boardPath,
      icon: Kanban,
      activeMatch: (pathname: string) => pathname.includes('/board'),
    },
    {
      label: 'Backlog & Sprints',
      shortLabel: 'Backlog',
      path: backlogPath,
      icon: Layers,
      activeMatch: (pathname: string) => pathname.includes('/backlog'),
    },
    {
      label: 'Advanced Search',
      shortLabel: 'Search',
      path: '/search',
      icon: Search,
    },
    {
      label: 'Time Tracking',
      shortLabel: 'Time',
      path: '/time-tracking',
      icon: Clock,
    },
  ];

  if (user.systemRole === 'ADMIN') {
    navItems.push({
      label: 'Admin Center',
      shortLabel: 'Admin',
      path: '/admin',
      icon: ShieldAlert,
      activeMatch: (pathname: string) => pathname.startsWith('/admin'),
    });
  }

  return (
    <>
      {/* Desktop Sidebar — single DOM tree, CSS-only width transition to prevent re-mount flicker */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--md-sys-color-surface-container-low)] shrink-0 select-none z-30 overflow-hidden transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* ── Brand Header ────────────────────────────────── */}
        <div className="px-2.5 pt-3 pb-2.5 flex flex-col shrink-0">
          {/* Logo row — always rendered, text fades out on collapse */}
          <div className="flex items-center gap-2.5 mb-2 px-0.5 overflow-hidden">
            <Link
              to="/"
              className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all"
              title="BugTracker v3"
            >
              <Shield className="w-5 h-5" />
            </Link>

            {/* Text slides & fades — no layout shift because overflow-hidden */}
            <div
              className={`flex flex-col overflow-hidden transition-all duration-300 ${
                collapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
              }`}
            >
              <span className="font-bold text-sm tracking-tight text-[var(--md-sys-color-on-surface)] leading-none whitespace-nowrap">
                BugTracker
              </span>
              <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-bold mt-0.5 whitespace-nowrap">
                Enterprise v3
              </span>
            </div>
          </div>

          {/* Collapse / Expand toggle — same height always */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] flex items-center transition-all duration-200 cursor-pointer overflow-hidden ${
              collapsed ? 'w-10 justify-center mx-auto' : 'w-full px-3 justify-between'
            }`}
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
          >
            <span
              className={`text-[11px] font-medium whitespace-nowrap transition-all duration-200 ${
                collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
              }`}
            >
              Collapse menu
            </span>
            {collapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronLeft className="w-4 h-4 shrink-0" />
            )}
          </button>
        </div>

        {/* ── Navigation Items ─────────────────────────────── */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
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
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-full transition-colors duration-150 group ${
                  collapsed
                    ? 'flex-col py-2 px-1 gap-1 rounded-2xl w-full'
                    : 'flex-row gap-3 px-3.5 py-2.5 text-xs font-medium'
                } ${
                  isActive
                    ? collapsed
                      ? 'text-[var(--md-sys-color-on-secondary-container)]'
                      : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {/* Icon — in rail mode gets its own pill indicator */}
                <span
                  className={`flex items-center justify-center transition-all duration-200 ${
                    collapsed
                      ? `w-14 h-8 rounded-full ${
                          isActive
                            ? 'bg-[var(--md-sys-color-secondary-container)]'
                            : 'group-hover:bg-[var(--md-sys-color-surface-container-high)]'
                        }`
                      : ''
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-[var(--md-sys-color-primary)]' : ''
                    }`}
                  />
                </span>

                {/* Label — full label in expanded, short label always visible in collapsed */}
                {collapsed ? (
                  <span className="text-[9px] font-semibold leading-tight text-center whitespace-nowrap">
                    {item.shortLabel}
                  </span>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Bottom: Swagger API link ──────────────────────── */}
        <div className="px-2 pb-3 pt-2 shrink-0">
          {collapsed ? (
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 py-2 px-1 w-full rounded-2xl text-[var(--md-sys-color-on-surface-variant)] group"
              title="Swagger OpenAPI Documentation"
            >
              <span className="flex items-center justify-center w-14 h-8 rounded-full group-hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                <ExternalLink className="w-5 h-5" />
              </span>
              <span className="text-[9px] font-semibold leading-tight text-center">API</span>
            </a>
          ) : (
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              title="Swagger OpenAPI Documentation"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 shrink-0" />
                <span>Swagger Docs</span>
              </div>
              <span className="font-mono text-[10px] font-bold text-[var(--md-sys-color-primary)]">API</span>
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
            <div className="p-4 flex items-center justify-between">
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
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
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
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[var(--md-sys-color-primary)]' : ''}`} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Bottom */}
            <div className="p-3">
              <a
                href="http://localhost:3000/api/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4.5 h-4.5 shrink-0" />
                  <span>Swagger OpenAPI Docs</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
