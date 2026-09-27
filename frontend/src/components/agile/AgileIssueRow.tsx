import React, { useState } from 'react';
import type { IssueItem, IssueType, IssuePriority } from '../../api/client';
import { Avatar } from '../common/Avatar';
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
} from 'lucide-react';

interface AgileIssueRowProps {
  issue: IssueItem;
  availableSprints: string[];
  onClick: (issue: IssueItem) => void;
  onMoveToSprint: (issueId: number, sprintName: string | null) => void;
}

export const AgileIssueRow: React.FC<AgileIssueRowProps> = ({
  issue,
  availableSprints,
  onClick,
  onMoveToSprint,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', String(issue.id));
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        issueId: issue.id,
        currentSprint: issue.sprint || null,
      }),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

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
  const dropdownItems = [];

  dropdownItems.push({
    label: (
      <span className="flex items-center gap-2">
        <ExternalLink className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        <span>View Issue Details</span>
      </span>
    ),
    onClick: () => onClick(issue),
  });

  if (issue.sprint) {
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

  const otherSprints = availableSprints.filter((s) => s !== issue.sprint);
  if (otherSprints.length > 0) {
    otherSprints.forEach((sName) => {
      dropdownItems.push({
        label: (
          <span className="flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
            <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Move to {sName}</span>
          </span>
        ),
        onClick: () => onMoveToSprint(issue.id, sName),
      });
    });
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(issue)}
      className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/80 transition-all duration-150 cursor-pointer select-none shadow-2xs ${
        isDragging ? 'opacity-40 scale-98 border-dashed border-[var(--md-sys-color-primary)]' : ''
      }`}
    >
      {/* Left: Drag grip, Type Icon, Key, Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <GripVertical className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab" />
        <div className="shrink-0">{renderTypeIcon(issue.issueType)}</div>

        <span className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/40 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
          {issue.key}
        </span>

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
        <div onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
};
