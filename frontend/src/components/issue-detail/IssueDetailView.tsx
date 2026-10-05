import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { queryClient } from '../../api/queryClient.js';
import {
  useIssueDetailQuery,
  useUpdateIssueStatusMutation,
  useUpdateIssueSprintMutation,
  useAssignIssueToMeMutation,
  useUpdateIssueMutation,
  useAddIssueCommentMutation,
  useDeleteAttachmentMutation,
  useDeleteIssueMutation,
  issueKeys,
} from '../../api/queries';
import { api, type IssueStatus, type IssueItem, type CreateIssuePayload } from '../../api/client';
import { realtimeSocket } from '../../api/socket';
import { useAuth } from '../../store';
import { useRecentIssuesStore } from '../../store/useRecentIssuesStore';
import { LogWorkModal } from '../kanban/LogWorkModal';
import { IssueModal } from '../kanban/IssueModal';
import { IssueLinksSection } from '../kanban/IssueLinksSection';
import { VcsDevelopmentPanel } from '../kanban/VcsDevelopmentPanel';
import {
  IssueDetailHeader,
  IssueDetailDescription,
  IssueActivityTabs,
  IssueAttachmentsSection,
  IssueSidebarDetails,
  IssueTimeTrackingCard,
  IssueSubtasksSection,
} from './index.js';
import { Card, Button, Modal } from '../ui';
import {
  Loader2,
  AlertCircle,
  GitCommitHorizontal,
  Link2,
  Paperclip,
  ExternalLink,
  X,
} from 'lucide-react';

export interface IssueDetailViewProps {
  issueKeyOrId: string | number;
  isModal?: boolean;
  onClose?: () => void;
  onIssueUpdated?: (updatedIssue: IssueItem) => void;
  onIssueDeleted?: (issueId: number) => void;
  onEditClick?: (issue: IssueItem) => void;
}

