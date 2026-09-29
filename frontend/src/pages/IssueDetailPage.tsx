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
import { LogWorkModal } from '../components/kanban/LogWorkModal';
import { IssueModal } from '../components/kanban/IssueModal';
import { IssueLinksSection } from '../components/kanban/IssueLinksSection';
import {
  IssueDetailHeader,
  IssueDetailDescription,
  IssueCommentsSection,
  IssueAttachmentsSection,
  IssueSidebarDetails,
  IssueTimeTrackingCard,
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

  const handleSprintChange = async (newSprint: string | null) => {
    if (!issue) return;
    await sprintMutation.mutateAsync({ id: issue.id, sprint: newSprint });
  };

  const handleAssignToMe = async () => {
    if (!issue || !user) return;
    await assignMutation.mutateAsync(issue.id);
  };

  const handleUpdateIssue = async (payload: { title?: string; description?: string }) => {
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

  const handleDeleteIssue = async () => {
    if (!issue) return;
    try {
      await deleteIssueMutation.mutateAsync(issue.id);
      navigate(issue.projectId ? `/projects/${issue.projectId}/board` : '/issues');
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
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5 space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Error Loading Issue</h2>
          <p className="text-sm text-muted-foreground">{error || 'Issue not found'}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header Bar */}
      <IssueDetailHeader
        issue={issue}
        activeViewers={activeViewers}
        deleting={deleteIssueMutation.isPending}
        onStatusChange={handleStatusChange}
        onEditClick={() => setEditModalOpen(true)}
        onDeleteClick={() => setDeleteModalOpen(true)}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols): Title, Description, Links, Comments, Attachments */}
        <div className="lg:col-span-2 space-y-6">
          <IssueDetailDescription
            issue={issue}
            onUpdateIssue={handleUpdateIssue}
          />

          <IssueLinksSection
            issueId={issue.id}
            currentIssueKey={issue.key}
            projectId={issue.projectId}
            links={issue.links}
            onLinksChanged={() => fetchIssue()}
          />

          <IssueCommentsSection
            comments={issue.comments || []}
            onAddComment={handleAddComment}
            onUploadCommentScreenshot={handleUploadScreenshot}
          />

          <IssueAttachmentsSection
            attachments={issue.attachments || []}
            currentUser={user}
            onUpload={handleUploadAttachment}
            onDelete={handleDeleteAttachment}
          />
        </div>

        {/* Right Column (1 col): Attributes & Time Tracking */}
        <div className="space-y-5">
          <IssueSidebarDetails
            issue={issue}
            currentUser={user}
            onAssignToMe={handleAssignToMe}
            onSprintChange={handleSprintChange}
          />

          <IssueTimeTrackingCard
            issue={issue}
            onOpenLogWorkModal={() => setLogWorkOpen(true)}
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
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{issue.key}</strong>?
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
