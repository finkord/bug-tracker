import React, { useState, useRef } from 'react';
import type { IssueItem, IssueStatus } from '../../api/client';
import type { KanbanSettings } from '../../types/kanban';
import { KANBAN_COLUMNS } from '../../types/kanban';
import { useTicketDragStore } from '../../store/useTicketDragStore';
import { IssueCard } from './IssueCard';
import { Badge } from '../ui';
import { Loader2, Plus, AlertCircle } from 'lucide-react';

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
  const [dragOverColumn, setDragOverColumn] = useState<IssueStatus | null>(null);
  const columnCounters = useRef<Record<string, number>>({});
  const isStoreDragging = useTicketDragStore((s) => s.isDragging);
  const hoverTarget = useTicketDragStore((s) => s.hoverTarget);

  const isColTargeted = (status: IssueStatus) =>
    dragOverColumn === status ||
    (isStoreDragging && hoverTarget?.type === 'column' && hoverTarget.status === status);

  const handleDragEnter = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    columnCounters.current[status] = (columnCounters.current[status] || 0) + 1;
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    columnCounters.current[status] = Math.max(0, (columnCounters.current[status] || 0) - 1);
    if (columnCounters.current[status] === 0 && dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    columnCounters.current = {};
    setDragOverColumn(null);
    const issueIdStr = e.dataTransfer.getData('text/plain');
    if (!issueIdStr) return;

    const issueId = Number(issueIdStr);
    const target = issues.find((i) => i.id === issueId);
    if (!target || target.status === status) return;

    onStatusChange(issueId, status);
  };

  return (
    <div className="w-full pb-6 pt-1">
      {/* 5-Column Horizontal Container */}
      <div data-drag-scroll-x="true" className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-3 xl:gap-4 items-stretch min-w-[1200px]">
          {KANBAN_COLUMNS.map((col) => {
            const colIssues = issues.filter((i) => i.status === col.status);
            const isOver = isColTargeted(col.status);
            const limit = settings.wipLimits[col.status];
            const isLimitExceeded = limit !== undefined && limit > 0 && colIssues.length > limit;

            return (
              <div
                key={col.status}
                data-drop-zone="column"
                data-column-status={col.status}
                onDragEnter={(e) => handleDragEnter(e, col.status)}
                onDragOver={handleDragOver}
                onDragLeave={(e) => handleDragLeave(e, col.status)}
                onDrop={(e) => handleDrop(e, col.status)}
                className={`flex flex-col flex-1 min-w-[230px] rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border transition-colors duration-150 shadow-2xs ${
                  isOver
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

                {/* Column Cards Container (unified page scroll - no inner scrollbar) */}
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
                        isOver
                          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-primary)]'
                          : 'border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container)]/30 text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
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
  );
};
