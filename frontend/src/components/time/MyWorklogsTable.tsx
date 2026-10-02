import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { WorklogItem, IssueItem, IssueStatus } from '../../api/client';
import { IssueContextMenu } from '../common/IssueContextMenu';
import { useAssignIssueToMeMutation, useUpdateIssueStatusMutation } from '../../api/queries';
import { useAuth } from '../../store';
import { Button } from '../ui';
import {
  Clock,
  Calendar,
  Search,
  ArrowUpDown,
  PlusCircle,
  FileText,
  ExternalLink,
  Inbox,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MyWorklogsTableProps {
  worklogs: WorklogItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  loading?: boolean;
  onOpenLogModal: () => void;
  onDeleteWorklog?: (issueId: number, worklogId: number) => void;
}

export const MyWorklogsTable: React.FC<MyWorklogsTableProps> = ({
  worklogs,
  total = 0,
  page = 1,
  limit = 20,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  loading = false,
  onOpenLogModal,
  onDeleteWorklog,
}) => {
  const { user } = useAuth();
  const assignMutation = useAssignIssueToMeMutation();
  const updateStatusMutation = useUpdateIssueStatusMutation();

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuIssue, setContextMenuIssue] = useState<IssueItem | null>(null);

  const handleContextMenu = (e: React.MouseEvent, rawIssue: NonNullable<WorklogItem['issue']>) => {
    e.preventDefault();
    e.stopPropagation();
    const issueItem: IssueItem = {
      id: rawIssue.id,
      key: rawIssue.key,
      title: rawIssue.title,
      status: rawIssue.status,
      priority: rawIssue.priority,
      issueType: 'TASK',
      projectId: 0,
      createdAt: '',
      updatedAt: '',
      reporter: { id: 0, fullName: '', email: '' },
      estimatedHours: 0,
      loggedHours: 0,
    };
    setContextMenuIssue(issueItem);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleStatusChange = async (issueId: number, status: IssueStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ issueId, status });
    } catch {
      // Ignored
    }
  };

  const handleAssignToMe = async (issueId: number) => {
    try {
      await assignMutation.mutateAsync(issueId);
    } catch {
      // Ignored
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter and sort worklogs locally for client-level fast query/sort
  const filteredWorklogs = useMemo(() => {
    let result = [...worklogs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.issue?.key.toLowerCase().includes(q) ||
          log.issue?.title.toLowerCase().includes(q) ||
          (log.description && log.description.toLowerCase().includes(q)) ||
          log.dateLogged.includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.dateLogged).getTime();
      const dateB = new Date(b.dateLogged).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [worklogs, searchQuery, sortOrder]);

  const totalFilteredHours = useMemo(() => {
    return filteredWorklogs.reduce((sum, item) => sum + item.timeSpentHours, 0);
  }, [filteredWorklogs]);

  const uniqueIssuesCount = useMemo(() => {
    const set = new Set(filteredWorklogs.map((l) => l.issue?.id).filter(Boolean));
    return set.size;
  }, [filteredWorklogs]);

  const fromRecord = total > 0 ? (page - 1) * limit + 1 : 0;
  const toRecord = total > 0 ? Math.min(page * limit, total) : 0;

  return (
    <div className="space-y-4">
      {/* Top summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Page Hours Logged
            </div>
            <div className="text-2xl font-black text-[var(--md-sys-color-primary)] mt-0.5">
              {totalFilteredHours.toFixed(1)}h
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Total Logged Entries
            </div>
            <div className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-0.5">
              {total || filteredWorklogs.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Active Tickets
            </div>
            <div className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-0.5">
              {uniqueIssuesCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="text"
              placeholder="Search worklogs by ticket, note, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search worklogs"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
            aria-label={`Sort by date ${sortOrder === 'desc' ? 'ascending' : 'descending'}`}
          >
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>

          <Button
            variant="filled"
            size="sm"
            onClick={onOpenLogModal}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            aria-label="Log work on ticket"
          >
            Log Time
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)] mx-auto mb-2" />
          <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
            Loading worklog records...
          </p>
        </div>
      ) : filteredWorklogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
          <Inbox className="w-10 h-10 text-[var(--md-sys-color-on-surface-variant)]/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            No worklogs found
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No worklog records matching "${searchQuery}"`
              : 'You have not logged any time yet. Click "Log Time" to record your first entry.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden shadow-2xs">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40">
                {filteredWorklogs.map((log) => {
                  const dateObj = new Date(log.dateLogged);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={log.id}
                      onContextMenu={(e) => {
                        if (log.issue) {
                          handleContextMenu(e, log.issue);
                        }
                      }}
                      className="hover:bg-[var(--md-sys-color-surface-container-highest)]/30 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-semibold text-[var(--md-sys-color-on-surface)] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Hours */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-black text-xs bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{log.timeSpentHours}h</span>
                        </span>
                      </td>

                      {/* Ticket */}
                      <td className="py-3.5 px-4">
                        {log.issue ? (
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/issues/${log.issue.key}`}
                              state={{ from: '/time-tracking', label: 'Back to Time Tracking' }}
                              className="font-mono font-bold text-[var(--md-sys-color-primary)] hover:underline shrink-0"
                            >
                              {log.issue.key}
                            </Link>
                            <span className="text-[var(--md-sys-color-on-surface)] font-medium truncate max-w-xs">
                              {log.issue.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--md-sys-color-on-surface-variant)] italic">
                            Unassigned Issue
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-md">
                        {log.description ? (
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">
                            {log.description}
                          </p>
                        ) : (
                          <span className="text-[var(--md-sys-color-on-surface-variant)] italic opacity-60">
                            No narrative description provided
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onDeleteWorklog && log.issue && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                if (window.confirm(`Delete worklog of ${log.timeSpentHours}h on ${log.issue?.key}?`)) {
                                  onDeleteWorklog(log.issue!.id, log.id);
                                }
                              }}
                              className="text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30"
                              title="Delete worklog"
                              aria-label={`Delete worklog of ${log.timeSpentHours} hours`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}

                          {log.issue && (
                            <Link to={`/issues/${log.issue.key}`}>
                              <Button
                                variant="ghost"
                                size="xs"
                                rightIcon={<ExternalLink className="w-3 h-3" />}
                                aria-label={`View ticket ${log.issue.key}`}
                              >
                                View Ticket
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden divide-y divide-[var(--md-sys-color-outline-variant)]">
            {filteredWorklogs.map((log) => {
              const dateObj = new Date(log.dateLogged);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={log.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                        {formattedDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                        <Clock className="w-3 h-3" />
                        {log.timeSpentHours}h
                      </span>

                      {onDeleteWorklog && log.issue && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete worklog of ${log.timeSpentHours}h?`)) {
                              onDeleteWorklog(log.issue!.id, log.id);
                            }
                          }}
                          className="p-1 rounded-md text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors"
                          aria-label="Delete worklog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {log.issue && (
                    <Link
                      to={`/issues/${log.issue.key}`}
                      className="block p-2 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                          {log.issue.key}
                        </span>
                        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                          {log.issue.title}
                        </span>
                      </div>
                    </Link>
                  )}

                  {log.description && (
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)]/60">
                      {log.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Server-Side Pagination Footer */}
          {onPageChange && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-xs text-[var(--md-sys-color-on-surface-variant)] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-[var(--md-sys-color-on-surface)]">{fromRecord}</strong> to{' '}
                  <strong className="text-[var(--md-sys-color-on-surface)]">{toRecord}</strong> of{' '}
                  <strong className="text-[var(--md-sys-color-on-surface)]">{total}</strong> worklogs
                </span>
                {onLimitChange && (
                  <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    aria-label="Rows per page"
                    className="ml-2 px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] focus:outline-none"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  aria-label="Previous page"
                >
                  Prev
                </Button>
                <span className="px-2 font-semibold text-[var(--md-sys-color-on-surface)]">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenuPos && contextMenuIssue && (
        <IssueContextMenu
          issue={contextMenuIssue}
          position={contextMenuPos}
          onClose={() => {
            setContextMenuPos(null);
            setContextMenuIssue(null);
          }}
          onStatusChange={handleStatusChange}
          onAssignToMe={handleAssignToMe}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};
