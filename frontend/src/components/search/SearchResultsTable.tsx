import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef, SortingState, OnChangeFn } from '@tanstack/react-table';
import type { IssueItem, IssueStatus, IssueType } from '../../api/client';
import {
  Badge,
  StatusBadge,
  PriorityBadge,
  DataTable,
} from '../ui';
import { UserIdentity } from '../common/UserIdentity';
import { IssueContextMenu } from '../common/IssueContextMenu';
import { useAssignIssueToMeMutation } from '../../api/queries';
import { useAuth } from '../../store';
import { formatShortDate } from '../../utils/date';
import {
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  ExternalLink,
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
      case 'FEATURE':
        return (
          <span title="Feature" className="inline-flex items-center text-[var(--md-sys-color-primary)]">
            <Sparkles className="w-4 h-4" />
          </span>
        );
      case 'IMPROVEMENT':
        return (
          <span title="Improvement" className="inline-flex items-center text-[var(--md-sys-color-tertiary)]">
            <Zap className="w-4 h-4" />
          </span>
        );
      case 'EPIC':
        return (
          <span title="Epic" className="inline-flex items-center text-[var(--md-sys-color-primary)]">
            <Flame className="w-4 h-4" />
          </span>
        );
      case 'SUBTASK':
      case 'TASK':
      default:
        return (
          <span title="Task" className="inline-flex items-center text-[var(--md-sys-color-secondary)]">
            <CheckSquare className="w-4 h-4" />
          </span>
        );
    }
  };

  const sorting = useMemo<SortingState>(() => {
    if (!sortBy) return [];
    return [{ id: sortBy, desc: sortOrder === 'desc' }];
  }, [sortBy, sortOrder]);

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
    if (next.length > 0) {
      onSortChange(next[0].id);
    }
  };

  const columns = useMemo<ColumnDef<IssueItem>[]>(() => [
    {
      id: 'key',
      accessorKey: 'key',
      header: 'Key',
      enableSorting: true,
      size: 110,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs whitespace-nowrap">
          <Link
            to={`/issues/${row.original.key}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[var(--md-sys-color-primary)] hover:underline"
          >
            {row.original.key}
          </Link>
        </span>
      ),
    },
    {
      id: 'issueType',
      accessorKey: 'issueType',
      header: 'Type',
      enableSorting: true,
      size: 70,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {renderTypeIcon(row.original.issueType)}
        </div>
      ),
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Summary',
      enableSorting: true,
      cell: ({ row }) => (
        <Link
          to={`/issues/${row.original.key}`}
          onClick={(e) => e.stopPropagation()}
          className="font-semibold text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition line-clamp-1"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      size: 140,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <StatusBadge
            status={row.original.status}
            interactive={Boolean(onUpdateStatus)}
            onStatusChange={(newStatus) => onUpdateStatus?.(row.original.id, newStatus)}
            size="sm"
          />
        </div>
      ),
    },
    {
      id: 'priority',
      accessorKey: 'priority',
      header: 'Priority',
      enableSorting: true,
      size: 110,
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} size="sm" />,
    },
    {
      id: 'sprint',
      header: 'Sprint',
      size: 130,
      cell: ({ row }) =>
        row.original.sprint?.name ? (
          <Badge variant="primary" className="text-[11px] font-medium rounded-full truncate max-w-[120px]">
            {row.original.sprint.name}
          </Badge>
        ) : (
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]/60 italic">
            Backlog
          </span>
        ),
    },
    {
      id: 'assignee',
      header: 'Assignee',
      size: 140,
      cell: ({ row }) =>
        row.original.assignee ? (
          <div onClick={(e) => e.stopPropagation()}>
            <UserIdentity
              userId={row.original.assignee.id}
              user={row.original.assignee}
              name={row.original.assignee.fullName}
              avatarUrl={row.original.assignee.avatarUrl}
              email={row.original.assignee.email}
              size="xs"
              showName
              nameClassName="max-w-[100px]"
            />
          </div>
        ) : (
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]/60 italic">
            Unassigned
          </span>
        ),
    },
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: 'Updated',
      enableSorting: true,
      size: 110,
      cell: ({ row }) => (
        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] whitespace-nowrap">
          {formatShortDate(row.original.updatedAt || row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 48,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Link
            to={`/issues/${row.original.key}`}
            title="Open Issue Page"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
    },
  ], [onUpdateStatus]);

  return (
    <>
      <DataTable
        columns={columns}
        data={issues}
        getRowId={(issue) => String(issue.id)}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        page={page}
        pageSize={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onLimitChange}
        onRowClick={onSelectIssue}
        onRowContextMenu={handleContextMenu}
        selectedRowId={selectedIssueId}
        emptyTitle="No issues found"
        emptyDescription="Try adjusting your search criteria or JQL query filter."
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
          onStatusChange={onUpdateStatus}
          onAssignToMe={handleAssignToMe}
          currentUserId={user?.id}
        />
      )}
    </>
  );
};
