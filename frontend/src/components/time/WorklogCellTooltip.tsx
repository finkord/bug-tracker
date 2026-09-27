import React from 'react';
import type { WorklogCellEntry } from '../../types/timeTracking';
import { Avatar } from '../common/Avatar';
import { Clock, Sparkles } from 'lucide-react';

interface WorklogCellTooltipProps {
  title?: string;
  userName?: string;
  userAvatar?: string | null;
  dateStr: string;
  totalHours: number;
  worklogs: WorklogCellEntry[];
}

export const WorklogCellTooltipContent: React.FC<WorklogCellTooltipProps> = ({
  title,
  userName,
  userAvatar,
  dateStr,
  totalHours,
  worklogs,
}) => {
  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const displayAuthor = userName || (worklogs.length > 0 ? worklogs[0].user?.fullName : undefined);
  const displayAvatar = userAvatar || (worklogs.length > 0 ? worklogs[0].user?.avatarUrl : undefined);

  return (
    <div className="w-[290px] max-w-[90vw] p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60 shadow-xl space-y-2.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--md-sys-color-outline-variant)]/30 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {displayAuthor ? (
            <Avatar name={displayAuthor} avatarUrl={displayAvatar} size="xs" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
              {displayAuthor || title || 'Logged Effort'}
            </div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-medium">
              {formattedDate}
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shrink-0 shadow-xs">
          <Clock className="w-3 h-3" />
          {totalHours.toFixed(1)}h
        </span>
      </div>

      {/* Tickets List */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
        {worklogs.length === 0 ? (
          <div className="p-3 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic bg-[var(--md-sys-color-surface-container-low)] rounded-xl">
            No worklog notes recorded.
          </div>
        ) : (
          worklogs.map((log, idx) => (
            <div
              key={log.id || idx}
              className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-1.5 transition-colors hover:border-[var(--md-sys-color-outline)]"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="px-2 py-0.5 rounded-md font-mono font-black text-[11px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] truncate">
                  {log.issueKey || 'Ticket'}
                </span>
                <span className="text-xs font-extrabold text-[var(--md-sys-color-primary)] shrink-0">
                  {log.timeSpentHours}h
                </span>
              </div>

              {log.issueTitle && (
                <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] line-clamp-1">
                  {log.issueTitle}
                </div>
              )}

              {log.description && (
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface)] p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)]/30 italic line-clamp-2">
                  "{log.description}"
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer prompt */}
      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[var(--md-sys-color-primary)] pt-1 border-t border-[var(--md-sys-color-outline-variant)]/20">
        <Sparkles className="w-3 h-3" />
        <span>Click cell to open full details</span>
      </div>
    </div>
  );
};
