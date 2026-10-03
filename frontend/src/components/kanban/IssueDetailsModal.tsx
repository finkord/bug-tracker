import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  type IssueItem,
  type IssueStatus,
  type IssueType,
  type IssuePriority,
} from '../../api/client';
import { useAuth } from '../../store';
import { useRecentIssuesStore } from '../../store/useRecentIssuesStore';
import {
  useIssueDetailQuery,
  useUpdateIssueStatusMutation,
  useUpdateIssueMutation,
  useAddIssueCommentMutation,
  useDeleteIssueMutation,
  useCreateIssueMutation,
  useAssigneesQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
  useIssueHistoryQuery,
} from '../../api/queries';
import { Avatar } from '../common/Avatar';
import { UserProfilePopover } from '../common/UserProfilePopover';
import { MarkdownContent } from '../common/MarkdownContent';
import { LogWorkModal } from './LogWorkModal';
import { VcsDevelopmentPanel } from './VcsDevelopmentPanel';
import { IssueLinksSection } from './IssueLinksSection';
import { IssueAttachmentsSection } from '../issue-detail/IssueAttachmentsSection';
import { issuesApi } from '../../api/modules/issues.api.js';
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
  Tabs,
  TabsList,
  TabsTrigger,
  StatusBadge,
  PriorityBadge,
  UserPicker,
  ConfirmDialog,
} from '../ui';
import {
  Calendar,
  Send,
  Loader2,
  Trash2,
  ExternalLink,
  MessageSquare,
  Clock,
  Layers,
  UserPlus,
  Pencil,
  Check,
  GitCommitHorizontal,
  CornerDownRight,
  Plus,
  History,
  Tag,
  Box,
  X,
  Copy,
  Link2,
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
  onEditClick: _onEditClick,
}) => {
  const { user } = useAuth();

  const [activeIssueId, setActiveIssueId] = useState<number | null>(issueId);

  useEffect(() => {
    setActiveIssueId(issueId);
  }, [issueId]);

  const {
    data: issue = null,
    isLoading: loading,
    refetch: fetchIssue,
  } = useIssueDetailQuery(isOpen && activeIssueId ? activeIssueId : undefined);

  const { data: assigneesData } = useAssigneesQuery({ limit: 200 });
  const assignees = assigneesData?.items ?? [];

  const statusMutation = useUpdateIssueStatusMutation();
  const updateIssueMutation = useUpdateIssueMutation();
  const addCommentMutation = useAddIssueCommentMutation();
  const deleteIssueMutation = useDeleteIssueMutation();
  const createIssueMutation = useCreateIssueMutation();

  const [commentText, setCommentText] = useState<string>('');
  const [subtaskTitle, setSubtaskTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [logWorkOpen, setLogWorkOpen] = useState<boolean>(false);
  const [activityTab, setActivityTab] = useState<'COMMENTS' | 'HISTORY'>('COMMENTS');
  const [newLabelInput, setNewLabelInput] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);

  const { data: projectComponents = [] } = useProjectComponentsQuery(issue?.projectId);
  const { data: projectVersions = [] } = useProjectVersionsQuery(issue?.projectId);
  const { data: issueHistory = [], isLoading: historyLoading } = useIssueHistoryQuery(
    isOpen && activeIssueId && activityTab === 'HISTORY' ? activeIssueId : undefined,
  );

  // Inline editing states
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleDraft, setTitleDraft] = useState<string>('');
  const [isEditingDesc, setIsEditingDesc] = useState<boolean>(false);
  const [descDraft, setDescDraft] = useState<string>('');
  const [isEditingEstimate, setIsEditingEstimate] = useState<boolean>(false);
  const [estimateDraft, setEstimateDraft] = useState<string>('');

  // Synchronize drafts when issue loads or changes and track in recent issues store
  useEffect(() => {
    if (issue) {
      setTitleDraft(issue.title);
      setDescDraft(issue.description || '');
      setEstimateDraft(String(issue.estimatedHours || 0));
      useRecentIssuesStore.getState().addRecentIssue(issue);
    }
  }, [issue]);

  // Copy feedback states
  const [hasCopiedKey, setHasCopiedKey] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const handleCopyKey = async () => {
    if (!issue?.key) return;
    try {
      await navigator.clipboard.writeText(issue.key);
      setHasCopiedKey(true);
      setTimeout(() => setHasCopiedKey(false), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    if (!issue?.key) return;
    try {
      const url = `${window.location.origin}/issues/${issue.key}`;
      await navigator.clipboard.writeText(url);
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 2000);
    } catch {}
  };

  // Subtask handlers
  const handleToggleSubtaskStatus = async (subtaskId: number, currentStatus: IssueStatus) => {
    const nextStatus: IssueStatus =
      currentStatus === 'RESOLVED' || currentStatus === 'CLOSED' ? 'OPEN' : 'RESOLVED';
    await statusMutation.mutateAsync({ issueId: subtaskId, status: nextStatus });
    await fetchIssue();
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim() || !issue) return;
    await createIssueMutation.mutateAsync({
      projectId: issue.projectId,
      title: subtaskTitle.trim(),
      parentId: issue.id,
      issueType: 'SUBTASK',
      priority: issue.priority,
      sprintId: issue.sprintId,
    });
    setSubtaskTitle('');
    await fetchIssue();
  };

  // Centralized inline update mutation helper
  const handleUpdateFields = async (data: {
    title?: string;
    description?: string;
    issueType?: IssueType;
    priority?: IssuePriority;
    assigneeId?: number | null;
    estimatedHours?: number;
    componentId?: number | null;
    fixVersionId?: number | null;
    labels?: string[];
  }) => {
    if (!issue) return;
    try {
      const updated = await updateIssueMutation.mutateAsync({
        id: issue.id,
        data: {
          ...data,
          assigneeId: data.assigneeId === null ? undefined : data.assigneeId,
          fixVersionId: data.fixVersionId === null ? undefined : data.fixVersionId,
        },
      });
      onIssueUpdated?.(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update issue');
    }
  };

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLabelInput.trim();
    if (!trimmed || !issue) return;
    const currentLabels = issue.labels || [];
    if (!currentLabels.includes(trimmed)) {
      await handleUpdateFields({ labels: [...currentLabels, trimmed] });
    }
    setNewLabelInput('');
  };

  const handleRemoveLabel = async (labelToRemove: string) => {
    if (!issue) return;
    const currentLabels = issue.labels || [];
    await handleUpdateFields({ labels: currentLabels.filter((l) => l !== labelToRemove) });
  };

  const handleSaveTitle = async () => {
    if (!issue) return;
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(issue.title);
      setIsEditingTitle(false);
      return;
    }
    if (trimmed !== issue.title) {
      await handleUpdateFields({ title: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = async () => {
    if (!issue) return;
    const trimmed = descDraft.trim();
    await handleUpdateFields({ description: trimmed || undefined });
    setIsEditingDesc(false);
  };

  const handleToggleChecklist = async (lineIndex: number, newChecked: boolean) => {
    if (!issue || !issue.description) return;
    const lines = issue.description.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const updatedLine = newChecked
      ? line.replace(/-\s*\[\s*\]/, '- [x]')
      : line.replace(/-\s*\[[xX]\]/, '- [ ]');
    lines[lineIndex] = updatedLine;
    const newDescription = lines.join('\n');
    setDescDraft(newDescription);
    await handleUpdateFields({ description: newDescription });
  };

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
    await handleUpdateFields({ assigneeId: user.id });
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
    try {
      await deleteIssueMutation.mutateAsync(issue.id);
      onIssueDeleted?.(issue.id);
      setDeleteConfirmOpen(false);
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
              <div className="inline-flex items-center gap-1 shrink-0">
                <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2.5 py-1 rounded-lg">
                  {issue ? issue.key : '...'}
                </span>
                {issue && (
                  <>
                    <Tooltip content={hasCopiedKey ? 'Copied key!' : 'Copy issue key'}>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="p-1 rounded-md hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                        title="Copy key"
                      >
                        {hasCopiedKey ? (
                          <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </Tooltip>
                    <Tooltip content={hasCopiedLink ? 'Copied URL!' : 'Copy issue URL'}>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="p-1 rounded-md hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                        title="Copy link"
                      >
                        {hasCopiedLink ? (
                          <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </Tooltip>
                  </>
                )}
              </div>

              {issue && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-36 shrink-0">
                    <StatusBadge
                      status={issue.status}
                      interactive
                      onStatusChange={handleStatusChange}
                      size="sm"
                      className="w-full justify-between"
                    />
                  </div>

                  {issue.sprint?.name && (
                    <Badge variant="primary" size="sm" className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 font-bold">
                      <Layers className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />
                      <span>{issue.sprint.name}</span>
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

                <Tooltip content="Delete issue">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
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
              {/* Parent Issue Breadcrumb */}
              {issue.parent && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] mb-2.5 font-medium bg-[var(--md-sys-color-surface-container)] px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] w-fit">
                  <CornerDownRight className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                  <span>Subtask of</span>
                  <button
                    type="button"
                    onClick={() => setActiveIssueId(issue.parent!.id)}
                    className="font-mono font-bold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
                  >
                    {issue.parent.key}
                  </button>
                  <span className="truncate max-w-xs text-[var(--md-sys-color-on-surface)]">{issue.parent.title}</span>
                </div>
              )}

              {/* Title & Description with Seamless Inline Editing */}
              <div>
                {isEditingTitle ? (
                  <div className="mb-3">
                    <input
                      type="text"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') {
                          setTitleDraft(issue.title);
                          setIsEditingTitle(false);
                        }
                      }}
                      className="w-full text-xl font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border-2 border-[var(--md-sys-color-primary)] rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsEditingTitle(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingTitle(true);
                    }}
                    className="group flex items-center justify-between gap-2 p-1.5 -m-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer transition-colors mb-3"
                    title="Click to edit title"
                  >
                    <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] leading-snug">
                      {issue.title}
                    </h2>
                    <Pencil className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                )}

                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      onPaste={async (e) => {
                        const items = e.clipboardData?.items;
                        if (!items || !issue) return;
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.indexOf('image') !== -1) {
                            e.preventDefault();
                            const file = items[i].getAsFile();
                            if (!file) continue;
                            try {
                              const uploaded = await issuesApi.uploadAttachment(issue.id, file);
                              if (uploaded?.url) {
                                const insertText = `\n![${file.name || 'screenshot'}](${uploaded.url})\n`;
                                setDescDraft((prev) => prev + insertText);
                              }
                            } catch (err) {
                              console.error('Failed to upload pasted image', err);
                            }
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveDesc();
                        } else if (e.key === 'Escape') {
                          setDescDraft(issue.description || '');
                          setIsEditingDesc(false);
                        }
                      }}
                      placeholder="Describe the defect, reproduction steps, expected vs actual behavior, or task checklist (- [ ] task)..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border-2 border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden resize-none font-mono"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                        Tip: Paste screenshots directly from clipboard (Cmd+V)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDescDraft(issue.description || '');
                            setIsEditingDesc(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="filled"
                          size="sm"
                          onClick={handleSaveDesc}
                          isLoading={updateIssueMutation.isPending}
                        >
                          Save Description (Ctrl+Enter)
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsEditingDesc(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingDesc(true);
                    }}
                    className="group relative p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed cursor-pointer transition-all"
                    title="Click to edit description"
                  >
                    {issue.description ? (
                      <MarkdownContent
                        content={issue.description}
                        onToggleChecklist={handleToggleChecklist}
                      />
                    ) : (
                      <span className="italic text-[var(--md-sys-color-on-surface-variant)]">
                        No detailed description provided. Click to add details...
                      </span>
                    )}
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Attributes Grid with Interactive Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs">
                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1 font-medium">Issue Type</span>
                  <Select
                    value={issue.issueType}
                    onValueChange={(val) => handleUpdateFields({ issueType: val as IssueType })}
                  >
                    <SelectTrigger size="sm" className="h-8 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUG">Bug / Defect</SelectItem>
                      <SelectItem value="TASK">Standard Task</SelectItem>
                      <SelectItem value="FEATURE">New Feature</SelectItem>
                      <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1 font-medium">Priority</span>
                  <PriorityBadge
                    priority={issue.priority}
                    interactive
                    onPriorityChange={(val) => handleUpdateFields({ priority: val as IssuePriority })}
                    size="sm"
                    className="w-full justify-between"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium">Assignee</span>
                  </div>
                  <UserPicker
                    value={issue.assignee?.id ?? null}
                    fallbackUser={issue.assignee}
                    onChange={(userId) => handleUpdateFields({ assigneeId: userId })}
                    users={assignees}
                    currentUser={
                      user
                        ? {
                            id: user.id,
                            fullName: user.fullName,
                            email: user.email,
                            avatarUrl: user.avatarUrl,
                            systemRole: user.systemRole,
                          }
                        : null
                    }
                    currentUserId={user?.id}
                    placeholder="Unassigned"
                    showAssignToMe
                    showProfileOnAvatar
                    size="md"
                    className="w-full"
                  />
                </div>

                <div>
                  <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1 font-medium">Sprint</span>
                  <div className="h-8 flex items-center px-2.5 rounded-lg bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/40">
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate block text-xs">
                      {issue.sprint?.name || 'Backlog'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Taxonomies: Component, Fix Version & Labels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs">
                {/* Component Selector */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1 text-[var(--md-sys-color-on-surface-variant)] font-medium">
                    <Box className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span>Component</span>
                  </div>
                  <Select
                    value={issue.componentId ? String(issue.componentId) : 'none'}
                    onValueChange={(val) =>
                      handleUpdateFields({ componentId: val === 'none' ? null : Number(val) })
                    }
                  >
                    <SelectTrigger size="sm" className="h-8 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                      <SelectValue placeholder="No Component" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Component</SelectItem>
                      {projectComponents.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fix Version Selector */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1 text-[var(--md-sys-color-on-surface-variant)] font-medium">
                    <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span>Fix Version</span>
                  </div>
                  <Select
                    value={issue.fixVersionId ? String(issue.fixVersionId) : 'none'}
                    onValueChange={(val) =>
                      handleUpdateFields({ fixVersionId: val === 'none' ? null : Number(val) })
                    }
                  >
                    <SelectTrigger size="sm" className="h-8 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                      <SelectValue placeholder="No Version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Version</SelectItem>
                      {projectVersions.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.name} ({v.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Labels Tag Manager */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1 text-[var(--md-sys-color-on-surface-variant)] font-medium">
                    <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span>Labels ({issue.labels?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-1.5 rounded-lg bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/40">
                    {issue.labels && issue.labels.length > 0 ? (
                      issue.labels.map((lbl) => (
                        <span
                          key={lbl}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40"
                        >
                          <span>{lbl}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLabel(lbl)}
                            className="p-0.5 rounded-full hover:bg-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                            title={`Remove label ${lbl}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] italic text-[var(--md-sys-color-on-surface-variant)] pl-1">
                        No labels
                      </span>
                    )}

                    {/* Inline Add Label Form */}
                    <form onSubmit={handleAddLabel} className="inline-flex items-center gap-1 ml-auto">
                      <input
                        type="text"
                        placeholder="+ Add label"
                        value={newLabelInput}
                        onChange={(e) => setNewLabelInput(e.target.value)}
                        className="w-20 text-[11px] px-1.5 py-0.5 rounded bg-transparent text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:bg-[var(--md-sys-color-surface)] border-0"
                      />
                    </form>
                  </div>
                </div>
              </div>

              {/* Subtasks Section */}
              {issue.issueType !== 'SUBTASK' && (
                <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitCommitHorizontal className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
                        Subtasks
                      </h4>
                      {issue.subtasks && issue.subtasks.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                          {issue.subtasks.filter((s) => s.status === 'RESOLVED' || s.status === 'CLOSED').length} / {issue.subtasks.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {issue.subtasks && issue.subtasks.length > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--md-sys-color-primary)] transition-all duration-300"
                          style={{
                            width: `${Math.round(
                              (issue.subtasks.filter((s) => s.status === 'RESOLVED' || s.status === 'CLOSED').length /
                                issue.subtasks.length) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Subtask list */}
                  {issue.subtasks && issue.subtasks.length > 0 ? (
                    <div className="space-y-1.5 divide-y divide-[var(--md-sys-color-outline-variant)]/20">
                      {issue.subtasks.map((subtask) => {
                        const isDone = subtask.status === 'RESOLVED' || subtask.status === 'CLOSED';
                        return (
                          <div
                            key={subtask.id}
                            className="flex items-center justify-between gap-3 pt-1.5 first:pt-0 group hover:bg-[var(--md-sys-color-surface-container)]/50 px-2 py-1 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleSubtaskStatus(subtask.id, subtask.status)}
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                                  isDone
                                    ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                                    : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]'
                                }`}
                                title={isDone ? 'Mark as Open' : 'Mark as Done'}
                              >
                                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveIssueId(subtask.id)}
                                className="font-mono text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer shrink-0"
                              >
                                {subtask.key}
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveIssueId(subtask.id)}
                                className={`text-xs text-left truncate hover:underline cursor-pointer ${
                                  isDone
                                    ? 'line-through text-[var(--md-sys-color-on-surface-variant)]'
                                    : 'text-[var(--md-sys-color-on-surface)]'
                                }`}
                              >
                                {subtask.title}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant={isDone ? 'success' : subtask.status === 'IN_PROGRESS' ? 'primary' : 'secondary'}
                                size="sm"
                              >
                                {subtask.status.replace('_', ' ')}
                              </Badge>
                              {subtask.assignee && (
                                <Avatar
                                  name={subtask.assignee.fullName}
                                  avatarUrl={subtask.assignee.avatarUrl}
                                  size="xs"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                      No subtasks yet. Break this task down into smaller actionable steps.
                    </p>
                  )}

                  {/* Inline Quick Add Subtask */}
                  <form onSubmit={handleCreateSubtask} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a subtask..."
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
                    />
                    <Button
                      type="submit"
                      variant="tonal"
                      size="sm"
                      disabled={!subtaskTitle.trim() || createIssueMutation.isPending}
                      isLoading={createIssueMutation.isPending}
                      className="shrink-0 text-xs h-7"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add
                    </Button>
                  </form>
                </div>
              )}

              {/* Issue Links & Dependencies Section */}
              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                <IssueLinksSection
                  issueId={issue.id}
                  currentIssueKey={issue.key}
                  projectId={issue.projectId}
                  links={issue.links || []}
                  onLinksChanged={() => fetchIssue()}
                />
              </div>

              {/* Attachments Section */}
              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                <IssueAttachmentsSection
                  attachments={issue.attachments || []}
                  currentUser={user}
                  onUpload={async (file: File) => {
                    await issuesApi.uploadAttachment(issue.id, file);
                    await fetchIssue();
                  }}
                  onDelete={async (attachmentId: number) => {
                    await issuesApi.deleteAttachment(issue.id, attachmentId);
                    await fetchIssue();
                  }}
                />
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
                    <div className="flex items-center gap-1.5">
                      <span>Estimated:</span>
                      {isEditingEstimate ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const parsed = parseFloat(estimateDraft) || 0;
                            handleUpdateFields({ estimatedHours: parsed });
                            setIsEditingEstimate(false);
                          }}
                          className="inline-flex items-center gap-1"
                        >
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={estimateDraft}
                            onChange={(e) => setEstimateDraft(e.target.value)}
                            autoFocus
                            className="w-16 h-6 px-1.5 text-xs font-bold rounded bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEstimateDraft(String(issue.estimatedHours || 0));
                                setIsEditingEstimate(false);
                              }
                            }}
                            onBlur={() => {
                              const parsed = parseFloat(estimateDraft) || 0;
                              if (parsed !== (issue.estimatedHours || 0)) {
                                handleUpdateFields({ estimatedHours: parsed });
                              }
                              setIsEditingEstimate(false);
                            }}
                          />
                          <span className="text-xs font-bold">h</span>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingEstimate(true)}
                          className="px-1.5 py-0.5 rounded hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] font-bold cursor-pointer transition-colors"
                          title="Click to edit estimate"
                        >
                          {issue.estimatedHours || 0}h
                        </button>
                      )}
                    </div>
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

              {/* Development & Git Panel */}
              <VcsDevelopmentPanel
                issueId={issue.id}
                issueKey={issue.key}
                issueTitle={issue.title}
              />

              {/* People & Timestamps */}
              <div className="flex flex-wrap items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-2">
                  {issue.reporter ? (
                    <UserProfilePopover user={issue.reporter}>
                      <div className="flex items-center gap-2 cursor-pointer group">
                        <Avatar
                          name={issue.reporter.fullName}
                          avatarUrl={issue.reporter.avatarUrl}
                          role={issue.reporter.systemRole}
                          size="xs"
                        />
                        <span>
                          Reported by: <strong className="text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] group-hover:underline">{issue.reporter.fullName}</strong>
                        </span>
                      </div>
                    </UserProfilePopover>
                  ) : (
                    <span>Reported by: <strong>Unknown</strong></span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created: {new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Discussion & Activity Section */}
              <div className="space-y-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center justify-between">
                  <Tabs
                    value={activityTab}
                    onValueChange={(val) => setActivityTab(val as 'COMMENTS' | 'HISTORY')}
                  >
                    <TabsList variant="pills" className="bg-[var(--md-sys-color-surface-container)] p-1 gap-1">
                      <TabsTrigger
                        value="COMMENTS"
                        variant="pills"
                        size="sm"
                        className="rounded-full text-xs font-bold gap-1.5 data-[state=active]:bg-[var(--md-sys-color-primary-container)] data-[state=active]:text-[var(--md-sys-color-on-primary-container)]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Comments ({issue.comments?.length || 0})</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="HISTORY"
                        variant="pills"
                        size="sm"
                        className="rounded-full text-xs font-bold gap-1.5 data-[state=active]:bg-[var(--md-sys-color-primary-container)] data-[state=active]:text-[var(--md-sys-color-on-primary-container)]"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Audit Trail</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {activityTab === 'COMMENTS' ? (
                  <>
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
                              <UserProfilePopover user={comment.author}>
                                <div className="flex items-center gap-2 cursor-pointer group">
                                  <Avatar
                                    name={comment.author.fullName}
                                    avatarUrl={comment.author.avatarUrl}
                                    role={comment.author.systemRole}
                                    size="xs"
                                  />
                                  <span className="font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] group-hover:underline">
                                    {comment.author.fullName}
                                  </span>
                                </div>
                              </UserProfilePopover>
                              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="pl-7">
                              <MarkdownContent
                                content={comment.text}
                                className="text-xs leading-relaxed text-[var(--md-sys-color-on-surface)]"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Input with Markdown and Cmd+Enter support */}
                    <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                      <textarea
                        rows={3}
                        required
                        placeholder="Write a comment or post an update... (Press Ctrl+Enter to submit, paste images directly)"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(e);
                          }
                        }}
                        onPaste={async (e) => {
                          const items = e.clipboardData?.items;
                          if (!items || !issue) return;
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf('image') !== -1) {
                              e.preventDefault();
                              const file = items[i].getAsFile();
                              if (!file) continue;
                              try {
                                const uploaded = await issuesApi.uploadAttachment(issue.id, file);
                                if (uploaded?.url) {
                                  const insertText = `\n![${file.name || 'screenshot'}](${uploaded.url})\n`;
                                  setCommentText((prev) => prev + insertText);
                                }
                              } catch (err) {
                                console.error('Failed to upload pasted image in modal', err);
                              }
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-y"
                      />
                      <div className="flex items-center justify-end">
                        <Button
                          type="submit"
                          variant="filled"
                          size="sm"
                          disabled={!commentText.trim()}
                          isLoading={addCommentMutation.isPending}
                          rightIcon={<Send className="w-3 h-3" />}
                        >
                          Post Comment (Ctrl+Enter)
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  /* Audit Trail Timeline */
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {historyLoading ? (
                      <div className="flex items-center justify-center p-8 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>Loading audit history...</span>
                      </div>
                    ) : issueHistory.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        No changes recorded in the audit trail yet.
                      </div>
                    ) : (
                      issueHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs"
                        >
                          <Avatar
                            name={item.user?.fullName || 'System'}
                            avatarUrl={item.user?.avatarUrl}
                            size="xs"
                            className="mt-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                                {item.user?.fullName || 'System automated'}
                              </span>
                              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] shrink-0 font-mono">
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                              {item.field === 'created' ? (
                                <span className="font-semibold text-[var(--md-sys-color-primary)]">
                                  Created this issue
                                </span>
                              ) : (
                                <>
                                  Updated <strong className="font-semibold text-[var(--md-sys-color-on-surface)]">{item.field}</strong>
                                  {item.oldValue && (
                                    <> from <span className="line-through text-[var(--md-sys-color-on-surface-variant)]/80">{item.oldValue}</span></>
                                  )}
                                  {item.newValue && (
                                    <> to <span className="font-semibold text-[var(--md-sys-color-primary)]">{item.newValue}</span></>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
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

      {issue && (
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Delete Issue"
          description={`Are you sure you want to permanently delete ${issue.key}? This action cannot be undone.`}
          isLoading={deleteIssueMutation.isPending}
        />
      )}
    </>
  );
};
