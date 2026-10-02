import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { IssueItem, IssueStatus } from '../../api/client';
import { IssueContextMenu } from '../common/IssueContextMenu';
import { useAssignIssueToMeMutation } from '../../api/queries';
import { useAuth } from '../../store';
import {
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui';
import { CheckCircle2, Clock, Sparkles, ExternalLink } from 'lucide-react';

interface AssignedIssuesSectionProps {
  issues: IssueItem[];
  loading: boolean;
  onSelectIssue: (issueId: number) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
}

export const AssignedIssuesSection: React.FC<AssignedIssuesSectionProps> = ({
  issues,
  loading,
  onSelectIssue,
  onStatusChange,
}) => {
  const { user } = useAuth();
  const assignMutation = useAssignIssueToMeMutation();
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuIssue, setContextMenuIssue] = useState<IssueItem | null>(null);

  const handleContextMenu = (e: React.MouseEvent, issue: IssueItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuIssue(issue);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleAssignToMe = async (issueId: number) => {
    try {
      await assignMutation.mutateAsync(issueId);
    } catch {
      // Ignored
    }
  };
  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-surface-container-high)]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            Assigned to Me ({issues.length})
          </h2>
        </div>
        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
          Active workflow issues
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic py-8 text-center">
          Loading your assigned tasks...
        </p>
      ) : issues.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[var(--md-sys-color-surface-container)] text-center space-y-2">
          <Sparkles className="w-6 h-6 mx-auto text-[var(--md-sys-color-primary)]" />
          <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
            You have no pending assigned tickets!
          </p>
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Pick a task from your project Kanban board or create a new issue.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onContextMenu={(e) => handleContextMenu(e, issue)}
              onClick={() => onSelectIssue(issue.id)}
              className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-high)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-outline-variant)]/80 cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <a
                  href={`/issues/${issue.key}`}
                  onClick={(e) => {
                    if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                    e.preventDefault();
                    onSelectIssue(issue.id);
                  }}
                  className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] hover:underline shrink-0 bg-[var(--md-sys-color-primary-container)]/50 px-2.5 py-0.5 rounded-full"
                >
                  {issue.key}
                </a>
                <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                  {issue.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-xs">
                <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                  <span>{issue.loggedHours || 0}h</span>
                  {issue.estimatedHours > 0 && <span className="opacity-60">/ {issue.estimatedHours}h</span>}
                </span>

                <Badge variant="neutral" size="sm">
                  {issue.priority}
                </Badge>

                {/* Quick Status Select */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={issue.status}
                    onValueChange={(val) =>
                      onStatusChange(issue.id, val as IssueStatus)
                    }
                  >
                    <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container)] text-xs font-semibold h-7 border-[var(--md-sys-color-outline-variant)]/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Link
                  to={`/issues/${issue.key || issue.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                  title="Open full page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenuPos && contextMenuIssue && (
        <IssueContextMenu
          issue={contextMenuIssue}
          position={contextMenuPos}
          onClose={() => {
            setContextMenuPos(null);
            setContextMenuIssue(null);
          }}
          onStatusChange={onStatusChange}
          onAssignToMe={handleAssignToMe}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};
