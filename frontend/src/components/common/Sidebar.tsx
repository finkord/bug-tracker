import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { api, type ProjectItem } from '../../api/client';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/Dropdown';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Layers,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Shield,
  ExternalLink,
  SlidersHorizontal,
  Briefcase,
  Check,
} from 'lucide-react';

interface SidebarProps {
  currentProjectId?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentProjectId }) => {
  const { user } = useAuth();
  const { collapsed, toggleSidebar, mobileOpen, closeMobile, showCollapsedLabels } = useSidebar();
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

  // Extract projectId from URL if present (e.g. /projects/2/board)
  const urlProjectId = useMemo(() => {
    const match = location.pathname.match(/\/projects\/(\d+)/);
    return match ? Number(match[1]) : undefined;
  }, [location.pathname]);

  const activeProjectId = currentProjectId || urlProjectId || (projects[0]?.id);
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  if (!user) return null;

  const boardPath = activeProject ? `/projects/${activeProject.id}/board` : '/projects';
  const backlogPath = activeProject ? `/projects/${activeProject.id}/backlog` : '/projects';

  const navItems = [
    { label: 'Dashboard',         shortLabel: 'Dash',     path: '/',          icon: LayoutDashboard, exact: true, activeMatch: (p: string) => p === '/' },
    { label: 'Projects',          shortLabel: 'Projects', path: '/projects',  icon: FolderKanban,    exact: true, activeMatch: (p: string) => p === '/projects' },
    { label: 'Kanban Board',      shortLabel: 'Kanban',   path: boardPath,    icon: Kanban,          activeMatch: (p: string) => p.includes('/board') },
    { label: 'Backlog & Sprints', shortLabel: 'Backlog',  path: backlogPath, icon: Layers,         activeMatch: (p: string) => p.includes('/backlog') },
    { label: 'Filters & Search',  shortLabel: 'Search',   path: '/search',    icon: SlidersHorizontal, activeMatch: (p: string) => p.startsWith('/search') },
    { label: 'Time Tracking',     shortLabel: 'Time',     path: '/time-tracking', icon: Clock,      activeMatch: (p: string) => p.startsWith('/time-tracking') },
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
        end={item.exact}
        title={item.label}
        onClick={onClick}
        className={`w-full flex items-center rounded-xl overflow-hidden transition-colors group select-none ${
          collapsed && showCollapsedLabels ? 'py-1.5' : 'h-11'
        } ${
          !collapsed && isActive
            ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold shadow-xs'
            : !collapsed
            ? 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
            : ''
        }`}
      >
        {/* Fixed 72px left-anchored slot — stays stationary at x=0 in both states */}
        <div className="w-[72px] shrink-0 flex flex-col items-center justify-center">
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

          {/* Short label text rendered exclusively when collapsed is active AND preference is enabled */}
          {collapsed && showCollapsedLabels && (
            <span
              className={`text-[10px] leading-tight text-center whitespace-nowrap mt-0.5 animate-in fade-in duration-150 ${
                isActive
                  ? 'font-bold text-[var(--md-sys-color-on-surface)]'
                  : 'font-medium text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              {item.shortLabel}
            </span>
          )}
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
      {/* ─── Desktop Super-Sidebar (Full-Height 100vh) ────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--md-sys-color-surface-container-low)] shrink-0 select-none z-20 overflow-hidden transition-[width] duration-200 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* ── 1. Sidebar Brand Header ──────────────────────────────────────── */}
        <div className="h-16 shrink-0 flex items-center border-b border-[var(--md-sys-color-outline-variant)]/15">
          <NavLink to="/" className="w-full flex items-center group overflow-hidden" title="BugTracker Workspace">
            <div className="w-[72px] shrink-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs transition-all duration-150 group-hover:brightness-115">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <span
              className={`font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)] whitespace-nowrap truncate transition-opacity duration-200 ${
                collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 pr-3'
              }`}
            >
              BugTracker
            </span>
          </NavLink>
        </div>

        {/* ── 2. Project Context Switcher & Quick Actions ───────────────────── */}
        <div className="shrink-0 p-2 border-b border-[var(--md-sys-color-outline-variant)]/15 space-y-1.5 overflow-hidden">
          {/* Project Picker Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`w-full flex items-center rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer border border-[var(--md-sys-color-outline-variant)]/30 overflow-hidden ${
                  collapsed ? 'h-10 justify-center' : 'h-11 px-2.5 justify-between'
                }`}
                title={activeProject ? `Project: ${activeProject.name}` : 'Select Project'}
              >
                {collapsed ? (
                  <div className="w-7 h-7 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-black text-xs">
                    {activeProject ? activeProject.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-black text-xs shrink-0">
                        {activeProject ? activeProject.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-xs font-bold truncate leading-tight text-[var(--md-sys-color-on-surface)]">
                          {activeProject ? activeProject.name : 'Select Project'}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate leading-tight">
                          {activeProject ? (activeProject.key || `PRJ-${activeProject.id}`) : 'Workspace'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0 ml-1" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              side="bottom"
              className="w-60 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] shadow-xl z-50 border border-[var(--md-sys-color-outline-variant)]/25 text-xs animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2 py-1 text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Switch Project ({projects.length})
              </div>

              <DropdownMenuSeparator />

              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {projects.map((p) => {
                  const isSelected = p.id === activeProject?.id;
                  return (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}/board`)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold'
                          : 'hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-[11px] shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="truncate text-xs">{p.name}</p>
                          <p className="text-[10px] font-mono opacity-70 truncate">{p.key || `PRJ-${p.id}`}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />}
                    </DropdownMenuItem>
                  );
                })}
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] px-2.5 py-2 rounded-xl cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>Manage all projects</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── 3. Navigation items ─────────────────────────────────────────── */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-1">
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        {/* ── 4. Bottom actions (GitLab style): Swagger Docs & Collapse Sidebar ─ */}
        <div className="shrink-0 pb-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-col gap-1 overflow-hidden">
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

            {/* Mobile header with clickable logo */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/15">
              <NavLink
                to="/"
                onClick={closeMobile}
                className="flex items-center gap-3 group"
                title="Return to Dashboard"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs group-hover:brightness-115 transition-all">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="font-bold text-base text-[var(--md-sys-color-on-surface)]">BugTracker</span>
              </NavLink>
              <button
                type="button"
                onClick={closeMobile}
                className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Interactive Project Switcher */}
            <div className="p-3 border-b border-[var(--md-sys-color-outline-variant)]/15">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                      <div className="w-7 h-7 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-black text-xs shrink-0">
                        {activeProject ? activeProject.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-[var(--md-sys-color-on-surface)] leading-tight">
                          {activeProject?.name || 'Select Project'}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate leading-tight">
                          {activeProject?.key || 'PRJ'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0 ml-1" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  className="w-64 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] shadow-xl z-50 border border-[var(--md-sys-color-outline-variant)]/25 text-xs animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                    Switch Project ({projects.length})
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {projects.map((p) => {
                      const isSelected = p.id === activeProject?.id;
                      return (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => {
                            navigate(`/projects/${p.id}/board`);
                            closeMobile();
                          }}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold'
                              : 'hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-[11px] shrink-0">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="truncate text-xs">{p.name}</p>
                              <p className="text-[10px] font-mono opacity-70 truncate">{p.key || `PRJ-${p.id}`}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      navigate('/projects');
                      closeMobile();
                    }}
                    className="flex items-center gap-2 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] px-2.5 py-2 rounded-xl cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Manage all projects</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile nav items */}
            <nav className="flex-1 py-3 space-y-1 overflow-y-auto px-2">
              {navItems.map((item) => {
                const isActive = item.activeMatch
                  ? item.activeMatch(location.pathname)
                  : item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.exact}
                    onClick={closeMobile}
                    className={`w-full h-11 flex items-center gap-3 px-3 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold shadow-xs'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile bottom: API link */}
            <div className="px-3 pb-4 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-col gap-1">
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
