import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { IssueItem, IssueStatus, IssueType } from '../../api/types/index.js';
import {
  useUpdateIssueStatusMutation,
  useCreateIssueMutation,
  useIssuesQuery,
} from '../../api/queries/index.js';
import { UserIdentity } from '../common/UserIdentity.js';
import {
  Card,
  Button,
  Badge,
  PriorityBadge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from '../ui/index.js';
import { IssueTypeIcon } from '../ui/IssueTypeIcon.js';
import { Zap, Plus, Check, X } from 'lucide-react';

interface IssueEpicChildrenSectionProps {
  issue: IssueItem;
  onIssuesChanged: () => void;
  onClose?: () => void;
}

export const IssueEpicChildrenSection: React.FC<IssueEpicChildrenSectionProps> = ({
  issue,
  onIssuesChanged,
  onClose,
}) => {
  const [childTitle, setChildTitle] = useState('');
  const [childType, setChildType] = useState<IssueType>('STORY');

  const statusMutation = useUpdateIssueStatusMutation();
  const createIssueMutation = useCreateIssueMutation();

  // Load child issues belonging to this epic with react-query
  const { data: issuesData } = useIssuesQuery({
    projectId: issue.projectId,
    epicId: issue.id,
    limit: 100,
  });

  const children = issuesData?.items ?? issue.epicIssues ?? [];
  const completedCount = children.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CLOSED',
  ).length;
  const progressPercent =
    children.length > 0 ? Math.round((completedCount / children.length) * 100) : 0;

  const handleToggleStatus = async (childId: number, currentStatus: IssueStatus) => {
    const nextStatus: IssueStatus =
      currentStatus === 'RESOLVED' || currentStatus === 'CLOSED' ? 'OPEN' : 'RESOLVED';
    await statusMutation.mutateAsync({ issueId: childId, status: nextStatus });
    onIssuesChanged();
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childTitle.trim() || !issue) return;

    await createIssueMutation.mutateAsync({
      projectId: issue.projectId,
      epicId: issue.id,
      title: childTitle.trim(),
      issueType: childType,
      priority: 'MEDIUM',
      sprintId: issue.sprintId,
    });

    setChildTitle('');
    onIssuesChanged();
  };

  return (
    <Card className="p-3.5 sm:p-4 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl space-y-3 shadow-xs">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
            Issues in this Epic
          </h3>
          {children.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
              {completedCount} / {children.length}
            </span>
          )}
          {children.length > 0 && (
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-medium hidden sm:inline">
              {progressPercent}% completed
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="h-7 w-7 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
              title="Collapse epic issues section"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {children.length > 0 && (
        <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--md-sys-color-primary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Child Issues List */}
      {children.length > 0 ? (
        <div className="space-y-1.5">
          {children.map((child) => {
            const isDone = child.status === 'RESOLVED' || child.status === 'CLOSED';
            return (
              <div
                key={child.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container)]/50 transition-colors border border-transparent hover:border-[var(--md-sys-color-outline-variant)]/40"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(child.id, child.status)}
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                        : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]'
                    }`}
                    title={isDone ? 'Mark as Open' : 'Mark as Done'}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="shrink-0">
                    <IssueTypeIcon type={child.issueType} />
                  </div>

                  <Link
                    to={`/issues/${child.key}`}
                    className="font-mono text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline shrink-0"
                  >
                    {child.key}
                  </Link>

                  <Link
                    to={`/issues/${child.key}`}
                    className={`text-xs truncate hover:underline ${
                      isDone
                        ? 'line-through text-[var(--md-sys-color-on-surface-variant)]'
                        : 'text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {child.title}
                  </Link>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={child.priority} size="xs" showLabel={false} />
                  <Badge
                    variant={isDone ? 'success' : child.status === 'IN_PROGRESS' ? 'primary' : 'neutral'}
                    size="sm"
                  >
                    {child.status.replace('_', ' ')}
                  </Badge>
                  {child.assignee && (
                    <UserIdentity
                      userId={child.assignee.id}
                      user={child.assignee}
                      name={child.assignee.fullName}
                      avatarUrl={child.assignee.avatarUrl}
                      size="xs"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic py-1">
          No stories or tasks linked to this epic yet. Add work items below.
        </p>
      )}

      {/* Inline Quick Add Form */}
      <form onSubmit={handleCreateChild} className="flex items-center gap-2 pt-1">
        <div className="w-28 shrink-0">
          <Select
            value={childType}
            onValueChange={(val) => setChildType(val as IssueType)}
          >
            <SelectTrigger size="sm" className="h-8 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STORY">Story</SelectItem>
              <SelectItem value="TASK">Task</SelectItem>
              <SelectItem value="BUG">Bug</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Input
            placeholder="What needs to be done in this epic?"
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
            className="h-8 text-xs rounded-xl"
          />
        </div>
        <Button
          type="submit"
          variant="tonal"
          size="sm"
          disabled={!childTitle.trim() || createIssueMutation.isPending}
          isLoading={createIssueMutation.isPending}
          className="shrink-0 text-xs h-8 px-3 rounded-xl"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </form>
    </Card>
  );
};
