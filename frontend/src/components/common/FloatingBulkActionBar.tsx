import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  User,
  Zap,
  Trash2,
  X,
  Layers,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useIssueSelectionStore } from '../../store/useIssueSelectionStore';
import { useBulkUpdateIssuesMutation, useBulkDeleteIssuesMutation } from '../../api/queries/useIssuesQuery';
import { useAssigneesQuery } from '../../api/queries/useUsersQuery';
import { useProjectSprintsQuery } from '../../api/queries/useSprintsQuery';
import { Dropdown, type DropdownMenuItemConfig } from '../ui/Dropdown';
import type { IssueStatus, IssuePriority } from '../../api/types/issues.types';

export interface FloatingBulkActionBarProps {
  projectId?: number;
  onActionComplete?: () => void;
}

export const FloatingBulkActionBar: React.FC<FloatingBulkActionBarProps> = ({
  projectId,
  onActionComplete,
}) => {
  const { selectedIds, clearSelection } = useIssueSelectionStore();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const bulkUpdateMutation = useBulkUpdateIssuesMutation();
  const bulkDeleteMutation = useBulkDeleteIssuesMutation();

  const { data: assigneesData } = useAssigneesQuery({ limit: 100 });
  const assignees = assigneesData?.items ?? [];
  const { data: sprints = [] } = useProjectSprintsQuery(projectId);

  const selectedCount = selectedIds.size;
  const isPending = bulkUpdateMutation.isPending || bulkDeleteMutation.isPending;

  // Pressing Escape clears active selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCount > 0) {
        clearSelection();
        setIsConfirmingDelete(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, clearSelection]);

  if (selectedCount === 0) {
    return null;
  }

  const issueIds = Array.from(selectedIds);

  const handleUpdateStatus = (status: IssueStatus) => {
    bulkUpdateMutation.mutate(
      { issueIds, status },
      {
        onSuccess: () => {
          clearSelection();
          onActionComplete?.();
        },
      },
    );
  };

  const handleUpdatePriority = (priority: IssuePriority) => {
    bulkUpdateMutation.mutate(
      { issueIds, priority },
      {
        onSuccess: () => {
          clearSelection();
          onActionComplete?.();
        },
      },
    );
  };

  const handleUpdateAssignee = (assigneeId: number | null) => {
    bulkUpdateMutation.mutate(
      { issueIds, assigneeId },
      {
        onSuccess: () => {
          clearSelection();
          onActionComplete?.();
        },
      },
    );
  };

  const handleUpdateSprint = (sprintId: number | null) => {
    bulkUpdateMutation.mutate(
      { issueIds, sprintId },
      {
        onSuccess: () => {
          clearSelection();
          onActionComplete?.();
        },
      },
    );
  };

  const handleDeleteIssues = () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    bulkDeleteMutation.mutate(
      { issueIds },
      {
        onSuccess: () => {
          setIsConfirmingDelete(false);
          clearSelection();
          onActionComplete?.();
        },
      },
    );
  };

  const statusItems: DropdownMenuItemConfig[] = [
    { label: 'To Do', onClick: () => handleUpdateStatus('OPEN') },
    { label: 'In Progress', onClick: () => handleUpdateStatus('IN_PROGRESS') },
    { label: 'Code Review', onClick: () => handleUpdateStatus('REVIEW') },
    { label: 'Resolved', onClick: () => handleUpdateStatus('RESOLVED') },
    { label: 'Closed', onClick: () => handleUpdateStatus('CLOSED') },
  ];

  const priorityItems: DropdownMenuItemConfig[] = [
    { label: 'Low', onClick: () => handleUpdatePriority('LOW') },
    { label: 'Medium', onClick: () => handleUpdatePriority('MEDIUM') },
    { label: 'High', onClick: () => handleUpdatePriority('HIGH') },
    { label: 'Critical', onClick: () => handleUpdatePriority('CRITICAL') },
  ];

  const assigneeItems: DropdownMenuItemConfig[] = [
    { label: 'Unassigned', onClick: () => handleUpdateAssignee(null) },
    ...(assignees.length > 0
      ? [
          { divider: true, label: '' },
          ...assignees.slice(0, 20).map((u) => ({
            label: u.fullName || u.email,
            onClick: () => handleUpdateAssignee(u.id),
          })),
        ]
      : []),
  ];

  const sprintItems: DropdownMenuItemConfig[] = [
    { label: 'Backlog (No Sprint)', onClick: () => handleUpdateSprint(null) },
    ...(sprints.length > 0
      ? [
          { divider: true, label: '' },
          ...sprints.map((s) => ({
            label: s.name,
            onClick: () => handleUpdateSprint(s.id),
          })),
        ]
      : []),
  ];

  return (
    <div
      role="region"
      aria-label="Bulk actions toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-150"
    >
      {/* Selected counter */}
      <div className="flex items-center gap-2 pr-2 border-r border-[var(--md-sys-color-outline-variant)]">
        <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
        <span className="text-xs font-semibold whitespace-nowrap">
          {selectedCount} selected
        </span>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--md-sys-color-primary)]" />
          <span>Applying changes...</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status Dropdown */}
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Status</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            }
            items={statusItems}
            align="center"
          />

          {/* Priority Dropdown */}
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
              >
                <AlertCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-secondary)]" />
                <span>Priority</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            }
            items={priorityItems}
            align="center"
          />

          {/* Assignee Dropdown */}
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
              >
                <User className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
                <span>Assignee</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            }
            items={assigneeItems}
            align="center"
          />

          {/* Sprint Dropdown */}
          {projectId && (
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
                >
                  <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-secondary)]" />
                  <span>Sprint</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              }
              items={sprintItems}
              align="center"
            />
          )}

          {/* Bulk Delete Button */}
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={handleDeleteIssues}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-error)]"
              >
                Confirm Delete ({selectedCount})
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1.5 text-xs rounded-lg hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] transition-colors"
                title="Cancel deletion"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDeleteIssues}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-error)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-error)]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

      {/* Clear selection */}
      <button
        type="button"
        onClick={() => {
          clearSelection();
          setIsConfirmingDelete(false);
        }}
        className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] ml-1"
        title="Deselect all (Esc)"
        aria-label="Deselect all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
