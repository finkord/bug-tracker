import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown,
  FolderGit2,
  X,
  Check,
  Search,
} from 'lucide-react';

interface SidebarProps {
  currentProjectId?: number;
  onProjectChange?: (projectId: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentProjectId, onProjectChange }) => {
  const { user } = useAuth();
  const { collapsed, toggleSidebar, mobileOpen, closeMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api.getProjects()
        .then((data) => setProjects(data))
        .catch(() => {});
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!user) {
    return null;
  }

  // Active project selection
  const selectedProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  const handleSelectProject = (project: ProjectItem) => {
    setProjectDropdownOpen(false);
    if (onProjectChange) {
      onProjectChange(project.id);
    } else {
      if (location.pathname.includes('/board')) {
        navigate(`/projects/${project.id}/board`);
      } else if (location.pathname.includes('/backlog')) {
        navigate(`/projects/${project.id}/backlog`);
      } else {
        navigate(`/projects/${project.id}/board`);
      }
    }
  };

  const boardPath = selectedProject ? `/projects/${selectedProject.id}/board` : '/board';
  const backlogPath = selectedProject ? `/projects/${selectedProject.id}/backlog` : '/backlog';

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
      {/* Desktop Sidebar Rail / Expanded */}
      <aside
        className={`hidden md:flex flex-col border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] transition-all duration-300 ease-in-out shrink-0 select-none ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {/* Workspace Quick Switcher + Header */}
        <div className="p-3 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-2 relative" ref={dropdownRef}>
          {collapsed ? (
            <button
              type="button"
              onClick={() => setProjectDropdownOpen((prev) => !prev)}
              className="w-10 h-10 mx-auto rounded-[14px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold flex items-center justify-center text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              title={`Switch Workspace (Active: ${selectedProject ? selectedProject.key : 'BT'})`}
            >
              {selectedProject ? selectedProject.key : 'BT'}
            </button>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--md-sys-color-on-surface-variant)]">
                  Active Workspace
                </span>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Workspace Selector Button */}
              <button
                type="button"
                onClick={() => setProjectDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderGit2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] block truncate">
                      {selectedProject ? selectedProject.name : 'Select Project'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold">
                    {selectedProject ? selectedProject.key : 'BT'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                </div>
              </button>
            </div>
          )}

          {/* Project Switcher Dropdown */}
          {projectDropdownOpen && (
            <div className={`absolute top-full ${collapsed ? 'left-18' : 'left-3 right-3'} mt-1 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-xl p-1.5 space-y-1 z-50 w-60 animate-in fade-in zoom-in-95 duration-150`}>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                Switch Project
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {projects.map((p) => {
                  const isSelected = selectedProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProject(p)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                          : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                      }`}
                    >
                      <div className="truncate text-left mr-2">
                        <span className="block truncate">{p.name}</span>
                        <span className="text-[10px] font-mono opacity-70">{p.key}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[16px] text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[var(--md-sys-color-primary)]' : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={closeMobile}
          />

          <div className="relative w-72 max-w-[85vw] bg-[var(--md-sys-color-surface)] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                Navigation Menu
              </span>
              <button
                type="button"
                onClick={closeMobile}
                className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[16px] text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold shadow-xs'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
