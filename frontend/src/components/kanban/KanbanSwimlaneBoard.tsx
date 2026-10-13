import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { IssueItem, IssueStatus, IssuePriority, IssueType, AssigneeUser } from '../../api/client';
import type { KanbanSettings } from '../../types/kanban.js';
import { KANBAN_COLUMNS } from '../../types/kanban.js';
import { IssueCard } from './IssueCard.js';
import { DraggableKanbanCard } from './DraggableKanbanCard.js';
import { Avatar } from '../common/Avatar';
import { Badge } from '../ui';
import { useIssueSelectionStore } from '../../store/useIssueSelectionStore.js';
import { isAllowedTransition } from '../../utils/workflowTransitions.js';
import {
  ChevronDown,
  ChevronRight,
  UserX,
  ChevronsUpDown,
  Loader2,
  Plus,
  AlertCircle,
  Layers,
  Flame,
} from 'lucide-react';

export interface KanbanSwimlaneBoardProps {
  issues: IssueItem[];
  loading: boolean;
  settings: KanbanSettings;
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssigneeAndStatusChange: (issueId: number, newAssigneeId: number | null, nextStatus: IssueStatus) => void;
  onSwimlaneDrop?: (
    issueId: number,
    nextStatus: IssueStatus,
    patch?: { assigneeId?: number | null; parentId?: number | null; epicId?: number | null; priority?: IssuePriority },
  ) => void;
  onAssignToMe: (issueId: number) => void;
  onQuickAddInStatus?: (status: IssueStatus, assigneeId?: number | null) => void;
  currentUserId?: number;
  focusedIssueId?: number | null;
}

interface BaseSwimlaneGroup {
  key: string;
  title: string;
  subtitle?: string | null;
  issues: IssueItem[];
}

interface AssigneeSwimlaneGroup extends BaseSwimlaneGroup {
  type: 'assignee';
  assignee: AssigneeUser | null;
  assigneeId: number | null;
}

interface EpicSwimlaneGroup extends BaseSwimlaneGroup {
  type: 'epic';
  parentId: number | null;
  epicId?: number | null;
  parentIssue: { id: number; key: string; title: string; issueType?: IssueType; color?: string | null } | null;
}

interface ExpediteSwimlaneGroup extends BaseSwimlaneGroup {
  type: 'expedite';
  isExpedite: boolean;
}

type SwimlaneGroup = AssigneeSwimlaneGroup | EpicSwimlaneGroup | ExpediteSwimlaneGroup;

interface SwimlaneCellDroppableProps {
  group: SwimlaneGroup;
  col: (typeof KANBAN_COLUMNS)[number];
  colIssues: IssueItem[];
  allIssues: IssueItem[];
  activeIssue: IssueItem | null;
  settings: KanbanSettings;
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssigneeAndStatusChange: (issueId: number, newAssigneeId: number | null, nextStatus: IssueStatus) => void;
  onAssignToMe: (issueId: number) => void;
  onQuickAddInStatus?: (status: IssueStatus, assigneeId?: number | null) => void;
  currentUserId?: number;
  focusedIssueId?: number | null;
}

