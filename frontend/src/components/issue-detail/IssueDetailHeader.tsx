import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { IssueItem, IssueStatus } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import { UserProfilePopover } from '../common/UserProfilePopover.js';
import { BackButton } from '../common/BackButton.js';
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/index.js';
import {
  Edit3,
  Trash2,
  Layers,
  Radio,
  Copy,
  Check,
} from 'lucide-react';

interface IssueDetailHeaderProps {
  issue: IssueItem;
  activeViewers: Array<{ id: number; fullName: string; avatarUrl?: string }>;
  deleting: boolean;
  onStatusChange: (status: IssueStatus) => Promise<void>;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onBack?: () => void;
}

export const IssueDetailHeader: React.FC<IssueDetailHeaderProps> = ({
  issue,
  activeViewers,
  deleting,
  onStatusChange,
  onEditClick,
  onDeleteClick,
  onBack,
}) => {
  const location = useLocation();
  const [hasCopiedKey, setHasCopiedKey] = useState(false);

  const backLabel = (location.state as { label?: string } | null)?.label || (issue.projectKey ? `Back to ${issue.projectKey}` : 'Back');

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(issue.key);
      setHasCopiedKey(true);
      setTimeout(() => setHasCopiedKey(false), 2000);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <BackButton
          fallbackPath={issue.projectKey ? `/projects/${issue.projectKey}/board` : '/projects'}
          label={backLabel}
          onClick={onBack}
        />

        <div className="h-4 w-px bg-[var(--md-sys-color-outline-variant)]/60" />

        <Link
          to={`/projects/${issue.projectKey || issue.projectId}/board`}
          className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors flex items-center gap-1.5"
        >
          <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          {issue.projectName}
        </Link>

        {issue.parent && (
          <>
            <span className="text-[var(--md-sys-color-on-surface-variant)]">/</span>
            <Link
              to={`/issues/${issue.parent.key}`}
              className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors font-mono"
            >
              {issue.parent.key}
            </Link>
          </>
        )}

        <span className="text-[var(--md-sys-color-on-surface-variant)]">/</span>

        <div className="inline-flex items-center gap-1">
          <Badge variant="neutral" className="font-mono text-xs px-2.5 py-0.5 font-bold tracking-wide">
            {issue.key}
          </Badge>
          <button
            type="button"
            onClick={handleCopyKey}
            className="p-1 rounded-md hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            title="Copy issue key to clipboard"
          >
            {hasCopiedKey ? (
              <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="w-36">
          <Select value={issue.status} onValueChange={(val) => onStatusChange(val as IssueStatus)}>
            <SelectTrigger className="h-8 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">In Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {activeViewers.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-primary-container)]/20 px-2.5 py-1 rounded-full border border-[var(--md-sys-color-primary)]/30 mr-1">
            <Radio className="w-3 h-3 text-[var(--md-sys-color-primary)] animate-pulse" />
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mr-1">Viewing:</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {activeViewers.map((viewer) => (
                <UserProfilePopover key={viewer.id} user={viewer}>
                  <div className="inline-block ring-2 ring-[var(--md-sys-color-surface)] rounded-full cursor-pointer hover:ring-[var(--md-sys-color-primary)] transition-all">
                    <Avatar
                      name={viewer.fullName}
                      avatarUrl={viewer.avatarUrl || undefined}
                      size="sm"
                      className="w-5 h-5 text-[10px]"
                    />
                  </div>
                </UserProfilePopover>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="gap-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface)]"
        >
          <Edit3 className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
          Edit
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteClick}
          disabled={deleting}
          className="gap-1.5 text-xs font-medium text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/20 hover:text-[var(--md-sys-color-error)]"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
};
