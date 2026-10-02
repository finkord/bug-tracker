import React from 'react';
import type { IssueItem } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import { Card, Button } from '../ui/index.js';
import { Clock, PlusCircle } from 'lucide-react';

interface IssueTimeTrackingCardProps {
  issue: IssueItem;
  onOpenLogWorkModal: () => void;
}

export const IssueTimeTrackingCard: React.FC<IssueTimeTrackingCardProps> = ({
  issue,
  onOpenLogWorkModal,
}) => {
  const estimated = issue.estimatedHours || 0;
  const logged = issue.loggedHours || 0;
  const progressPercent = estimated > 0 ? Math.min(Math.round((logged / estimated) * 100), 100) : 0;
  const worklogs = issue.worklogs || [];

  return (
    <Card className="p-4 space-y-4 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          Time Tracking
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenLogWorkModal}
          className="h-7 text-xs px-2 gap-1 text-[var(--md-sys-color-on-surface)]"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          Log Work
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-[var(--md-sys-color-on-surface)]">{logged}h logged</span>
          <span className="text-[var(--md-sys-color-on-surface-variant)]">
            {estimated > 0 ? `${estimated}h estimated` : 'No estimate'}
          </span>
        </div>
        <div className="h-2 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              logged > estimated && estimated > 0
                ? 'bg-[var(--md-sys-color-error)]'
                : 'bg-[var(--md-sys-color-primary)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Worklogs List */}
      {worklogs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/40">
          <p className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
            Recent Worklogs
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {worklogs.slice(0, 5).map((w) => (
              <div
                key={w.id}
                className="text-xs p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      name={w.user?.fullName || 'User'}
                      avatarUrl={w.user?.avatarUrl || undefined}
                      size="sm"
                      className="w-4 h-4 text-[9px]"
                    />
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{w.user?.fullName}</span>
                  </div>
                  <span className="font-mono text-[var(--md-sys-color-primary)] font-bold">{w.timeSpentHours}h</span>
                </div>
                {w.description && (
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">{w.description}</p>
                )}
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]/80 font-mono">
                  {w.dateLogged}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
