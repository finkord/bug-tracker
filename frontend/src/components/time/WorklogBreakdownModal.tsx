import React from 'react';
import { Link } from 'react-router-dom';
import type { CellBreakdownData } from '../../types/timeTracking';
import { Modal, Button, Badge } from '../ui';
import { Avatar } from '../common/Avatar';
import {
  Clock,
  ExternalLink,
  PlusCircle,
  Trash2,
} from 'lucide-react';

interface WorklogBreakdownModalProps {
  data: CellBreakdownData | null;
  isOpen: boolean;
  onClose: () => void;
  onLogMoreWork: (issueId?: number) => void;
  onDeleteWorklog?: (issueId: number, worklogId: number) => void;
}

export const WorklogBreakdownModal: React.FC<WorklogBreakdownModalProps> = ({
  data,
  isOpen,
  onClose,
  onLogMoreWork,
  onDeleteWorklog,
}) => {
  if (!data) return null;

  const formattedDate = new Date(data.date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[var(--md-sys-color-on-surface)]">
                {data.title}
              </h3>
              <Badge variant="primary" size="sm">
                {data.totalHours.toFixed(1)}h Total
              </Badge>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-medium">
              {formattedDate} {data.subtitle ? `• ${data.subtitle}` : ''}
            </p>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="space-y-4 pt-1">
        {/* Worklog list */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {data.worklogs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
              <Clock className="w-8 h-8 text-[var(--md-sys-color-on-surface-variant)]/40 mx-auto mb-2" />
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                No individual worklog entries recorded for this cell.
              </p>
            </div>
          ) : (
            data.worklogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 hover:border-[var(--md-sys-color-outline)] transition-all space-y-3 shadow-2xs"
              >
                {/* Header: Ticket / User & Hours */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    {log.issueKey ? (
                      <Link
                        to={`/issues/${log.issueKey}`}
                        state={{ from: '/time-tracking', label: 'Back to Time Tracking' }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition-colors shadow-2xs shrink-0"
                      >
                        <span>{log.issueKey}</span>
                      </Link>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                        Ticket
                      </span>
                    )}

                    {log.issueTitle && (
                      <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate max-w-sm">
                        {log.issueTitle}
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shrink-0 shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {log.timeSpentHours}h
                  </span>
                </div>

                {/* Description Note */}
                {log.description ? (
                  <div className="text-xs text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface)] p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)]/40 font-medium italic">
                    "{log.description}"
                  </div>
                ) : (
                  <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic opacity-60">
                    No narrative note logged
                  </div>
                )}

                {/* Author Info and Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30 text-xs">
                  {log.user ? (
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={log.user.fullName || 'User'}
                        avatarUrl={log.user.avatarUrl}
                        size="xs"
                      />
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                        {log.user.fullName}
                      </span>
                    </div>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-1.5">
                    {onDeleteWorklog && log.issueId && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          if (window.confirm(`Delete worklog of ${log.timeSpentHours}h?`)) {
                            onDeleteWorklog(log.issueId!, log.id);
                          }
                        }}
                        className="text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30"
                        title="Delete worklog"
                        aria-label={`Delete worklog of ${log.timeSpentHours} hours`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {log.issueKey && (
                      <Link
                        to={`/issues/${log.issueKey}`}
                        state={{ from: '/time-tracking', label: 'Back to Time Tracking' }}
                      >
                        <Button
                          variant="ghost"
                          size="xs"
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Open Ticket Page
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
          <Button
            variant="filled"
            size="sm"
            onClick={() => {
              onClose();
              onLogMoreWork(data.targetIssueId);
            }}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Log More Work
          </Button>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
