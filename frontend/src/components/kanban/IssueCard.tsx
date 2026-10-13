import React from 'react';
import type {
  IssueItem,
  IssueStatus,
  IssuePriority,
  IssueType,
} from '../../api/client.js';
import { Avatar } from '../common/Avatar.js';
import { UserProfilePopover } from '../common/UserProfilePopover';
import type { CardDensity } from '../../types/kanban';
import {
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  MessageSquare,
  Clock,
  UserPlus,
  MoreVertical,
  ArrowRight,
  GripVertical,
  Check,
  GitCommitHorizontal,
  Box,
  Milestone,
  Bookmark,
  CornerDownRight,
} from 'lucide-react';
import { Dropdown, PriorityBadge } from '../ui';
import { useIssueSelectionStore } from '../../store/useIssueSelectionStore';

export interface IssueCardProps {
  issue: IssueItem;
  onClick: (issue: IssueItem) => void;
  onStatusChange?: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe?: (issueId: number) => void;
  currentUserId?: number;
  density?: CardDensity;
  isDragging?: boolean;
  isFocused?: boolean;
  orderedIds?: number[];
}

const STATUS_TRANSITIONS: { status: IssueStatus; label: string }[] = [
  { status: 'OPEN', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'REVIEW', label: 'Code Review' },
  { status: 'RESOLVED', label: 'Resolved' },
  { status: 'CLOSED', label: 'Closed' },
];

