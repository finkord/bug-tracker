import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { IssueItem, IssuePriority, IssueStatus, IssueType } from '../../api/client';
import {
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui';
import { Avatar } from '../common/Avatar';
import { IssueContextMenu } from '../common/IssueContextMenu';
import { useAssignIssueToMeMutation } from '../../api/queries';
import { useAuth } from '../../store';
import {
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SearchResultsTableProps {
  issues: IssueItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  selectedIssueId?: number | null;
  onSelectIssue?: (issue: IssueItem) => void;
  onOpenDetailsModal?: (issue: IssueItem) => void;
  onUpdateStatus?: (issueId: number, status: IssueStatus) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string) => void;
}

const STATUS_OPTIONS: { label: string; value: IssueStatus }[] = [
  { label: 'To Do', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Review', value: 'REVIEW' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export const SearchResultsTable: React.FC<SearchResultsTableProps> = ({
  issues,
  total,
  page = 1,
  limit = 50,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  selectedIssueId,
  onSelectIssue,
  onUpdateStatus,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const { user } = useAuth();
  const assignMutation = useAssignIssueToMeMutation();
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuIssue, setContextMenuIssue] = useState<IssueItem | null>(null);

  const handleContextMenu = (e: React.MouseEvent, issue: IssueItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuIssue(issue);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleAssignToMe = async (issueId: number) => {
    try {
      await assignMutation.mutateAsync(issueId);
    } catch {
      // Ignored
    }
  };

  const renderTypeIcon = (type: IssueType) => {
    switch (type) {
      case 'BUG':
        return (
          <span title="Bug" className="inline-flex items-center text-[var(--md-sys-color-error)]">
            <Bug className="w-4 h-4" />
          </span>
        );
      case 'TASK':
        return (
          <span title="Task" className="inline-flex items-center text-[var(--md-sys-color-primary)]">
            <CheckSquare className="w-4 h-4" />
          </span>
        );
      case 'FEATURE':
        return (
          <span title="Feature" className="inline-flex items-center text-[var(--md-sys-color-success)]">
            <Sparkles className="w-4 h-4" />
          </span>
        );
      case 'IMPROVEMENT':
        return (
          <span title="Improvement" className="inline-flex items-center text-[var(--md-sys-color-tertiary)]">
            <Zap className="w-4 h-4" />
          </span>
        );
      default:
        return null;
    }
  };

  const renderPriorityBadge = (priority: IssuePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <Badge variant="critical" className="gap-1 px-2 py-0.5 text-[11px] rounded-full">
            <Flame className="w-3 h-3 text-[var(--md-sys-color-priority-critical)]" />
            <span>Critical</span>
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="high" className="gap-1 px-2 py-0.5 text-[11px] rounded-full">
            <AlertCircle className="w-3 h-3 text-[var(--md-sys-color-priority-high)]" />
            <span>High</span>
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="medium" className="gap-1.5 px-2 py-0.5 text-[11px] rounded-full">
            <span>Medium</span>
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="low" className="gap-1.5 px-2 py-0.5 text-[11px] rounded-full">
            <span>Low</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
    );
  };

  if (issues.length === 0) {
    return (
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl p-12 text-center w-full">
        <div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center mx-auto mb-3 text-[var(--md-sys-color-on-surface-variant)]">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
          No matching issues found
        </h3>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-sm mx-auto">
          Try broadening your search query or changing active filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl shadow-xs overflow-hidden flex flex-col w-full flex-1 min-h-0">
      {/* Table Results Bar (Ticket Count & Pagination Status) */}
      <div className="px-4 py-2.5 border-b border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)] shrink-0">
        <span className="font-bold text-[var(--md-sys-color-on-surface)]">
          {total ?? issues.length} {(total ?? issues.length) === 1 ? 'ticket' : 'tickets'} found
        </span>
        {totalPages > 1 && (
          <span className="text-[11px] font-normal opacity-80">
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      <div className="overflow-x-auto flex-1 min-h-0">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)] text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] select-none">
              <th
                onClick={() => onSortChange('key')}
                className="py-3 px-4 cursor-pointer hover:text-[var(--md-sys-color-on-surface)] transition group w-28"
              >
                <div className="flex items-center gap-1.5">
                  <span>Key</span>
                  {renderSortIcon('key')}
                </div>
              </th>
              <th className="py-3 px-3 w-12 text-center">Type</th>
              <th
                onClick={() => onSortChange('title')}
                className="py-3 px-4 cursor-pointer hover:text-[var(--md-sys-color-on-surface)] transition group min-w-[240px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Summary</span>
                  {renderSortIcon('title')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('status')}
                className="py-3 px-4 cursor-pointer hover:text-[var(--md-sys-color-on-surface)] transition group w-36"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('priority')}
                className="py-3 px-4 cursor-pointer hover:text-[var(--md-sys-color-on-surface)] transition group w-32"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  {renderSortIcon('priority')}
                </div>
              </th>
              <th className="py-3 px-4 w-36">Sprint</th>
              <th className="py-3 px-4 w-40">Assignee</th>
              <th
                onClick={() => onSortChange('updatedAt')}
                className="py-3 px-4 cursor-pointer hover:text-[var(--md-sys-color-on-surface)] transition group w-32 hidden md:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Updated</span>
                  {renderSortIcon('updatedAt')}
                </div>
              </th>
              <th className="py-3 px-3 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
            {issues.map((issue) => {
              const isSelected = selectedIssueId === issue.id;
              const formattedDate = new Date(issue.updatedAt || issue.createdAt).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric' },
              );

              return (
                <tr
                  key={issue.id}
                  onContextMenu={(e) => handleContextMenu(e, issue)}
                  onClick={() => onSelectIssue?.(issue)}
                  className={`hover:bg-[var(--md-sys-color-surface-container-high)]/60 transition cursor-pointer group ${
                    isSelected ? 'bg-[var(--md-sys-color-primary-container)]/30' : ''
                  }`}
                >
                  {/* Key */}
                  <td className="py-2.5 px-4 font-mono font-bold text-xs whitespace-nowrap">
                    <Link
                      to={`/issues/${issue.key}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[var(--md-sys-color-primary)] hover:underline"
                    >
                      {issue.key}
                    </Link>
                  </td>

                  {/* Type */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    {renderTypeIcon(issue.issueType)}
                  </td>

                  {/* Summary */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/issues/${issue.key}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition line-clamp-1"
                      >
                        {issue.title}
                      </Link>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-2 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {onUpdateStatus ? (
                      <div className="w-32">
                        <Select
                          value={issue.status}
                          onValueChange={(val) => onUpdateStatus(issue.id, val as IssueStatus)}
                        >
                          <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <Badge variant="neutral" className="text-xs rounded-full">
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {renderPriorityBadge(issue.priority)}
                  </td>

                  {/* Sprint */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {issue.sprint?.name ? (
                      <Badge variant="primary" className="text-[11px] font-medium rounded-full truncate max-w-[120px]">
                        {issue.sprint.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]/60 italic">
                        Backlog
                      </span>
                    )}
                  </td>

                  {/* Assignee */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {issue.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={issue.assignee.fullName || 'User'}
                          avatarUrl={issue.assignee.avatarUrl}
                          size="xs"
                        />
                        <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] truncate max-w-[100px]">
                          {issue.assignee.fullName || 'User'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]/60 italic">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Updated */}
                  <td className="py-2.5 px-4 whitespace-nowrap text-xs text-[var(--md-sys-color-on-surface-variant)] hidden md:table-cell">
                    {formattedDate}
                  </td>

                  {/* Actions: Open Issue Page */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <Link
                      to={`/issues/${issue.key}`}
                      title="Open Issue Page"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <div className="py-2.5 px-4 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)]/40 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] flex flex-wrap items-center justify-between gap-3">
        <span>
          {total !== undefined
            ? `Showing ${total === 0 ? 0 : (page - 1) * limit + 1} to ${Math.min(page * limit, total)} of ${total} issues`
            : `Showing ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}`}
        </span>

        <div className="flex items-center gap-4">
          {onLimitChange && (
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}

          {totalPages !== undefined && totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded-md border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1 text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded-md border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right-Click Context Menu */}
      {contextMenuPos && contextMenuIssue && (
        <IssueContextMenu
          issue={contextMenuIssue}
          position={contextMenuPos}
          onClose={() => {
            setContextMenuPos(null);
            setContextMenuIssue(null);
          }}
          onStatusChange={onUpdateStatus}
          onAssignToMe={handleAssignToMe}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};
