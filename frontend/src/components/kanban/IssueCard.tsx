import React from 'react';
import type {
  IssueItem,
  IssueStatus,
  IssuePriority,
  IssueType,
} from '../../api/client';
import { Avatar } from '../common/Avatar';
import {
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Clock,
  UserPlus,
} from 'lucide-react';

interface IssueCardProps {
  issue: IssueItem;
  onClick: (issue: IssueItem) => void;
  onStatusChange?: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe?: (issueId: number) => void;
  currentUserId?: number;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  onStatusChange,
  onAssignToMe,
  currentUserId,
}) => {
  // Drag start handler for native HTML5 drag-and-drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(issue.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Type icon and badge renderer
  const renderTypeBadge = (type: IssueType) => {
    switch (type) {
      case 'BUG':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Bug className="w-3 h-3" />
            Bug
          </span>
        );
      case 'TASK':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CheckSquare className="w-3 h-3" />
            Task
          </span>
        );
      case 'FEATURE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            Feature
          </span>
        );
      case 'IMPROVEMENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Zap className="w-3 h-3" />
            Improvement
          </span>
        );
      default:
        return null;
    }
  };

  // Priority indicator renderer
  const renderPriorityBadge = (priority: IssuePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-600 text-white shadow-xs">
            <Flame className="w-3 h-3" />
            Crit
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
            Med
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">
            Low
          </span>
        );
    }
  };

  // Order of statuses for step transitions
  const statusFlow: IssueStatus[] = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED'];
  const currentIndex = statusFlow.indexOf(issue.status);

  // Time tracking ratio
  const logged = issue.loggedHours || 0;
  const estimated = issue.estimatedHours || 0;
  const progressPercent = estimated > 0 ? Math.min(Math.round((logged / estimated) * 100), 100) : 0;
  const isOverEstimate = estimated > 0 && logged > estimated;

  const isAssignedToMe = currentUserId && issue.assignee?.id === currentUserId;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(issue)}
      className="group relative bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer select-none"
    >
      {/* Top Header: Key and Type */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/50 px-2 py-0.5 rounded-lg">
            {issue.key}
          </span>
          {issue.sprint && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              {issue.sprint}
            </span>
          )}
        </div>
        {renderTypeBadge(issue.issueType)}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] line-clamp-2 transition-colors mb-1.5 leading-snug">
        {issue.title}
      </h4>

      {/* Description Snippet */}
      {issue.description && (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 mb-2.5">
          {issue.description}
        </p>
      )}

      {/* Time Tracking Progress Indicator */}
      {(logged > 0 || estimated > 0) && (
        <div className="mb-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
              <span>{logged}h</span>
              {estimated > 0 && <span className="opacity-60">/ {estimated}h</span>}
            </span>
            {estimated > 0 && (
              <span className={`text-[10px] font-bold ${isOverEstimate ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {progressPercent}%
              </span>
            )}
          </div>
          {estimated > 0 && (
            <div className="w-full h-1.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverEstimate ? 'bg-rose-500' : 'bg-[var(--md-sys-color-primary)]'
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

        {/* Assignee Avatar with Quick Assign to Me */}
        <div className="flex items-center gap-1.5">
          {issue.assignee ? (
            <div className="flex items-center gap-1">
              <Avatar
                name={issue.assignee.fullName}
                avatarUrl={issue.assignee.avatarUrl}
                role={issue.assignee.systemRole}
                size="xs"
              />
            </div>
          ) : onAssignToMe && !isAssignedToMe ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssignToMe(issue.id);
              }}
              title="Assign to me"
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-primary-container)] transition-colors border border-[var(--md-sys-color-outline-variant)]"
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

      {/* Quick Status Advance */}
      {onStatusChange && (
        <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-2 border-t border-dashed border-[var(--md-sys-color-outline-variant)]/60 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(issue.id, statusFlow[currentIndex - 1]);
              }}
              title={`Move to ${statusFlow[currentIndex - 1]}`}
              className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {currentIndex < statusFlow.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(issue.id, statusFlow[currentIndex + 1]);
              }}
              title={`Move to ${statusFlow[currentIndex + 1]}`}
              className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
