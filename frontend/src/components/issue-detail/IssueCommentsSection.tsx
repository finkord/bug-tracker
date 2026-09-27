import React, { useRef, useState } from 'react';
import type { IssueComment } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import { MarkdownContent } from '../common/MarkdownContent.js';
import { Card, Button } from '../ui/index.js';
import { MessageSquare, Send, Paperclip, Loader2 } from 'lucide-react';

interface IssueCommentsSectionProps {
  comments: IssueComment[];
  onAddComment: (text: string) => Promise<void>;
  onUploadCommentScreenshot: (file: File) => Promise<string>;
}

export const IssueCommentsSection: React.FC<IssueCommentsSectionProps> = ({
  comments,
  onAddComment,
  onUploadCommentScreenshot,
}) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Activity & Comments ({comments.length})
        </h3>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg bg-card/30">
            No comments yet. Start the conversation below.
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4 bg-card/70 border-border/70">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={comment.author.fullName}
                    avatarUrl={comment.author.avatarUrl || undefined}
                    size="sm"
                    className="w-7 h-7 text-xs"
                  />
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {comment.author.fullName}
                    </span>
                    {comment.author.systemRole && (
                      <span className="text-[11px] text-muted-foreground ml-2">
                        {comment.author.systemRole}
                      </span>
                    )}
                  </div>
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <div className="pl-9">
                <MarkdownContent content={comment.text} className="text-sm leading-relaxed" />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <Card className="p-4 border-border/80 bg-card/90">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onPaste={handlePaste}
            rows={3}
            placeholder="Write a comment... (Paste images directly or use markdown)"
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-sans resize-y"
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
              className="text-xs text-muted-foreground hover:text-foreground"
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
              Send Comment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
