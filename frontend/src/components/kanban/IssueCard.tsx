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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
            <Bug className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Bug
          </span>
        );
      case 'TASK':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800">
            <CheckSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Task
          </span>
        );
      case 'FEATURE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Feature
          </span>
        );
      case 'IMPROVEMENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-950 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800">
            <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
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
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 shadow-2xs">
            <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Crit
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-950 border border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800">
            <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
            Med
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
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

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
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
    </div>
  );
};
