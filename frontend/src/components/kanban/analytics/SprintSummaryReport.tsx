import React, { useMemo } from 'react';
import type { IssueItem } from '../../../api/client';
import { Button, StatusBadge, PriorityBadge, DataTable } from '../../ui';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Printer } from 'lucide-react';

interface SprintSummaryReportProps {
  sprintName: string;
  sprintIssues: IssueItem[];
}

export const SprintSummaryReport: React.FC<SprintSummaryReportProps> = ({
  sprintName,
  sprintIssues,
}) => {
  const handleExportCSV = () => {
    const headers = ['Key', 'Title', 'Status', 'Priority', 'Assignee', 'Estimated Hours', 'Logged Hours'];
    const rows = sprintIssues.map((i) => [
      i.key,
      `"${i.title.replace(/"/g, '""')}"`,
      i.status,
      i.priority,
      i.assignee?.fullName || 'Unassigned',
      i.estimatedHours || 0,
      i.loggedHours || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sprintName.replace(/\s+/g, '_')}_Sprint_Report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<IssueItem>[]>(
    () => [
      {
        accessorKey: 'key',
        header: 'Key',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">
            {row.original.key}
          </span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate block max-w-[280px]">
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="xs" />,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} size="xs" />,
      },
      {
        id: 'assignee',
        header: 'Assignee',
        cell: ({ row }) => (
          <span className="text-[var(--md-sys-color-on-surface-variant)]">
            {row.original.assignee?.fullName || 'Unassigned'}
          </span>
        ),
      },
      {
        accessorKey: 'estimatedHours',
        header: 'Est.',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-[var(--md-sys-color-on-surface)]">
            {row.original.estimatedHours || 0}h
          </span>
        ),
      },
      {
        accessorKey: 'loggedHours',
        header: 'Logged',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-[var(--md-sys-color-success)]">
            {row.original.loggedHours || 0}h
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            Stakeholder Agile Sprint Report
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Summary breakdown for management and sprint retrospective.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            type="button"
            variant="filled"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Summary
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden bg-[var(--md-sys-color-surface)]">
        <DataTable
          columns={columns}
          data={sprintIssues}
          emptyTitle="No issues in sprint"
          emptyDescription="Add issues to this sprint to populate the summary report."
        />
      </div>
    </div>
  );
};
