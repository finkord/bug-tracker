import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { IssueItem } from '../../api/client.js';
import type { SprintDefinition } from '../../types/agile.js';
import { AgileIssueRow } from './AgileIssueRow.js';
import { Badge, Button, Dropdown, Tooltip } from '../ui';
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
  Users,
} from 'lucide-react';

interface SprintContainerProps {
  sprint: SprintDefinition;
  issues: IssueItem[];
  availableSprints: SprintDefinition[];
  isCollapsed: boolean;
  onToggleCollapse: (sprintName: string) => void;
  onSelectIssue: (issue: IssueItem) => void;
  onMoveToSprint: (issueId: number, sprintId: number | null) => void;
  onStartSprint: (sprintId: number) => void;
  onCompleteSprint: (sprint: SprintDefinition) => void;
  onEditSprint: (sprint: SprintDefinition) => void;
  onDeleteSprint: (sprintId: number, sprintName: string) => void;
  onGoToActiveBoard?: () => void;
  onQuickCreateInSprint: (sprintId: number) => void;
}

const SprintContainerComponent: React.FC<SprintContainerProps> = ({
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
  const { setNodeRef } = useDroppable({
    id: `sprint-${sprint.id}`,
    data: {
      type: 'sprint',
      sprintId: sprint.id,
    },
  });

  const orderedIds = useMemo(() => issues.map((i) => i.id), [issues]);

  const totalEstimate = issues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const capacity = sprint.capacityHours || sprint.team?.sprintCapacityHours || 0;
  const capacityPercentage = capacity > 0 ? Math.round((totalEstimate / capacity) * 100) : 0;
  const isOverCapacity = capacity > 0 && totalEstimate > capacity;

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
      onClick: () => {
        if (sprint.id) {
          onDeleteSprint(sprint.id, sprint.name);
        }
      },
      danger: true,
    },
  ];

  return (
    <div
      ref={setNodeRef}
      data-drop-zone="sprint"
      data-sprint-id={sprint.id}
      className="rounded-3xl border border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-outline-variant)]/70 bg-[var(--md-sys-color-surface-container-low)] shadow-2xs overflow-hidden transition-colors duration-150"
    >
      {/* Sprint Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-4 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggleCollapse(sprint.name)}
            aria-label={isCollapsed ? 'Expand sprint' : 'Collapse sprint'}
            className="p-1 rounded-lg text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                {sprint.name}
              </span>

              {/* Status Badge */}
              <Badge
                variant={
                  sprint.status === 'ACTIVE'
                    ? 'in-progress'
                    : sprint.status === 'COMPLETED'
                      ? 'resolved'
                      : 'neutral'
                }
                size="sm"
              >
                {sprint.status}
              </Badge>

              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
                {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
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
                <span className="flex items-center gap-1 min-w-0">
                  <Target className="w-3 h-3 text-[var(--md-sys-color-tertiary)] shrink-0" />
                  <span className="truncate max-w-xl">Goal: {sprint.goal}</span>
                </span>
              )}
            </div>

            {/* Team & Capacity Progress Meter */}
            {(capacity > 0 || sprint.team) && (
              <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-[11px]">
                {sprint.team && (
                  <Badge variant="secondary" size="sm" className="gap-1 font-mono text-[10px]">
                    <Users className="w-3 h-3" />
                    {sprint.team.name}
                  </Badge>
                )}
                {capacity > 0 && (
                  <div className="flex items-center gap-2 min-w-[200px] max-w-xs flex-1">
                    <div className="w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverCapacity
                            ? 'bg-[var(--md-sys-color-error)]'
                            : capacityPercentage > 85
                              ? 'bg-[var(--md-sys-color-warning)]'
                              : 'bg-[var(--md-sys-color-primary)]'
                        }`}
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`font-mono text-[10px] whitespace-nowrap ${
                        isOverCapacity
                          ? 'font-bold text-[var(--md-sys-color-error)]'
                          : 'text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {totalEstimate}h / {capacity}h {isOverCapacity ? '(Exceeded)' : `(${capacityPercentage}%)`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Metrics + Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Unified Sprint Metrics (Linear / Jira style) */}
          <Tooltip content={`To Do: ${todoCount} | In Progress: ${inProgressCount} | Done: ${doneCount}${totalEstimate > 0 ? ` | Total: ${totalEstimate}h` : ''}`}>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-xs font-mono font-medium text-[var(--md-sys-color-on-surface-variant)] shrink-0 cursor-default border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs">
              <span>{issues.length} {issues.length === 1 ? 'ticket' : 'tickets'}</span>
              {totalEstimate > 0 && <span>· {totalEstimate}h</span>}
              {issues.length > 0 && (
                <div className="w-14 h-1.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] flex overflow-hidden ml-1">
                  {doneCount > 0 && (
                    <div
                      className="h-full bg-[var(--md-sys-color-success)]"
                      style={{ width: `${(doneCount / issues.length) * 100}%` }}
                    />
                  )}
                  {inProgressCount > 0 && (
                    <div
                      className="h-full bg-[var(--md-sys-color-primary)]"
                      style={{ width: `${(inProgressCount / issues.length) * 100}%` }}
                    />
                  )}
                  {todoCount > 0 && (
                    <div
                      className="h-full bg-[var(--md-sys-color-outline-variant)]/40"
                      style={{ width: `${(todoCount / issues.length) * 100}%` }}
                    />
                  )}
                </div>
              )}
            </div>
          </Tooltip>

          {/* Lifecycle Action: Start Sprint */}
          {sprint.status === 'PLANNED' && sprint.id && (
            <Button
              variant="filled"
              size="sm"
              onClick={() => onStartSprint(sprint.id!)}
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
                onClick={() => onCompleteSprint(sprint)}
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
                orderedIds={orderedIds}
              />
            ))
          )}

          {/* Inline Quick Add Issue Trigger */}
          {sprint.id && (
            <button
              type="button"
              onClick={() => onQuickCreateInSprint(sprint.id!)}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)]/50 hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Create Issue in {sprint.name}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const SprintContainer = React.memo(SprintContainerComponent);
