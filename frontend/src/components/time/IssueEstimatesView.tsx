import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { IssueItem, IssueType } from '../../api/client';
import { Avatar } from '../common/Avatar';
import { Badge, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui';
import {
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  PlusCircle,
  Search,
} from 'lucide-react';

interface IssueEstimatesViewProps {
  issues: IssueItem[];
  onOpenLogWorkForIssue: (issue: IssueItem) => void;
}

export const IssueEstimatesView: React.FC<IssueEstimatesViewProps> = ({
  issues,
  onOpenLogWorkForIssue,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = issues.filter((issue) => {
    const matchesSearch =
      issue.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderTypeIcon = (type: IssueType) => {
    switch (type) {
      case 'BUG':
        return <Bug className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />;
      case 'TASK':
        return <CheckSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />;
      case 'FEATURE':
        return <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" />;
      case 'IMPROVEMENT':
        return <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl shadow-xs overflow-hidden flex flex-col w-full">
      {/* Filters Strip */}
      <div className="p-3 border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by key or summary..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 border-0"
            />
          </div>

          <div className="w-36">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold border-0">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">In Review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
          {filtered.length} {filtered.length === 1 ? 'ticket' : 'tickets'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-high)]/50 text-[var(--md-sys-color-on-surface-variant)] font-bold select-none">
              <th className="py-2.5 px-4 w-28">Key</th>
              <th className="py-2.5 px-2 w-10 text-center">Type</th>
              <th className="py-2.5 px-4 min-w-[220px]">Summary</th>
              <th className="py-2.5 px-4 w-32">Status</th>
              <th className="py-2.5 px-4 w-36">Assignee</th>
              <th className="py-2.5 px-4 min-w-[260px]">Time Tracking & Estimates</th>
              <th className="py-2.5 px-3 text-right w-24"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  No matching tickets found.
                </td>
              </tr>
            ) : (
              filtered.map((issue) => {
                const estimated = issue.estimatedHours || 0;
                const logged = issue.loggedHours || 0;
                const remaining = Math.max(0, estimated - logged);
                const percentage =
                  estimated > 0 ? Math.min(100, Math.round((logged / estimated) * 100)) : logged > 0 ? 100 : 0;
                const isOverEstimate = estimated > 0 && logged > estimated;

                return (
                  <tr key={issue.id} className="hover:bg-[var(--md-sys-color-surface-container-high)]/40 transition">
                    {/* Key */}
                    <td className="py-2.5 px-4 font-mono font-bold whitespace-nowrap">
                      <Link
                        to={`/issues/${issue.key}`}
                        className="text-[var(--md-sys-color-primary)] hover:underline"
                      >
                        {issue.key}
                      </Link>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-2 whitespace-nowrap text-center">
                      {renderTypeIcon(issue.issueType)}
                    </td>

                    {/* Summary */}
                    <td className="py-2.5 px-4">
                      <Link
                        to={`/issues/${issue.key}`}
                        className="font-semibold text-xs text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] line-clamp-1"
                      >
                        {issue.title}
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <Badge variant="neutral" className="text-[10px] rounded-full px-2 py-0.5">
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Assignee */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {issue.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={issue.assignee.fullName || 'User'}
                            avatarUrl={issue.assignee.avatarUrl}
                            size="xs"
                          />
                          <span className="truncate max-w-[90px] text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                            {issue.assignee.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/60 italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Time Tracking Progress Bar */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                            Logged: <span className="font-bold text-[var(--md-sys-color-primary)]">{logged.toFixed(1)}h</span>
                          </span>
                          <span className="text-[var(--md-sys-color-on-surface-variant)]">
                            Remaining: {remaining.toFixed(1)}h
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                            Est: {estimated > 0 ? `${estimated.toFixed(1)}h` : 'None'}
                          </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden flex">
                          <div
                            style={{ width: `${percentage}%` }}
                            className={`h-full transition-all duration-300 ${
                              isOverEstimate
                                ? 'bg-[var(--md-sys-color-error)]'
                                : percentage >= 80
                                ? 'bg-[var(--md-sys-color-success)]'
                                : 'bg-[var(--md-sys-color-primary)]'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions: Log Work Button */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenLogWorkForIssue(issue)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--md-sys-color-primary-container)]/40 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/80 font-bold text-[11px] transition cursor-pointer"
                        title="Log work on this ticket"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Log</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
