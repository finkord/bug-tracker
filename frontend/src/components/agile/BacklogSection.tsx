import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { IssueItem } from '../../api/client.js';
import type { SprintDefinition } from '../../types/agile.js';
import { AgileIssueRow } from './AgileIssueRow.js';
import { Badge, Button } from '../ui';
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
  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog',
    data: {
      type: 'backlog',
      sprintId: null,
    },
  });

  const totalEstimate = issues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);

  return (
    <div
      ref={setNodeRef}
      data-drop-zone="backlog"
      className={`rounded-3xl border bg-[var(--md-sys-color-surface-container-low)] shadow-2xs overflow-hidden transition-colors duration-150 ${
        isOver
          ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/10 shadow-xs'
          : 'border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-outline-variant)]/70'
      }`}
    >
      {/* Backlog Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)]/30">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand backlog' : 'Collapse backlog'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

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

          <Button
            type="button"
            variant="tonal"
            size="sm"
            onClick={onQuickCreateInBacklog}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Issue
          </Button>
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
                orderedIds={issues.map((i) => i.id)}
              />
            ))
          )}

          {/* Quick Create in Backlog Trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onQuickCreateInBacklog}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="w-full border-dashed"
          >
            Create Issue in Backlog
          </Button>
        </div>
      )}
    </div>
  );
};
