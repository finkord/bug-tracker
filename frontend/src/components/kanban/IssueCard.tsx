import React, { useState } from 'react';
import type {
  IssueItem,
  IssueStatus,
  IssuePriority,
  IssueType,
} from '../../api/client';
import { Avatar } from '../common/Avatar';
import type { CardDensity } from '../../types/kanban';
import {
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
  MessageSquare,
  Clock,
  UserPlus,
  MoreVertical,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import { Dropdown, Tooltip } from '../ui';

interface IssueCardProps {
  issue: IssueItem;
  onClick: (issue: IssueItem) => void;
  onStatusChange?: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe?: (issueId: number) => void;
  currentUserId?: number;
  density?: CardDensity;
  isDragging?: boolean;
}

const STATUS_TRANSITIONS: { status: IssueStatus; label: string }[] = [
  { status: 'OPEN', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'REVIEW', label: 'Code Review' },
  { status: 'RESOLVED', label: 'Resolved' },
  { status: 'CLOSED', label: 'Closed' },
];

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  onStatusChange,
  onAssignToMe,
  currentUserId,
  density = 'comfortable',
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  // Drag start handler for native HTML5 drag-and-drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragActive(true);
    e.dataTransfer.setData('text/plain', String(issue.id));
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        issueId: issue.id,
        currentAssigneeId: issue.assignee?.id ?? null,
        currentStatus: issue.status,
      }),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragActive(false);
  };

  // Type icon renderer
  const renderTypeBadge = (type: IssueType, isCompact = false) => {
    switch (type) {
      case 'BUG':
        return (
          <span
            title="Bug"
            className={`inline-flex items-center gap-1 font-semibold rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] shrink-0 ${
              isCompact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <Bug className="w-3 h-3 text-[var(--md-sys-color-error)]" />
            {!isCompact && 'Bug'}
          </span>
        );
      case 'TASK':
        return (
          <span
            title="Task"
            className={`inline-flex items-center gap-1 font-semibold rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shrink-0 ${
              isCompact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <CheckSquare className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
            {!isCompact && 'Task'}
          </span>
        );
      case 'FEATURE':
        return (
          <span
            title="Feature"
            className={`inline-flex items-center gap-1 font-semibold rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] shrink-0 ${
              isCompact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[var(--md-sys-color-success)]" />
            {!isCompact && 'Feature'}
          </span>
        );
      case 'IMPROVEMENT':
        return (
          <span
            title="Improvement"
            className={`inline-flex items-center gap-1 font-semibold rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] shrink-0 ${
              isCompact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <Zap className="w-3 h-3 text-[var(--md-sys-color-tertiary)]" />
            {!isCompact && 'Improvement'}
          </span>
        );
      default:
        return null;
    }
  };

  // Priority indicator renderer
  const renderPriorityBadge = (priority: IssuePriority, isCompact = false) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span
            title="Critical Priority"
            className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full bg-[var(--md-sys-color-priority-critical-container)] text-[var(--md-sys-color-priority-on-critical-container)] ${
              isCompact ? 'p-1 text-[9px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <Flame className="w-3 h-3 text-[var(--md-sys-color-priority-critical)]" />
            {!isCompact && 'Crit'}
          </span>
        );
      case 'HIGH':
        return (
          <span
            title="High Priority"
            className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full bg-[var(--md-sys-color-priority-high-container)] text-[var(--md-sys-color-priority-on-high-container)] ${
              isCompact ? 'p-1 text-[9px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-[var(--md-sys-color-priority-high)]" />
            {!isCompact && 'High'}
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            title="Medium Priority"
            className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded-full bg-[var(--md-sys-color-priority-medium-container)] text-[var(--md-sys-color-priority-on-medium-container)] ${
              isCompact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            Med
          </span>
        );
      case 'LOW':
        return (
          <span
            title="Low Priority"
            className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded-full bg-[var(--md-sys-color-priority-low-container)] text-[var(--md-sys-color-priority-on-low-container)] ${
              isCompact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            Low
          </span>
        );
    }
  };

  // Time tracking ratio
  const logged = issue.loggedHours || 0;
  const estimated = issue.estimatedHours || 0;
  const progressPercent = estimated > 0 ? Math.min(Math.round((logged / estimated) * 100), 100) : 0;
  const isOverEstimate = estimated > 0 && logged > estimated;
  const isAssignedToMe = currentUserId && issue.assignee?.id === currentUserId;

  // Dropdown menu items for quick status transitions
  const quickMoveItems = STATUS_TRANSITIONS.filter((t) => t.status !== issue.status).map((t) => ({
    label: (
      <div className="flex items-center justify-between w-full">
        <span>Move to {t.label}</span>
        <ArrowRight className="w-3 h-3 text-[var(--md-sys-color-outline)]" />
      </div>
    ),
    onClick: () => onStatusChange?.(issue.id, t.status),
  }));

  // Render Minimal Density Card
  if (density === 'minimal') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onClick(issue)}
        className={`group relative bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/80 rounded-xl p-2 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer select-none flex items-center justify-between gap-2 ${
          isDragActive ? 'opacity-40 scale-95 border-dashed border-[var(--md-sys-color-primary)]' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripVertical className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab" />
          <span className="font-mono text-[10px] font-bold text-[var(--md-sys-color-primary)] shrink-0">
            {issue.key}
          </span>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)] truncate">
            {issue.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {renderPriorityBadge(issue.priority, true)}
          {issue.assignee ? (
            <Avatar
              name={issue.assignee.fullName}
              avatarUrl={issue.assignee.avatarUrl}
              role={issue.assignee.systemRole}
              size="xs"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] text-[8px] font-bold flex items-center justify-center border border-dashed border-[var(--md-sys-color-outline)]">
              ?
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Compact Density Card
  if (density === 'compact') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onClick(issue)}
        className={`group relative bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/80 rounded-2xl p-2.5 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer select-none ${
          isDragActive ? 'opacity-40 scale-95 border-dashed border-[var(--md-sys-color-primary)]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[10px] font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/40 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {issue.key}
            </span>
            {renderTypeBadge(issue.issueType, true)}
          </div>

          <div className="flex items-center gap-1">
            {renderPriorityBadge(issue.priority, true)}
            {onStatusChange && (
              <div onClick={(e) => e.stopPropagation()}>
                <Dropdown
                  trigger={
                    <button
                      type="button"
                      aria-label="Quick actions"
                      className="p-1 rounded-lg text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  }
                  items={quickMoveItems}
                  align="end"
                />
              </div>
            )}
          </div>
        </div>

        <h4 className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] line-clamp-2 transition-colors mb-2 leading-snug">
          {issue.title}
        </h4>

        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/30 text-xs">
          <div className="flex items-center gap-1 text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            {(logged > 0 || estimated > 0) && (
              <span className="flex items-center gap-0.5 font-mono">
                <Clock className="w-2.5 h-2.5 text-[var(--md-sys-color-primary)]" />
                <span>{logged}h</span>
              </span>
            )}
            {(issue.commentsCount ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 ml-1">
                <MessageSquare className="w-2.5 h-2.5" />
                {issue.commentsCount}
              </span>
            )}
          </div>

          <div>
            {issue.assignee ? (
              <Avatar
                name={issue.assignee.fullName}
                avatarUrl={issue.assignee.avatarUrl}
                role={issue.assignee.systemRole}
                size="xs"
              />
            ) : onAssignToMe && !isAssignedToMe ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignToMe(issue.id);
                }}
                title="Assign to me"
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
              >
                + Me
              </button>
            ) : (
              <div className="w-4 h-4 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] text-[8px] font-bold flex items-center justify-center border border-dashed border-[var(--md-sys-color-outline)]">
                ?
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Comfortable Density Card (Default Rich Mode)
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(issue)}
      className={`group relative bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/80 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer select-none ${
        isDragActive ? 'opacity-40 scale-95 border-dashed border-[var(--md-sys-color-primary)]' : ''
      }`}
    >
      {/* Top Header: Key, Sprint, Type, Quick Actions */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            {issue.key}
          </span>
          {issue.sprint?.name && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] whitespace-nowrap shrink-0 truncate max-w-[90px]">
              {issue.sprint.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {renderTypeBadge(issue.issueType)}
          {onStatusChange && (
            <div onClick={(e) => e.stopPropagation()}>
              <Dropdown
                trigger={
                  <button
                    type="button"
                    aria-label="Quick actions"
                    className="p-1 rounded-lg text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                }
                items={quickMoveItems}
                align="end"
              />
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] line-clamp-2 transition-colors mb-1.5 leading-snug">
        {issue.title}
      </h4>

      {/* Description Preview */}
      {issue.description && (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 mb-2.5">
          {issue.description}
        </p>
      )}

      {/* Time Tracking Progress Bar */}
      {(logged > 0 || estimated > 0) && (
        <div className="mb-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
              <span>{logged}h</span>
              {estimated > 0 && <span className="opacity-60">/ {estimated}h</span>}
            </span>
            {estimated > 0 && (
              <span
                className={`text-[10px] font-bold ${
                  isOverEstimate ? 'text-[var(--md-sys-color-error)]' : 'text-[var(--md-sys-color-success)]'
                }`}
              >
                {progressPercent}%
              </span>
            )}
          </div>
          {estimated > 0 && (
            <div className="w-full h-1.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverEstimate ? 'bg-[var(--md-sys-color-error)]' : 'bg-[var(--md-sys-color-primary)]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer Info: Priority, Comments, Assignee */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/40 text-xs">
        <div className="flex items-center gap-2">
          {renderPriorityBadge(issue.priority)}

          {(issue.commentsCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              <MessageSquare className="w-3 h-3" />
              {issue.commentsCount}
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {issue.assignee ? (
            <Tooltip content={issue.assignee.fullName}>
              <Avatar
                name={issue.assignee.fullName}
                avatarUrl={issue.assignee.avatarUrl}
                role={issue.assignee.systemRole}
                size="xs"
              />
            </Tooltip>
          ) : onAssignToMe && !isAssignedToMe ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssignToMe(issue.id);
              }}
              title="Assign to me"
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-primary-container)] transition-colors border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
            >
              <UserPlus className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
              <span>Assign</span>
            </button>
          ) : (
            <div
              className="w-5 h-5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] text-[9px] font-medium flex items-center justify-center border border-dashed border-[var(--md-sys-color-outline)]"
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
