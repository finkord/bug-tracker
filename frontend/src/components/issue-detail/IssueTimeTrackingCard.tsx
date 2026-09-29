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
    <Card className="p-4 space-y-4 bg-card/80 border-border/80">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Time Tracking
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenLogWorkModal}
          className="h-7 text-xs px-2 gap-1"
        >
          <PlusCircle className="w-3.5 h-3.5 text-primary" />
          Log Work
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-foreground">{logged}h logged</span>
          <span className="text-muted-foreground">
            {estimated > 0 ? `${estimated}h estimated` : 'No estimate'}
          </span>
        </div>
        <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              logged > estimated && estimated > 0
                ? 'bg-[var(--md-sys-color-warning)]'
                : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Worklogs List */}
      {worklogs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/60">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Worklogs
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {worklogs.slice(0, 5).map((w) => (
              <div
                key={w.id}
                className="text-xs p-2 rounded bg-muted/30 border border-border/40 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      name={w.user?.fullName || 'User'}
                      avatarUrl={w.user?.avatarUrl || undefined}
                      size="sm"
                      className="w-4 h-4 text-[9px]"
                    />
                    <span className="font-semibold text-foreground">{w.user?.fullName}</span>
                  </div>
                  <span className="font-mono text-primary font-bold">{w.timeSpentHours}h</span>
                </div>
                {w.description && (
                  <p className="text-[11px] text-muted-foreground truncate">{w.description}</p>
                )}
                <div className="text-[10px] text-muted-foreground/80 font-mono">
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
