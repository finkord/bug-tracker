import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  type IssueItem,
  type IssueStatus,
} from '../../api/client';
import { useAuth } from '../../store';
import {
  useIssueDetailQuery,
  useUpdateIssueStatusMutation,
  useUpdateIssueMutation,
  useAddIssueCommentMutation,
  useDeleteIssueMutation,
} from '../../api/queries';
import { Avatar } from '../common/Avatar';
import { LogWorkModal } from './LogWorkModal';
import {
  Modal,
  Button,
  Badge,
  Tooltip,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui';
import {
  Calendar,
  Send,
  Loader2,
  Trash2,
  Edit,
  ExternalLink,
  MessageSquare,
  Clock,
  Layers,
  UserPlus,
} from 'lucide-react';

interface IssueDetailsModalProps {
  isOpen: boolean;
  issueId: number | null;
  onClose: () => void;
  onIssueUpdated?: (updatedIssue: IssueItem) => void;
  onIssueDeleted?: (issueId: number) => void;
  onEditClick?: (issue: IssueItem) => void;
}

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  isOpen,
  issueId,
  onClose,
  onIssueUpdated,
  onIssueDeleted,
  onEditClick,
}) => {
  const { user } = useAuth();
  const {
    data: issue = null,
    isLoading: loading,
    refetch: fetchIssue,
  } = useIssueDetailQuery(isOpen && issueId ? issueId : undefined);

  const statusMutation = useUpdateIssueStatusMutation();
  const updateIssueMutation = useUpdateIssueMutation();
  const addCommentMutation = useAddIssueCommentMutation();
  const deleteIssueMutation = useDeleteIssueMutation();

  const [commentText, setCommentText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [logWorkOpen, setLogWorkOpen] = useState<boolean>(false);

  // Handle direct status change
  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return;
    try {
      const updated = await statusMutation.mutateAsync({ issueId: issue.id, status: newStatus });
      onIssueUpdated?.(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update issue status');
    }
  };

  // Assign issue to current user
  const handleAssignToMe = async () => {
    if (!issue || !user) return;
    try {
      const updated = await updateIssueMutation.mutateAsync({
        id: issue.id,
        data: { assigneeId: user.id },
      });
      onIssueUpdated?.(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reassign issue');
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !commentText.trim()) return;

    try {
      await addCommentMutation.mutateAsync({ issueId: issue.id, text: commentText.trim() });
      setCommentText('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    }
  };

  // Delete issue
  const handleDelete = async () => {
    if (!issue) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${issue.key}?`)) {
      return;
    }

    try {
      await deleteIssueMutation.mutateAsync(issue.id);
      onIssueDeleted?.(issue.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete issue');
    }
  };

  const isAssignedToMe = user && issue?.assignee?.id === user.id;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        title={
          <div className="flex items-center justify-between gap-3 w-full pr-1">
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2.5 py-1 rounded-lg shrink-0">
                {issue ? issue.key : '...'}
              </span>

              {issue && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-36 shrink-0">
                    <Select
                      value={issue.status}
                      onValueChange={(val) => handleStatusChange(val as IssueStatus)}
                    >
                      <SelectTrigger size="sm" className="rounded-lg bg-[var(--md-sys-color-surface-container)] text-xs font-semibold h-7 border-[var(--md-sys-color-outline-variant)]/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="REVIEW">Code Review</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {issue.sprint && (
                    <Badge variant="primary" size="sm" className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 font-bold">
                      <Layers className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />
                      <span>{issue.sprint}</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {issue && (
              <div className="flex items-center gap-1 shrink-0">
                <Tooltip content="Open in full page view">
                  <Link
                    to={`/issues/${issue.key || issue.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors flex items-center gap-1 text-xs shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Tooltip>

                {onEditClick && (
                  <Tooltip content="Edit issue parameters">
                    <button
                      type="button"
                      onClick={() => onEditClick(issue)}
                      className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer shrink-0"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}

                <Tooltip content="Delete issue">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteIssueMutation.isPending}
                    className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Loading issue details...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/30 text-[var(--md-sys-color-on-error-container)] text-sm">
              {error}
            </div>
          )}

          {issue && !loading && (
            <>
              {/* Title & Description */}
              <div>
                <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] leading-snug mb-3">
                  {issue.title}
                </h2>
                <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-sm text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap leading-relaxed">
                  {issue.description || (
                    <span className="italic text-[var(--md-sys-color-on-surface-variant)]">
                      No detailed description provided.
                    </span>
                  )}
                </div>
              </div>

              {/* Attributes Grid with Avatars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs">
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1">Issue Type</span>
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{issue.issueType}</span>
                </div>
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1">Priority</span>
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{issue.priority}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">Assignee</span>
                    {!isAssignedToMe && (
                      <button
                        type="button"
                        onClick={handleAssignToMe}
                        className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Assign me</span>
                      </button>
                    )}
                  </div>
                  {issue.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={issue.assignee.fullName}
                        avatarUrl={issue.assignee.avatarUrl}
                        role={issue.assignee.systemRole}
                        size="xs"
                      />
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                        {issue.assignee.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="italic text-[var(--md-sys-color-on-surface-variant)]">Unassigned</span>
                  )}
                </div>
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1">Sprint</span>
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate block">
                    {issue.sprint || 'Backlog'}
                  </span>
                </div>
              </div>

              {/* Time Tracking Widget */}
              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
                      Time Tracking & Worklogs
                    </h4>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setLogWorkOpen(true)}
                    variant="tonal"
                    size="sm"
                    leftIcon={<Clock className="w-3.5 h-3.5" />}
                  >
                    Log Work
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    <span>Logged: <strong>{issue.loggedHours || 0}h</strong></span>
                    <span>Estimated: <strong>{issue.estimatedHours || 0}h</strong></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--md-sys-color-primary)] transition-all"
                      style={{
                        width: `${
                          issue.estimatedHours && issue.estimatedHours > 0
                            ? Math.min(Math.round(((issue.loggedHours || 0) / issue.estimatedHours) * 100), 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* People & Timestamps */}
              <div className="flex flex-wrap items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={issue.reporter?.fullName || 'Reporter'}
                    avatarUrl={issue.reporter?.avatarUrl}
                    role={issue.reporter?.systemRole}
                    size="xs"
                  />
                  <span>
                    Reported by: <strong className="text-[var(--md-sys-color-on-surface)]">{issue.reporter?.fullName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created: {new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Discussion & Activity Section */}
              <div className="space-y-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                      Discussion & Activity ({issue.comments?.length || 0})
                    </h3>
                  </div>
                </div>

                {/* Comment List */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {(!issue.comments || issue.comments.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      No activity comments yet. Start the conversation below.
                    </div>
                  ) : (
                    issue.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={comment.author.fullName}
                              avatarUrl={comment.author.avatarUrl}
                              role={comment.author.systemRole}
                              size="xs"
                            />
                            <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                              {comment.author.fullName}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap leading-relaxed pl-7">
                          {comment.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Write a comment or post an update..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-input-bg)] text-[var(--md-sys-color-input-text)] border border-[var(--md-sys-color-input-border)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20 focus:border-[var(--md-sys-color-primary)]"
                  />
                  <Button
                    type="submit"
                    variant="filled"
                    size="sm"
                    disabled={!commentText.trim()}
                    isLoading={addCommentMutation.isPending}
                    rightIcon={<Send className="w-3 h-3" />}
                  >
                    Post
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </Modal>

      {issue && (
        <LogWorkModal
          isOpen={logWorkOpen}
          onClose={() => setLogWorkOpen(false)}
          issueId={issue.id}
          issueKey={issue.key}
          issueTitle={issue.title}
          onWorkLogged={async () => {
            await fetchIssue();
            if (issue) onIssueUpdated?.({ ...issue, loggedHours: (issue.loggedHours || 0) + 1 });
          }}
        />
      )}
    </>
  );
};
