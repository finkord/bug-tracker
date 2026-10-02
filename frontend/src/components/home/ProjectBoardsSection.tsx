import React from 'react';
import { Link } from 'react-router-dom';
import type { ProjectItem } from '../../api/client';
import { Button } from '../ui';
import { Kanban, Layers } from 'lucide-react';

interface ProjectBoardsSectionProps {
  projects: ProjectItem[];
}

export const ProjectBoardsSection: React.FC<ProjectBoardsSectionProps> = ({ projects }) => {
  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-surface-container-high)]">
        <div className="flex items-center gap-2">
          <Kanban className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            Project Kanban Boards
          </h2>
        </div>
        <Link to="/projects" className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projects.map((p) => (
          <div
            key={p.id}
            className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/70 space-y-3 hover:bg-[var(--md-sys-color-surface-container-high)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/50 px-2.5 py-0.5 rounded-full">
                {p.key}
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                {p.openIssues ?? 0} open issues
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">
                {p.name}
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-1 mt-0.5">
                {p.description || 'No description provided.'}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--md-sys-color-surface-container-high)]">
              <Link to={`/projects/${p.key || p.id}/board`} className="flex-1">
                <Button
                  type="button"
                  variant="filled"
                  size="xs"
                  className="w-full"
                  leftIcon={<Kanban className="w-3 h-3" />}
                >
                  Board
                </Button>
              </Link>
              <Link to={`/projects/${p.key || p.id}/backlog`}>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  leftIcon={<Layers className="w-3 h-3" />}
                >
                  Backlog
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