const SwimlaneCellDroppable: React.FC<SwimlaneCellDroppableProps> = ({
  group,
  col,
  colIssues,
  allIssues,
  activeIssue,
  settings,
  onSelectIssue,
  onStatusChange,
  onAssigneeAndStatusChange,
  onAssignToMe,
  onQuickAddInStatus,
  currentUserId,
  focusedIssueId,
}) => {
  const isTransitionAllowed = !activeIssue || isAllowedTransition(activeIssue.status, col.status);
  const cellKey = `${group.key}-${col.status}`;

  const { setNodeRef, isOver } = useDroppable({
    id: `swimlane-cell-${cellKey}`,
    data: {
      type: 'swimlane-cell',
      group,
      status: col.status,
    },
    disabled: !isTransitionAllowed,
  });

  const limit = settings.wipLimits[col.status];
  const isLimitExceeded = limit !== undefined && limit > 0 && colIssues.length > limit;

  return (
    <div
      ref={setNodeRef}
      data-drop-zone="cell"
      data-column-status={col.status}
      data-lane-key={group.key}
      className={`flex-1 min-w-[230px] flex flex-col rounded-2xl p-2.5 transition-colors duration-150 min-h-[120px] border ${
        isOver && isTransitionAllowed
          ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/10 shadow-xs'
          : isOver && !isTransitionAllowed
          ? 'border-[var(--md-sys-color-error)]/40 bg-[var(--md-sys-color-error-container)]/10 cursor-not-allowed'
          : isLimitExceeded
          ? 'border-[var(--md-sys-color-error)]/40 bg-[var(--md-sys-color-error-container)]/10'
          : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container-low)]'
      }`}
    >
      {/* Cell Header with Column Title and Quick Add */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
            {col.title}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
            {colIssues.length}
          </span>
          {isLimitExceeded && (
            <AlertCircle className="w-3 h-3 text-[var(--md-sys-color-error)]" />
          )}
        </div>

        {onQuickAddInStatus && (
          <button
            type="button"
            onClick={() =>
              onQuickAddInStatus(
                col.status,
                group.type === 'assignee' ? group.assigneeId : undefined,
              )
            }
            className="p-0.5 rounded text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
            title={`Add ticket in ${group.title} (${col.title})`}
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Cards List in this cell */}
      <div className="flex-1 space-y-2.5">
        {colIssues.length === 0 ? (
          <div
            className={`h-16 rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-2 text-[11px] transition-colors ${
              isOver && isTransitionAllowed
                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-primary)]'
                : isOver && !isTransitionAllowed
                ? 'border-[var(--md-sys-color-error)]/40 bg-[var(--md-sys-color-error-container)]/20 text-[var(--md-sys-color-error)]'
                : 'border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-outline)]'
            }`}
          >
            <span className="text-[10px] opacity-70">
              {isOver && !isTransitionAllowed ? 'Transition not allowed' : 'Drop tickets here'}
            </span>
          </div>
        ) : (
          colIssues.map((issue) => (
            <DraggableKanbanCard
              key={issue.id}
              issue={issue}
              onClick={onSelectIssue}
              onStatusChange={(id, nextStatus) => {
                if (group.type === 'assignee') {
                  onAssigneeAndStatusChange(id, group.assigneeId, nextStatus);
                } else {
                  onStatusChange(id, nextStatus);
                }
              }}
              onAssignToMe={onAssignToMe}
              currentUserId={currentUserId}
              density={settings.cardDensity}
              isFocused={focusedIssueId === issue.id}
              orderedIds={allIssues.map((i) => i.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const KanbanSwimlaneBoard: React.FC<KanbanSwimlaneBoardProps> = ({
  issues,
  loading,
  settings,
  onSelectIssue,
  onStatusChange,
  onAssigneeAndStatusChange,
  onSwimlaneDrop,
  onAssignToMe,
  onQuickAddInStatus,
  currentUserId,
  focusedIssueId,
}) => {
  const [collapsedLanes, setCollapsedLanes] = useState<Record<string, boolean>>({});
  const [activeIssue, setActiveIssue] = useState<IssueItem | null>(null);

  const { selectedIds, clearSelection } = useIssueSelectionStore();

  const swimlaneType = settings.swimlaneType || 'assignee';

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

  // Group issues based on selected swimlane strategy
  const swimlaneGroups = useMemo<SwimlaneGroup[]>(() => {
    // 1. Group by Epic / Parent Issue
    if (swimlaneType === 'epic') {
      const parentMap = new Map<number, EpicSwimlaneGroup>();
      const standaloneGroup: EpicSwimlaneGroup = {
        type: 'epic',
        key: 'standalone',
        title: 'Standalone Issues (Without Epic)',
        subtitle: 'Independent tasks not linked to a parent epic',
        parentId: null,
        parentIssue: null,
        issues: [],
      };

      for (const issue of issues) {
        const ep = issue.epic || (issue.parentId && issue.parent ? issue.parent : null);
        const epId = issue.epicId || issue.parentId;
        if (epId && ep) {
          if (!parentMap.has(epId)) {
            parentMap.set(epId, {
              type: 'epic',
              key: `epic-${epId}`,
              title: `${ep.key}: ${ep.title || 'Untitled Epic'}`,
              subtitle: `Epic container #${epId}`,
              parentId: epId,
              epicId: epId,
              parentIssue: ep,
              issues: [],
            });
          }
          parentMap.get(epId)!.issues.push(issue);
        } else {
          standaloneGroup.issues.push(issue);
        }
      }

      const groups: SwimlaneGroup[] = Array.from(parentMap.values());
      if (standaloneGroup.issues.length > 0) {
        groups.push(standaloneGroup);
      }
      return groups;
    }

    // 2. Expedite / High Priority Track vs Standard Lane
    if (swimlaneType === 'expedite') {
      const expediteIssues: IssueItem[] = [];
      const standardIssues: IssueItem[] = [];

      for (const issue of issues) {
        if (issue.priority === 'CRITICAL') {
          expediteIssues.push(issue);
        } else {
          standardIssues.push(issue);
        }
      }

      const groups: SwimlaneGroup[] = [];
      if (expediteIssues.length > 0 || issues.length === 0) {
        groups.push({
          type: 'expedite',
          key: 'expedite-critical',
          title: 'Expedite Lane (Critical Blockers)',
          subtitle: 'Priority 0 items requiring immediate attention and fast-tracking',
          isExpedite: true,
          issues: expediteIssues,
        });
      }

      groups.push({
        type: 'expedite',
        key: 'standard-track',
        title: 'Standard Workflow',
        subtitle: 'Normal priority issues following regular WIP rules',
        isExpedite: false,
        issues: standardIssues,
      });

      return groups;
    }

    // 3. Group by Assignee (Default)
    const assigneeMap = new Map<number, AssigneeSwimlaneGroup>();
    const unassignedGroup: AssigneeSwimlaneGroup = {
      type: 'assignee',
      key: 'unassigned',
      title: 'Unassigned',
      subtitle: 'Issues ready to be picked up by the team',
      assignee: null,
      assigneeId: null,
      issues: [],
    };

    for (const issue of issues) {
      if (issue.assignee) {
        const userId = issue.assignee.id;
        if (!assigneeMap.has(userId)) {
          assigneeMap.set(userId, {
            type: 'assignee',
            key: `user-${userId}`,
            title: issue.assignee.fullName,
            subtitle: issue.assignee.email,
            assignee: issue.assignee,
            assigneeId: userId,
            issues: [],
          });
        }
        assigneeMap.get(userId)!.issues.push(issue);
      } else {
        unassignedGroup.issues.push(issue);
      }
    }

    const sortedAssignees = Array.from(assigneeMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );

    const groups: SwimlaneGroup[] = [];
    if (settings.unassignedPosition === 'top' && unassignedGroup.issues.length > 0) {
      groups.push(unassignedGroup);
    }

    groups.push(...sortedAssignees);

    if (settings.unassignedPosition !== 'top' && unassignedGroup.issues.length > 0) {
      groups.push(unassignedGroup);
    }

    return groups;
  }, [issues, swimlaneType, settings.unassignedPosition]);

  const toggleLane = (laneKey: string) => {
    setCollapsedLanes((prev) => ({
      ...prev,
      [laneKey]: !prev[laneKey],
    }));
  };

  const handleExpandAll = () => {
    setCollapsedLanes({});
  };

  const handleCollapseAll = () => {
    const all: Record<string, boolean> = {};
    for (const g of swimlaneGroups) {
      all[g.key] = true;
    }
    setCollapsedLanes(all);
  };

  const areAllCollapsed = useMemo(() => {
    if (swimlaneGroups.length === 0) return false;
    return swimlaneGroups.every((g) => Boolean(collapsedLanes[g.key]));
  }, [swimlaneGroups, collapsedLanes]);

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
    let targetGroup: SwimlaneGroup | undefined;

    if (over.data.current?.type === 'swimlane-cell') {
      targetStatus = over.data.current.status;
      targetGroup = over.data.current.group;
    }

    if (!targetStatus || !targetGroup) return;

    const issueIds =
      selectedIds.has(issue.id) && selectedIds.size > 1
        ? Array.from(selectedIds)
        : [issue.id];

    for (const issueId of issueIds) {
      const targetIssue = issues.find((i) => i.id === issueId);
      if (!targetIssue) continue;
      if (!isAllowedTransition(targetIssue.status, targetStatus)) continue;

      if (targetGroup.type === 'assignee') {
        const isSameAssignee = (targetIssue.assignee?.id ?? null) === targetGroup.assigneeId;
        const isSameStatus = targetIssue.status === targetStatus;
        if (isSameAssignee && isSameStatus) continue;

        if (onSwimlaneDrop) {
          onSwimlaneDrop(issueId, targetStatus, { assigneeId: targetGroup.assigneeId });
        } else {
          onAssigneeAndStatusChange(issueId, targetGroup.assigneeId, targetStatus);
        }
      } else if (targetGroup.type === 'epic') {
        const isSameEpic = (targetIssue.epicId ?? targetIssue.parentId ?? null) === (targetGroup.epicId ?? targetGroup.parentId);
        const isSameStatus = targetIssue.status === targetStatus;
        if (isSameEpic && isSameStatus) continue;

        if (onSwimlaneDrop) {
          onSwimlaneDrop(issueId, targetStatus, { epicId: targetGroup.epicId ?? targetGroup.parentId });
        } else {
          onStatusChange(issueId, targetStatus);
        }
      } else if (targetGroup.type === 'expedite') {
        const nextPriority: IssuePriority = targetGroup.isExpedite
          ? 'CRITICAL'
          : targetIssue.priority === 'CRITICAL'
          ? 'HIGH'
          : targetIssue.priority;
        const isSamePriority = targetIssue.priority === nextPriority;
        const isSameStatus = targetIssue.status === targetStatus;
        if (isSamePriority && isSameStatus) continue;

        if (onSwimlaneDrop) {
          onSwimlaneDrop(issueId, targetStatus, { priority: nextPriority });
        } else {
          onStatusChange(issueId, targetStatus);
        }
      }
    }

    if (selectedIds.size > 0) {
      clearSelection();
    }
  };

  const handleDragCancel = () => {
    setActiveIssue(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--md-sys-color-primary)]" />
        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Loading board swimlanes...
        </span>
      </div>
    );
  }

  if (swimlaneGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-center my-4">
        <UserX className="w-10 h-10 text-[var(--md-sys-color-outline)] mb-2" />
        <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">No issues found</h3>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-sm">
          Try changing your search query, adjusting your filters, or creating a new issue.
        </p>
      </div>
    );
  }

  const laneLabel =
    swimlaneType === 'epic'
      ? 'Epic'
      : swimlaneType === 'expedite'
      ? 'Track'
      : 'Assignee';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      autoScroll={{
        threshold: {
          x: 0.15,
          y: 0.15,
        },
        acceleration: 15,
      }}
    >
      <div className="w-full pb-8 pt-1 space-y-4">
        {/* Swimlane Global Control Bar */}
        <div className="flex items-center justify-between px-2 py-1 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            <span className="font-semibold">
              {swimlaneGroups.length} {laneLabel} {swimlaneGroups.length === 1 ? 'Lane' : 'Lanes'}
            </span>
          </div>

          <button
            type="button"
            onClick={areAllCollapsed ? handleExpandAll : handleCollapseAll}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span>{areAllCollapsed ? 'Expand All Lanes' : 'Collapse All Lanes'}</span>
          </button>
        </div>

        {/* Single Synchronized Horizontal Scroll Container */}
        <div data-drag-scroll-x="true" className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="min-w-[1200px] space-y-4">
            {/* Sticky Board Columns Header for Swimlanes */}
            <div className="sticky top-0 z-20 bg-[var(--md-sys-color-background)]/95 backdrop-blur-md pb-2 pt-1 border-b border-[var(--md-sys-color-outline-variant)]/30">
              <div className="flex gap-3 xl:gap-4">
                {KANBAN_COLUMNS.map((col) => {
                  const count = issues.filter((i) => i.status === col.status).length;
                  const limit = settings.wipLimits[col.status];
                  const isLimitExceeded = limit !== undefined && limit > 0 && count > limit;

                  return (
                    <div
                      key={col.status}
                      className={`flex-1 min-w-[230px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-colors ${
                        isLimitExceeded
                          ? 'border-[var(--md-sys-color-error)]/40 bg-[var(--md-sys-color-error-container)]/10'
                          : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]/30'
                      }`}
                    >
                      <span className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface)] truncate">
                        {col.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={col.badgeVariant} size="sm" className="px-2 py-0.5 rounded-full font-bold">
                          {count}
                          {limit ? ` / ${limit}` : ''}
                        </Badge>
                        {isLimitExceeded && (
                          <AlertCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

        {/* Swimlane Rows */}
        {swimlaneGroups.map((group) => {
          const isCollapsed = Boolean(collapsedLanes[group.key]);

          return (
            <div
              key={group.key}
              className={`rounded-3xl border shadow-2xs overflow-hidden transition-all duration-200 ${
                group.type === 'expedite' && group.isExpedite
                  ? 'border-[var(--md-sys-color-error)]/40 bg-[var(--md-sys-color-error-container)]/5'
                  : 'border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-low)]'
              }`}
            >
              {/* Swimlane Header Banner */}
              <div
                onClick={() => toggleLane(group.key)}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer select-none border-b border-[var(--md-sys-color-outline-variant)]/30 transition-colors"
              >
                {/* Left: Collapse Icon + Entity Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label={isCollapsed ? 'Expand lane' : 'Collapse lane'}
                    className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] shrink-0"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Left Icon / Avatar based on swimlane type */}
                  {group.type === 'assignee' && (
                    group.assignee ? (
                      <Avatar
                        name={group.assignee.fullName}
                        avatarUrl={group.assignee.avatarUrl}
                        role={group.assignee.systemRole}
                        size="sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-surface-container-highest)] border border-dashed border-[var(--md-sys-color-outline)] flex items-center justify-center text-[var(--md-sys-color-outline)] shrink-0">
                        <UserX className="w-4 h-4" />
                      </div>
                    )
                  )}

                  {group.type === 'epic' && (
                    <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)]/40 border border-[var(--md-sys-color-primary)]/30 flex items-center justify-center text-[var(--md-sys-color-primary)] shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                  )}

                  {group.type === 'expedite' && (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      group.isExpedite
                        ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-error)]'
                        : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]'
                    }`}>
                      {group.isExpedite ? (
                        <Flame className="w-4 h-4 text-[var(--md-sys-color-error)]" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">
                        {group.title}
                      </h3>
                      {group.type === 'assignee' && group.assignee?.systemRole && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] font-semibold shrink-0">
                          {group.assignee.systemRole}
                        </span>
                      )}
                      {group.type === 'expedite' && group.isExpedite && (
                        <Badge variant="critical" size="sm" className="px-2 py-0.5 rounded-full font-bold">
                          P0 Blocker
                        </Badge>
                      )}
                    </div>
                    {group.subtitle && (
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {group.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Issue Counts & Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="font-bold text-[var(--md-sys-color-on-surface)]">{group.issues.length}</span>
                    <span>{group.issues.length === 1 ? 'ticket' : 'tickets'}</span>
                  </div>

                  {/* Status distribution pill */}
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
                    {KANBAN_COLUMNS.map((col) => {
                      const cnt = group.issues.filter((i) => i.status === col.status).length;
                      if (cnt === 0) return null;
                      return (
                        <Badge key={col.status} variant={col.badgeVariant} size="sm" className="px-1.5 py-0.2 rounded-md font-bold">
                          {col.shortTitle}: {cnt}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Swimlane Columns Body */}
              {!isCollapsed && (
                <div className="p-3 bg-[var(--md-sys-color-surface-container-lowest)]/40 dark:bg-[var(--md-sys-color-surface-container-low)]">
                  <div className="flex gap-3 xl:gap-4 items-stretch">
                    {KANBAN_COLUMNS.map((col) => {
                      const colIssues = group.issues.filter((i) => i.status === col.status);

                      return (
                        <SwimlaneCellDroppable
                          key={col.status}
                          group={group}
                          col={col}
                          colIssues={colIssues}
                          allIssues={issues}
                          activeIssue={activeIssue}
                          settings={settings}
                          onSelectIssue={onSelectIssue}
                          onStatusChange={onStatusChange}
                          onAssigneeAndStatusChange={onAssigneeAndStatusChange}
                          onAssignToMe={onAssignToMe}
                          onQuickAddInStatus={onQuickAddInStatus}
                          currentUserId={currentUserId}
                          focusedIssueId={focusedIssueId}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeIssue ? (
          <div className="rotate-2 scale-102 shadow-2xl opacity-95 pointer-events-none w-[270px] relative">
            <IssueCard
              issue={activeIssue}
              onClick={() => {}}
              density={settings.cardDensity}
              isDragging
            />
            {selectedIds.has(activeIssue.id) && selectedIds.size > 1 && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-md ring-2 ring-[var(--md-sys-color-surface)]">
                +{selectedIds.size - 1} more
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
