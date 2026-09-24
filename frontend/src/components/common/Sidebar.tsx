import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { Avatar } from './Avatar';
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
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/Dropdown';

interface SidebarProps {
  currentProjectId?: number;
}

// Pill dimensions shared between collapse toggle, logo area, and nav items
const RAIL_PILL = 'w-14 h-8 rounded-full'; // 56x32 — M3 Navigation Rail indicator size

export const Sidebar: React.FC<SidebarProps> = ({ currentProjectId }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, toggleSidebar, mobileOpen, closeMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    if (user) {
      api.getProjects()
        .then((data) => setProjects(data))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  const selectedProject = projects.find((p) => p.id === currentProjectId) || projects[0];
  const boardPath = selectedProject ? `/projects/${selectedProject.id}/board` : '/projects';
  const backlogPath = selectedProject ? `/projects/${selectedProject.id}/backlog` : '/projects';

  const navItems = [
    { label: 'Dashboard',      shortLabel: 'Dash',     path: '/',          icon: LayoutDashboard, exact: true },
    { label: 'Projects',       shortLabel: 'Projects', path: '/projects',  icon: FolderKanban,    exact: true },
    { label: 'Kanban Board',   shortLabel: 'Kanban',   path: boardPath,    icon: Kanban,          activeMatch: (p: string) => p.includes('/board') },
    { label: 'Backlog & Sprints', shortLabel: 'Backlog', path: backlogPath, icon: Layers,         activeMatch: (p: string) => p.includes('/backlog') },
    { label: 'Advanced Search', shortLabel: 'Search',  path: '/search',    icon: Search },
    { label: 'Time Tracking',  shortLabel: 'Time',     path: '/time-tracking', icon: Clock },
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

  // Shared nav item renderer (desktop collapsed rail + mobile)
  const renderNavItem = (item: typeof navItems[number], railMode: boolean, onClick?: () => void) => {
    const Icon = item.icon;
    const isActive = item.activeMatch
      ? item.activeMatch(location.pathname)
      : item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

    if (railMode) {
      // Rail mode: icon pill centred + short label below
      return (
        <NavLink
          key={item.label}
          to={item.path}
          title={item.label}
          onClick={onClick}
          className={`flex flex-col items-center gap-1 py-1 w-full rounded-2xl transition-colors group ${
            isActive
              ? 'text-[var(--md-sys-color-on-secondary-container)]'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <span className={`${RAIL_PILL} flex items-center justify-center transition-colors ${
            isActive
              ? 'bg-[var(--md-sys-color-secondary-container)]'
              : 'group-hover:bg-[var(--md-sys-color-surface-container-high)]'
          }`}>
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[var(--md-sys-color-primary)]' : ''}`} />
          </span>
          <span className="text-[9px] font-semibold leading-tight text-center whitespace-nowrap">
            {item.shortLabel}
          </span>
        </NavLink>
      );
    }

    // Drawer mode: full-width row with icon + label
    return (
      <NavLink
        key={item.label}
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium transition-colors ${
          isActive
            ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold'
            : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
        }`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[var(--md-sys-color-primary)]' : ''}`} />
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* ─── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--md-sys-color-surface-container-low)] shrink-0 select-none z-30 overflow-hidden transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* ── Brand header ─────────────────────────────────────────────── */}
        <div className={`shrink-0 flex flex-col gap-2 pt-3 pb-2 ${collapsed ? 'px-2 items-center' : 'px-2.5'}`}>

          {/* Logo — w-10 h-10 matches RAIL_PILL width so they left-align in expanded mode */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Link
              to="/"
              className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all"
              title="BugTracker v3"
            >
              <Shield className="w-5 h-5" />
            </Link>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${
              collapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
            }`}>
              <span className="font-bold text-sm tracking-tight text-[var(--md-sys-color-on-surface)] leading-none whitespace-nowrap">
                BugTracker
              </span>
              <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-bold mt-0.5 whitespace-nowrap">
                Enterprise v3
              </span>
            </div>
          </div>

          {/* Collapse toggle — pill in rail mode, full-width button in drawer mode */}
          {collapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand navigation"
              aria-label="Expand sidebar navigation"
              className={`${RAIL_PILL} flex items-center justify-center bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer`}
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse navigation"
              aria-label="Collapse sidebar navigation"
              className="w-full h-8 rounded-full flex items-center justify-between px-3.5 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors cursor-pointer"
            >
              <span>Collapse menu</span>
              <ChevronLeft className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>

        {/* ── Navigation items ─────────────────────────────────────────── */}
        <nav className={`flex-1 py-2 overflow-y-auto overflow-x-hidden space-y-0.5 ${collapsed ? 'px-2' : 'px-2'}`}>
          {navItems.map((item) => renderNavItem(item, collapsed))}
        </nav>

        {/* ── Bottom section: theme toggle + API link + user chip ───────── */}
        <div className={`shrink-0 pb-3 pt-2 flex flex-col gap-0.5 ${collapsed ? 'px-2 items-center' : 'px-2'}`}>
          {/* Theme toggle */}
          {collapsed ? (
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Toggle visual theme"
              className={`${RAIL_PILL} flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Toggle visual theme"
              className="w-full h-8 rounded-full flex items-center gap-3 px-3.5 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          )}

          {/* Swagger API link */}
          {collapsed ? (
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              title="Swagger OpenAPI Documentation"
              className={`${RAIL_PILL} flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors`}
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          ) : (
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              title="Swagger OpenAPI Documentation"
              className="w-full h-8 rounded-full flex items-center justify-between px-3.5 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 shrink-0" />
                <span>Swagger Docs</span>
              </div>
              <span className="font-mono text-[10px] font-bold text-[var(--md-sys-color-primary)]">API</span>
            </a>
          )}

          {/* User chip / profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {collapsed ? (
                <button
                  type="button"
                  title={user.fullName || user.email}
                  aria-label="User account menu"
                  className="cursor-pointer transition-all hover:scale-105 active:scale-95 mt-1"
                >
                  <Avatar name={user.fullName || user.email} avatarUrl={user.avatarUrl} size="sm" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="User account menu"
                  className="w-full flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 mt-1 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] active:scale-[0.98]"
                >
                  <Avatar name={user.fullName || user.email} avatarUrl={user.avatarUrl} size="sm" />
                  <div className="flex flex-col text-left leading-tight min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {user.systemRole}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
                </button>
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align={collapsed ? 'start' : 'end'}
              side={collapsed ? 'right' : 'top'}
              className="w-64 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Profile summary */}
              <div className="p-3 bg-[var(--md-sys-color-surface-container-low)] rounded-xl mb-1.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={user.fullName || user.email} avatarUrl={user.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                      {user.fullName || 'User'}
                    </p>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between text-[10px]">
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-mono">
                    {user.systemRole}
                  </span>
                  {user.twoFactorEnabled ? (
                    <span className="font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]">
                      2FA Active
                    </span>
                  ) : (
                    <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-70">2FA Off</span>
                  )}
                </div>
              </div>

              <div className="space-y-0.5 text-xs font-medium">
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                {user.systemRole === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-[var(--md-sys-color-warning)]" />
                      <span>Admin Center</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </div>

              <DropdownMenuSeparator className="my-1 bg-[var(--md-sys-color-outline-variant)]/30" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ─── Mobile Slide-Over Drawer ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={closeMobile} />
          <div className="relative w-72 max-w-[85vw] bg-[var(--md-sys-color-surface-container-low)] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">

            {/* Mobile header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">BugTracker v3</span>
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

            {/* Mobile nav items */}
            <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => renderNavItem(item, false, closeMobile))}
            </nav>

            {/* Mobile bottom: theme + api + user */}
            <div className="px-3 pb-4 pt-2 flex flex-col gap-0.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <a
                href="http://localhost:3000/api/docs"
                target="_blank"
                rel="noreferrer"
                onClick={closeMobile}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                <ExternalLink className="w-5 h-5 shrink-0" />
                <span>Swagger OpenAPI Docs</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
