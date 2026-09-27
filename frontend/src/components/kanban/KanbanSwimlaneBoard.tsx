import React, { useState, useMemo } from 'react';
import type { IssueItem, IssueStatus, AssigneeUser } from '../../api/client';
import type { KanbanSettings } from '../../types/kanban';
import { KANBAN_COLUMNS } from '../../types/kanban';
import { IssueCard } from './IssueCard';
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
} from 'lucide-react';

interface KanbanSwimlaneBoardProps {
  issues: IssueItem[];
  loading: boolean;
  settings: KanbanSettings;
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssigneeAndStatusChange: (issueId: number, newAssigneeId: number | null, nextStatus: IssueStatus) => void;
  onAssignToMe: (issueId: number) => void;
  onQuickAddInStatus?: (status: IssueStatus, assigneeId?: number | null) => void;
  currentUserId?: number;
}

interface SwimlaneGroup {
  assignee: AssigneeUser | null;
  key: string;
  issues: IssueItem[];
}

export const KanbanSwimlaneBoard: React.FC<KanbanSwimlaneBoardProps> = ({
  issues,
  loading,
  settings,
  onSelectIssue,
  onStatusChange: _onStatusChange,
  onAssigneeAndStatusChange,
  onAssignToMe,
  onQuickAddInStatus,
  currentUserId,
}) => {
  // Collapsed swimlane IDs state
  const [collapsedLanes, setCollapsedLanes] = useState<Record<string, boolean>>({});
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Group issues by Assignee
  const swimlaneGroups = useMemo<SwimlaneGroup[]>(() => {
    const map = new Map<string, SwimlaneGroup>();
    let unassignedGroup: SwimlaneGroup = {
      assignee: null,
      key: 'unassigned',
      issues: [],
    };

    issues.forEach((issue) => {
      if (!issue.assignee) {
        unassignedGroup.issues.push(issue);
      } else {
        const idKey = `user-${issue.assignee.id}`;
        if (!map.has(idKey)) {
          map.set(idKey, {
            assignee: issue.assignee,
            key: idKey,
            issues: [],
          });
        }
        map.get(idKey)!.issues.push(issue);
      }
    });

    const userGroups = Array.from(map.values()).sort((a, b) => {
      const nameA = a.assignee?.fullName || '';
      const nameB = b.assignee?.fullName || '';
      return nameA.localeCompare(nameB);
    });

    if (unassignedGroup.issues.length > 0 || userGroups.length === 0) {
      if (settings.unassignedPosition === 'top') {
        return [unassignedGroup, ...userGroups];
      } else {
        return [...userGroups, unassignedGroup];
      }
    }

    return userGroups;
  }, [issues, settings.unassignedPosition]);

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

  const areAllCollapsed = swimlaneGroups.length > 0 && swimlaneGroups.every((g) => !collapsedLanes[g.key] === false && collapsedLanes[g.key]);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (dragOverTarget !== targetKey) setDragOverTarget(targetKey);
  };

  const handleDragLeave = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (dragOverTarget === targetKey) setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, laneAssigneeId: number | null, status: IssueStatus) => {
    e.preventDefault();
    setDragOverTarget(null);

    const issueIdStr = e.dataTransfer.getData('text/plain');
    if (!issueIdStr) return;

    const issueId = Number(issueIdStr);
    const targetIssue = issues.find((i) => i.id === issueId);
    if (!targetIssue) return;

    const currentAssigneeId = targetIssue.assignee?.id ?? null;
    const isSameAssignee = currentAssigneeId === laneAssigneeId;
    const isSameStatus = targetIssue.status === status;

    if (isSameAssignee && isSameStatus) return;

    onAssigneeAndStatusChange(issueId, laneAssigneeId, status);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--md-sys-color-primary)]" />
        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Loading worker swimlanes...
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
          Try changing your search query, adjusting your filters, or creating a new issue assigned to a team member.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-8 pt-1 space-y-4">
      {/* Swimlane Global Control Bar */}
      <div className="flex items-center justify-between px-2 py-1 shrink-0">
        <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <span className="font-semibold">
            {swimlaneGroups.length} Assignee {swimlaneGroups.length === 1 ? 'Lane' : 'Lanes'}
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
            return (
              <div
                key={col.status}
                className="flex-1 min-w-[230px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30"
              >
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface)] truncate">
                  {col.title}
                </span>
                <Badge variant={col.badgeVariant} size="sm" className="px-2 py-0.5 rounded-full font-bold">
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Swimlane Rows */}
      {swimlaneGroups.map((group) => {
        const isCollapsed = !!collapsedLanes[group.key];
        const isUnassigned = group.assignee === null;
        const assigneeId = group.assignee?.id ?? null;

        return (
          <div
            key={group.key}
            className="rounded-3xl border border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-low)] shadow-2xs overflow-hidden transition-all duration-200"
          >
            {/* Swimlane Header Banner */}
            <div
              onClick={() => toggleLane(group.key)}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer select-none border-b border-[var(--md-sys-color-outline-variant)]/30 transition-colors"
            >
              {/* Left: Collapse Icon + Worker Info */}
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

                {isUnassigned ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-surface-container-highest)] border border-dashed border-[var(--md-sys-color-outline)] flex items-center justify-center text-[var(--md-sys-color-outline)] shrink-0">
                    <UserX className="w-4 h-4" />
                  </div>
                ) : (
                  <Avatar
                    name={group.assignee!.fullName}
                    avatarUrl={group.assignee!.avatarUrl}
                    role={group.assignee!.systemRole}
                    size="sm"
                  />
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">
                      {isUnassigned ? 'Unassigned' : group.assignee!.fullName}
                    </h3>
                    {group.assignee?.systemRole && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] font-semibold shrink-0">
                        {group.assignee.systemRole}
                      </span>
                    )}
                  </div>
                  {group.assignee?.email && (
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {group.assignee.email}
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

            {/* Swimlane Columns Body (when expanded - unified page vertical scroll) */}
            {!isCollapsed && (
              <div className="p-3 bg-[var(--md-sys-color-surface-container-lowest)]/40 dark:bg-[var(--md-sys-color-surface-container-low)]">
                <div className="overflow-x-auto pb-2 scrollbar-thin">
                  <div className="flex gap-3 xl:gap-4 items-stretch min-w-[1200px]">
                    {KANBAN_COLUMNS.map((col) => {
                      const colIssues = group.issues.filter((i) => i.status === col.status);
                      const cellKey = `${group.key}-${col.status}`;
                      const isOver = dragOverTarget === cellKey;
                      const limit = settings.wipLimits[col.status];
                      const isLimitExceeded = limit !== undefined && limit > 0 && colIssues.length > limit;

                      return (
                        <div
                          key={col.status}
                          onDragOver={(e) => handleDragOver(e, cellKey)}
                          onDragLeave={(e) => handleDragLeave(e, cellKey)}
                          onDrop={(e) => handleDrop(e, assigneeId, col.status)}
                          className={`flex-1 min-w-[230px] flex flex-col rounded-2xl p-2.5 transition-all duration-200 min-h-[120px] border ${
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
                                onClick={() => onQuickAddInStatus(col.status, assigneeId)}
                                className="p-0.5 rounded text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                                title={`Add ticket for ${isUnassigned ? 'Unassigned' : group.assignee!.fullName} in ${col.title}`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Cards List in this cell (no inner vertical scrollbar - expands naturally) */}
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
                                  onStatusChange={(id, nextStatus) =>
                                    onAssigneeAndStatusChange(id, assigneeId, nextStatus)
                                  }
                                  onAssignToMe={onAssignToMe}
                                  currentUserId={currentUserId}
                                  density={settings.cardDensity}
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
