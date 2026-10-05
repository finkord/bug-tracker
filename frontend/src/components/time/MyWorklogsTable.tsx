import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import type { WorklogItem, IssueItem, IssueStatus } from '../../api/client';
import { IssueContextMenu } from '../common/IssueContextMenu';
import { useAssignIssueToMeMutation, useUpdateIssueStatusMutation } from '../../api/queries';
import { useAuth } from '../../store';
import { Button, SearchInput, ConfirmDialog, DataTable } from '../ui';
import { formatFullDate } from '../../utils/date';
import {
  Clock,
  Calendar,
  ArrowUpDown,
  PlusCircle,
  FileText,
  ExternalLink,
  Trash2,
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
      projectKey: rawIssue.projectName || '',
      projectName: rawIssue.projectName || '',
      issueNum: 0,
      description: null,
      sprintId: null,
      assignee: null,
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
  const [worklogToDelete, setWorklogToDelete] = useState<{
    issueId: number;
    worklogId: number;
    hours: number;
    issueKey?: string;
  } | null>(null);

  // Filter and sort worklogs locally for quick interaction
  const filteredWorklogs = useMemo(() => {
    let result = [...worklogs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.issue?.key.toLowerCase().includes(q) ||
          log.issue?.title.toLowerCase().includes(q) ||
          (log.description && log.description.toLowerCase().includes(q)) ||
          log.dateLogged.includes(q),
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

  const columns = useMemo<ColumnDef<WorklogItem>[]>(() => [
    {
      id: 'dateLogged',
      accessorKey: 'dateLogged',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-semibold text-[var(--md-sys-color-on-surface)] whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
          <span>{formatFullDate(row.original.dateLogged)}</span>
        </div>
      ),
    },
    {
      id: 'timeSpentHours',
      accessorKey: 'timeSpentHours',
      header: 'Hours',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-black text-xs bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs whitespace-nowrap">
          <Clock className="w-3.5 h-3.5" />
          <span>{row.original.timeSpentHours}h</span>
        </span>
      ),
    },
    {
      id: 'ticket',
      header: 'Ticket',
      cell: ({ row }) => {
        const issue = row.original.issue;
        if (!issue) {
          return <span className="text-[var(--md-sys-color-on-surface-variant)] italic">Unassigned Issue</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/issues/${issue.key}`}
              state={{ from: '/time-tracking', label: 'Back to Time Tracking' }}
              className="font-mono font-bold text-[var(--md-sys-color-primary)] hover:underline shrink-0"
            >
              {issue.key}
            </Link>
            <span className="text-[var(--md-sys-color-on-surface)] font-medium truncate max-w-xs">
              {issue.title}
            </span>
          </div>
        );
      },
    },
    {
      id: 'description',
      header: 'Description',
      cell: ({ row }) =>
        row.original.description ? (
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 max-w-md">
            {row.original.description}
          </p>
        ) : (
          <span className="text-[var(--md-sys-color-on-surface-variant)] italic opacity-60">
            No narrative description provided
          </span>
        ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          {onDeleteWorklog && row.original.issue && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setWorklogToDelete({
                  issueId: row.original.issue!.id,
                  worklogId: row.original.id,
                  hours: row.original.timeSpentHours,
                  issueKey: row.original.issue?.key,
                });
              }}
              className="text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30"
              title="Delete worklog"
              aria-label={`Delete worklog of ${row.original.timeSpentHours} hours`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}

          {row.original.issue && (
            <Link to={`/issues/${row.original.issue.key}`}>
              <Button
                variant="ghost"
                size="xs"
                rightIcon={<ExternalLink className="w-3 h-3" />}
                aria-label={`View ticket ${row.original.issue.key}`}
              >
                View Ticket
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ], [onDeleteWorklog]);

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
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search worklogs by ticket, note, date..."
          className="flex-1 min-w-[240px] max-w-md"
          aria-label="Search worklogs"
        />

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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredWorklogs}
        getRowId={(row) => String(row.id)}
        page={page}
        pageSize={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onLimitChange}
        pageSizeOptions={[10, 20, 50]}
        isLoading={loading}
        loadingMessage="Loading worklog records..."
        emptyTitle="No worklogs found"
        emptyDescription={
          searchQuery
            ? `No worklog records matching "${searchQuery}"`
            : 'You have not logged any time yet. Click "Log Time" to record your first entry.'
        }
        onRowContextMenu={(e, row) => {
          if (row.issue) {
            handleContextMenu(e, row.issue);
          }
        }}
      />

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

      <ConfirmDialog
        isOpen={!!worklogToDelete}
        onClose={() => setWorklogToDelete(null)}
        onConfirm={() => {
          if (worklogToDelete && onDeleteWorklog) {
            onDeleteWorklog(worklogToDelete.issueId, worklogToDelete.worklogId);
          }
          setWorklogToDelete(null);
        }}
        title="Delete Worklog"
        description={
          worklogToDelete?.issueKey
            ? `Are you sure you want to delete worklog of ${worklogToDelete.hours}h on ${worklogToDelete.issueKey}?`
            : `Are you sure you want to delete worklog of ${worklogToDelete?.hours}h?`
        }
        confirmLabel="Delete Worklog"
        variant="danger"
      />
    </div>
  );
};
