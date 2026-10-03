import React from 'react';
import type { IssueItem } from '../../api/types/index.js';
import { Card, Button } from '../ui/index.js';
import { Clock, Plus } from 'lucide-react';

interface IssueTimeTrackingCardProps {
  issue: IssueItem;
  onOpenLogWorkModal: () => void;
  onViewWorklogsTab?: () => void;
}

export const IssueTimeTrackingCard: React.FC<IssueTimeTrackingCardProps> = ({
  issue,
  onOpenLogWorkModal,
  onViewWorklogsTab,
}) => {
  const estimated = issue.estimatedHours || 0;
  const logged = issue.loggedHours || 0;
  const progressPercent = estimated > 0 ? Math.min(Math.round((logged / estimated) * 100), 100) : 0;
  const isOverEstimated = logged > estimated && estimated > 0;

  return (
    <Card className="p-3.5 space-y-2.5 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl shadow-xs">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onViewWorklogsTab}
          className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
          title="Click to view worklogs in Activity Hub"
        >
          <Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Time Tracking</span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenLogWorkModal}
          className="h-6 w-6 p-0 rounded-full hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]"
          title="Log work on this issue"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Progress Bar & Hours Summary */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
            {logged}h <span className="font-normal text-[var(--md-sys-color-on-surface-variant)]">logged</span>
          </span>
          <span className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] font-mono">
            {estimated > 0 ? `${estimated}h estimated` : 'No estimate'}
          </span>
        </div>

        <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOverEstimated
                ? 'bg-[var(--md-sys-color-error)]'
                : 'bg-[var(--md-sys-color-primary)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {estimated > 0 && (
          <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            <span>{progressPercent}% logged</span>
            {isOverEstimated ? (
              <span className="text-[var(--md-sys-color-error)] font-medium">
                +{logged - estimated}h over
              </span>
            ) : (
              <span>{Math.max(0, estimated - logged)}h remaining</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
