import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronsUpDown,
  Check,
  Search,
  FolderKanban,
  Kanban,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/Dropdown';
import { Tooltip } from '../ui/Tooltip';
import { useActiveProjectStore } from '../../store';
import type { ProjectItem } from '../../api/client';
import { ProjectAvatar } from '../projects/ProjectAvatar';

interface SidebarProjectSwitcherProps {
  projects: ProjectItem[];
  activeProject?: ProjectItem;
  collapsed?: boolean;
  onNavigate?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const SidebarProjectSwitcher: React.FC<SidebarProjectSwitcherProps> = ({
  projects,
  activeProject,
  collapsed = false,
  onNavigate,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const recentProjects = useActiveProjectStore((state) => state.recentProjects);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.key && p.key.toLowerCase().includes(q)),
    );
  }, [projects, search]);

  const handleSelectProject = (project: ProjectItem, view: 'board' | 'backlog' = 'board') => {
    useActiveProjectStore.getState().setActiveProject({
      id: project.id,
      key: project.key || String(project.id),
      name: project.name,
    });
    navigate(`/projects/${project.key || project.id}/${view}`);
    onNavigate?.();
  };

  const projectInitial = activeProject
    ? activeProject.name.charAt(0).toUpperCase()
    : 'P';
  const projectName = activeProject?.name || 'Select Project';
  const projectKey = activeProject?.key || (activeProject ? `PRJ-${activeProject.id}` : 'Workspace');

  const dropdownContent = (
    <DropdownMenuContent
      align={collapsed ? 'start' : 'center'}
      side={collapsed ? 'right' : 'bottom'}
      sideOffset={8}
      className="w-72 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] shadow-2xl border border-[var(--md-sys-color-outline-variant)]/30 text-xs animate-in fade-in zoom-in-95 duration-150 z-50"
    >
      {/* Search Filter Header */}
      <div className="px-2 py-1.5 flex items-center gap-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 mb-2">
        <Search className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
        <input
          type="text"
          placeholder="Find project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Recently Visited Projects Section */}
      {!search && recentProjects.length > 1 && (
        <>
          <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px]">
            <Sparkles className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
            <span>Recent Projects</span>
          </DropdownMenuLabel>
          <div className="space-y-0.5 mb-1.5">
            {recentProjects.slice(0, 3).map((rp) => {
              const isSelected = rp.id === activeProject?.id;
              const matchingProject = projects.find((p) => p.id === rp.id);
              if (!matchingProject) return null;

              return (
                <div
                  key={`recent-${rp.id}`}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-secondary-container)]/80 text-[var(--md-sys-color-on-secondary-container)] font-bold'
                      : 'hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectProject(matchingProject, 'board')}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <ProjectAvatar
                      name={rp.name}
                      projectKey={rp.key}
                      avatarUrl={matchingProject.avatarUrl}
                      size="xs"
                    />
                    <span className="truncate text-xs">{rp.name}</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={() => handleSelectProject(matchingProject, 'board')}
                      className="p-1 rounded-md hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                      title="Kanban Board"
                    >
                      <Kanban className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectProject(matchingProject, 'backlog')}
                      className="p-1 rounded-md hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                      title="Backlog"
                    >
                      <Layers className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <DropdownMenuSeparator />
        </>
      )}

      {/* All Projects Section */}
      <DropdownMenuLabel>
        Workspace Projects ({filteredProjects.length})
      </DropdownMenuLabel>

      <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const isSelected = project.id === activeProject?.id;
            return (
              <DropdownMenuItem
                key={project.id}
                onClick={() => handleSelectProject(project, 'board')}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold'
                    : 'hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ProjectAvatar
                    name={project.name}
                    projectKey={project.key}
                    avatarUrl={project.avatarUrl}
                    size="xs"
                  />
                  <div className="min-w-0 truncate">
                    <p className="truncate text-xs">{project.name}</p>
                    <p className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {project.key || `PRJ-${project.id}`}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)] ml-2" />
                )}
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="px-3 py-3 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]/60">
            No matching projects found
          </div>
        )}
      </div>

      <DropdownMenuSeparator />

      {/* Quick Management Links */}
      <DropdownMenuItem
        onClick={() => {
          navigate('/projects');
          onNavigate?.();
        }}
        className="flex items-center gap-2 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-highest)] px-2.5 py-2 rounded-xl cursor-pointer"
      >
        <FolderKanban className="w-4 h-4" />
        <span>View all projects</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (collapsed) {
    return (
      <div className="shrink-0 flex items-center justify-center py-1">
        <DropdownMenu onOpenChange={onOpenChange}>
          <DropdownMenuTrigger asChild>
            <Tooltip content={projectName} side="right" sideOffset={8}>
              <button
                type="button"
                className="w-7 h-7 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center transition-all cursor-pointer border border-[var(--md-sys-color-outline-variant)]/40 shadow-2xs overflow-hidden"
                aria-label="Switch active project"
              >
                <ProjectAvatar
                  name={projectName}
                  projectKey={activeProject?.key}
                  avatarUrl={activeProject?.avatarUrl}
                  size="xs"
                />
              </button>
            </Tooltip>
          </DropdownMenuTrigger>
          {dropdownContent}
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-2.5 flex items-center">
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full h-8 px-2 flex items-center justify-between rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer border border-[var(--md-sys-color-outline-variant)]/30 overflow-hidden"
            aria-label="Switch active project"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ProjectAvatar
                name={projectName}
                projectKey={activeProject?.key}
                avatarUrl={activeProject?.avatarUrl}
                size="xs"
              />
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-tight text-[var(--md-sys-color-on-surface)]">
                  {projectName}
                </p>
                <p className="text-[9px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate leading-none mt-0.5">
                  {projectKey}
                </p>
              </div>
            </div>
            <ChevronsUpDown className="w-3 h-3 opacity-60 shrink-0 ml-1 text-[var(--md-sys-color-on-surface-variant)]" />
          </button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    </div>
  );
};
