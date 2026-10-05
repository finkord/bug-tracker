import React from 'react';
import type { IssueItem } from '../../../api/client';
import { Button, StatusBadge, PriorityBadge } from '../../ui';
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
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              <th className="p-3">Key</th>
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Assignee</th>
              <th className="p-3 text-right">Est.</th>
              <th className="p-3 text-right">Logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {sprintIssues.map((issue) => (
              <tr key={issue.id} className="hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                <td className="p-3 font-mono font-bold text-[var(--md-sys-color-primary)]">{issue.key}</td>
                <td className="p-3 font-semibold text-[var(--md-sys-color-on-surface)] truncate max-w-[240px]">
                  {issue.title}
                </td>
                <td className="p-3">
                  <StatusBadge status={issue.status} size="xs" />
                </td>
                <td className="p-3">
                  <PriorityBadge priority={issue.priority} size="xs" />
                </td>
                <td className="p-3 text-[var(--md-sys-color-on-surface-variant)]">
                  {issue.assignee?.fullName || 'Unassigned'}
                </td>
                <td className="p-3 text-right font-mono font-semibold text-[var(--md-sys-color-on-surface)]">
                  {issue.estimatedHours || 0}h
                </td>
                <td className="p-3 text-right font-mono font-semibold text-[var(--md-sys-color-success)]">
                  {issue.loggedHours || 0}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
