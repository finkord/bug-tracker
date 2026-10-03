import React, { useRef, useState } from 'react';
import type { IssueItem, UserProfile } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import { UserProfilePopover } from '../common/UserProfilePopover.js';
import { MarkdownContent } from '../common/MarkdownContent.js';
import {
  Card,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
} from '../ui/index.js';
import {
  MessageSquare,
  History,
  Clock,
  GitBranch,
  Send,
  Paperclip,
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Check,
  X,
} from 'lucide-react';
import {
  useIssueHistoryQuery,
  useUpdateIssueCommentMutation,
  useDeleteIssueCommentMutation,
  useDeleteWorklogMutation,
} from '../../api/queries/index.js';
import { VcsDevelopmentPanel } from '../kanban/VcsDevelopmentPanel.js';

export interface IssueActivityTabsProps {
  issue: IssueItem;
  currentUser: UserProfile | null;
  onAddComment: (text: string) => Promise<void>;
  onUploadCommentScreenshot: (file: File) => Promise<string>;
  onOpenLogWorkModal: () => void;
  activeTab?: 'comments' | 'history' | 'worklogs' | 'development';
  onTabChange?: (tab: 'comments' | 'history' | 'worklogs' | 'development') => void;
}

export const IssueActivityTabs: React.FC<IssueActivityTabsProps> = ({
  issue,
  currentUser,
  onAddComment,
  onUploadCommentScreenshot,
  onOpenLogWorkModal,
  activeTab: controlledActiveTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'comments' | 'history' | 'worklogs' | 'development'>('comments');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const handleTabChange = (val: string) => {
    const tab = val as 'comments' | 'history' | 'worklogs' | 'development';
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  const { data: issueHistory = [], isLoading: historyLoading } = useIssueHistoryQuery(
    activeTab === 'history' ? issue.id : undefined,
  );

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing comment state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const updateCommentMutation = useUpdateIssueCommentMutation();
  const deleteCommentMutation = useDeleteIssueCommentMutation();
  const deleteWorklogMutation = useDeleteWorklogMutation();

  const comments = issue.comments || [];
  const worklogs = issue.worklogs || [];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(commentText.trim());
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `screenshot_${timestamp}.png`;
        const file = new File([blob], filename, { type: blob.type || 'image/png' });

        setUploadingImage(true);
        const placeholder = `\n![Uploading ${filename}...]()\n`;
        setCommentText((prev) => prev + placeholder);

        try {
          const url = await onUploadCommentScreenshot(file);
          setCommentText((prev) =>
            prev.replace(placeholder, `\n![${filename}](${url})\n`),
          );
        } catch {
          setCommentText((prev) => prev.replace(placeholder, ''));
        } finally {
          setUploadingImage(false);
        }
        break;
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const placeholder = `\n![Uploading ${file.name}...]()\n`;
    setCommentText((prev) => prev + placeholder);

    try {
      const url = await onUploadCommentScreenshot(file);
      setCommentText((prev) =>
        prev.replace(placeholder, `\n![${file.name}](${url})\n`),
      );
    } catch {
      setCommentText((prev) => prev.replace(placeholder, ''));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartEditComment = (commentId: number, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingText(currentText);
  };

  const handleSaveCommentEdit = async (commentId: number) => {
    if (!editingText.trim()) return;
    await updateCommentMutation.mutateAsync({
      issueId: issue.id,
      commentId,
      text: editingText.trim(),
    });
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteCommentMutation.mutateAsync({
        issueId: issue.id,
        commentId,
      });
    }
  };

  const handleDeleteWorklog = async (worklogId: number) => {
    if (window.confirm('Are you sure you want to delete this worklog entry?')) {
      await deleteWorklogMutation.mutateAsync({
        issueId: issue.id,
        worklogId,
      });
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]/40">
          <TabsList variant="pills" className="bg-[var(--md-sys-color-surface-container)] p-1 gap-1">
            <TabsTrigger
              value="comments"
              variant="pills"
              size="sm"
              className="rounded-full text-xs font-bold gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments ({comments.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              variant="pills"
              size="sm"
              className="rounded-full text-xs font-bold gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </TabsTrigger>
            <TabsTrigger
              value="worklogs"
              variant="pills"
              size="sm"
              className="rounded-full text-xs font-bold gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Worklogs ({worklogs.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="development"
              variant="pills"
              size="sm"
              className="rounded-full text-xs font-bold gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Development</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Comments */}
        <TabsContent value="comments" className="space-y-4 pt-3 focus:outline-none">
          {comments.length === 0 ? (
            <EmptyState
              icon={<MessageSquare />}
              title="No comments yet"
              description="Be the first to share an update or start a conversation on this issue."
              compact
            />
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isAuthor = currentUser?.id === comment.authorId;
                const canModify = isAuthor || currentUser?.systemRole === 'ADMIN';
                const isEditing = editingCommentId === comment.id;

                return (
                  <Card
                    key={comment.id}
                    className="p-4 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <UserProfilePopover user={comment.author}>
                        <div className="flex items-center gap-2.5 cursor-pointer group">
                          <Avatar
                            name={comment.author.fullName}
                            avatarUrl={comment.author.avatarUrl || undefined}
                            size="sm"
                            className="w-7 h-7 text-xs"
                          />
                          <div>
                            <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] group-hover:underline">
                              {comment.author.fullName}
                            </span>
                            {comment.author.systemRole && (
                              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] ml-2">
                                {comment.author.systemRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </UserProfilePopover>

                      <div className="flex items-center gap-2">
                        <time className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          {new Date(comment.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                        {canModify && !isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditComment(comment.id, comment.text)}
                              className="p-1 rounded-md text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer"
                              title="Edit comment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deleteCommentMutation.isPending}
                              className="p-1 rounded-md text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors cursor-pointer"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pl-9">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-sans resize-y"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCommentId(null)}
                              disabled={updateCommentMutation.isPending}
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              variant="filled"
                              size="sm"
                              onClick={() => handleSaveCommentEdit(comment.id)}
                              isLoading={updateCommentMutation.isPending}
                              disabled={!editingText.trim()}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <MarkdownContent content={comment.text} className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add Comment Form */}
          <Card className="p-4 border-[var(--md-sys-color-outline-variant)]/80 bg-[var(--md-sys-color-surface-container-low)] rounded-2xl shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={3}
                placeholder="Write a comment... (Press Ctrl+Enter to submit, paste images directly)"
                className="w-full px-3 py-2 text-sm bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-sans resize-y"
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {uploadingImage ? 'Uploading Image...' : 'Attach Image'}
                </Button>

                <Button type="submit" size="sm" disabled={submitting || !commentText.trim()}>
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Send Comment (Ctrl+Enter)
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Audit Trail */}
        <TabsContent value="history" className="space-y-3 pt-3 focus:outline-none">
          {historyLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-[var(--md-sys-color-primary)]" />
              <span>Loading audit history...</span>
            </div>
          ) : issueHistory.length === 0 ? (
            <EmptyState
              icon={<History />}
              title="No audit events recorded"
              description="Field edits, transitions, and reassignments will appear here as they occur."
              compact
            />
          ) : (
            issueHistory.map((item) => (
              <Card
                key={item.id}
                className="p-3.5 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 text-xs rounded-2xl shadow-xs"
              >
                <div className="flex items-start gap-2.5">
                  <Avatar
                    name={item.user?.fullName || 'System'}
                    avatarUrl={item.user?.avatarUrl || undefined}
                    size="xs"
                    className="w-5 h-5 text-[10px] shrink-0 mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                        {item.user?.fullName || 'System'}
                      </span>
                      <time className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <div className="text-[var(--md-sys-color-on-surface-variant)]">
                      Updated <strong className="text-[var(--md-sys-color-on-surface)] capitalize">{item.field}</strong>
                      {item.oldValue && (
                        <span>
                          {' from '}
                          <code className="px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container)] font-mono text-[11px] text-[var(--md-sys-color-on-surface)]">
                            {item.oldValue}
                          </code>
                        </span>
                      )}
                      {item.newValue && (
                        <span>
                          {' to '}
                          <code className="px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-highest)] font-mono text-[11px] text-[var(--md-sys-color-primary)] font-semibold">
                            {item.newValue}
                          </code>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 3: Worklogs */}
        <TabsContent value="worklogs" className="space-y-4 pt-3 focus:outline-none">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60">
            <div className="text-xs">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Total Logged: </span>
              <strong className="text-[var(--md-sys-color-primary)] font-mono text-sm">
                {issue.loggedHours || 0}h
              </strong>
              {issue.estimatedHours ? (
                <span className="text-[var(--md-sys-color-on-surface-variant)]">
                  {' / '}{issue.estimatedHours}h estimated
                </span>
              ) : (
                <span className="text-[var(--md-sys-color-on-surface-variant)] italic ml-1">
                  (no estimate)
                </span>
              )}
            </div>
            <Button
              variant="tonal"
              size="sm"
              onClick={onOpenLogWorkModal}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Log Work
            </Button>
          </div>

          {worklogs.length === 0 ? (
            <EmptyState
              icon={<Clock />}
              title="No work logged yet"
              description="Track time spent on this issue to monitor progress and burn rate."
              action={{
                label: 'Log Work',
                onClick: onOpenLogWorkModal,
                icon: <Plus className="w-4 h-4" />,
              }}
              compact
            />
          ) : (
            <div className="space-y-2.5">
              {worklogs.map((w) => {
                const isAuthor = currentUser?.id === w.userId;
                const canDelete = isAuthor || currentUser?.systemRole === 'ADMIN';

                return (
                  <Card
                    key={w.id}
                    className="p-3.5 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={w.user?.fullName || 'User'}
                          avatarUrl={w.user?.avatarUrl || undefined}
                          size="xs"
                          className="w-6 h-6 text-[10px]"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                            {w.user?.fullName || 'User'}
                          </span>
                          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] ml-2 font-mono">
                            {w.dateLogged}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                          {w.timeSpentHours}h
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteWorklog(w.id)}
                            disabled={deleteWorklogMutation.isPending}
                            className="p-1 rounded-md text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors cursor-pointer"
                            title="Delete worklog entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {w.description && (
                      <p className="mt-2 pl-8 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                        {w.description}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Development */}
        <TabsContent value="development" className="pt-3 focus:outline-none">
          <VcsDevelopmentPanel
            issueId={issue.id}
            issueKey={issue.key}
            issueTitle={issue.title}
            compact={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
