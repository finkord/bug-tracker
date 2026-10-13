import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { IssueItem, IssueStatus, UserProfile } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import { UserProfilePopover } from '../common/UserProfilePopover.js';
import { StatusBadge } from '../ui/StatusBadge.js';
import { Button } from '../ui/Button.js';
import { Dropdown, type DropdownMenuItemConfig } from '../ui/Dropdown.js';
import {
  Radio,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  X,
  MoreHorizontal,
  Share2,
} from 'lucide-react';

import { IssueTypeIcon } from '../ui/IssueTypeIcon.js';

export interface IssueDetailHeaderProps {
  issue: IssueItem;
  currentUser?: UserProfile | null;
  activeViewers?: Array<{ id: number; fullName: string; avatarUrl?: string }>;
  deleting?: boolean;
  onStatusChange: (status: IssueStatus) => Promise<void>;
  onDeleteClick: () => void;
  onBack?: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const IssueDetailHeader: React.FC<IssueDetailHeaderProps> = ({
  issue,
  currentUser,
  activeViewers = [],
  deleting: _deleting = false,
  onStatusChange,
  onDeleteClick,
  onBack: _onBack,
  isModal = false,
  onClose,
}) => {
  const [hasCopiedKey, setHasCopiedKey] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const canDelete =
    currentUser?.isAdmin ||
    currentUser?.systemRole === 'ADMIN';

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(issue.key);
      setHasCopiedKey(true);
      setTimeout(() => setHasCopiedKey(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/issues/${issue.key}`;
      await navigator.clipboard.writeText(url);
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 2000);
    } catch {
      // Ignored
    }
  };

  const renderActiveViewers = () => (
    <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-primary-container)]/20 px-2.5 py-1 rounded-full border border-[var(--md-sys-color-primary)]/30">
      <Radio className="w-3 h-3 text-[var(--md-sys-color-primary)] animate-pulse" />
      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mr-1 hidden sm:inline">
        Viewing:
      </span>
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
  );

  const dropdownItems: DropdownMenuItemConfig[] = [
    {
      label: hasCopiedKey ? 'Key Copied!' : 'Copy Issue Key',
      icon: hasCopiedKey ? <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" /> : <Copy className="w-3.5 h-3.5" />,
      onClick: handleCopyKey,
    },
    {
      label: hasCopiedLink ? 'Link Copied!' : 'Copy Link to Issue',
      icon: hasCopiedLink ? <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" /> : <Share2 className="w-3.5 h-3.5" />,
      onClick: handleCopyLink,
    },
  ];

  if (canDelete) {
    dropdownItems.push(
      { label: '', divider: true },
      {
        label: 'Delete Issue',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        onClick: onDeleteClick,
        danger: true,
      },
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
      {/* Left: Type, Key, Status cockpit, Parent, Sprint */}
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        {/* Issue Type Chip */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/50 text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
          <IssueTypeIcon type={issue.issueType} />
          <span className="capitalize">{issue.issueType?.toLowerCase() || 'Issue'}</span>
        </div>

        {/* Issue Key with Quick Copy */}
        <div className="inline-flex items-center gap-1">
          <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/70 px-2.5 py-1 rounded-lg border border-[var(--md-sys-color-primary)]/20">
            {issue.key}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleCopyKey}
            aria-label="Copy issue key to clipboard"
            title="Copy issue key"
            className="h-7 w-7 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
          >
            {hasCopiedKey ? (
              <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>

        {/* Primary Status Workflow Cockpit */}
        <div className="inline-flex items-center">
          <StatusBadge
            status={issue.status}
            interactive={true}
            onStatusChange={onStatusChange}
            size="md"
          />
        </div>

        {/* Parent Link if Subtask */}
        {issue.parent && (
          <Link
            to={`/issues/${issue.parent.key}`}
            className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 font-mono"
            title={`Parent: ${issue.parent.title}`}
          >
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-sans">Parent:</span>
            <span>{issue.parent.key}</span>
          </Link>
        )}

        {/* Sprint Chip */}
        {issue.sprint?.name && (
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)] px-2 py-0.5 rounded-md border border-[var(--md-sys-color-outline-variant)]/60">
            {issue.sprint.name}
          </span>
        )}
      </div>

      {/* Right: Presence, Actions Dropdown Menu, Modal Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {activeViewers.length > 0 && renderActiveViewers()}

        {/* More Actions Dropdown Menu */}
        <Dropdown
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]"
              aria-label="More issue actions"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          }
          items={dropdownItems}
          align="end"
        />

        {/* Modal Controls */}
        {isModal && (
          <>
            <Link
              to={`/issues/${issue.key}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors flex items-center gap-1 text-xs"
              title="Open in full page view"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Full page</span>
            </Link>

            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close"
                className="h-8 w-8 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
