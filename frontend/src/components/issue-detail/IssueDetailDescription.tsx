import React, { useState } from 'react';
import type { IssueItem } from '../../api/types/index.js';
import { issuesApi } from '../../api/modules/issues.api.js';
import { MarkdownContent } from '../common/MarkdownContent.js';
import { Card, Button } from '../ui/index.js';
import { Edit3, Check, X, FileText, Image } from 'lucide-react';

interface IssueDetailDescriptionProps {
  issue: IssueItem;
  onUpdateIssue: (payload: { title?: string; description?: string }) => Promise<void>;
}

export const IssueDetailDescription: React.FC<IssueDetailDescriptionProps> = ({
  issue,
  onUpdateIssue,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description || '');
  const [saving, setSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onUpdateIssue({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(issue.title);
    setDescription(issue.description || '');
    setIsEditing(false);
  };

  const handleToggleChecklist = async (lineIndex: number, newChecked: boolean) => {
    if (!issue.description) return;
    const lines = issue.description.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const updatedLine = newChecked
      ? line.replace(/-\s*\[\s*\]/, '- [x]')
      : line.replace(/-\s*\[[xX]\]/, '- [ ]');
    lines[lineIndex] = updatedLine;
    const newDescription = lines.join('\n');
    setDescription(newDescription);
    await onUpdateIssue({ description: newDescription });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;
        setIsUploadingImage(true);
        try {
          const uploaded = await issuesApi.uploadAttachment(issue.id, file);
          if (uploaded?.url) {
            const insertText = `\n![${file.name || 'screenshot'}](${uploaded.url})\n`;
            setDescription((prev) => prev + insertText);
          }
        } catch (err) {
          console.error('Failed to upload pasted image', err);
        } finally {
          setIsUploadingImage(false);
        }
      }
    }
  };

  if (isEditing) {
    return (
      <Card className="p-5 border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container-low)] shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-base font-semibold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            placeholder="Issue summary..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Description (Markdown Supported)
            </label>
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
              <Image className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
              Paste images directly from clipboard (Cmd+V)
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            rows={8}
            className="w-full px-3 py-2 text-sm bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-mono resize-y"
            placeholder="Detailed issue description, steps to reproduce, or acceptance criteria with checklists (- [ ] task)... Press Ctrl+Enter to save"
          />
          {isUploadingImage && (
            <p className="text-xs text-[var(--md-sys-color-primary)] animate-pulse mt-1">
              Uploading pasted screenshot...
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
            <Check className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save Changes (Ctrl+Enter)'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] leading-snug">
          {issue.title}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
          Edit
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          Description
        </h3>
        <Card className="p-5 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60">
          {issue.description ? (
            <MarkdownContent
              content={issue.description}
              onToggleChecklist={handleToggleChecklist}
              className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]"
            />
          ) : (
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] italic">
              No description provided. Click edit to add details.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
