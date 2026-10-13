import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { IssueLinksSection } from '../kanban/IssueLinksSection';
import {
  IssueDetailDescription,
  IssueActivityTabs,
  IssueAttachmentsSection,
  IssueSidebarDetails,
  IssueSubtasksSection,
  IssueEpicChildrenSection,
} from './index.js';
import { Card, Button, Modal } from '../ui';
import {
  Loader2,
  AlertCircle,
  Link2,
  Paperclip,
  GitCommitHorizontal,
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeViewers, setActiveViewers] = useState<{ id: number; fullName: string; avatarUrl?: string }[]>([]);
  const [activeActivityTab, setActiveActivityTab] = useState<'comments' | 'history' | 'worklogs' | 'development'>('comments');
  const [subtasksCollapsed, setSubtasksCollapsed] = useState<boolean>(false);
  const [linksCollapsed, setLinksCollapsed] = useState<boolean | null>(null);
  const [attachmentsCollapsed, setAttachmentsCollapsed] = useState<boolean | null>(null);

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

        if (!isInput && !logWorkOpen && !deleteModalOpen) {
          handleBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logWorkOpen, deleteModalOpen, handleBack]);

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

  const hasLinks = Boolean((issue?.links?.length ?? 0) > 0);
  const hasAttachments = Boolean((issue?.attachments?.length ?? 0) > 0);
  const isLinksOpen = linksCollapsed === null ? hasLinks : !linksCollapsed;
  const isAttachmentsOpen = attachmentsCollapsed === null ? hasAttachments : !attachmentsCollapsed;

  return (
    <div className={`w-full flex-1 flex flex-col min-w-0 space-y-5 animate-in fade-in duration-200 ${isModal ? 'p-2 sm:p-4' : 'px-4 sm:px-6 lg:px-8 py-5'}`}>
      {/* Top Header / Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          {issue.projectKey && (
            <span className="font-medium text-[var(--md-sys-color-on-surface-variant)]">
              {issue.projectKey}
            </span>
          )}
          {issue.projectKey && <span>/</span>}
          <span className="font-semibold text-[var(--md-sys-color-primary)]">
            {issue.key}
          </span>
        </div>
        {isModal && onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-8 w-8 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Title, Description, Subtasks, Links, Attachments, Comments */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-5">
          <div id="description-section">
            <IssueDetailDescription
              issue={issue}
              onUpdateIssue={handleUpdateIssue}
            />
          </div>

          {/* Epic Children Section if EPIC */}
          {issue.issueType === 'EPIC' && (
            <div id="epic-children-section">
              <IssueEpicChildrenSection
                issue={issue}
                onIssuesChanged={() => fetchIssue()}
              />
            </div>
          )}

          {/* Collapsible Subtasks Section */}
          {!subtasksCollapsed && issue.issueType !== 'SUBTASK' && issue.issueType !== 'EPIC' && (
            <div id="subtasks-section">
              <IssueSubtasksSection
                issue={issue}
                onSubtasksChanged={() => fetchIssue()}
                onClose={() => setSubtasksCollapsed(true)}
              />
            </div>
          )}

          {/* Subtask parent indicator if subtask */}
          {issue.issueType === 'SUBTASK' && (
            <div id="subtasks-section">
              <IssueSubtasksSection
                issue={issue}
                onSubtasksChanged={() => fetchIssue()}
              />
            </div>
          )}

          {/* Collapsible Links Section */}
          {isLinksOpen && (
            <div id="links-section">
              <IssueLinksSection
                issueId={issue.id}
                currentIssueKey={issue.key}
                projectId={issue.projectId}
                links={issue.links}
                onLinksChanged={() => fetchIssue()}
                onClose={() => setLinksCollapsed(true)}
              />
            </div>
          )}

          {/* Collapsible Attachments Section */}
          {isAttachmentsOpen && (
            <div id="attachments-section">
              <IssueAttachmentsSection
                attachments={issue.attachments || []}
                currentUser={user}
                onUpload={handleUploadAttachment}
                onDelete={handleDeleteAttachment}
                onClose={() => setAttachmentsCollapsed(true)}
              />
            </div>
          )}

          {/* Quick Expand Bar if subtasks, links, or attachments are collapsed */}
          {(subtasksCollapsed || !isLinksOpen || !isAttachmentsOpen) && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {subtasksCollapsed && issue.issueType !== 'SUBTASK' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSubtasksCollapsed(false)}
                  className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
                  leftIcon={<GitCommitHorizontal className="w-3.5 h-3.5" />}
                >
                  {(issue.subtasks?.length ?? 0) > 0
                    ? `Show Subtasks (${issue.subtasks?.length})`
                    : 'Add Subtask'}
                </Button>
              )}
              {!isLinksOpen && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLinksCollapsed(false)}
                  className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
                  leftIcon={<Link2 className="w-3.5 h-3.5" />}
                >
                  {hasLinks ? `Show Links (${issue.links?.length || 0})` : 'Link another issue'}
                </Button>
              )}
              {!isAttachmentsOpen && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachmentsCollapsed(false)}
                  className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
                  leftIcon={<Paperclip className="w-3.5 h-3.5" />}
                >
                  {hasAttachments ? `Show Attachments (${issue.attachments?.length || 0})` : 'Attach files'}
                </Button>
              )}
            </div>
          )}

          {/* Activity Stream Hub (Comments with top input, Audit trail, Worklogs, Development) */}
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

        {/* Right Column: Properties & Integrated Time Tracking Dock */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-4 lg:sticky lg:top-6">
          <IssueSidebarDetails
            issue={issue}
            currentUser={user}
            activeViewers={activeViewers}
            onAssignToMe={handleAssignToMe}
            onSprintChange={handleSprintChange}
            onStatusChange={handleStatusChange}
            onDeleteClick={() => setDeleteModalOpen(true)}
            onUpdateFields={handleUpdateIssue}
            onOpenLogWorkModal={() => setLogWorkOpen(true)}
            onViewWorklogsTab={() => handleSwitchActivityTab('worklogs')}
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
          estimatedHours={issue.estimatedHours}
          loggedHours={issue.loggedHours}
          onWorkLogged={() => fetchIssue()}
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

