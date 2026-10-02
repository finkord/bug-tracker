import React, { useRef, useState } from 'react';
import type { IssueComment } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import { UserProfilePopover } from '../common/UserProfilePopover.js';
import { MarkdownContent } from '../common/MarkdownContent.js';
import { Card, Button, Tabs, TabsList, TabsTrigger } from '../ui/index.js';
import { MessageSquare, Send, Paperclip, Loader2, History } from 'lucide-react';
import { useIssueHistoryQuery } from '../../api/queries/index.js';

interface IssueCommentsSectionProps {
  issueId?: number;
  comments: IssueComment[];
  onAddComment: (text: string) => Promise<void>;
  onUploadCommentScreenshot: (file: File) => Promise<string>;
}

export const IssueCommentsSection: React.FC<IssueCommentsSectionProps> = ({
  issueId,
  comments,
  onAddComment,
  onUploadCommentScreenshot,
}) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const { data: issueHistory = [], isLoading: historyLoading } = useIssueHistoryQuery(
    issueId && activeTab === 'history' ? issueId : undefined,
  );
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'comments' | 'history')}
        >
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
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'comments' ? (
        <>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-6 text-sm text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
                No comments yet. Start the conversation below.
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="p-4 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60">
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
                    <time className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {new Date(comment.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <div className="pl-9">
                    <MarkdownContent content={comment.text} className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]" />
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <Card className="p-4 border-[var(--md-sys-color-outline-variant)]/80 bg-[var(--md-sys-color-surface-container-low)]">
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
        </>
      ) : (
        /* Audit Trail Timeline */
        <div className="space-y-3">
          {historyLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>Loading audit history...</span>
            </div>
          ) : issueHistory.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-sm text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)]">
              No changes recorded in the audit trail yet.
            </div>
          ) : (
            issueHistory.map((item) => (
              <Card key={item.id} className="p-3.5 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 text-xs">
                <div className="flex items-start gap-2.5">
                  <Avatar
                    name={item.user?.fullName || 'System'}
                    avatarUrl={item.user?.avatarUrl || undefined}
                    size="sm"
                    className="w-6 h-6 text-[10px] mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                        {item.user?.fullName || 'System automated'}
                      </span>
                      <time className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono shrink-0">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
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
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