const IssueCardComponent: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  onStatusChange,
  onAssignToMe,
  currentUserId,
  density = 'comfortable',
  isDragging = false,
  isFocused = false,
  orderedIds,
}) => {
  const isBeingDragged = isDragging;

  const { selectedIds, toggleSelection, rangeSelect } = useIssueSelectionStore();
  const isSelected = selectedIds.has(issue.id);
  const hasAnySelection = selectedIds.size > 0;
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      rangeSelect(issue.id, orderedIds || []);
    } else {
      toggleSelection(issue.id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && orderedIds) {
      rangeSelect(issue.id, orderedIds);
      return;
    }
    onClick(issue);
  };

  const renderSelectionCheckbox = (sizeClass = 'w-3.5 h-3.5') => (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`Select issue ${issue.key}`}
      onClick={handleCheckboxClick}
      className={`rounded border flex items-center justify-center transition-all ${sizeClass} cursor-pointer pointer-events-auto shrink-0 ${
        isSelected
          ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
          : hasAnySelection
            ? 'opacity-80 hover:opacity-100 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-primary)]'
            : 'opacity-60 hover:opacity-100 border-[var(--md-sys-color-outline-variant)]/80 bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-primary)]'
      }`}
    >
      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
    </button>
  );

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
      case 'STORY':
        return (
          <span
            title="Story"
            className={`inline-flex items-center gap-1 font-semibold rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] shrink-0 ${
              isCompact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <Bookmark className="w-3 h-3 text-[var(--md-sys-color-success)]" />
            {!isCompact && 'Story'}
          </span>
        );
      case 'EPIC':
        return (
          <span
            title="Epic"
            className={`inline-flex items-center gap-1 font-semibold rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] shrink-0 ${
              isCompact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <Zap className="w-3 h-3 text-[var(--md-sys-color-tertiary)]" />
            {!isCompact && 'Epic'}
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
      case 'SUBTASK':
        return (
          <span
            title="Subtask"
            className={`inline-flex items-center gap-1 font-semibold rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shrink-0 ${
              isCompact ? 'p-1 text-[10px]' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <GitCommitHorizontal className="w-3 h-3 text-[var(--md-sys-color-secondary)]" />
            {!isCompact && 'Subtask'}
          </span>
        );
      default:
        return null;
    }
  };

  // Priority indicator renderer
  const renderPriorityBadge = (priority: IssuePriority, isCompact = false) => {
    return <PriorityBadge priority={priority} size={isCompact ? 'xs' : 'sm'} />;
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
        onClick={handleClick}
        className={`group relative bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/80 rounded-xl p-2 shadow-2xs hover:shadow-xs transition-colors duration-150 ${
          isBeingDragged
            ? 'select-none cursor-grabbing opacity-30 scale-95 border-dashed border-[var(--md-sys-color-primary)]'
            : 'cursor-pointer'
        } ${
          isSelected
            ? '!border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-highest)]'
            : ''
        } ${isFocused ? 'ring-2 ring-[var(--md-sys-color-primary)] ring-offset-1 ring-offset-[var(--md-sys-color-surface)] shadow-md !border-[var(--md-sys-color-primary)]' : ''}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div
            title="Drag to move"
            className="cursor-grab active:cursor-grabbing shrink-0 select-none flex items-center justify-center text-[var(--md-sys-color-outline)]/40 group-hover:text-[var(--md-sys-color-primary)] transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          {renderSelectionCheckbox()}
          <a
            href={`/issues/${issue.key}`}
            onClick={(e) => {
              if (e.button === 1 || e.ctrlKey || e.metaKey) return;
              e.preventDefault();
              onClick(issue);
            }}
            className="font-mono text-[10px] font-bold text-[var(--md-sys-color-primary)] hover:underline shrink-0 pointer-events-auto select-text"
          >
            {issue.key}
          </a>
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
        onClick={handleClick}
        className={`group relative bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/80 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-colors duration-150 ${
          isBeingDragged
            ? 'select-none cursor-grabbing opacity-30 scale-95 border-dashed border-[var(--md-sys-color-primary)]'
            : 'cursor-pointer'
        } ${
          isSelected
            ? '!border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-highest)]'
            : ''
        } ${isFocused ? 'ring-2 ring-[var(--md-sys-color-primary)] ring-offset-1 ring-offset-[var(--md-sys-color-surface)] shadow-md !border-[var(--md-sys-color-primary)]' : ''}`}
      >
        {/* Top Header: Checkbox, Type Badge, Key, and Priority / Quick Actions */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
            {renderSelectionCheckbox()}
            {renderTypeBadge(issue.issueType, true)}
            <a
              href={`/issues/${issue.key}`}
              onClick={(e) => {
                if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                e.preventDefault();
                onClick(issue);
              }}
              className="font-mono text-[10px] font-bold text-[var(--md-sys-color-primary)] hover:underline bg-[var(--md-sys-color-primary-container)]/40 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 pointer-events-auto"
            >
              {issue.key}
            </a>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {renderPriorityBadge(issue.priority, true)}
            {onStatusChange && (
              <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
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

        {/* Metadata Chips Row: Epic, Parent, Component, FixVersion */}
        {(issue.epic || issue.parent || issue.component || issue.fixVersion) && (
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {issue.epic && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 truncate max-w-[100px]"
                style={{
                  backgroundColor: issue.epic.color ? `${issue.epic.color}22` : 'var(--md-sys-color-tertiary-container)',
                  color: issue.epic.color || 'var(--md-sys-color-on-tertiary-container)',
                  border: `1px solid ${issue.epic.color ? `${issue.epic.color}44` : 'var(--md-sys-color-outline-variant)'}`,
                }}
                title={`Epic: ${issue.epic.title || issue.epic.key}`}
              >
                <Zap className="w-2.5 h-2.5 shrink-0" />
                <span>{issue.epic.key}</span>
              </span>
            )}
            {issue.parent && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] whitespace-nowrap shrink-0 truncate max-w-[90px]"
                title={`Parent: ${issue.parent.title || issue.parent.key}`}
              >
                <CornerDownRight className="w-2.5 h-2.5 shrink-0 text-[var(--md-sys-color-primary)]" />
                <span>{issue.parent.key}</span>
              </span>
            )}
            {issue.component && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30 whitespace-nowrap shrink-0 truncate max-w-[90px]"
                title={`Component: ${issue.component.name}`}
              >
                <Box className="w-2.5 h-2.5 shrink-0" />
                <span>{issue.component.name}</span>
              </span>
            )}
            {issue.fixVersion && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-tertiary-container)]/50 text-[var(--md-sys-color-on-tertiary-container)] whitespace-nowrap shrink-0 truncate max-w-[90px]"
                title={`Version: ${issue.fixVersion.name}`}
              >
                <Milestone className="w-2.5 h-2.5 shrink-0" />
                <span>{issue.fixVersion.name}</span>
              </span>
            )}
          </div>
        )}

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
            {(issue.subtasksCount ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 ml-1 text-[var(--md-sys-color-secondary)] font-mono" title={`${issue.subtasksCount} subtask(s)`}>
                <GitCommitHorizontal className="w-2.5 h-2.5" />
                <span>{issue.subtasksCount}</span>
              </span>
            )}
          </div>

          <div>
            {issue.assignee ? (
              <UserProfilePopover user={issue.assignee}>
                <Avatar
                  name={issue.assignee.fullName}
                  avatarUrl={issue.assignee.avatarUrl}
                  role={issue.assignee.systemRole}
                  size="xs"
                />
              </UserProfilePopover>
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
      onClick={handleClick}
      className={`group relative bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/80 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-colors duration-150 ${
        isBeingDragged
          ? 'select-none cursor-grabbing opacity-30 scale-95 border-dashed border-[var(--md-sys-color-primary)]'
          : 'cursor-pointer'
      } ${
        isSelected
          ? '!border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-highest)]'
          : ''
      } ${isFocused ? 'ring-2 ring-[var(--md-sys-color-primary)] ring-offset-1 ring-offset-[var(--md-sys-color-surface)] shadow-md !border-[var(--md-sys-color-primary)]' : ''}`}
    >
      {/* Top Header: Checkbox, Type Badge, Key, and Quick Actions */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {renderSelectionCheckbox('w-4 h-4')}
          {renderTypeBadge(issue.issueType, true)}
          <a
            href={`/issues/${issue.key}`}
            onClick={(e) => {
              if (e.button === 1 || e.ctrlKey || e.metaKey) return;
              e.preventDefault();
              onClick(issue);
            }}
            className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline bg-[var(--md-sys-color-primary-container)]/50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 pointer-events-auto"
          >
            {issue.key}
          </a>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto">
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

      {/* Metadata Chips Row: Sprint, Epic, Parent, Component, FixVersion */}
      {(issue.sprint?.name || issue.epic || issue.parent || issue.component || issue.fixVersion) && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {issue.sprint?.name && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] whitespace-nowrap shrink-0 truncate max-w-[120px]">
              {issue.sprint.name}
            </span>
          )}
          {issue.epic && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 truncate max-w-[120px]"
              style={{
                backgroundColor: issue.epic.color ? `${issue.epic.color}22` : 'var(--md-sys-color-tertiary-container)',
                color: issue.epic.color || 'var(--md-sys-color-on-tertiary-container)',
                border: `1px solid ${issue.epic.color ? `${issue.epic.color}44` : 'var(--md-sys-color-outline-variant)'}`,
              }}
              title={`Epic: ${issue.epic.title || issue.epic.key}`}
            >
              <Zap className="w-2.5 h-2.5 shrink-0" />
              <span>{issue.epic.title || issue.epic.key}</span>
            </span>
          )}
          {issue.parent && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] whitespace-nowrap shrink-0 truncate max-w-[120px]"
              title={`Parent: ${issue.parent.title || issue.parent.key}`}
            >
              <CornerDownRight className="w-2.5 h-2.5 shrink-0 text-[var(--md-sys-color-primary)]" />
              <span>{issue.parent.key}</span>
            </span>
          )}
          {issue.component && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30 whitespace-nowrap shrink-0 truncate max-w-[110px]"
              title={`Component: ${issue.component.name}`}
            >
              <Box className="w-2.5 h-2.5 shrink-0" />
              <span>{issue.component.name}</span>
            </span>
          )}
          {issue.fixVersion && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--md-sys-color-tertiary-container)]/50 text-[var(--md-sys-color-on-tertiary-container)] whitespace-nowrap shrink-0 truncate max-w-[110px]"
              title={`Fix Version: ${issue.fixVersion.name}`}
            >
              <Milestone className="w-2.5 h-2.5 shrink-0" />
              <span>{issue.fixVersion.name}</span>
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] line-clamp-2 transition-colors mb-1.5 leading-snug select-text">
        {issue.title}
      </h4>

      {/* Description Preview */}
      {issue.description && (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-1 mb-2.5 select-text">
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

          {(issue.subtasksCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--md-sys-color-secondary)] font-mono" title={`${issue.subtasksCount} subtask(s)`}>
              <GitCommitHorizontal className="w-3.5 h-3.5" />
              <span>{issue.subtasksCount}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {issue.assignee ? (
            <UserProfilePopover user={issue.assignee}>
              <Avatar
                name={issue.assignee.fullName}
                avatarUrl={issue.assignee.avatarUrl}
                role={issue.assignee.systemRole}
                size="xs"
              />
            </UserProfilePopover>
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

export const IssueCard = React.memo(IssueCardComponent);
