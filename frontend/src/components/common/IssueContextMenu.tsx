import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { IssueItem, IssueStatus } from '../../api/client';
import {
  ExternalLink,
  ArrowRight,
  Link2,
  Copy,
  UserCheck,
  Check,
  CircleDot,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';

export interface IssueContextMenuProps {
  issue: IssueItem;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onStatusChange?: (issueId: number, status: IssueStatus) => void;
  onAssignToMe?: (issueId: number) => void;
  currentUserId?: number;
}

const STATUS_OPTIONS: { status: IssueStatus; label: string; icon: React.ReactNode }[] = [
  {
    status: 'OPEN',
    label: 'To Do',
    icon: <Circle className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)]" />,
  },
  {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    icon: <Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />,
  },
  {
    status: 'REVIEW',
    label: 'Code Review',
    icon: <CircleDot className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />,
  },
  {
    status: 'RESOLVED',
    label: 'Resolved',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" />,
  },
  {
    status: 'CLOSED',
    label: 'Closed',
    icon: <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />,
  },
];

export const IssueContextMenu: React.FC<IssueContextMenuProps> = ({
  issue,
  position,
  onClose,
  onStatusChange,
  onAssignToMe,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!position) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleScroll = () => {
      onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [position, onClose]);

  if (!position) return null;

  // Clamp coordinates within the viewport
  const menuWidth = 220;
  const menuHeight = 320;
  const x = Math.min(position.x, window.innerWidth - menuWidth - 12);
  const y = Math.min(position.y, window.innerHeight - menuHeight - 12);

  const handleOpenInNewTab = () => {
    window.open(`/issues/${issue.key}`, '_blank');
    onClose();
  };

  const handleOpenDetails = () => {
    navigate(`/issues/${issue.key}`);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/issues/${issue.key}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        onClose();
      }, 500);
    } catch {
      onClose();
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(issue.key);
      setCopiedKey(true);
      setTimeout(() => {
        setCopiedKey(false);
        onClose();
      }, 500);
    } catch {
      onClose();
    }
  };

  const isAssignedToMe = currentUserId && issue.assignee?.id === currentUserId;

  return createPortal(
    <div
      ref={menuRef}
      style={{ left: `${Math.max(12, x)}px`, top: `${Math.max(12, y)}px` }}
      className="fixed z-50 w-56 p-1.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Issue Key */}
      <div className="px-3 py-1.5 border-b border-[var(--md-sys-color-outline-variant)]/20 mb-1 flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)]">
          {issue.key}
        </span>
        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-semibold">
          Issue Actions
        </span>
      </div>

      {/* Primary Actions */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={handleOpenInNewTab}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer text-left"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
          <span>Open in new tab</span>
        </button>

        <button
          type="button"
          onClick={handleOpenDetails}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer text-left"
        >
          <ArrowRight className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
          <span>Open issue details</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Link2 className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
            <span>Copy link</span>
          </div>
          {copiedLink && (
            <span className="text-[10px] text-[var(--md-sys-color-success)] font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Copied
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopyKey}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Copy className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
            <span>Copy issue key</span>
          </div>
          {copiedKey && (
            <span className="text-[10px] text-[var(--md-sys-color-success)] font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Copied
            </span>
          )}
        </button>
      </div>

      {/* Assignment Section */}
      {onAssignToMe && !isAssignedToMe && (
        <>
          <div className="h-px my-1 bg-[var(--md-sys-color-outline-variant)]/20" />
          <button
            type="button"
            onClick={() => {
              onAssignToMe(issue.id);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors cursor-pointer text-left"
          >
            <UserCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
            <span>Assign to me</span>
          </button>
        </>
      )}

      {/* Status Transitions */}
      {onStatusChange && (
        <>
          <div className="h-px my-1 bg-[var(--md-sys-color-outline-variant)]/20" />
          <div className="px-2.5 py-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)] block mb-1">
              Status
            </span>
            <div className="space-y-0.5">
              {STATUS_OPTIONS.map((opt) => {
                const isCurrent = issue.status === opt.status;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      onStatusChange(issue.id, opt.status);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs font-medium transition-colors text-left ${
                      isCurrent
                        ? 'bg-[var(--md-sys-color-primary-container)]/50 text-[var(--md-sys-color-primary)] font-semibold cursor-default'
                        : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                    {isCurrent && <Check className="w-3 h-3 text-[var(--md-sys-color-primary)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
};
