import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { IssueItem, IssueStatus } from '../../api/types/index.js';
import {
  useUpdateIssueStatusMutation,
  useCreateIssueMutation,
} from '../../api/queries/index.js';
import { Avatar } from '../common/Avatar.js';
import { Card, Button, Badge } from '../ui/index.js';
import { GitCommitHorizontal, Plus, Check, CornerDownRight } from 'lucide-react';

interface IssueSubtasksSectionProps {
  issue: IssueItem;
  onSubtasksChanged: () => void;
}

export const IssueSubtasksSection: React.FC<IssueSubtasksSectionProps> = ({
  issue,
  onSubtasksChanged,
}) => {
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const statusMutation = useUpdateIssueStatusMutation();
  const createIssueMutation = useCreateIssueMutation();

  const handleToggleSubtask = async (subtaskId: number, currentStatus: IssueStatus) => {
    const nextStatus: IssueStatus =
      currentStatus === 'RESOLVED' || currentStatus === 'CLOSED' ? 'OPEN' : 'RESOLVED';
    await statusMutation.mutateAsync({ issueId: subtaskId, status: nextStatus });
    onSubtasksChanged();
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim() || !issue) return;

    await createIssueMutation.mutateAsync({
      projectId: issue.projectId,
      title: subtaskTitle.trim(),
      parentId: issue.id,
      issueType: 'SUBTASK',
      priority: issue.priority,
      sprintId: issue.sprintId,
    });

    setSubtaskTitle('');
    onSubtasksChanged();
  };

  if (issue.issueType === 'SUBTASK') {
    if (!issue.parent) return null;
    return (
      <Card className="p-4 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <CornerDownRight className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
          <span className="font-medium">Subtask of:</span>
          <Link
            to={`/issues/${issue.parent.key}`}
            className="font-mono font-bold text-[var(--md-sys-color-primary)] hover:underline"
          >
            {issue.parent.key}
          </Link>
          <span className="truncate text-[var(--md-sys-color-on-surface)] font-medium">
            {issue.parent.title}
          </span>
        </div>
      </Card>
    );
  }

  const subtasks = issue.subtasks || [];
  const completedCount = subtasks.filter(
    (s) => s.status === 'RESOLVED' || s.status === 'CLOSED',
  ).length;
  const progressPercent =
    subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <Card className="p-5 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommitHorizontal className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
            Subtasks
          </h3>
          {subtasks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
              {completedCount} / {subtasks.length}
            </span>
          )}
        </div>

        {subtasks.length > 0 && (
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
            {progressPercent}% completed
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--md-sys-color-primary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Subtasks List */}
      {subtasks.length > 0 ? (
        <div className="space-y-2 divide-y divide-[var(--md-sys-color-outline-variant)]/30">
          {subtasks.map((subtask) => {
            const isDone = subtask.status === 'RESOLVED' || subtask.status === 'CLOSED';
            return (
              <div
                key={subtask.id}
                className="flex items-center justify-between gap-3 pt-2 first:pt-0 group hover:bg-[var(--md-sys-color-surface-container)]/50 px-2 py-1.5 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(subtask.id, subtask.status)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                        : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]'
                    }`}
                    title={isDone ? 'Mark as Open' : 'Mark as Done'}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <Link
                    to={`/issues/${subtask.key}`}
                    className="font-mono text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline shrink-0"
                  >
                    {subtask.key}
                  </Link>

                  <Link
                    to={`/issues/${subtask.key}`}
                    className={`text-xs truncate hover:underline ${
                      isDone
                        ? 'line-through text-[var(--md-sys-color-on-surface-variant)]'
                        : 'text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {subtask.title}
                  </Link>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={isDone ? 'success' : subtask.status === 'IN_PROGRESS' ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {subtask.status.replace('_', ' ')}
                  </Badge>
                  {subtask.assignee && (
                    <Avatar
                      name={subtask.assignee.fullName}
                      avatarUrl={subtask.assignee.avatarUrl}
                      size="xs"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
          No subtasks yet. Break this task down into smaller actionable steps.
        </p>
      )}

      {/* Inline Quick Add Form */}
      <form onSubmit={handleCreateSubtask} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Add a subtask..."
          value={subtaskTitle}
          onChange={(e) => setSubtaskTitle(e.target.value)}
          className="flex-1 text-xs px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
        />
        <Button
          type="submit"
          variant="tonal"
          size="sm"
          disabled={!subtaskTitle.trim() || createIssueMutation.isPending}
          isLoading={createIssueMutation.isPending}
          className="shrink-0 text-xs h-8"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </form>
    </Card>
  );
};
