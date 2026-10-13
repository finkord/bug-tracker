import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { IssueItem, IssueStatus } from '../../api/client.js';
import type { KanbanSettings } from '../../types/kanban.js';
import { KANBAN_COLUMNS } from '../../types/kanban.js';
import { DraggableKanbanCard } from './DraggableKanbanCard.js';
import { Badge } from '../ui/index.js';
import { Loader2, Plus, AlertCircle, Ban } from 'lucide-react';
import { isAllowedTransition } from '../../utils/workflowTransitions.js';
import { useIssueSelectionStore } from '../../store/useIssueSelectionStore.js';

interface KanbanFlatBoardProps {
  issues: IssueItem[];
  loading: boolean;
  settings: KanbanSettings;
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe: (issueId: number) => void;
  onQuickAddInStatus?: (status: IssueStatus) => void;
  currentUserId?: number;
  focusedIssueId?: number | null;
}

interface GhostCardProps {
  issue: IssueItem;
  selectedCount?: number;
}

const GhostCard: React.FC<GhostCardProps> = React.memo(({ issue, selectedCount }) => {
  return (
    <div
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border-2 border-[var(--md-sys-color-primary)] shadow-2xl w-[260px] select-none pointer-events-none relative"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono font-bold text-[var(--md-sys-color-primary)]">
          {issue.key}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
          {issue.status}
        </span>
      </div>
      <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] line-clamp-2 leading-snug">
        {issue.title}
      </p>
      {issue.assignee && (
        <div className="mt-2 text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-medium truncate">
          {issue.assignee.fullName}
        </div>
      )}
      {selectedCount && selectedCount > 1 ? (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-md ring-2 ring-[var(--md-sys-color-surface)]">
          +{selectedCount - 1} more
        </span>
      ) : null}
    </div>
  );
});

interface KanbanColumnProps {
  col: (typeof KANBAN_COLUMNS)[number];
  colIssues: IssueItem[];
  limit?: number;
  loading: boolean;
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe: (issueId: number) => void;
  onQuickAddInStatus?: (status: IssueStatus) => void;
  currentUserId?: number;
  focusedIssueId?: number | null;
  settings: KanbanSettings;
  orderedIds: number[];
}

const KanbanColumnDroppableComponent: React.FC<KanbanColumnProps> = ({
  col,
  colIssues,
  limit,
  loading,
  onSelectIssue,
  onStatusChange,
  onAssignToMe,
  onQuickAddInStatus,
  currentUserId,
  focusedIssueId,
  settings,
  orderedIds,
}) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `column-${col.status}`,
    data: {
      type: 'column',
      status: col.status,
    },
    disabled: false,
  });

  const draggedIssue = active?.data.current?.issue as IssueItem | undefined;
  const isDisallowed = draggedIssue
    ? !isAllowedTransition(draggedIssue.status, col.status)
    : false;
  const isCurrentColumn = draggedIssue ? draggedIssue.status === col.status : false;

  const isLimitExceeded = limit !== undefined && limit > 0 && colIssues.length > limit;

  return (
    <div
      ref={setNodeRef}
      id={`column-${col.status}`}
      data-drop-zone="column"
      data-column-status={col.status}
      className={`flex flex-col flex-1 min-w-[230px] rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border transition-colors duration-150 shadow-2xs ${
        isDisallowed
          ? 'opacity-40 border-dashed border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)] cursor-not-allowed'
          : isOver && !isCurrentColumn
            ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container)] shadow-md'
            : isLimitExceeded
              ? 'border-[var(--md-sys-color-error)]/60 bg-[var(--md-sys-color-error-container)]/10'
              : 'border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-outline-variant)]/70'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--md-sys-color-outline-variant)]/30 shrink-0 sticky top-0 bg-[var(--md-sys-color-surface-container-low)] rounded-t-3xl z-10">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface)] truncate">
            {col.title}
          </h3>

          <Badge
            variant={col.badgeVariant}
            size="sm"
            className="px-2 py-0.5 rounded-full font-bold shrink-0"
          >
            {colIssues.length}
            {limit ? ` / ${limit}` : ''}
          </Badge>

          {isDisallowed && (
            <span
              title="Transition not allowed from current status"
              className="flex items-center text-[10px] text-[var(--md-sys-color-outline)] shrink-0"
            >
              <Ban className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]/70" />
            </span>
          )}

          {isLimitExceeded && (
            <span
              title={`WIP Limit exceeded (${colIssues.length}/${limit})`}
              className="flex items-center gap-1 text-[10px] font-bold text-[var(--md-sys-color-error)] shrink-0"
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {onQuickAddInStatus && (
          <button
            type="button"
            onClick={() => onQuickAddInStatus(col.status)}
            className="p-1 rounded-lg text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
            title={`Add ticket in ${col.title}`}
            aria-label={`Add ticket in ${col.title}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Column Cards Container */}
      <div className="flex-1 p-3 space-y-2.5 min-h-[220px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--md-sys-color-primary)]" />
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Loading...
            </span>
          </div>
        ) : colIssues.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center h-28 rounded-2xl border border-dashed text-center p-3 text-xs transition-colors ${
              isDisallowed
                ? 'border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-outline)]/40'
                : isOver && !isCurrentColumn
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-primary)]'
                  : 'border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container)]/30 text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          >
            <span>{isDisallowed ? 'Transition blocked' : 'No issues'}</span>
            <span className="text-[10px] opacity-70 mt-0.5">
              {isDisallowed ? 'Disallowed by workflow rules' : 'Drag tickets here'}
            </span>
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
              density={settings.cardDensity}
              isFocused={focusedIssueId === issue.id}
              orderedIds={orderedIds}
            />
          ))
        )}
      </div>
    </div>
  );
};

