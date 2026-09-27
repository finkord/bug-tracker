import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type IssueItem, type IssueStatus } from '../api/client.js';
import { realtimeSocket } from '../api/socket.js';
import { useAuth } from '../context/AuthContext.js';
import { LogWorkModal } from '../components/kanban/LogWorkModal.js';
import { IssueModal } from '../components/kanban/IssueModal.js';
import { IssueLinksSection } from '../components/kanban/IssueLinksSection.js';
import {
  IssueDetailHeader,
  IssueDetailDescription,
  IssueCommentsSection,
  IssueAttachmentsSection,
  IssueSidebarDetails,
  IssueTimeTrackingCard,
} from '../components/issue-detail/index.js';
import { Card, Button, Modal } from '../components/ui/index.js';
import { Loader2, AlertCircle } from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { key, id } = useParams<{ key?: string; id?: string }>();
  const issueKeyOrId = key || id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState<IssueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logWorkOpen, setLogWorkOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeViewers, setActiveViewers] = useState<{ id: number; fullName: string; avatarUrl?: string }[]>([]);

  const fetchIssue = async () => {
    if (!issueKeyOrId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIssue(issueKeyOrId);
      setIssue(data);
      if (data?.key && issueKeyOrId !== data.key) {
        navigate(`/issues/${data.key}`, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [issueKeyOrId]);

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
        setIssue((prev) => ({ ...prev, ...updated }));
      }
    });

    const unsubComment = realtimeSocket.onCommentCreated(({ issueId, comment }) => {
      if (issueId === issue.id) {
        setIssue((prev) => {
          if (!prev) return prev;
          const comments = prev.comments || [];
          if (comments.some((cm) => cm.id === comment.id)) return prev;
          return { ...prev, comments: [...comments, comment] };
        });
      }
    });

    const unsubAtt = realtimeSocket.onAttachmentUploaded(({ issueId }) => {
      if (issueId === issue.id) {
        fetchIssue();
      }
    });

    const unsubPresence = realtimeSocket.onPresenceViewing(({ user: viewerUser, issueId }) => {
      if (Number(issueId) === issue.id && viewerUser?.id !== user?.id) {
        setActiveViewers((prev) => {
          if (prev.some((v) => v.id === viewerUser.id)) return prev;
          return [...prev, viewerUser];
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
  }, [issue?.id, user?.id]);

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue || issue.status === newStatus) return;
    try {
      const updated = await api.updateIssueStatus(issue.id, newStatus);
      setIssue(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleSprintChange = async (newSprint: string | null) => {
    if (!issue) return;
    try {
      const updated = await api.updateIssueSprint(issue.id, newSprint);
      setIssue((prev) => (prev ? { ...prev, sprint: updated.sprint } : null));
    } catch (err: any) {
      setError(err.message || 'Failed to update sprint assignment');
    }
  };

  const handleAssignToMe = async () => {
    if (!issue || !user) return;
    try {
      const updated = await api.assignIssueToMe(issue.id);
      setIssue(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to assign issue');
    }
  };

  const handleUpdateIssue = async (payload: { title?: string; description?: string }) => {
    if (!issue) return;
    try {
      const updated = await api.updateIssue(issue.id, payload);
      setIssue(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update issue');
    }
  };

  const handleAddComment = async (text: string) => {
    if (!issue) return;
    const newComment = await api.addIssueComment(issue.id, text);
    setIssue((prev) => {
      if (!prev) return prev;
      const currentComments = prev.comments || [];
      if (currentComments.some((cm) => cm.id === newComment.id)) return prev;
      return { ...prev, comments: [...currentComments, newComment] };
    });
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
    await api.deleteAttachment(issue.id, attachmentId);
    setIssue((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        attachments: (prev.attachments || []).filter((a) => a.id !== attachmentId),
      };
    });
  };

  const handleDeleteIssue = async () => {
    if (!issue) return;
    setDeleting(true);
    try {
      await api.deleteIssue(issue.id);
      navigate(issue.projectId ? `/projects/${issue.projectId}/board` : '/issues');
    } catch (err: any) {
      setError(err.message || 'Failed to delete issue');
      setDeleting(false);
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
        deleting={deleting}
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
            onLinksChanged={fetchIssue}
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
          onWorkLogged={fetchIssue}
        />
      )}

      {/* Edit Issue Modal */}
      {editModalOpen && (
        <IssueModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          editingIssue={issue}
          onIssueSaved={fetchIssue}
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
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteIssue}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
