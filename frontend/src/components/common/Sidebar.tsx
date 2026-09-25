import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  currentProjectId?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentProjectId }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  if (!user) return null;

  const selectedProject = projects.find((p) => p.id === currentProjectId) || projects[0];
  const boardPath = selectedProject ? `/projects/${selectedProject.id}/board` : '/projects';
  const backlogPath = selectedProject ? `/projects/${selectedProject.id}/backlog` : '/projects';

  const navItems = [
    { label: 'Dashboard',         shortLabel: 'Dash',     path: '/',          icon: LayoutDashboard, exact: true },
    { label: 'Projects',          shortLabel: 'Projects', path: '/projects',  icon: FolderKanban,    exact: true },
    { label: 'Kanban Board',      shortLabel: 'Kanban',   path: boardPath,    icon: Kanban,          activeMatch: (p: string) => p.includes('/board') },
    { label: 'Backlog & Sprints', shortLabel: 'Backlog',  path: backlogPath, icon: Layers,         activeMatch: (p: string) => p.includes('/backlog') },
    { label: 'Advanced Search',   shortLabel: 'Search',   path: '/search',    icon: Search },
    { label: 'Time Tracking',     shortLabel: 'Time',     path: '/time-tracking', icon: Clock },
  ];

  if (user.systemRole === 'ADMIN') {
    navItems.push({
      label: 'Admin Center',
      shortLabel: 'Admin',
      path: '/admin',
      icon: ShieldAlert,
      activeMatch: (p: string) => p.startsWith('/admin'),
    });
  }

  // Unified DOM structure for nav items — left-anchored 72px slot prevents horizontal jump
  const renderNavItem = (item: typeof navItems[number], onClick?: () => void) => {
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
        title={item.label}
        onClick={onClick}
        className={`w-full flex items-center rounded-xl overflow-hidden transition-colors group select-none ${
          collapsed ? 'py-1' : 'h-11'
        } ${
          !collapsed && isActive
            ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold shadow-xs'
            : !collapsed
            ? 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
            : ''
        }`}
      >
        {/* Fixed 72px left-anchored slot — stays stationary at x=0 in both states */}
        <div className="w-[72px] shrink-0 flex flex-col items-center justify-center gap-0.5">
          {/* M3 capsule indicator pill highlights ONLY the icon */}
          <div
            className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors ${
              collapsed && isActive
                ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-primary)]'
                : collapsed
                ? 'text-[var(--md-sys-color-on-surface-variant)] group-hover:bg-[var(--md-sys-color-surface-container-high)] group-hover:text-[var(--md-sys-color-on-surface)]'
                : isActive
                ? 'text-[var(--md-sys-color-primary)]'
                : 'text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
          </div>

          {/* Short label text outside and below the pill in collapsed state */}
          <span
            className={`text-[10px] leading-tight text-center whitespace-nowrap transition-all duration-200 ${
              collapsed
                ? `opacity-100 max-h-4 ${
                    isActive
                      ? 'font-bold text-[var(--md-sys-color-on-surface)]'
                      : 'font-medium text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)]'
                  }`
                : 'opacity-0 max-h-0 overflow-hidden pointer-events-none'
            }`}
          >
            {item.shortLabel}
          </span>
        </div>

        {/* Full label for expanded drawer mode */}
        <span
          className={`text-xs font-semibold whitespace-nowrap truncate transition-opacity duration-200 ${
            collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 pr-3'
          }`}
        >
          {item.label}
        </span>
      </NavLink>
    );
  };

  return (
    <>
      {/* ─── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--md-sys-color-outline-variant)]/15 shrink-0 select-none z-30 overflow-hidden transition-[width] duration-200 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* ── Brand header: height h-16 with clean top spacing ─────────────── */}
        <div className="shrink-0 h-16 flex items-center border-b border-[var(--md-sys-color-outline-variant)]/15 overflow-hidden pt-1">
          <Link
            to="/"
            className="w-full flex items-center overflow-hidden group"
            title="BugTracker"
          >
            {/* Logo anchor: exactly 72px column, stationary position, color highlight on hover */}
            <div className="w-[72px] shrink-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs transition-all duration-150 group-hover:brightness-115 group-hover:shadow-md">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <span
              className={`font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)] leading-none truncate whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 pr-3'
              }`}
            >
              BugTracker
            </span>
          </Link>
        </div>

        {/* ── Navigation items ─────────────────────────────────────────── */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-1">
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        {/* ── Bottom actions (GitLab style): Theme, Swagger, Collapse ─────── */}
        <div className="shrink-0 pb-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-col gap-1 overflow-hidden">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle visual theme"
            className="w-full h-11 flex items-center rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors cursor-pointer overflow-hidden group"
          >
            <div className="w-[72px] shrink-0 flex items-center justify-center">
              <div className="w-14 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--md-sys-color-surface-container-high)]">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </div>
            </div>
            <span
              className={`truncate whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 text-left pr-3'
              }`}
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>

          {/* Swagger API link */}
          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noreferrer"
            title="Swagger OpenAPI Documentation"
            className="w-full h-11 flex items-center rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors overflow-hidden group"
          >
            <div className="w-[72px] shrink-0 flex items-center justify-center">
              <div className="w-14 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--md-sys-color-surface-container-high)]">
                <ExternalLink className="w-5 h-5" />
              </div>
            </div>
            <span
              className={`truncate whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 text-left pr-3'
              }`}
            >
              Swagger Docs
            </span>
          </a>

          {/* Collapse sidebar toggle button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
            className="w-full h-11 flex items-center rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors cursor-pointer overflow-hidden group"
          >
            <div className="w-[72px] shrink-0 flex items-center justify-center">
              <div className="w-14 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--md-sys-color-surface-container-high)]">
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </div>
            </div>
            <span
              className={`truncate whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 text-left pr-3'
              }`}
            >
              Collapse sidebar
            </span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Slide-Over Drawer ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={closeMobile} />
          <div className="relative w-72 max-w-[85vw] bg-[var(--md-sys-color-surface-container-low)] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">

            {/* Mobile header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/15 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="font-bold text-base text-[var(--md-sys-color-on-surface)]">BugTracker</span>
              </div>
              <button
                type="button"
                onClick={closeMobile}
                className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile nav items */}
            <nav className="flex-1 py-3 space-y-1 overflow-y-auto px-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `w-full h-11 flex items-center gap-3 px-3 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold shadow-xs'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Mobile bottom: theme + api */}
            <div className="px-3 pb-4 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-col gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                </div>
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <a
                href="http://localhost:3000/api/docs"
                target="_blank"
                rel="noreferrer"
                onClick={closeMobile}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 shrink-0" />
                </div>
                <span>Swagger OpenAPI Docs</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
