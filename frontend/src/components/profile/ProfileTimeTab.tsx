import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyWorklogsQuery, useDeleteWorklogMutation } from '../../api/queries';
import { MyWorklogsTable } from '../time/MyWorklogsTable';
import { LogWorkModal } from '../kanban/LogWorkModal';
import { Card, Button } from '../ui/index.js';
import { Clock, Calendar, Trophy, ExternalLink, Plus } from 'lucide-react';

export const ProfileTimeTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const { data: myWorklogsData, isLoading } = useMyWorklogsQuery(page, limit);
  const deleteMutation = useDeleteWorklogMutation();

  const worklogs = myWorklogsData?.items || [];
  const total = myWorklogsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Compute summary metrics
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let totalLoggedHours = 0;
  let thisMonthHours = 0;
  const uniqueIssues = new Set<number>();

  worklogs.forEach((log) => {
    const hours = log.timeSpentHours || 0;
    totalLoggedHours += hours;
    if (log.dateLogged.startsWith(currentMonthPrefix)) {
      thisMonthHours += hours;
    }
    if (log.issue?.id) {
      uniqueIssues.add(log.issue.id);
    }
  });

  const handleDeleteWorklog = (issueId: number, worklogId: number) => {
    deleteMutation.mutate({ issueId, worklogId });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Effort Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Total Logged Effort
            </span>
            <p className="text-2xl font-black text-[var(--md-sys-color-primary)]">
              {totalLoggedHours.toFixed(1)}h
            </p>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Across all projects
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              This Month
            </span>
            <p className="text-2xl font-black text-[var(--md-sys-color-success)]">
              {thisMonthHours.toFixed(1)}h
            </p>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Current billing period
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[var(--md-sys-color-success)]" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Work Items Logged
            </span>
            <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)]">
              {uniqueIssues.size}
            </p>
            <div className="pt-0.5">
              <Link
                to="/time-tracking"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline"
              >
                <span>Open Timesheet Matrix</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Unified Worklogs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Recent Personal Worklogs
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Review and manage logged time entries across assigned tasks and tickets
            </p>
          </div>

          <Button
            type="button"
            variant="filled"
            size="sm"
            onClick={() => setIsLogModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Log Time
          </Button>
        </div>

        <MyWorklogsTable
          worklogs={worklogs}
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={setLimit}
          loading={isLoading}
          onOpenLogModal={() => setIsLogModalOpen(true)}
          onDeleteWorklog={handleDeleteWorklog}
        />
      </div>

      <LogWorkModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={() => setIsLogModalOpen(false)}
      />
    </div>
  );
};

export default ProfileTimeTab;
