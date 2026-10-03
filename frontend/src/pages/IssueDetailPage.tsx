import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
} from '../api/queries';
import { api, type IssueStatus } from '../api/client';
import { realtimeSocket } from '../api/socket';
import { useAuth } from '../store';
import { useRecentIssuesStore } from '../store/useRecentIssuesStore';
import { LogWorkModal } from '../components/kanban/LogWorkModal';
import { IssueModal } from '../components/kanban/IssueModal';
import { IssueLinksSection } from '../components/kanban/IssueLinksSection';
import { VcsDevelopmentPanel } from '../components/kanban/VcsDevelopmentPanel';
import {
  IssueDetailHeader,
  IssueDetailDescription,
  IssueActivityTabs,
  IssueAttachmentsSection,
  IssueSidebarDetails,
  IssueTimeTrackingCard,
  IssueSubtasksSection,
} from '../components/issue-detail';
import { Card, Button, Modal } from '../components/ui';
import { Loader2, AlertCircle } from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { key, id } = useParams<{ key?: string; id?: string }>();
  const issueKeyOrId = key || id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // Redirect to canonical key url if accessed by ID
  useEffect(() => {
    if (issue?.key && issueKeyOrId !== issue.key) {
      navigate(`/issues/${issue.key}`, { replace: true });
    }
  }, [issue?.key, issueKeyOrId, navigate]);

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
        queryClient.setQueryData(issueKeys.detail(issueKeyOrId!), (old: typeof issue) =>
          old ? { ...old, ...updated } : old,
        );
      }
    });

    const unsubComment = realtimeSocket.onCommentCreated(({ issueId, comment }) => {
      if (issueId === issue.id) {
        queryClient.setQueryData(issueKeys.detail(issueKeyOrId!), (old: typeof issue) => {
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
  }, [issue?.id, user?.id, issueKeyOrId, queryClient, fetchIssue, user]);

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue || issue.status === newStatus) return;
    await statusMutation.mutateAsync({ issueId: issue.id, status: newStatus });
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
      // Fallback via general update mutation if specialized self-assign permission fails
      await updateMutation.mutateAsync({ id: issue.id, data: { assigneeId: user.id } });
    }
  };

  const handleUpdateIssue = async (payload: Partial<import('../api/client').CreateIssuePayload>) => {
    if (!issue) return;
    await updateMutation.mutateAsync({ id: issue.id, data: payload });
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

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (issue?.projectKey || issue?.projectId) {
      navigate(`/projects/${issue.projectKey || issue.projectId}/board`);
    } else {
      navigate('/projects');
    }
  };

  // Keyboard shortcut Esc to return back when not editing
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
  }, [issue?.projectKey, issue?.projectId, logWorkOpen, editModalOpen, deleteModalOpen]);

  const handleDeleteIssue = async () => {
    if (!issue) return;
    try {
      await deleteIssueMutation.mutateAsync(issue.id);
      const targetBoard = issue.projectKey ? `/projects/${issue.projectKey}/board` : (issue.projectId ? `/projects/${issue.projectId}/board` : '/projects');
      navigate(targetBoard);
    } catch {
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
        <Card className="max-w-md w-full p-8 text-center border-[var(--md-sys-color-error)]/30 bg-[var(--md-sys-color-error-container)]/10 space-y-4">
          <AlertCircle className="w-10 h-10 text-[var(--md-sys-color-error)] mx-auto" />
          <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Error Loading Issue</h2>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{error || 'Issue not found'}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <IssueDetailHeader
        issue={issue}
        activeViewers={activeViewers}
        deleting={deleteIssueMutation.isPending}
        onStatusChange={handleStatusChange}
        onEditClick={() => setEditModalOpen(true)}
        onDeleteClick={() => setDeleteModalOpen(true)}
        onBack={handleBack}
      />

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Title, Description, Links, Comments, Attachments */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-6">
          <IssueDetailDescription
            issue={issue}
            onUpdateIssue={handleUpdateIssue}
          />

          <IssueSubtasksSection
            issue={issue}
            onSubtasksChanged={() => fetchIssue()}
          />

          <IssueLinksSection
            issueId={issue.id}
            currentIssueKey={issue.key}
            projectId={issue.projectId}
            links={issue.links}
            onLinksChanged={() => fetchIssue()}
          />

          <IssueAttachmentsSection
            attachments={issue.attachments || []}
            currentUser={user}
            onUpload={handleUploadAttachment}
            onDelete={handleDeleteAttachment}
          />

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
