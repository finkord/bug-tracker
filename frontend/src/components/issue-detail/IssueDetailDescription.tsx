import React, { useState, useEffect } from 'react';
import type { IssueItem } from '../../api/types/index.js';
import { issuesApi } from '../../api/modules/issues.api.js';
import { MarkdownContent } from '../common/MarkdownContent.js';
import { Card, Button } from '../ui/index.js';
import { Edit3, Check, X, FileText, Image, Pencil } from 'lucide-react';

interface IssueDetailDescriptionProps {
  issue: IssueItem;
  onUpdateIssue: (payload: { title?: string; description?: string }) => Promise<void>;
}

export const IssueDetailDescription: React.FC<IssueDetailDescriptionProps> = ({
  issue,
  onUpdateIssue,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [titleDraft, setTitleDraft] = useState(issue.title);
  const [descDraft, setDescDraft] = useState(issue.description || '');
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    setTitleDraft(issue.title);
  }, [issue.title]);

  useEffect(() => {
    setDescDraft(issue.description || '');
  }, [issue.description]);

  const handleSaveTitle = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === issue.title) {
      setTitleDraft(issue.title);
      setIsEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    try {
      await onUpdateIssue({ title: trimmed });
      setIsEditingTitle(false);
    } finally {
      setSavingTitle(false);
    }
  };

  const handleSaveDesc = async () => {
    const trimmed = descDraft.trim();
    setSavingDesc(true);
    try {
      await onUpdateIssue({ description: trimmed || undefined });
      setIsEditingDesc(false);
    } finally {
      setSavingDesc(false);
    }
  };

  const handleCancelTitle = () => {
    setTitleDraft(issue.title);
    setIsEditingTitle(false);
  };

  const handleCancelDesc = () => {
    setDescDraft(issue.description || '');
    setIsEditingDesc(false);
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
    setDescDraft(newDescription);
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
            setDescDraft((prev) => prev + insertText);
          }
        } catch (err) {
          console.error('Failed to upload pasted image', err);
        } finally {
          setIsUploadingImage(false);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Section with Inline Editing */}
      <div className="relative">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelTitle();
              }}
              disabled={savingTitle}
              className="w-full text-2xl font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border-2 border-[var(--md-sys-color-primary)] rounded-xl px-3 py-1.5 focus:outline-hidden"
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
            className="group flex items-start justify-between gap-3 p-1.5 -m-1.5 rounded-xl hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer transition-colors"
            title="Click to edit title"
          >
            <h1 className="text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] leading-snug">
              {issue.title}
            </h1>
            <span className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Pencil className="w-4 h-4" />
            </span>
          </div>
        )}
      </div>

      {/* Description Section with Inline Editing */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Description
          </h3>
          {!isEditingDesc && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingDesc(true)}
              className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] text-xs h-7 px-2"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
        </div>

        {isEditingDesc ? (
          <Card className="p-4 border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container-low)] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                <Image className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                Paste images from clipboard (Ctrl+V)
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Ctrl+Enter to save, Esc to cancel
              </span>
            </div>

            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveDesc();
                } else if (e.key === 'Escape') {
                  handleCancelDesc();
                }
              }}
              rows={6}
              disabled={savingDesc}
              placeholder="Describe the defect, reproduction steps, expected vs actual behavior, or task checklist (- [ ] task)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-y font-mono"
              autoFocus
            />

            {isUploadingImage && (
              <p className="text-xs text-[var(--md-sys-color-primary)] animate-pulse">
                Uploading pasted screenshot...
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={handleCancelDesc} disabled={savingDesc}>
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveDesc} disabled={savingDesc}>
                <Check className="w-3.5 h-3.5 mr-1" />
                {savingDesc ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </Card>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsEditingDesc(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingDesc(true);
            }}
            className="group cursor-pointer rounded-xl transition-colors"
            title="Click to edit description"
          >
            <Card className="p-4 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 hover:border-[var(--md-sys-color-outline-variant)] transition-colors">
              {issue.description ? (
                <MarkdownContent
                  content={issue.description}
                  onToggleChecklist={handleToggleChecklist}
                  className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]"
                />
              ) : (
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] italic">
                  No description provided. Click to add details...
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
