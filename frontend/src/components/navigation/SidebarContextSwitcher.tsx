import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Briefcase, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/Dropdown';
import type { ProjectItem } from '../../api/client';

interface SidebarContextSwitcherProps {
  projects: ProjectItem[];
  activeProject?: ProjectItem;
  collapsed?: boolean;
  onNavigate?: () => void;
}

/**
 * Context Switcher for projects following GitLab Pajamas navigation patterns.
 */
export const SidebarContextSwitcher: React.FC<SidebarContextSwitcherProps> = ({
  projects,
  activeProject,
  collapsed = false,
  onNavigate,
}) => {
  const navigate = useNavigate();

  const handleSelectProject = (projectId: number) => {
    navigate(`/projects/${projectId}/board`);
    onNavigate?.();
  };

  const handleManageProjects = () => {
    navigate('/projects');
    onNavigate?.();
  };

  const projectInitial = activeProject ? activeProject.name.charAt(0).toUpperCase() : 'P';
  const projectName = activeProject?.name || 'Select Project';
  const projectKey = activeProject?.key || (activeProject ? `PRJ-${activeProject.id}` : 'Workspace');

  return (
    <div className="shrink-0 p-2 border-b border-[var(--md-sys-color-outline-variant)]/15 space-y-1.5 overflow-hidden">
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
                {projectInitial}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-black text-xs shrink-0">
                    {projectInitial}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-xs font-bold truncate leading-tight text-[var(--md-sys-color-on-surface)]">
                      {projectName}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate leading-tight">
                      {projectKey}
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
            {projects.map((project) => {
              const isSelected = project.id === activeProject?.id;
              return (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold'
                      : 'hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-[11px] shrink-0">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="truncate text-xs">{project.name}</p>
                      <p className="text-[10px] font-mono opacity-70 truncate">{project.key || `PRJ-${project.id}`}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleManageProjects}
            className="flex items-center gap-2 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] px-2.5 py-2 rounded-xl cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Manage all projects</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
