import { realtimeSocket } from '../api/socket';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, type IssueItem, type IssueStatus } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { LogWorkModal } from '../components/kanban/LogWorkModal';
import { IssueModal } from '../components/kanban/IssueModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  Layers,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  UserPlus,
  AlertCircle,
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Download,
  Maximize2,
  X,
} from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState<IssueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [logWorkOpen, setLogWorkOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeViewers, setActiveViewers] = useState<{ id: number; fullName: string; avatarUrl?: string }[]>([]);
  // Attachments State
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchIssue = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIssue(Number(id));
      setIssue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  // Real-time WebSocket connection for live collaboration & updates
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
          return {
            ...prev,
            comments: [...comments, comment],
          };
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
    if (!issue) return;
    try {
      const updated = await api.assignIssueToMe(issue.id);
      setIssue(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to self-assign issue');
    }
  };

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

  const handleUploadFile = async (file: File) => {
    if (!issue) return;
    setUploadingAttachment(true);
    setAttachmentError(null);
    try {
      await api.uploadAttachment(issue.id, file);
      await fetchIssue();
    } catch (err: any) {
      setAttachmentError(err.message || 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!issue) return;
    try {
      await api.deleteAttachment(issue.id, attachmentId);
      await fetchIssue();
    } catch (err: any) {
      setAttachmentError(err.message || 'Failed to delete attachment');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDelete = async () => {
    if (!issue) return;
    const confirmed = window.confirm(`Permanently delete ${issue.key}?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.deleteIssue(issue.id);
      navigate(`/projects/${issue.projectId}/board`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete issue');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--md-sys-color-primary)]" />
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Loading issue details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertCircle className="w-5 h-5" />
            <span>Issue Not Found</span>
          </div>
          <p className="text-sm">{error || 'The requested issue does not exist or has been removed.'}</p>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-4 py-2 rounded-full m3-btn-filled text-xs font-semibold"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const isAssignedToMe = user && issue.assignee?.id === user.id;
  const progressPercent =
    issue.estimatedHours > 0
      ? Math.min(Math.round(((issue.loggedHours || 0) / issue.estimatedHours) * 100), 100)
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumbs & Quick Back */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <Link
            to={`/projects/${issue.projectId}/board`}
            className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Board</span>
          </Link>
          <span>/</span>
          <Link to="/projects" className="hover:underline">
            Projects
          </Link>
          <span>/</span>
          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{issue.projectName}</span>
          <span>/</span>
          <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">{issue.key}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold m3-btn-outline flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
            title="Delete issue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column Details & Comments, Right Column Metadata & Time Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Header Card */}
          <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-3 py-1 rounded-xl">
                  {issue.key}
                </span>
                {activeViewers.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-[11px]">
                      {activeViewers.map((v) => v.fullName).join(', ')} viewing
                    </span>
                  </div>
                )}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]">
                  {issue.issueType}
                </span>
                {issue.sprint ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25 flex items-center gap-1 shadow-2xs">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{issue.sprint}</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Product Backlog</span>
                  </span>
                )}
              </div>

              {/* Status Selector */}
              <select
                aria-label="Workflow status selector"
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              >
                <option value="OPEN">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Code Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] leading-tight">
              {issue.title}
            </h1>

            {/* Description Box */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Description
              </span>
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-sm text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap leading-relaxed">
                {issue.description || <span className="italic text-[var(--md-sys-color-on-surface-variant)]">No description provided.</span>}
              </div>
            </div>
          </div>

                    {/* Evidence & File Attachments (SeaweedFS S3-Compatible Storage) */}
          <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <h3 className="font-bold text-base text-[var(--md-sys-color-on-surface)]">
                  Evidence & Attachments ({issue.attachments?.length || 0})
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Stored on SeaweedFS S3
              </span>
            </div>

            {attachmentError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
                <span>{attachmentError}</span>
                <button
                  type="button"
                  onClick={() => setAttachmentError(null)}
                  className="font-bold ml-2 hover:opacity-75"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30 scale-[1.01]'
                  : 'border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)]'
              }`}
              onClick={() => document.getElementById('issue-file-upload-input')?.click()}
            >
              <input
                id="issue-file-upload-input"
                type="file"
                className="hidden"
                disabled={uploadingAttachment}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadFile(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
              {uploadingAttachment ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--md-sys-color-primary)]" />
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    Uploading file to SeaweedFS cluster...
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center text-[var(--md-sys-color-primary)]">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                      Drop screenshots, crash logs, or documents here, or <span className="text-[var(--md-sys-color-primary)] underline">browse</span>
                    </p>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      Supports PNG, JPG, GIF, PDF, TXT, JSON, ZIP (Max 25MB)
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Attachments Grid */}
            {issue.attachments && issue.attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {issue.attachments.map((att) => {
                  const isImage = att.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.filename);
                  const formatSize = (bytes: number) => {
                    if (bytes < 1024) return `${bytes} B`;
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                  };

                  return (
                    <div
                      key={att.id}
                      className="group relative p-3 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isImage ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageUrl(att.url);
                              setPreviewImageTitle(att.filename);
                            }}
                            className="relative w-11 h-11 rounded-xl overflow-hidden bg-black/10 shrink-0 cursor-zoom-in border border-[var(--md-sys-color-outline-variant)] group-hover:ring-2 group-hover:ring-[var(--md-sys-color-primary)]"
                          >
                            <img
                              src={att.url}
                              alt={att.filename}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center shrink-0 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate"
                            title={att.filename}
                          >
                            {att.filename}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                            <span>{formatSize(att.fileSize)}</span>
                            <span>•</span>
                            <span>{att.uploader?.fullName || 'User'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImageUrl(att.url);
                              setPreviewImageTitle(att.filename);
                            }}
                            className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                            title="Preview image"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a
                          href={att.url}
                          download={att.filename}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)]"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-rose-500/10 hover:text-rose-500"
                          title="Delete attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discussion & Activity Thread */}
          <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-5 shadow-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              <h3 className="font-bold text-base text-[var(--md-sys-color-on-surface)]">
                Discussion & Activity ({issue.comments?.length || 0})
              </h3>
            </div>

            {/* Comment Post Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Share technical findings, steps, or ask questions..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold m3-btn-filled shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Post</span>
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              {!issue.comments || issue.comments.length === 0 ? (
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic text-center py-4">
                  No discussion comments yet. Be the first to comment!
                </p>
              ) : (
                issue.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={c.author.fullName}
                          avatarUrl={c.author.avatarUrl}
                          role={c.author.systemRole}
                          size="xs"
                        />
                        <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                          {c.author.fullName}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap leading-relaxed pl-7">
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Time Tracking (1 span) */}
        <div className="space-y-6">
          {/* People & Attributes Card */}
          <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              Attributes & Assignees
            </h3>

            {/* Assignee */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Assignee
                </span>
                {!isAssignedToMe && (
                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign to me</span>
                  </button>
                )}
              </div>
              {issue.assignee ? (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                  <Avatar
                    name={issue.assignee.fullName}
                    avatarUrl={issue.assignee.avatarUrl}
                    role={issue.assignee.systemRole}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                      {issue.assignee.fullName}
                    </p>
                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {issue.assignee.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface)] border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Unassigned
                </div>
              )}
            </div>

            {/* Reporter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Reporter
              </span>
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <Avatar
                  name={issue.reporter?.fullName || 'Reporter'}
                  avatarUrl={issue.reporter?.avatarUrl}
                  role={issue.reporter?.systemRole}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                    {issue.reporter?.fullName}
                  </p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                    {issue.reporter?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Priority & Issue Type */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[10px] uppercase font-semibold text-[var(--md-sys-color-on-surface-variant)] block mb-1">
                  Priority
                </span>
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">{issue.priority}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[10px] uppercase font-semibold text-[var(--md-sys-color-on-surface-variant)] block mb-1">
                  Issue Type
                </span>
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">{issue.issueType}</span>
              </div>

              {/* Sprint Iteration Assignment */}
              <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] col-span-2">
                <span className="text-[10px] uppercase font-semibold text-[var(--md-sys-color-on-surface-variant)] block mb-1.5 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                  <span>Sprint Iteration</span>
                </span>
                <select
                  aria-label="Sprint iteration assignment"
                  value={issue.sprint || ''}
                  onChange={(e) => handleSprintChange(e.target.value ? e.target.value : null)}
                  className="w-full text-xs font-bold text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-2.5 py-1.5 cursor-pointer focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
                >
                  <option value="">Product Backlog (Unassigned)</option>
                  <option value="Sprint 1">Sprint 1</option>
                  <option value="Sprint 2">Sprint 2</option>
                  <option value="Sprint 3">Sprint 3</option>
                  <option value="Sprint 4">Sprint 4</option>
                </select>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-1.5 pt-2 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created: {new Date(issue.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Updated: {new Date(issue.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Time Tracking & Worklogs Card */}
          <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Time Tracking
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLogWorkOpen(true)}
                className="px-3 py-1 rounded-full m3-btn-filled text-xs flex items-center gap-1 font-semibold"
              >
                <Clock className="w-3 h-3" />
                <span>Log Work</span>
              </button>
            </div>

            {/* Hours summary & progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                <span>Logged: {issue.loggedHours || 0}h</span>
                <span>Estimated: {issue.estimatedHours || 0}h</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--md-sys-color-primary)] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] text-right">
                {progressPercent}% of estimated effort completed
              </p>
            </div>

            {/* Worklogs History */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Recent Worklogs ({issue.worklogs?.length || 0})
              </span>
              {!issue.worklogs || issue.worklogs.length === 0 ? (
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                  No work hours logged yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {issue.worklogs.map((w) => (
                    <div
                      key={w.id}
                      className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={w.user.fullName}
                            avatarUrl={w.user.avatarUrl}
                            size="xs"
                          />
                          <span className="font-semibold">{w.user.fullName}</span>
                        </div>
                        <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">
                          +{w.timeSpentHours}h
                        </span>
                      </div>
                      {w.description && (
                        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">
                          {w.description}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] opacity-70">
                        Date: {w.dateLogged}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LogWorkModal
        isOpen={logWorkOpen}
        onClose={() => setLogWorkOpen(false)}
        issueId={issue.id}
        issueKey={issue.key}
        issueTitle={issue.title}
        onWorkLogged={fetchIssue}
      />

      <IssueModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editingIssue={issue}
        onIssueSaved={(updated) => setIssue(updated)}
      />
      {/* Image Lightbox Modal */}
      {previewImageUrl && (
        <div
          onClick={() => {
            setPreviewImageUrl(null);
            setPreviewImageTitle(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-[var(--md-sys-color-surface-container-high)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--md-sys-color-outline-variant)] flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate px-2">
                {previewImageTitle || 'Image Preview'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageUrl}
                  download={previewImageTitle || 'screenshot.png'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-full m3-btn-outline text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImageUrl(null);
                    setPreviewImageTitle(null);
                  }}
                  className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center bg-black/20">
              <img
                src={previewImageUrl}
                alt={previewImageTitle || 'Preview'}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
