import { realtimeSocket } from '../api/socket';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, type IssueItem, type IssueStatus } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { LogWorkModal } from '../components/kanban/LogWorkModal';
import { IssueModal } from '../components/kanban/IssueModal';
import { IssueLinksSection } from '../components/kanban/IssueLinksSection';
import { MarkdownContent } from '../components/common/MarkdownContent';
import { Card, Button, Badge, Tooltip, Modal } from '../components/ui';
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
} from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { key, id } = useParams<{ key?: string; id?: string }>();
  const issueKeyOrId = key || id;
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
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const commentFileInputRef = useRef<HTMLInputElement>(null);

  const fetchIssue = async () => {
    if (!issueKeyOrId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIssue(issueKeyOrId);
      setIssue(data);
      // If user navigated via numeric ID or different casing, replace URL with canonical /issues/<projectKey>-<issueNum>
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
    if (!issue || !user) return;
    try {
      const updated = await api.assignIssueToMe(issue.id);
      setIssue(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to assign issue');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await api.addIssueComment(issue.id, commentText.trim());
      setIssue((prev) => {
        if (!prev) return prev;
        const currentComments = prev.comments || [];
        if (currentComments.some((cm) => cm.id === newComment.id)) {
          return prev;
        }
        return {
          ...prev,
          comments: [...currentComments, newComment],
        };
      });
      setCommentText('');
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePasteInComment = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !issue) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `screenshot_${timestamp}.png`;
        const file = new File([blob], filename, { type: blob.type || 'image/png' });

        setUploadingScreenshot(true);
        const placeholder = `\n![Uploading ${filename}...]()\n`;
        setCommentText((prev) => prev + placeholder);

        try {
          const uploaded = await api.uploadAttachment(issue.id, file);
          await fetchIssue();
          setCommentText((prev) =>
            prev.replace(placeholder, `\n![${filename}](${uploaded.url})\n`),
          );
        } catch (err: any) {
          setError(err.message || 'Failed to upload pasted screenshot');
          setCommentText((prev) => prev.replace(placeholder, ''));
        } finally {
          setUploadingScreenshot(false);
        }
        break;
      }
    }
  };

  const handleCommentScreenshotSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !issue) return;

    setUploadingScreenshot(true);
    const placeholder = `\n![Uploading ${file.name}...]()\n`;
    setCommentText((prev) => prev + placeholder);

    try {
      const uploaded = await api.uploadAttachment(issue.id, file);
      await fetchIssue();
      setCommentText((prev) =>
        prev.replace(placeholder, `\n![${file.name}](${uploaded.url})\n`),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to upload screenshot');
      setCommentText((prev) => prev.replace(placeholder, ''));
    } finally {
      setUploadingScreenshot(false);
      if (commentFileInputRef.current) {
        commentFileInputRef.current.value = '';
      }
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!issue) return;
    setAttachmentError(null);
    setUploadingAttachment(true);
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
    if (!window.confirm('Are you sure you want to remove this attachment?')) return;
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
        <div className="p-6 rounded-2xl bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/20 text-[var(--md-sys-color-on-error-container)] space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertCircle className="w-5 h-5 text-[var(--md-sys-color-error)]" />
            <span>Issue Not Found</span>
          </div>
          <p className="text-sm">{error || 'The requested issue does not exist or has been removed.'}</p>
          <Button
            type="button"
            variant="filled"
            size="sm"
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumbs & Action Bar */}
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
          <Button
            type="button"
            onClick={() => setEditModalOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>

          <Tooltip content="Permanently delete issue">
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              variant="ghost"
              size="icon-sm"
              className="text-[var(--md-sys-color-on-surface-variant)] hover:text-red-500 hover:bg-red-500/10"
              aria-label="Delete issue"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Main 70/30 Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 of 12 cols = ~67%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Issue Header & Description Card */}
          <Card variant="filled" padding="md" rounded="xl" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2.5 py-1 rounded-lg">
                  {issue.key}
                </span>

                {activeViewers.length > 0 && (
                  <Badge variant="success" size="sm" dot>
                    {activeViewers.map((v) => v.fullName).join(', ')} viewing
                  </Badge>
                )}

                <Badge variant="neutral" size="sm">
                  {issue.issueType}
                </Badge>

                {issue.sprint ? (
                  <Badge variant="primary" size="sm">
                    <Layers className="w-3 h-3 mr-1 inline" />
                    {issue.sprint}
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    <Layers className="w-3 h-3 mr-1 inline" />
                    Product Backlog
                  </Badge>
                )}
              </div>

              {/* Status Selector */}
              <select
                aria-label="Workflow status selector"
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20"
              >
                <option value="OPEN">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Code Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
              {issue.title}
            </h1>

            {/* Description Box */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] select-none">
                Description
              </span>
              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed">
                <MarkdownContent
                  content={issue.description}
                  onImageClick={(url, title) => {
                    setPreviewImageUrl(url);
                    setPreviewImageTitle(title || 'Description Image');
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Issue Linking & Dependency Graphs (Lab 3/5 Model) */}
          <IssueLinksSection
            issueId={issue.id}
            currentIssueKey={issue.key}
            projectId={issue.projectId}
            links={issue.links}
            onLinksChanged={fetchIssue}
          />

          {/* Evidence & File Attachments */}
          <Card variant="filled" padding="md" rounded="xl" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  Evidence & Attachments ({issue.attachments?.length || 0})
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Stored on SeaweedFS S3
              </span>
            </div>

            {attachmentError && (
              <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/20 text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between">
                <span>{attachmentError}</span>
                <button
                  type="button"
                  onClick={() => setAttachmentError(null)}
                  className="font-bold ml-2 hover:opacity-75 cursor-pointer"
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
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30 scale-[1.01]'
                  : 'border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-low)]'
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
                  <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center text-[var(--md-sys-color-primary)]">
                    <UploadCloud className="w-4 h-4" />
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
                      className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-2.5 group hover:border-[var(--md-sys-color-primary)]/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isImage ? (
                          <div
                            onClick={() => {
                              setPreviewImageUrl(att.url);
                              setPreviewImageTitle(att.filename);
                            }}
                            className="w-12 h-12 rounded-lg bg-black/10 overflow-hidden shrink-0 border border-[var(--md-sys-color-outline-variant)] cursor-pointer hover:opacity-85 transition-opacity relative group/img"
                            title="Click to preview"
                          >
                            <img
                              src={att.url}
                              alt={att.filename}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center text-[var(--md-sys-color-primary)] shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate" title={att.filename}>
                            {att.filename}
                          </p>
                          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                            {formatSize(att.fileSize)} • {new Date(att.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isImage && (
                          <Tooltip content="Preview image">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImageUrl(att.url);
                                setPreviewImageTitle(att.filename);
                              }}
                              className="p-1.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
                              aria-label="Preview image"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        )}

                        <Tooltip content="Download attachment">
                          <a
                            href={att.url}
                            download={att.filename}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                            aria-label="Download attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </Tooltip>

                        <Tooltip content="Delete attachment">
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                            aria-label="Delete attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Discussion & Activity Section */}
          <Card variant="filled" padding="md" rounded="xl" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  Discussion & Activity ({issue.comments?.length || 0})
                </h3>
              </div>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Markdown & Screenshots supported
              </span>
            </div>

            {/* Comment Form with Screenshot Toolbar */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <div className="rounded-xl border border-[var(--md-sys-color-input-border)] bg-[var(--md-sys-color-input-bg)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)]/20 transition-all overflow-hidden">
                <textarea
                  rows={3}
                  required
                  placeholder="Share findings, logs, or paste screenshots directly (Ctrl+V / Cmd+V)..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onPaste={handlePasteInComment}
                  className="w-full p-3.5 bg-transparent text-[var(--md-sys-color-input-text)] text-xs resize-y min-h-[75px] outline-hidden placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 font-sans leading-relaxed"
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 bg-[var(--md-sys-color-surface-container-low)] border-t border-[var(--md-sys-color-outline-variant)]/30">
                  <div className="flex items-center gap-2">
                    <input
                      ref={commentFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCommentScreenshotSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => commentFileInputRef.current?.click()}
                      disabled={uploadingScreenshot}
                      className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] px-2.5 py-1 h-auto cursor-pointer"
                      leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
                    >
                      {uploadingScreenshot ? 'Uploading Screenshot...' : 'Insert Screenshot'}
                    </Button>

                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline select-none">
                      • Paste with <kbd className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">Ctrl+V</kbd>
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="filled"
                    size="sm"
                    disabled={!commentText.trim() || uploadingScreenshot}
                    isLoading={submittingComment}
                    rightIcon={<Send className="w-3 h-3" />}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              {(() => {
                const uniqueComments = Array.from(
                  new Map((issue.comments || []).map((c) => [c.id, c])).values(),
                );
                if (uniqueComments.length === 0) {
                  return (
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic text-center py-5">
                      No discussion comments yet. Be the first to comment or attach a screenshot!
                    </p>
                  );
                }
                return uniqueComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-[var(--md-sys-color-outline-variant)]/20">
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
                    <div className="pl-7 pt-0.5">
                      <MarkdownContent
                        content={c.text}
                        onImageClick={(url, title) => {
                          setPreviewImageUrl(url);
                          setPreviewImageTitle(title || `Screenshot from ${c.author.fullName}`);
                        }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>

        {/* Right Sticky Sidebar (4 of 12 cols = ~33%) */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Attributes & People Card */}
          <Card variant="filled" padding="md" rounded="xl" className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] pb-2 border-b border-[var(--md-sys-color-outline-variant)] select-none">
              Attributes & Assignment
            </h3>

            {/* Assignee */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Assignee
                </span>
                {!isAssignedToMe && (
                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign to me</span>
                  </button>
                )}
              </div>
              {issue.assignee ? (
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
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
                <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <span>Unassigned</span>
                </div>
              )}
            </div>

            {/* Reporter */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Reporter
              </span>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                <Avatar
                  name={issue.reporter?.fullName || 'Reporter'}
                  avatarUrl={issue.reporter?.avatarUrl}
                  role={issue.reporter?.systemRole}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                    {issue.reporter?.fullName || 'System'}
                  </p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                    {issue.reporter?.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Priority & Type */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              <div>
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] block mb-1">
                  Priority
                </span>
                <Badge
                  variant={
                    issue.priority === 'CRITICAL'
                      ? 'critical'
                      : issue.priority === 'HIGH'
                      ? 'high'
                      : issue.priority === 'MEDIUM'
                      ? 'medium'
                      : 'low'
                  }
                  size="md"
                  dot
                >
                  {issue.priority}
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    Sprint
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const val = prompt('Enter sprint name (leave empty for Backlog):', issue.sprint || '');
                      if (val !== null) {
                        handleSprintChange(val.trim() ? val.trim() : null);
                      }
                    }}
                    className="text-[10px] font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] block truncate">
                  {issue.sprint || 'Backlog'}
                </span>
              </div>
            </div>

            {/* Created Timestamp */}
            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created</span>
              </span>
              <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Card>

          {/* Time Tracking Card */}
          <Card variant="filled" padding="md" rounded="xl" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] select-none">
                  Time Tracking
                </h3>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                <span>Logged: <strong>{issue.loggedHours || 0}h</strong></span>
                <span>Estimated: <strong>{issue.estimatedHours || 0}h</strong></span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--md-sys-color-primary)] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] text-right">
                {progressPercent}% of estimate delivered
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Issue Modal */}
      {editModalOpen && (
        <IssueModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          defaultProjectId={issue.projectId}
          editingIssue={issue}
          onIssueSaved={(updated) => {
            setIssue(updated);
            setEditModalOpen(false);
          }}
        />
      )}

      {/* Log Work Modal */}
      {logWorkOpen && (
        <LogWorkModal
          isOpen={logWorkOpen}
          onClose={() => setLogWorkOpen(false)}
          issueId={issue.id}
          issueKey={issue.key}
          issueTitle={issue.title}
          onWorkLogged={async () => {
            await fetchIssue();
          }}
        />
      )}

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewImageUrl}
        onClose={() => {
          setPreviewImageUrl(null);
          setPreviewImageTitle(null);
        }}
        size="2xl"
        title={previewImageTitle || 'Image Preview'}
        footer={
          previewImageUrl ? (
            <a
              href={previewImageUrl}
              download={previewImageTitle || 'attachment.png'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold hover:brightness-105"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full Resolution</span>
            </a>
          ) : null
        }
      >
        {previewImageUrl && (
          <div className="flex flex-col items-center justify-center p-3 bg-black/5 dark:bg-black/20 rounded-xl overflow-hidden min-h-[220px]">
            <img
              src={previewImageUrl}
              alt={previewImageTitle || 'Preview'}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.error-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'error-fallback p-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-2';
                  fallback.innerHTML = `<p class="font-semibold text-rose-500">Image could not be rendered directly.</p><a href="${previewImageUrl}" target="_blank" class="inline-flex items-center gap-1 text-[var(--md-sys-color-primary)] underline font-bold">Open directly in new tab &rarr;</a>`;
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