export const IssueDetailView: React.FC<IssueDetailViewProps> = ({
  issueKeyOrId,
  isModal = false,
  onClose,
  onIssueUpdated,
  onIssueDeleted,
  onEditClick: customEditClick,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: issue = null,
    isLoading: loading,
    error: queryError,
    refetch: fetchIssue,
  } = useIssueDetailQuery(issueKeyOrId);

  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const [logWorkOpen, setLogWorkOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeViewers, setActiveViewers] = useState<{ id: number; fullName: string; avatarUrl?: string }[]>([]);
  const [activeActivityTab, setActiveActivityTab] = useState<'comments' | 'history' | 'worklogs' | 'development'>('comments');
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const handleSwitchActivityTab = (tab: 'comments' | 'history' | 'worklogs' | 'development') => {
    setActiveActivityTab(tab);
    const el = document.getElementById('activity-tabs-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const statusMutation = useUpdateIssueStatusMutation();
  const sprintMutation = useUpdateIssueSprintMutation();
  const assignMutation = useAssignIssueToMeMutation();
  const updateMutation = useUpdateIssueMutation();
  const commentMutation = useAddIssueCommentMutation();
  const deleteAttachmentMutation = useDeleteAttachmentMutation();
  const deleteIssueMutation = useDeleteIssueMutation();

  // Track recently visited issues for Command Palette
  useEffect(() => {
    if (issue) {
      useRecentIssuesStore.getState().addRecentIssue(issue);
    }
  }, [issue]);

  // Real-time WebSocket subscriptions
  useEffect(() => {
    if (!issue?.id) return;
    realtimeSocket.connect();
    realtimeSocket.joinIssue(issue.id, user ? {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    } : undefined);

    const unsubUpdated = realtimeSocket.onIssueUpdated((updated) => {
      if (updated.id === issue.id) {
        queryClient.setQueryData(issueKeys.detail(String(issueKeyOrId)), (old: typeof issue | undefined) =>
          old ? { ...old, ...updated } : old,
        );
        onIssueUpdated?.(updated as unknown as IssueItem);
      }
    });

    const unsubComment = realtimeSocket.onCommentCreated(({ issueId, comment }) => {
      if (issueId === issue.id) {
        queryClient.setQueryData(issueKeys.detail(String(issueKeyOrId)), (old: typeof issue | undefined) => {
          if (!old) return old;
          const comments = old.comments || [];
          if (comments.some((cm) => cm.id === comment.id)) return old;
          return { ...old, comments: [...comments, comment] };
        });
      }
    });

    const unsubAtt = realtimeSocket.onAttachmentUploaded(({ issueId }) => {
      if (issueId === issue.id) {
        fetchIssue();
      }
    });

    const unsubPresence = realtimeSocket.onPresenceViewing(({ user: viewerUser, issueId }) => {
      if (Number(issueId) === issue.id && viewerUser?.id && viewerUser.id !== user?.id) {
        const viewer = {
          id: viewerUser.id,
          fullName: viewerUser.fullName || 'Anonymous',
          avatarUrl: viewerUser.avatarUrl ?? undefined,
        };
        setActiveViewers((prev) => {
          if (prev.some((v) => v.id === viewer.id)) return prev;
          return [...prev, viewer];
        });
      }
    });

    return () => {
      realtimeSocket.leaveIssue(issue.id);
      unsubUpdated();
      unsubComment();
      unsubAtt();
      unsubPresence();
    };
  }, [issue?.id, user?.id, issueKeyOrId, fetchIssue, user, onIssueUpdated]);

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue || issue.status === newStatus) return;
    const updated = await statusMutation.mutateAsync({ issueId: issue.id, status: newStatus });
    onIssueUpdated?.(updated as unknown as IssueItem);
  };

  const handleSprintChange = async (newSprintId: number | null) => {
    if (!issue) return;
    await sprintMutation.mutateAsync({ id: issue.id, sprintId: newSprintId });
  };

  const handleAssignToMe = async () => {
    if (!issue || !user) return;
    try {
      await assignMutation.mutateAsync(issue.id);
    } catch {
      await updateMutation.mutateAsync({ id: issue.id, data: { assigneeId: user.id } });
    }
  };

  const handleUpdateIssue = async (payload: Partial<CreateIssuePayload>) => {
    if (!issue) return;
    const updated = await updateMutation.mutateAsync({ id: issue.id, data: payload });
    onIssueUpdated?.(updated as unknown as IssueItem);
  };

  const handleAddComment = async (text: string) => {
    if (!issue) return;
    await commentMutation.mutateAsync({ issueId: issue.id, text });
  };

  const handleUploadScreenshot = async (file: File): Promise<string> => {
    if (!issue) throw new Error('No issue loaded');
    const uploaded = await api.uploadAttachment(issue.id, file);
    await fetchIssue();
    return uploaded.url;
  };

  const handleUploadAttachment = async (file: File) => {
    if (!issue) return;
    await api.uploadAttachment(issue.id, file);
    await fetchIssue();
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!issue) return;
    await deleteAttachmentMutation.mutateAsync({ issueId: issue.id, attachmentId });
  };

  const handleBack = useCallback(() => {
    if (isModal && onClose) {
      onClose();
      return;
    }
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (issue?.projectKey || issue?.projectId) {
      navigate(`/projects/${issue.projectKey || issue.projectId}/board`);
    } else {
      navigate('/projects');
    }
  }, [navigate, issue, isModal, onClose]);

  // Keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeEl = document.activeElement;
        const activeTag = activeEl?.tagName?.toLowerCase();
        const isInput =
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          activeTag === 'select' ||
          (activeEl as HTMLElement)?.isContentEditable;

        if (!isInput && !logWorkOpen && !editModalOpen && !deleteModalOpen) {
          handleBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logWorkOpen, editModalOpen, deleteModalOpen, handleBack]);

  const handleDeleteIssue = async () => {
    if (!issue) return;
    try {
      await deleteIssueMutation.mutateAsync(issue.id);
      onIssueDeleted?.(issue.id);
      if (isModal && onClose) {
        onClose();
      } else {
        const targetBoard = issue.projectKey ? `/projects/${issue.projectKey}/board` : (issue.projectId ? `/projects/${issue.projectId}/board` : '/projects');
        navigate(targetBoard);
      }
    } catch {
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[var(--md-sys-color-primary)] animate-spin" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="w-full px-4 py-8 flex justify-center">
        <Card className="max-w-md w-full p-8 text-center border-[var(--md-sys-color-error)]/30 bg-[var(--md-sys-color-error-container)]/10 space-y-4">
          <AlertCircle className="w-10 h-10 text-[var(--md-sys-color-error)] mx-auto" />
          <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Error Loading Issue</h2>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{error || 'Issue not found'}</p>
          <Button variant="outline" onClick={handleBack}>
            {isModal ? 'Close' : 'Go Back'}
          </Button>
        </Card>
      </div>
    );
  }

  const hasSubtasks = Boolean((issue?.subtasks?.length ?? 0) > 0 || issue?.issueType === 'SUBTASK');
  const hasLinks = Boolean((issue?.links?.length ?? 0) > 0);
  const hasAttachments = Boolean((issue?.attachments?.length ?? 0) > 0);

  return (
    <div className={`w-full flex-1 flex flex-col min-w-0 space-y-6 animate-in fade-in duration-200 ${isModal ? 'p-2 sm:p-4' : 'px-4 sm:px-6 lg:px-8 py-5'}`}>
      {/* Header bar: If in modal, show compact modal actions */}
      {isModal ? (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2.5 py-1 rounded-lg">
              {issue.key}
            </span>
            {issue.sprint?.name && (
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)] px-2 py-0.5 rounded-md border border-[var(--md-sys-color-outline-variant)]/60">
                {issue.sprint.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              to={`/issues/${issue.key}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors flex items-center gap-1 text-xs"
              title="Open in full page view"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Full page</span>
            </Link>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <IssueDetailHeader
          issue={issue}
          activeViewers={activeViewers}
          deleting={deleteIssueMutation.isPending}
          onStatusChange={handleStatusChange}
          onEditClick={customEditClick ? () => customEditClick(issue) : () => setEditModalOpen(true)}
          onDeleteClick={() => setDeleteModalOpen(true)}
          onBack={handleBack}
        />
      )}

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Title, Description, Links, Comments, Attachments */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-6">
          <div id="description-section">
            <IssueDetailDescription
              issue={issue}
              onUpdateIssue={handleUpdateIssue}
            />
          </div>

          {/* Quick Actions Bar */}
          {(!hasSubtasks || !hasLinks || !hasAttachments) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              {!hasSubtasks && !showSubtasks && (
                <button
                  type="button"
                  onClick={() => setShowSubtasks(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 transition-colors cursor-pointer"
                >
                  <GitCommitHorizontal className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  Add subtask
                </button>
              )}
              {!hasLinks && !showLinks && (
                <button
                  type="button"
                  onClick={() => setShowLinks(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 transition-colors cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  Link issue
                </button>
              )}
              {!hasAttachments && !showAttachments && (
                <button
                  type="button"
                  onClick={() => setShowAttachments(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  Attach files
                </button>
              )}
            </div>
          )}

          {/* Subtasks Section */}
          {(hasSubtasks || showSubtasks) && (
            <div id="subtasks-section">
              <IssueSubtasksSection
                issue={issue}
                onSubtasksChanged={() => fetchIssue()}
              />
            </div>
          )}

          {/* Links Section */}
          {(hasLinks || showLinks) && (
            <div id="links-section">
              <IssueLinksSection
                issueId={issue.id}
                currentIssueKey={issue.key}
                projectId={issue.projectId}
                links={issue.links}
                onLinksChanged={() => fetchIssue()}
              />
            </div>
          )}

          {/* Attachments Section */}
          {(hasAttachments || showAttachments) && (
            <div id="attachments-section">
              <IssueAttachmentsSection
                attachments={issue.attachments || []}
                currentUser={user}
                onUpload={handleUploadAttachment}
                onDelete={handleDeleteAttachment}
              />
            </div>
          )}

          {/* Activity / Comments Stream */}
          <div id="activity-tabs-section">
            <IssueActivityTabs
              issue={issue}
              currentUser={user}
              activeTab={activeActivityTab}
              onTabChange={setActiveActivityTab}
              onAddComment={handleAddComment}
              onUploadCommentScreenshot={handleUploadScreenshot}
              onOpenLogWorkModal={() => setLogWorkOpen(true)}
            />
          </div>
        </div>

        {/* Right Column: Attributes & Time Tracking */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-4 lg:sticky lg:top-6">
          <IssueSidebarDetails
            issue={issue}
            currentUser={user}
            onAssignToMe={handleAssignToMe}
            onSprintChange={handleSprintChange}
            onStatusChange={handleStatusChange}
            onUpdateFields={handleUpdateIssue}
          />

          <IssueTimeTrackingCard
            issue={issue}
            onOpenLogWorkModal={() => setLogWorkOpen(true)}
            onViewWorklogsTab={() => handleSwitchActivityTab('worklogs')}
          />

          <VcsDevelopmentPanel
            issueId={issue.id}
            issueKey={issue.key}
            issueTitle={issue.title}
            compact
            onViewDetails={() => handleSwitchActivityTab('development')}
          />
        </div>
      </div>

      {/* Log Work Modal */}
      {logWorkOpen && (
        <LogWorkModal
          isOpen={logWorkOpen}
          onClose={() => setLogWorkOpen(false)}
          issueId={issue.id}
          issueKey={issue.key}
          issueTitle={issue.title}
          onWorkLogged={() => fetchIssue()}
        />
      )}

      {/* Edit Issue Modal */}
      {editModalOpen && (
        <IssueModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          editingIssue={issue}
          onIssueSaved={() => fetchIssue()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Issue"
          size="sm"
        >
          <div className="p-4 space-y-4">
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              Are you sure you want to delete <strong className="text-[var(--md-sys-color-on-surface)]">{issue.key}</strong>?
              This action cannot be undone and will delete all associated comments and worklogs.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteIssueMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteIssue}
                disabled={deleteIssueMutation.isPending}
              >
                {deleteIssueMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
