import React, { useRef, useState } from 'react';
import type { IssueItem, IssueType, IssuePriority, IssueStatus } from '../../api/client';
import type { SprintDefinition } from '../../types/agile';
import { useTicketDragStore } from '../../store/useTicketDragStore';
import { Avatar } from '../common/Avatar';
import { IssueContextMenu } from '../common/IssueContextMenu';
import { Badge, Dropdown, Tooltip } from '../ui';
import {
  GripVertical,
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
  Clock,
  MoreVertical,
  ArrowDown,
  Layers,
  ExternalLink,
  Check,
  GitCommitHorizontal,
} from 'lucide-react';
import { useIssueSelectionStore } from '../../store/useIssueSelectionStore';

interface AgileIssueRowProps {
  issue: IssueItem;
  availableSprints: SprintDefinition[];
  onClick: (issue: IssueItem) => void;
  onMoveToSprint: (issueId: number, sprintId: number | null) => void;
  onStatusChange?: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe?: (issueId: number) => void;
  currentUserId?: number;
  orderedIds?: number[];
}

const AgileIssueRowComponent: React.FC<AgileIssueRowProps> = ({
  issue,
  availableSprints,
  onClick,
  onMoveToSprint,
  onStatusChange,
  onAssignToMe,
  currentUserId,
  orderedIds,
}) => {
  const isBeingDragged = useTicketDragStore(
    (s) => s.isDragging && s.activeDrag?.issue.id === issue.id,
  );
  const startDrag = useTicketDragStore((s) => s.startDrag);

  const { selectedIds, toggleSelection, rangeSelect } = useIssueSelectionStore();
  const isSelected = selectedIds.has(issue.id);
  const hasAnySelection = selectedIds.size > 0;

  const rowRef = useRef<HTMLDivElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menu"]') || target.closest('a')) {
      return;
    }

    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;

    const handleWindowPointerMove = (moveEvt: PointerEvent) => {
      if (!pointerStartRef.current) return;
      const dx = moveEvt.clientX - pointerStartRef.current.x;
      const dy = moveEvt.clientY - pointerStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        hasDraggedRef.current = true;
        window.removeEventListener('pointermove', handleWindowPointerMove);
        window.removeEventListener('pointerup', handleWindowPointerUp);

        if (rowRef.current) {
          const rect = rowRef.current.getBoundingClientRect();
          startDrag({
            issue,
            variant: 'row',
            initialPointer: { x: moveEvt.clientX, y: moveEvt.clientY },
            offset: { x: moveEvt.clientX - rect.left, y: moveEvt.clientY - rect.top },
            dimensions: { width: rect.width, height: rect.height },
            onDrop: (dropTarget) => {
              if (dropTarget.type === 'sprint') {
                if (issue.sprintId !== dropTarget.sprintId) {
                  onMoveToSprint(issue.id, dropTarget.sprintId);
                }
              } else if (dropTarget.type === 'backlog') {
                if (issue.sprintId) {
                  onMoveToSprint(issue.id, null);
                }
              }
            },
          });
        }
      }
    };

    const handleWindowPointerUp = () => {
      pointerStartRef.current = null;
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      rangeSelect(issue.id, orderedIds || []);
    } else {
      toggleSelection(issue.id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) return;
    if (e.shiftKey && orderedIds) {
      rangeSelect(issue.id, orderedIds);
      return;
    }
    onClick(issue);
  };

  const renderSelectionCheckbox = () => (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`Select issue ${issue.key}`}
      onClick={handleCheckboxClick}
      className={`rounded border flex items-center justify-center transition-all w-3.5 h-3.5 cursor-pointer pointer-events-auto shrink-0 ${
        isSelected
          ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
          : hasAnySelection
            ? 'opacity-80 hover:opacity-100 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-primary)]'
            : 'opacity-0 group-hover:opacity-80 hover:!opacity-100 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-primary)]'
      }`}
    >
      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
    </button>
  );

  const renderTypeIcon = (type: IssueType) => {
    switch (type) {
      case 'BUG':
        return (
          <span title="Bug" className="inline-flex items-center">
            <Bug className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />
          </span>
        );
      case 'TASK':
        return (
          <span title="Task" className="inline-flex items-center">
            <CheckSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          </span>
        );
      case 'FEATURE':
        return (
          <span title="Feature" className="inline-flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" />
          </span>
        );
      case 'IMPROVEMENT':
        return (
          <span title="Improvement" className="inline-flex items-center">
            <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
          </span>
        );
      case 'SUBTASK':
        return (
          <span title="Subtask" className="inline-flex items-center">
            <GitCommitHorizontal className="w-3.5 h-3.5 text-[var(--md-sys-color-secondary)]" />
          </span>
        );
    }
  };

  const renderPriorityIcon = (priority: IssuePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span title="Critical" className="inline-flex items-center">
            <Flame className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-critical)]" />
          </span>
        );
      case 'HIGH':
        return (
          <span title="High" className="inline-flex items-center">
            <AlertCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-high)]" />
          </span>
        );
      case 'MEDIUM':
        return <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-priority-medium)]" title="Medium" />;
      case 'LOW':
        return <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-priority-low)]" title="Low" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'open' as const;
      case 'IN_PROGRESS':
        return 'in-progress' as const;
      case 'REVIEW':
        return 'review' as const;
      case 'RESOLVED':
        return 'resolved' as const;
      case 'CLOSED':
        return 'closed' as const;
      default:
        return 'neutral' as const;
    }
  };

  // Build quick move dropdown options
  const dropdownItems: Array<{ label: React.ReactNode; onClick: () => void }> = [];
  dropdownItems.push({
    label: (
      <span className="flex items-center gap-2">
        <ExternalLink className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        <span>Open in New Tab</span>
      </span>
    ),
    onClick: () => window.open(`/issues/${issue.key}`, '_blank'),
  });

  dropdownItems.push({
    label: (
      <span className="flex items-center gap-2">
        <ExternalLink className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        <span>View Issue Details</span>
      </span>
    ),
    onClick: () => onClick(issue),
  });

  if (issue.sprintId) {
    dropdownItems.push({
      label: (
        <span className="flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
          <ArrowDown className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)]" />
          <span>Move to Backlog</span>
        </span>
      ),
      onClick: () => onMoveToSprint(issue.id, null),
    });
  }

  const otherSprints = availableSprints.filter((s) => s.id && s.id !== issue.sprintId);
  if (otherSprints.length > 0) {
    otherSprints.forEach((s) => {
      dropdownItems.push({
        label: (
          <span className="flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
            <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Move to {s.name}</span>
          </span>
        ),
        onClick: () => onMoveToSprint(issue.id, s.id!),
      });
    });
  }

  return (
    <div
      ref={rowRef}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/80 transition-colors duration-150 cursor-grab active:cursor-grabbing select-none shadow-2xs ${
        isSelected
          ? '!border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-highest)] shadow-xs'
          : ''
      } ${
        isBeingDragged ? 'opacity-30 scale-98 border-dashed border-[var(--md-sys-color-primary)]' : ''
      }`}
    >
      {/* Left: Drag grip, Checkbox, Type Icon, Key, Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none">
        <GripVertical className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        {renderSelectionCheckbox()}
        <div className="shrink-0">{renderTypeIcon(issue.issueType)}</div>

        <a
          href={`/issues/${issue.key}`}
          onClick={(e) => {
            if (e.button === 1 || e.ctrlKey || e.metaKey) return;
            e.preventDefault();
            onClick(issue);
          }}
          className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline bg-[var(--md-sys-color-primary-container)]/40 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 pointer-events-auto"
        >
          {issue.key}
        </a>

        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
          {issue.title}
        </span>
      </div>

      {/* Right: Status, Priority, Estimate, Assignee, Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Status Badge */}
        <Badge variant={getStatusBadgeVariant(issue.status)} size="sm" className="hidden sm:inline-flex">
          {issue.status.replace('_', ' ')}
        </Badge>

        {/* Priority Icon */}
        <div className="shrink-0 flex items-center justify-center w-5 h-5">
          {renderPriorityIcon(issue.priority)}
        </div>

        {/* Estimate Chip */}
        {(issue.estimatedHours || 0) > 0 && (
          <span
            className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] shrink-0"
            title={`Estimated: ${issue.estimatedHours}h, Logged: ${issue.loggedHours || 0}h`}
          >
            <Clock className="w-2.5 h-2.5 text-[var(--md-sys-color-primary)]" />
            <span>{issue.estimatedHours}h</span>
          </span>
        )}

        {/* Subtask Counter */}
        {(issue.subtasksCount || 0) > 0 && (
          <span
            className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-secondary-container)]/40 text-[var(--md-sys-color-secondary)] shrink-0"
            title={`${issue.subtasksCount} subtask(s)`}
          >
            <GitCommitHorizontal className="w-3 h-3" />
            <span>{issue.subtasksCount}</span>
          </span>
        )}

        {/* Assignee Avatar */}
        <div className="shrink-0">
          {issue.assignee ? (
            <Tooltip content={issue.assignee.fullName}>
              <Avatar
                name={issue.assignee.fullName}
                avatarUrl={issue.assignee.avatarUrl}
                role={issue.assignee.systemRole}
                size="xs"
              />
            </Tooltip>
          ) : (
            <div
              className="w-5 h-5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] text-[9px] font-medium flex items-center justify-center border border-dashed border-[var(--md-sys-color-outline)]"
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>

        {/* 3-dot Action Dropdown */}
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <button
                type="button"
                aria-label="Issue actions"
                className="p-1 rounded-lg text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            }
            items={dropdownItems}
            align="end"
          />
        </div>
      </div>

      {contextMenuPos && (
        <IssueContextMenu
          issue={issue}
          position={contextMenuPos}
          onClose={() => setContextMenuPos(null)}
          onStatusChange={onStatusChange}
          onAssignToMe={onAssignToMe}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export const AgileIssueRow = React.memo(AgileIssueRowComponent);
