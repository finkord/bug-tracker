import React, { useState, useMemo, useRef } from 'react';
import type { IssueItem, IssueStatus, IssuePriority, AssigneeUser } from '../../api/client';
import type { KanbanSettings } from '../../types/kanban.js';
import { KANBAN_COLUMNS } from '../../types/kanban.js';
import { IssueCard } from './IssueCard.js';
import { Avatar } from '../common/Avatar';
import { Badge } from '../ui';
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

interface KanbanSwimlaneBoardProps {
  issues: IssueItem[];
  loading: boolean;
  settings: KanbanSettings;
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssigneeAndStatusChange: (issueId: number, newAssigneeId: number | null, nextStatus: IssueStatus) => void;
  onSwimlaneDrop?: (
    issueId: number,
    nextStatus: IssueStatus,
    patch?: { assigneeId?: number | null; parentId?: number | null; priority?: IssuePriority },
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
  parentIssue: IssueItem | null;
}

interface ExpediteSwimlaneGroup extends BaseSwimlaneGroup {
  type: 'expedite';
  isExpedite: boolean;
}

type SwimlaneGroup = AssigneeSwimlaneGroup | EpicSwimlaneGroup | ExpediteSwimlaneGroup;

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
  // Collapsed swimlane IDs state
  const [collapsedLanes, setCollapsedLanes] = useState<Record<string, boolean>>({});
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const swimlaneType = settings.swimlaneType || 'assignee';

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

      issues.forEach((issue) => {
        if (!issue.parentId) {
          standaloneGroup.issues.push(issue);
        } else {
          if (!parentMap.has(issue.parentId)) {
            const p = issue.parent ?? null;
            parentMap.set(issue.parentId, {
              type: 'epic',
              key: `epic-${issue.parentId}`,
              title: p ? `${p.key}: ${p.title}` : `Parent Epic #${issue.parentId}`,
              subtitle: p ? `Parent Status: ${p.status}` : null,
              parentId: issue.parentId,
              parentIssue: p,
              issues: [],
            });
          }
          parentMap.get(issue.parentId)!.issues.push(issue);
        }
      });

      const epicGroups = Array.from(parentMap.values()).sort((a, b) =>
        a.title.localeCompare(b.title),
      );

