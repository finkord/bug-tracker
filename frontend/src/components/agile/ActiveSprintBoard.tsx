import React, { useState } from 'react';
import type { IssueItem, IssueStatus } from '../../api/client';
import type { SprintDefinition } from '../../types/agile';
import { IssueCard } from '../kanban/IssueCard';
import { Badge, Button } from '../ui';
import {
  Calendar,
  Target,
  CheckCircle2,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ActiveSprintBoardProps {
  sprint: SprintDefinition | null;
  issues: IssueItem[];
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe: (issueId: number) => void;
  onCompleteSprint: (sprint: SprintDefinition) => void;
  onGoToBacklog: () => void;
  currentUserId?: number;
}

interface ScrumColumnDef {
  id: string;
  title: string;
  statuses: IssueStatus[];
  dropStatus: IssueStatus;
  badgeVariant: 'open' | 'in-progress' | 'review' | 'resolved' | 'closed';
}

const SCRUM_COLUMNS: ScrumColumnDef[] = [
  { id: 'todo', title: 'To Do', statuses: ['OPEN'], dropStatus: 'OPEN', badgeVariant: 'open' },
  { id: 'in_progress', title: 'In Progress', statuses: ['IN_PROGRESS'], dropStatus: 'IN_PROGRESS', badgeVariant: 'in-progress' },
  { id: 'review', title: 'In Review', statuses: ['REVIEW'], dropStatus: 'REVIEW', badgeVariant: 'review' },
  { id: 'done', title: 'Done', statuses: ['RESOLVED', 'CLOSED'], dropStatus: 'RESOLVED', badgeVariant: 'resolved' },
];

export const ActiveSprintBoard: React.FC<ActiveSprintBoardProps> = ({
  sprint,
  issues,
  onSelectIssue,
  onStatusChange,
  onAssignToMe,
  onCompleteSprint,
  onGoToBacklog,
  currentUserId,
}) => {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, dropStatus: IssueStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const issueIdStr = e.dataTransfer.getData('text/plain');
    if (!issueIdStr) return;

    const issueId = Number(issueIdStr);
    const target = issues.find((i) => i.id === issueId);
    if (!target || target.status === dropStatus) return;

    onStatusChange(issueId, dropStatus);
  };

  if (!sprint) {
    return (
      <div className="flex flex-col items-center justify-center p-12 my-6 rounded-3xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center mb-3">
          <Play className="w-6 h-6 fill-current" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
          No Active Sprint
        </h2>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-md">
          There is no sprint currently in progress. Head over to the Backlog view to plan and start a sprint.
        </p>
        <div className="mt-5">
          <Button
            variant="filled"
            size="md"
            onClick={onGoToBacklog}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            Go to Backlog Planning
          </Button>
        </div>
      </div>
    );
  }

  const completedCount = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  const progressPercent = issues.length > 0 ? Math.round((completedCount / issues.length) * 100) : 0;

  return (
    <div className="w-full pb-8 pt-1 space-y-4">
      {/* Active Sprint Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--md-sys-color-on-surface)] truncate">
              {sprint.name}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] ring-1 ring-[var(--md-sys-color-success)]/40">
              Active Sprint
            </span>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              ({issues.length} {issues.length === 1 ? 'issue' : 'issues'})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {sprint.startDate && sprint.endDate && (
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>{sprint.startDate} to {sprint.endDate}</span>
              </span>
            )}
            {sprint.goal && (
              <span className="flex items-center gap-1 text-[11px] truncate max-w-lg">
                <Target className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)] shrink-0" />
                <span className="truncate">{sprint.goal}</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress bar + Complete Sprint action */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end gap-1 text-xs">
            <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
              {completedCount} of {issues.length} Done ({progressPercent}%)
            </span>
            <div className="w-32 h-1.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
              <div
                className="h-full bg-[var(--md-sys-color-success)] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

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
      </div>

      {/* Scrum Board 4-Column Layout */}
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-3 xl:gap-4 items-stretch min-w-[1000px]">
          {SCRUM_COLUMNS.map((col) => {
            const colIssues = issues.filter((i) => col.statuses.includes(i.status));
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.dropStatus)}
                className={`flex flex-col flex-1 min-w-[230px] rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border transition-all duration-200 shadow-2xs ${
                  isOver
                    ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container)] shadow-md'
                    : 'border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-outline-variant)]/70'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--md-sys-color-outline-variant)]/30 shrink-0 sticky top-0 bg-[var(--md-sys-color-surface-container-low)] rounded-t-3xl z-10">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface)] truncate">
                    {col.title}
                  </h3>
                  <Badge variant={col.badgeVariant} size="sm">
                    {colIssues.length}
                  </Badge>
                </div>

                {/* Cards List */}
                <div className="flex-1 p-3 space-y-2.5 min-h-[220px]">
                  {colIssues.length === 0 ? (
                    <div
                      className={`flex flex-col items-center justify-center h-28 rounded-2xl border border-dashed text-center p-3 text-xs transition-colors ${
                        isOver
                          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-primary)]'
                          : 'border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container)]/30 text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 opacity-50 mb-1" />
                      <span>No issues</span>
                      <span className="text-[10px] opacity-70 mt-0.5">Drag tickets here</span>
                    </div>
                  ) : (
                    colIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onClick={onSelectIssue}
                        onStatusChange={onStatusChange}
                        onAssignToMe={onAssignToMe}
                        currentUserId={currentUserId}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
