import React, { useState } from 'react';
import type { IssueItem } from '../../api/types/index.js';
import { MarkdownContent } from '../common/MarkdownContent.js';
import { Card, Button } from '../ui/index.js';
import { Edit3, Check, X, FileText } from 'lucide-react';

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

  if (isEditing) {
    return (
      <Card className="p-5 border-primary/40 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-base font-semibold bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Issue summary..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Description (Markdown Supported)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            placeholder="Detailed issue description, steps to reproduce, or acceptance criteria..."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
            <Check className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
          {issue.title}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
          Edit
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Description
        </h3>
        <Card className="p-5 bg-card/60 border-border/70 backdrop-blur-sm">
          {issue.description ? (
            <MarkdownContent content={issue.description} className="text-sm leading-relaxed" />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No description provided. Click edit to add details.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