      if (standaloneGroup.issues.length > 0 || epicGroups.length === 0) {
        return [...epicGroups, standaloneGroup];
      }
      return epicGroups;
    }

    // 2. Group by Expedite (P0 / Critical) vs Standard Backlog
    if (swimlaneType === 'expedite') {
      const expediteGroup: ExpediteSwimlaneGroup = {
        type: 'expedite',
        key: 'expedite-p0',
        title: 'Expedite Lane (P0 / Critical)',
        subtitle: 'Top-priority blockers demanding immediate response',
        isExpedite: true,
        issues: [],
      };

      const standardGroup: ExpediteSwimlaneGroup = {
        type: 'expedite',
        key: 'standard-track',
        title: 'Standard Work Track',
        subtitle: 'High, Medium, and Low priority deliverables',
        isExpedite: false,
        issues: [],
      };

      issues.forEach((issue) => {
        if (issue.priority === 'CRITICAL') {
          expediteGroup.issues.push(issue);
        } else {
          standardGroup.issues.push(issue);
        }
      });

      return [expediteGroup, standardGroup];
    }

    // 3. Default: Group by Assignee
    const map = new Map<string, AssigneeSwimlaneGroup>();
    const unassignedGroup: AssigneeSwimlaneGroup = {
      type: 'assignee',
      assignee: null,
      assigneeId: null,
      key: 'unassigned',
      title: 'Unassigned',
      subtitle: 'Unclaimed tickets awaiting assignment',
      issues: [],
    };

    issues.forEach((issue) => {
      if (!issue.assignee) {
        unassignedGroup.issues.push(issue);
      } else {
        const idKey = `user-${issue.assignee.id}`;
        if (!map.has(idKey)) {
          map.set(idKey, {
            type: 'assignee',
            assignee: issue.assignee,
            assigneeId: issue.assignee.id,
            key: idKey,
            title: issue.assignee.fullName,
            subtitle: issue.assignee.email,
            issues: [],
          });
        }
        map.get(idKey)!.issues.push(issue);
      }
    });

    const userGroups = Array.from(map.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );

    if (unassignedGroup.issues.length > 0 || userGroups.length === 0) {
      if (settings.unassignedPosition === 'top') {
        return [unassignedGroup, ...userGroups];
      }
      return [...userGroups, unassignedGroup];
    }

    return userGroups;
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
    const allCollapsed: Record<string, boolean> = {};
    swimlaneGroups.forEach((g) => {
      allCollapsed[g.key] = true;
    });
    setCollapsedLanes(allCollapsed);
  };

  const areAllCollapsed =
    swimlaneGroups.length > 0 &&
    swimlaneGroups.every((g) => Boolean(collapsedLanes[g.key]));

  const cellCounters = useRef<Record<string, number>>({});

  const isCellTargeted = (
    _laneAssigneeId: number | null,
    _colStatus: IssueStatus,
    cellKey: string,
  ) => dragOverTarget === cellKey;

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    cellCounters.current[targetKey] = (cellCounters.current[targetKey] || 0) + 1;
    if (dragOverTarget !== targetKey) setDragOverTarget(targetKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    cellCounters.current[targetKey] = Math.max(0, (cellCounters.current[targetKey] || 0) - 1);
    if (cellCounters.current[targetKey] === 0 && dragOverTarget === targetKey) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, group: SwimlaneGroup, status: IssueStatus) => {
    e.preventDefault();
    cellCounters.current = {};
    setDragOverTarget(null);

    const issueIdStr = e.dataTransfer.getData('text/plain');
    if (!issueIdStr) return;

    const issueId = Number(issueIdStr);
    const targetIssue = issues.find((i) => i.id === issueId);
    if (!targetIssue) return;

    if (group.type === 'assignee') {
      const isSameAssignee = (targetIssue.assignee?.id ?? null) === group.assigneeId;
      const isSameStatus = targetIssue.status === status;
      if (isSameAssignee && isSameStatus) return;

      if (onSwimlaneDrop) {
        onSwimlaneDrop(issueId, status, { assigneeId: group.assigneeId });
      } else {
        onAssigneeAndStatusChange(issueId, group.assigneeId, status);
      }
    } else if (group.type === 'epic') {
      const isSameParent = (targetIssue.parentId ?? null) === group.parentId;
      const isSameStatus = targetIssue.status === status;
      if (isSameParent && isSameStatus) return;

      if (onSwimlaneDrop) {
        onSwimlaneDrop(issueId, status, { parentId: group.parentId });
      } else {
        onStatusChange(issueId, status);
      }
    } else if (group.type === 'expedite') {
      const nextPriority: IssuePriority = group.isExpedite
        ? 'CRITICAL'
        : targetIssue.priority === 'CRITICAL'
        ? 'HIGH'
        : targetIssue.priority;
      const isSamePriority = targetIssue.priority === nextPriority;
      const isSameStatus = targetIssue.status === status;
      if (isSamePriority && isSameStatus) return;

      if (onSwimlaneDrop) {
        onSwimlaneDrop(issueId, status, { priority: nextPriority });
      } else {
        onStatusChange(issueId, status);
      }
    }
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

      {/* Sticky Board Columns Header for Swimlanes */}
      <div className="sticky top-0 z-20 bg-[var(--md-sys-color-background)]/95 backdrop-blur-md pb-2 pt-1 border-b border-[var(--md-sys-color-outline-variant)]/30 overflow-x-auto scrollbar-none">
        <div className="flex gap-3 xl:gap-4 min-w-[1200px]">
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
                <div data-drag-scroll-x="true" className="overflow-x-auto pb-2 scrollbar-thin">
                  <div className="flex gap-3 xl:gap-4 items-stretch min-w-[1200px]">
                    {KANBAN_COLUMNS.map((col) => {
                      const colIssues = group.issues.filter((i) => i.status === col.status);
                      const cellKey = `${group.key}-${col.status}`;
                      const assigneeId = group.type === 'assignee' ? group.assigneeId : null;
                      const isOver = isCellTargeted(assigneeId, col.status, cellKey);
                      const limit = settings.wipLimits[col.status];
                      const isLimitExceeded = limit !== undefined && limit > 0 && colIssues.length > limit;

                      return (
                        <div
                          key={col.status}
                          data-drop-zone="cell"
                          data-column-status={col.status}
                          data-lane-key={group.key}
                          onDragEnter={(e) => handleDragEnter(e, cellKey)}
                          onDragOver={handleDragOver}
                          onDragLeave={(e) => handleDragLeave(e, cellKey)}
                          onDrop={(e) => handleDrop(e, group, col.status)}
                          className={`flex-1 min-w-[230px] flex flex-col rounded-2xl p-2.5 transition-colors duration-150 min-h-[120px] border ${
                            isOver
                              ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/10 shadow-xs'
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
                                  isOver
                                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-primary)]'
                                    : 'border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-outline)]'
                                }`}
                              >
                                <span className="text-[10px] opacity-70">Drop tickets here</span>
                              </div>
                            ) : (
                              colIssues.map((issue) => (
                                <IssueCard
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
                                  orderedIds={issues.map((i) => i.id)}
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
            )}
          </div>
        );
      })}
    </div>
  );
};

