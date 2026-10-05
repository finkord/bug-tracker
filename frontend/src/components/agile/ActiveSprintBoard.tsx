import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { IssueItem, IssueStatus } from '../../api/client.js';
import type { SprintDefinition } from '../../types/agile.js';
import { IssueCard } from '../kanban/IssueCard.js';
import { DraggableKanbanCard } from '../kanban/DraggableKanbanCard.js';
import { Badge, Button } from '../ui/index.js';
import {
  Calendar,
  Target,
  CheckCircle2,
  Play,
  Layers,
  Sparkles,
  Ban,
} from 'lucide-react';
import { isAllowedTransition } from '../../utils/workflowTransitions.js';

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

interface ScrumColumnProps {
  col: ScrumColumnDef;
  colIssues: IssueItem[];
  activeIssue: IssueItem | null;
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe: (issueId: number) => void;
  currentUserId?: number;
}

const ScrumColumnDroppable: React.FC<ScrumColumnProps> = ({
  col,
  colIssues,
  activeIssue,
  onSelectIssue,
  onStatusChange,
  onAssignToMe,
  currentUserId,
}) => {
  const isDisallowed = activeIssue
    ? !col.statuses.some((s) => isAllowedTransition(activeIssue.status, s))
    : false;
  const isCurrentColumn = activeIssue ? col.statuses.includes(activeIssue.status) : false;

  const { setNodeRef, isOver } = useDroppable({
    id: `scrum-col-${col.id}`,
    data: {
      type: 'column',
      colId: col.id,
      dropStatus: col.dropStatus,
      statuses: col.statuses,
    },
    disabled: isDisallowed,
  });

  return (
    <div
      ref={setNodeRef}
      data-column-status={col.dropStatus}
      className={`flex flex-col flex-1 min-w-[230px] rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border transition-all duration-150 shadow-2xs ${
        isDisallowed
          ? 'opacity-40 border-dashed border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)] cursor-not-allowed'
          : isOver && !isCurrentColumn
            ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container)] shadow-md'
            : 'border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-outline-variant)]/70'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--md-sys-color-outline-variant)]/30 shrink-0 sticky top-0 bg-[var(--md-sys-color-surface-container-low)] rounded-t-3xl z-10">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface)] truncate">
            {col.title}
          </h3>
          <Badge variant={col.badgeVariant} size="sm">
            {colIssues.length}
          </Badge>
          {isDisallowed && (
            <span
              title="Transition not allowed from current status"
              className="flex items-center text-[10px] text-[var(--md-sys-color-outline)] shrink-0"
            >
              <Ban className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]/70" />
            </span>
          )}
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 p-3 space-y-2.5 min-h-[220px]">
        {colIssues.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center h-28 rounded-2xl border border-dashed text-center p-3 text-xs transition-colors ${
              isDisallowed
                ? 'border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-outline)]/40'
                : isOver && !isCurrentColumn
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-primary)]'
                  : 'border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container)]/30 text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            {isDisallowed ? (
              <>
                <span>Transition blocked</span>
                <span className="text-[10px] opacity-70 mt-0.5">Disallowed by workflow rules</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 opacity-50 mb-1" />
                <span>No issues</span>
                <span className="text-[10px] opacity-70 mt-0.5">Drag tickets here</span>
              </>
            )}
          </div>
        ) : (
          colIssues.map((issue) => (
            <DraggableKanbanCard
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
};

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
  const [activeIssue, setActiveIssue] = useState<IssueItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const issue = event.active.data.current?.issue as IssueItem | undefined;
    if (issue) {
      setActiveIssue(issue);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);
    if (!over) return;

    const issue = active.data.current?.issue as IssueItem | undefined;
    if (!issue) return;

    let targetStatus: IssueStatus | undefined;
    if (over.data.current?.type === 'column') {
      const dropStatus = over.data.current.dropStatus as IssueStatus;
      const statuses = over.data.current.statuses as IssueStatus[];
      if (!statuses.includes(issue.status) && isAllowedTransition(issue.status, dropStatus)) {
        targetStatus = dropStatus;
      }
    } else if (over.data.current?.type === 'issue') {
      const targetIssue = over.data.current.issue as IssueItem;
      if (targetIssue.status !== issue.status && isAllowedTransition(issue.status, targetIssue.status)) {
        targetStatus = targetIssue.status;
      }
    }

    if (targetStatus && targetStatus !== issue.status) {
      onStatusChange(issue.id, targetStatus);
    }
  };

  const handleDragCancel = () => {
    setActiveIssue(null);
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
              {sprint.goal && (
                <div className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)]">
                  <Target className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                  <span className="truncate max-w-md italic">{sprint.goal}</span>
                </div>
              )}
              {sprint.startDate && sprint.endDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] shrink-0" />
                  <span>
                    {new Date(sprint.startDate).toLocaleDateString()} -{' '}
                    {new Date(sprint.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Action: Progress indicator & Complete Sprint */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="w-28 h-1.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                <div
                  className="h-full bg-[var(--md-sys-color-success)] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <Button
              variant="tonal"
              size="sm"
              onClick={() => onCompleteSprint(sprint)}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-[var(--md-sys-color-success)]" />}
            >
              Complete Sprint
            </Button>
          </div>
        </div>

        {/* Scrum Board 4-Column Layout */}
        <div data-drag-scroll-x="true" className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-3 xl:gap-4 items-stretch min-w-[1000px]">
            {SCRUM_COLUMNS.map((col) => {
              const colIssues = issues.filter((i) => col.statuses.includes(i.status));

              return (
                <ScrumColumnDroppable
                  key={col.id}
                  col={col}
                  colIssues={colIssues}
                  activeIssue={activeIssue}
                  onSelectIssue={onSelectIssue}
                  onStatusChange={onStatusChange}
                  onAssignToMe={onAssignToMe}
                  currentUserId={currentUserId}
                />
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeIssue ? (
          <div className="rotate-2 scale-102 shadow-2xl opacity-95 pointer-events-none w-[270px]">
            <IssueCard
              issue={activeIssue}
              onClick={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
