import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type IssueItem,
  type IssueStatus,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { LogWorkModal } from './LogWorkModal';
import {
  X,
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
  onIssueUpdated: (updatedIssue: IssueItem) => void;
  onIssueDeleted: (issueId: number) => void;
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
  const [issue, setIssue] = useState<IssueItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Discussion state
  const [commentText, setCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [logWorkOpen, setLogWorkOpen] = useState<boolean>(false);

  // Fetch full issue details
  const fetchIssue = async () => {
    if (!issueId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIssue(issueId);
      setIssue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch issue details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && issueId) {
      fetchIssue();
      setCommentText('');
    } else {
      setIssue(null);
    }
  }, [isOpen, issueId]);

  if (!isOpen || !issueId) return null;

  // Handle FSM Status Transition
  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue || issue.status === newStatus) return;
    try {
      const updated = await api.updateIssueStatus(issue.id, newStatus);
      setIssue(updated);
      onIssueUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  // Handle Self-Assignment
  const handleAssignToMe = async () => {
    if (!issue) return;
    try {
      const updated = await api.assignIssueToMe(issue.id);
      setIssue(updated);
      onIssueUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to assign issue');
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await api.addIssueComment(issue.id, commentText.trim());
      setCommentText('');
      await fetchIssue();
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!issue) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${issue.key}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.deleteIssue(issue.id);
      onIssueDeleted(issue.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete issue');
      setDeleting(false);
    }
  };

  const isAssignedToMe = user && issue?.assignee?.id === user.id;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[28px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-3 py-1 rounded-xl">
                {issue ? issue.key : '...'}
              </span>

              {issue && (
                <div className="flex items-center gap-2">
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
                  >
                    <option value="OPEN">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Code Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>

                  {issue.sprint && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {issue.sprint}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {issue && (
                <>
                  <Link
                    to={`/issues/${issue.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors flex items-center gap-1 text-xs"
                    title="Open in dedicated full page"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Full Page</span>
                  </Link>

                  {onEditClick && (
                    <button
                      type="button"
                      onClick={() => onEditClick(issue)}
                      className="p-2 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors"
                      title="Edit issue metadata"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    title="Delete issue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Loading issue details...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
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
                  <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-sm text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap leading-relaxed">
                    {issue.description || (
                      <span className="italic text-[var(--md-sys-color-on-surface-variant)]">
                        No detailed description provided.
                      </span>
                    )}
                  </div>
                </div>

                {/* Attributes Grid with Avatars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs">
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
                          className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-0.5"
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
                </div>

                {/* Time Tracking Widget */}
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                        Time Tracking & Worklogs
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogWorkOpen(true)}
                      className="px-3 py-1.5 rounded-full m3-btn-filled text-xs flex items-center gap-1.5 font-semibold shadow-xs"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Log Work</span>
                    </button>
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

                {/* Discussion Thread with Avatars */}
                <div className="space-y-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <h4 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                      Activity & Discussion ({issue.comments?.length || 0})
                    </h4>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3">
                    {!issue.comments || issue.comments.length === 0 ? (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                        No comments yet. Start the conversation below.
                      </p>
                    ) : (
                      issue.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 text-xs space-y-2"
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
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold m3-btn-filled shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {submittingComment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Post</span>
                          <Send className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {issue && (
        <LogWorkModal
          isOpen={logWorkOpen}
          onClose={() => setLogWorkOpen(false)}
          issueId={issue.id}
          issueKey={issue.key}
          issueTitle={issue.title}
          onWorkLogged={async () => {
            await fetchIssue();
            if (issue) onIssueUpdated({ ...issue, loggedHours: (issue.loggedHours || 0) + 1 });
          }}
        />
      )}
    </>
  );
};
