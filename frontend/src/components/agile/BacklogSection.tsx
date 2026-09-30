import React, { useState } from 'react';
import type { IssueItem } from '../../api/client';
import type { SprintDefinition } from '../../types/agile';
import { AgileIssueRow } from './AgileIssueRow';
import { Badge } from '../ui';
import { ChevronDown, ChevronRight, Inbox, Plus } from 'lucide-react';

interface BacklogSectionProps {
  issues: IssueItem[];
  availableSprints: SprintDefinition[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectIssue: (issue: IssueItem) => void;
  onMoveToSprint: (issueId: number, sprintId: number | null) => void;
  onQuickCreateInBacklog: () => void;
}

export const BacklogSection: React.FC<BacklogSectionProps> = ({
  issues,
  availableSprints,
  isCollapsed,
  onToggleCollapse,
  onSelectIssue,
  onMoveToSprint,
  onQuickCreateInBacklog,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDragOver) setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const issueIdStr = e.dataTransfer.getData('text/plain');
    if (!issueIdStr) return;

    const issueId = Number(issueIdStr);
    onMoveToSprint(issueId, null);
  };

  const totalEstimate = issues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-3xl border bg-[var(--md-sys-color-surface-container-low)] shadow-2xs overflow-hidden transition-all duration-200 ${
        isDragOver
          ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/10'
          : 'border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-outline-variant)]/70'
      }`}
    >
      {/* Backlog Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)]/30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand backlog' : 'Collapse backlog'}
            className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <h2
              onClick={onToggleCollapse}
              className="text-base font-bold text-[var(--md-sys-color-on-surface)] cursor-pointer hover:text-[var(--md-sys-color-primary)] transition-colors"
            >
              Backlog
            </h2>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              ({issues.length} {issues.length === 1 ? 'issue' : 'issues'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {totalEstimate > 0 && (
            <Badge variant="neutral" size="sm" className="font-mono font-bold">
              {totalEstimate}h total
            </Badge>
          )}

          <button
            type="button"
            onClick={onQuickCreateInBacklog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Issue</span>
          </button>
        </div>
      </div>

      {/* Backlog Issues List */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-2 bg-[var(--md-sys-color-surface-container-lowest)]/50 dark:bg-[var(--md-sys-color-surface-container-low)]">
          {issues.length === 0 ? (
            <div className="py-12 px-4 rounded-2xl border border-dashed border-[var(--md-sys-color-outline-variant)]/50 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] flex flex-col items-center justify-center gap-1">
              <Inbox className="w-8 h-8 text-[var(--md-sys-color-outline)] opacity-50 mb-1" />
              <p className="font-semibold text-xs text-[var(--md-sys-color-on-surface)]">
                Your Product Backlog is empty
              </p>
              <p className="text-[11px] opacity-70">
                Create new tasks or drag completed/unplanned tickets here
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <AgileIssueRow
                key={issue.id}
                issue={issue}
                availableSprints={availableSprints}
                onClick={onSelectIssue}
                onMoveToSprint={onMoveToSprint}
              />
            ))
          )}

          {/* Quick Create in Backlog Trigger */}
          <button
            type="button"
            onClick={onQuickCreateInBacklog}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)]/50 hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Issue in Backlog</span>
          </button>
        </div>
      )}
    </div>
  );
};