const KanbanColumnDroppable = React.memo(KanbanColumnDroppableComponent);

const boardCollisionDetection: CollisionDetection = (args) => {
  const { pointerCoordinates, droppableContainers } = args;
  if (!pointerCoordinates) {
    return [];
  }

  const el = document.elementFromPoint(pointerCoordinates.x, pointerCoordinates.y);
  if (el) {
    const colEl = el.closest<HTMLElement>('[data-drop-zone="column"]');
    if (colEl && colEl.id) {
      const container = droppableContainers.find((c) => c.id === colEl.id);
      if (container) {
        return [
          {
            id: colEl.id,
            data: {
              droppableContainer: container,
              value: 1,
            },
          },
        ];
      }
    }
  }

  return [];
};

export const KanbanFlatBoard: React.FC<KanbanFlatBoardProps> = ({
  issues,
  loading,
  settings,
  onSelectIssue,
  onStatusChange,
  onAssignToMe,
  onQuickAddInStatus,
  currentUserId,
  focusedIssueId,
}) => {
  const [activeIssue, setActiveIssue] = useState<IssueItem | null>(null);
  const { selectedIds, clearSelection } = useIssueSelectionStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
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
      targetStatus = over.data.current.status;
    } else if (over.data.current?.type === 'issue') {
      targetStatus = over.data.current.issue?.status;
    }

    if (!targetStatus) return;

    // Batch drag support
    if (selectedIds.has(issue.id) && selectedIds.size > 1) {
      selectedIds.forEach((id) => {
        const item = issues.find((i) => i.id === id);
        if (
          item &&
          item.status !== targetStatus &&
          isAllowedTransition(item.status, targetStatus)
        ) {
          onStatusChange(id, targetStatus);
        }
      });
      clearSelection();
    } else if (
      targetStatus !== issue.status &&
      isAllowedTransition(issue.status, targetStatus)
    ) {
      onStatusChange(issue.id, targetStatus);
    }
  };

  const handleDragCancel = () => {
    setActiveIssue(null);
  };

  const orderedIds = useMemo(() => issues.map((i) => i.id), [issues]);

  const issuesByColumn = useMemo(() => {
    const map: Record<string, IssueItem[]> = {};
    for (const col of KANBAN_COLUMNS) {
      map[col.status] = [];
    }
    for (const issue of issues) {
      if (map[issue.status]) {
        map[issue.status].push(issue);
      }
    }
    return map;
  }, [issues]);

  const visibleColumns = useMemo(() => {
    if (settings.showClosedColumn === false) {
      return KANBAN_COLUMNS.filter((col) => col.status !== 'CLOSED');
    }
    return KANBAN_COLUMNS;
  }, [settings.showClosedColumn]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={boardCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.BeforeDragging,
        },
      }}
      autoScroll={false}
    >
      <div className="w-full pb-6 pt-1">
        {/* Horizontal Container */}
        <div data-drag-scroll-x="true" className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-3 xl:gap-4 items-stretch min-w-[1200px]">
            {visibleColumns.map((col) => {
              const colIssues = issuesByColumn[col.status] || [];
              const limit = settings.wipLimits[col.status];

              return (
                <KanbanColumnDroppable
                  key={col.status}
                  col={col}
                  colIssues={colIssues}
                  limit={limit}
                  loading={loading}
                  onSelectIssue={onSelectIssue}
                  onStatusChange={onStatusChange}
                  onAssignToMe={onAssignToMe}
                  onQuickAddInStatus={onQuickAddInStatus}
                  currentUserId={currentUserId}
                  focusedIssueId={focusedIssueId}
                  settings={settings}
                  orderedIds={orderedIds}
                />
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay
        className="pointer-events-none"
        style={{ pointerEvents: 'none' }}
        dropAnimation={null}
      >
        {activeIssue ? (
          <GhostCard
            issue={activeIssue}
            selectedCount={selectedIds.size}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
