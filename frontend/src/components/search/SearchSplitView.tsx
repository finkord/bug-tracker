import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { IssueItem, IssuePriority, IssueStatus, IssueType } from '../../api/client';
import { api } from '../../api/client';
import { Avatar } from '../common/Avatar';
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
  StatusBadge,
  PriorityBadge,
} from '../ui';
import {
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
  ExternalLink,
  Layers,
  Send,
  Loader2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SearchSplitViewProps {
  issues: IssueItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  selectedIssueId: number | null;
  onSelectIssue: (issue: IssueItem) => void;
  onOpenDetailsModal?: (issue: IssueItem) => void;
  onUpdateStatus?: (issueId: number, status: IssueStatus) => void;
  onIssueUpdated?: (updatedIssue: IssueItem) => void;
}

const STATUS_OPTIONS: { label: string; value: IssueStatus }[] = [
  { label: 'To Do', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Review', value: 'REVIEW' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export const SearchSplitView: React.FC<SearchSplitViewProps> = ({
  issues,
  total: _total,
  page = 1,
  limit: _limit = 50,
  totalPages = 1,
  onPageChange,
  selectedIssueId,
  onSelectIssue,
  onUpdateStatus,
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

  const [detailedIssue, setDetailedIssue] = useState<IssueItem | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active issue selection
  const activeIssue = issues.find((i) => i.id === selectedIssueId) || issues[0] || null;

  useEffect(() => {
    if (!activeIssue) {
      setDetailedIssue(null);
      return;
    }

    let isMounted = true;

    api
      .getIssue(activeIssue.id)
      .then((data) => {
        if (isMounted) {
          setDetailedIssue(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load issue details in split view:', err);
        if (isMounted) {
          setDetailedIssue(activeIssue);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeIssue?.id]);

  const handleCopyKey = () => {
    if (!activeIssue) return;
    navigator.clipboard.writeText(activeIssue.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedIssue || !newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const added = await api.addIssueComment(detailedIssue.id, newComment.trim());
      setDetailedIssue((prev) =>
        prev
          ? {
              ...prev,
              comments: [...(prev.comments || []), added],
            }
          : null,
      );
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderTypeIcon = (type: IssueType) => {
    switch (type) {
      case 'BUG':
        return <Bug className="w-4 h-4 text-[var(--md-sys-color-error)] shrink-0" />;
      case 'TASK':
        return <CheckSquare className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />;
      case 'FEATURE':
        return <Sparkles className="w-4 h-4 text-[var(--md-sys-color-success)] shrink-0" />;
      case 'IMPROVEMENT':
        return <Zap className="w-4 h-4 text-[var(--md-sys-color-tertiary)] shrink-0" />;
      default:
        return null;
    }
  };



  if (issues.length === 0) {
    return (
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl p-12 text-center w-full">
        <div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center mx-auto mb-3 text-[var(--md-sys-color-on-surface-variant)]">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
          No matching issues found
        </h3>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-sm mx-auto">
          Try broadening your search query or changing active filters.
        </p>
      </div>
    );
  }

  const currentIssue = detailedIssue || activeIssue;

  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl shadow-xs overflow-hidden flex flex-col lg:flex-row flex-1 h-full min-h-0 w-full">
      {/* Left List Pane */}
      <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-[var(--md-sys-color-outline-variant)]/40 flex flex-col shrink-0 bg-[var(--md-sys-color-surface-container)] h-full overflow-hidden">
        <div className="p-3 border-b border-[var(--md-sys-color-outline-variant)]/30 text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between shrink-0">
          <span className="font-bold text-[var(--md-sys-color-on-surface)]">
            {_total ?? issues.length} {(_total ?? issues.length) === 1 ? 'ticket' : 'tickets'}
          </span>
          {totalPages > 1 && (
            <span className="text-[11px] font-normal opacity-80">
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[var(--md-sys-color-outline-variant)]/20 min-h-0">
          {issues.map((issue) => {
            const isSelected = activeIssue?.id === issue.id;
            return (
              <div
                key={issue.id}
                onContextMenu={(e) => handleContextMenu(e, issue)}
                onClick={() => onSelectIssue(issue)}
                className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] border-l-4 border-l-[var(--md-sys-color-primary)] shadow-xs'
                    : 'hover:bg-[var(--md-sys-color-surface-container-high)]/50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {renderTypeIcon(issue.issueType)}
                    <a
                      href={`/issues/${issue.key}`}
                      onClick={(e) => {
                        if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                        e.preventDefault();
                        onSelectIssue(issue);
                      }}
                      className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] hover:underline"
                    >
                      {issue.key}
                    </a>
                  </div>
                  <PriorityBadge priority={issue.priority} size="xs" />
                </div>

                <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] line-clamp-2">
                  {issue.title}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <StatusBadge status={issue.status} size="xs" />
                  {issue.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar
                        name={issue.assignee.fullName || 'User'}
                        avatarUrl={issue.assignee.avatarUrl}
                        size="xs"
                      />
                      <span className="truncate max-w-[80px] font-medium">
                        {issue.assignee.fullName?.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="italic opacity-60 text-[11px]">Unassigned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Left Pane Pagination */}
        {totalPages > 1 && onPageChange && (
          <div className="p-2 border-t border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)]">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded border border-[var(--md-sys-color-outline-variant)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded border border-[var(--md-sys-color-outline-variant)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right Detail Preview Pane */}
      <div className="flex-1 flex flex-col overflow-y-auto h-full min-h-0 bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-low)] p-4 sm:p-6 lg:p-7">
        {currentIssue ? (
          <div className="flex flex-col flex-1 min-h-0 space-y-5">
            {/* Header / Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/30 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                {renderTypeIcon(currentIssue.issueType)}
                <span className="font-mono text-sm font-bold text-[var(--md-sys-color-primary)]">
                  {currentIssue.key}
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  title="Copy Key"
                  className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/issues/${currentIssue.key}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
                  title="Open full Issue Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Issue Page</span>
                </Link>
              </div>
            </div>

            {/* 2-Column Responsive Body */}
            <div className="flex flex-col xl:flex-row gap-6 items-start flex-1 min-h-0">
              {/* Left Column (65%): Title, Description, Activity & Comments */}
              <div className="flex-1 min-w-0 space-y-5 w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] leading-snug">
                  {currentIssue.title}
                </h2>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    Description
                  </h4>
                  <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] text-sm text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap leading-relaxed min-h-[90px] border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs">
                    {currentIssue.description || (
                      <span className="italic text-[var(--md-sys-color-on-surface-variant)]/60">
                        No description provided.
                      </span>
                    )}
                  </div>
                </div>

                {/* Activity & Comments Stream */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    Activity & Comments ({currentIssue.comments?.length || 0})
                  </h4>

                  {/* Add comment box with integrated Post button */}
                  <form onSubmit={handleAddComment} className="relative flex items-center">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment or post an update..."
                      className="w-full pl-4 pr-24 py-2.5 text-xs sm:text-sm rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 transition border border-[var(--md-sys-color-outline-variant)]/30"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    >
                      {submittingComment ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <span>Post</span>
                          <Send className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Existing comments */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {currentIssue.comments && currentIssue.comments.length > 0 ? (
                      currentIssue.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-semibold text-[var(--md-sys-color-on-surface)]">
                              <Avatar
                                name={comment.author?.fullName || 'User'}
                                avatarUrl={comment.author?.avatarUrl}
                                size="xs"
                              />
                              <span>{comment.author?.fullName || 'User'}</span>
                            </div>
                            <span className="text-[var(--md-sys-color-on-surface-variant)]/70 text-[10px]">
                              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[var(--md-sys-color-on-surface)] pt-0.5 whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]/60 italic py-1">
                        No comments yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (35%): Properties Sidebar */}
              <div className="w-full xl:w-72 xl:shrink-0 space-y-4">
                {/* Status & Priority Card */}
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-3 shadow-2xs">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    Attributes
                  </h4>
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Status</span>
                      <div>
                        <StatusBadge
                          status={currentIssue.status}
                          interactive={Boolean(onUpdateStatus)}
                          onStatusChange={(val) => {
                            const newStat = val as IssueStatus;
                            onUpdateStatus?.(currentIssue.id, newStat);
                            setDetailedIssue((prev) => (prev ? { ...prev, status: newStat } : null));
                          }}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Priority</span>
                      <div>
                        <PriorityBadge priority={currentIssue.priority} size="sm" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Sprint</span>
                      <div>
                        {currentIssue.sprint?.name ? (
                          <Badge variant="primary" className="gap-1 text-xs rounded-full px-2.5 py-0.5">
                            <Layers className="w-3 h-3" />
                            <span>{currentIssue.sprint.name}</span>
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-xs rounded-full px-2.5 py-0.5">
                            Backlog
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* People Card */}
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-3 shadow-2xs">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    People
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Assignee</span>
                      <div className="flex items-center gap-2">
                        {currentIssue.assignee ? (
                          <>
                            <Avatar
                              name={currentIssue.assignee.fullName || 'User'}
                              avatarUrl={currentIssue.assignee.avatarUrl}
                              size="sm"
                            />
                            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                              {currentIssue.assignee.fullName}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Reporter</span>
                      <div className="flex items-center gap-2">
                        {currentIssue.reporter ? (
                          <>
                            <Avatar
                              name={currentIssue.reporter.fullName || 'User'}
                              avatarUrl={currentIssue.reporter.avatarUrl}
                              size="sm"
                            />
                            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                              {currentIssue.reporter.fullName}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Unknown</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps Card */}
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-2.5 shadow-2xs">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    Dates
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">Created</span>
                      <span className="font-medium text-[var(--md-sys-color-on-surface)]">
                        {new Date(currentIssue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">Updated</span>
                      <span className="font-medium text-[var(--md-sys-color-on-surface)]">
                        {new Date(currentIssue.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Select an issue from the list to view details
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenuPos && contextMenuIssue && (
        <IssueContextMenu
          issue={contextMenuIssue}
          position={contextMenuPos}
          onClose={() => {
            setContextMenuPos(null);
            setContextMenuIssue(null);
          }}
          onStatusChange={onUpdateStatus}
          onAssignToMe={handleAssignToMe}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};
