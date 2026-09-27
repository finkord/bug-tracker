import React, { useState } from 'react';
import type { IssueItem } from '../../api/client';
import type { SprintDefinition } from '../../types/agile';
import { AgileIssueRow } from './AgileIssueRow';
import { Badge, Button, Dropdown } from '../ui';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Target,
  Play,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SprintContainerProps {
  sprint: SprintDefinition;
  issues: IssueItem[];
  availableSprints: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectIssue: (issue: IssueItem) => void;
  onMoveToSprint: (issueId: number, sprintName: string | null) => void;
  onStartSprint: (sprintName: string) => void;
  onCompleteSprint: (sprintName: string) => void;
  onEditSprint: (sprint: SprintDefinition) => void;
  onDeleteSprint: (sprintName: string) => void;
  onGoToActiveBoard?: () => void;
  onQuickCreateInSprint: (sprintName: string) => void;
}

export const SprintContainer: React.FC<SprintContainerProps> = ({
  sprint,
  issues,
  availableSprints,
  isCollapsed,
  onToggleCollapse,
  onSelectIssue,
  onMoveToSprint,
  onStartSprint,
  onCompleteSprint,
  onEditSprint,
  onDeleteSprint,
  onGoToActiveBoard,
  onQuickCreateInSprint,
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
    onMoveToSprint(issueId, sprint.name);
  };

  const totalEstimate = issues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const todoCount = issues.filter((i) => i.status === 'OPEN').length;
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'REVIEW').length;
  const doneCount = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

  const sprintMenuActions = [
    {
      label: (
        <span className="flex items-center gap-2">
          <Edit2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Edit Sprint</span>
        </span>
      ),
      onClick: () => onEditSprint(sprint),
    },
    {
      label: (
        <span className="flex items-center gap-2 text-[var(--md-sys-color-error)]">
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Sprint</span>
        </span>
      ),
      onClick: () => onDeleteSprint(sprint.name),
      danger: true,
    },
  ];

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
      {/* Sprint Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)]/30">
        {/* Left: Chevron toggle + Title + Status + Dates + Goal */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sprint' : 'Collapse sprint'}
            className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer shrink-0 mt-0.5 sm:mt-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                onClick={onToggleCollapse}
                className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-surface)] cursor-pointer hover:text-[var(--md-sys-color-primary)] transition-colors truncate"
              >
                {sprint.name}
              </h2>

              <Badge
                variant={
                  sprint.status === 'ACTIVE'
                    ? 'success'
                    : sprint.status === 'PLANNED'
                    ? 'primary'
                    : 'neutral'
                }
                size="sm"
                className="uppercase tracking-wider font-bold"
              >
                {sprint.status}
              </Badge>

              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold shrink-0">
                ({issues.length} {issues.length === 1 ? 'issue' : 'issues'})
              </span>
            </div>

            {/* Date Range & Goal */}
            <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {sprint.startDate && sprint.endDate && (
                <span className="flex items-center gap-1 font-mono shrink-0">
                  <Calendar className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                  <span>{sprint.startDate} to {sprint.endDate}</span>
                </span>
              )}
              {sprint.goal && (
                <span className="flex items-center gap-1 truncate max-w-md">
                  <Target className="w-3 h-3 text-[var(--md-sys-color-tertiary)] shrink-0" />
                  <span className="truncate">Goal: {sprint.goal}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Metrics + Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Status Breakdown Pills */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]" title="To Do">
              {todoCount} To Do
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]" title="In Progress & Review">
              {inProgressCount} Progress
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]" title="Done">
              {doneCount} Done
            </span>
          </div>

          {/* Estimate Sum Badge */}
          {totalEstimate > 0 && (
            <Badge variant="neutral" size="sm" className="font-mono font-bold">
              {totalEstimate}h total
            </Badge>
          )}

          {/* Lifecycle Action: Start Sprint */}
          {sprint.status === 'PLANNED' && (
            <Button
              variant="filled"
              size="sm"
              onClick={() => onStartSprint(sprint.name)}
              leftIcon={<Play className="w-3 h-3 fill-current" />}
            >
              Start Sprint
            </Button>
          )}

          {/* Lifecycle Action: Complete Sprint & Board Link */}
          {sprint.status === 'ACTIVE' && (
            <div className="flex items-center gap-1.5">
              {onGoToActiveBoard && (
                <button
                  type="button"
                  onClick={onGoToActiveBoard}
                  className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--md-sys-color-primary-container)]/40 hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
                  title="View Active Sprint Board"
                >
                  <span>Active Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onCompleteSprint(sprint.name)}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" />}
                className="border-[var(--md-sys-color-success)] text-[var(--md-sys-color-success)] hover:bg-[var(--md-sys-color-success-container)]/20"
              >
                Complete Sprint
              </Button>
            </div>
          )}

          {/* 3-dot Menu for Edit / Delete */}
          <Dropdown
            trigger={
              <button
                type="button"
                aria-label="Sprint options"
                className="p-1.5 rounded-lg text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            items={sprintMenuActions}
            align="end"
          />
        </div>
      </div>

      {/* Sprint Issues List Body (when expanded) */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-2 bg-[var(--md-sys-color-surface-container-lowest)]/50 dark:bg-[var(--md-sys-color-surface-container-low)]">
          {issues.length === 0 ? (
            <div className="py-8 px-4 rounded-2xl border border-dashed border-[var(--md-sys-color-outline-variant)]/50 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] flex flex-col items-center justify-center gap-1">
              <Sparkles className="w-6 h-6 text-[var(--md-sys-color-primary)] opacity-60 mb-1" />
              <p className="font-semibold text-xs text-[var(--md-sys-color-on-surface)]">
                Plan this sprint by dragging issues here
              </p>
              <p className="text-[11px] opacity-70">
                Drag tickets from the Backlog pool below or click "+ Add Issue"
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

          {/* Inline Quick Add Issue Trigger */}
          <button
            type="button"
            onClick={() => onQuickCreateInSprint(sprint.name)}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)]/50 hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Issue in {sprint.name}</span>
          </button>
        </div>
      )}
    </div>
  );
};
