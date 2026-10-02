import React, { useState } from 'react';
import type { IssueItem, IssuePriority, IssueStatus, IssueType, UserProfile } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import { UserProfilePopover } from '../common/UserProfilePopover.js';
import {
  Card,
  Badge,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/index.js';
import {
  UserCheck,
  Calendar,
  Layers,
  UserPlus,
  Tag,
  Box,
  Milestone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  useAssigneesQuery,
  useProjectSprintsQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
} from '../../api/queries';

interface IssueSidebarDetailsProps {
  issue: IssueItem;
  currentUser: UserProfile | null;
  onAssignToMe: () => Promise<void>;
  onSprintChange?: (sprintId: number | null) => Promise<void>;
  onStatusChange?: (status: IssueStatus) => Promise<void>;
  onUpdateFields?: (data: Partial<{
    priority: IssuePriority;
    issueType: IssueType;
    assigneeId: number | null;
    componentId: number | null;
    fixVersionId: number | null;
  }>) => Promise<void>;
}

export const IssueSidebarDetails: React.FC<IssueSidebarDetailsProps> = ({
  issue,
  currentUser,
  onAssignToMe,
  onSprintChange,
  onStatusChange,
  onUpdateFields,
}) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const { data: assigneesData } = useAssigneesQuery(issue.projectId);
  const { data: sprints = [] } = useProjectSprintsQuery(issue.projectId);
  const { data: components = [] } = useProjectComponentsQuery(issue.projectId);
  const { data: versions = [] } = useProjectVersionsQuery(issue.projectId);

  const assignees = assigneesData?.items || [];
  const isAssignedToMe = currentUser && issue.assignee?.id === currentUser.id;

  const handleAssignMeClick = async () => {
    setIsAssigning(true);
    try {
      await onAssignToMe();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleFieldChange = async (fieldName: string, changeFn: () => Promise<void>) => {
    setUpdatingField(fieldName);
    try {
      await changeFn();
    } finally {
      setUpdatingField(null);
    }
  };

  const getPriorityBadgeVariant = (priority: string): NonNullable<React.ComponentProps<typeof Badge>['variant']> => {
    switch (priority) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'high';
      case 'MEDIUM':
        return 'medium';
      default:
        return 'low';
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
          Attributes & Details
        </h3>
        {updatingField && (
          <div className="flex items-center gap-1 text-[11px] text-[var(--md-sys-color-primary)] font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Status */}
        <div className="space-y-1">
          <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Status
          </span>
          {onStatusChange ? (
            <Select
              value={issue.status}
              onValueChange={(val) =>
                handleFieldChange('status', () => onStatusChange(val as IssueStatus))
              }
            >
              <SelectTrigger size="sm" className="h-8 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">In Review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="neutral" className="text-[11px] font-semibold">
              {issue.status}
            </Badge>
          )}
        </div>

        {/* Assignee */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              Assignee
            </span>
            <div className="flex items-center gap-2">
              {issue.assignee && (
                <UserProfilePopover user={issue.assignee}>
                  <span className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer">
                    Profile
                  </span>
                </UserProfilePopover>
              )}
              {currentUser && !isAssignedToMe && (
                <button
                  type="button"
                  onClick={handleAssignMeClick}
                  disabled={isAssigning}
                  className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                  <span>Assign to me</span>
                </button>
              )}
            </div>
          </div>

          {onUpdateFields ? (
            <Select
              value={issue.assignee ? String(issue.assignee.id) : 'unassigned'}
              onValueChange={(val) =>
                handleFieldChange('assignee', () =>
                  onUpdateFields({ assigneeId: val === 'unassigned' ? null : Number(val) }),
                )
              }
            >
              <SelectTrigger size="sm" className="h-8 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {currentUser && (
                  <SelectItem value={String(currentUser.id)}>
                    {currentUser.fullName} (Assign to Me)
                  </SelectItem>
                )}
                {assignees
                  .filter((a) => a.id !== currentUser?.id)
                  .map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-1.5">
              {issue.assignee ? (
                <UserProfilePopover user={issue.assignee}>
                  <div className="flex items-center gap-1.5 cursor-pointer group">
                    <Avatar
                      name={issue.assignee.fullName}
                      avatarUrl={issue.assignee.avatarUrl || undefined}
                      size="sm"
                      className="w-5 h-5 text-[10px]"
                    />
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] group-hover:underline">
                      {issue.assignee.fullName}
                    </span>
                  </div>
                </UserProfilePopover>
              ) : (
                <span className="text-[var(--md-sys-color-on-surface-variant)] italic">Unassigned</span>
              )}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-1 pt-1">
          <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Priority
          </span>
          {onUpdateFields ? (
            <Select
              value={issue.priority}
              onValueChange={(val) =>
                handleFieldChange('priority', () =>
                  onUpdateFields({ priority: val as IssuePriority }),
                )
              }
            >
              <SelectTrigger size="sm" className="h-8 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRITICAL">Critical / P0</SelectItem>
                <SelectItem value="HIGH">High / P1</SelectItem>
                <SelectItem value="MEDIUM">Medium / P2</SelectItem>
                <SelectItem value="LOW">Low / P3</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={getPriorityBadgeVariant(issue.priority)} className="text-[11px] px-2 py-0.5">
              {issue.priority}
            </Badge>
          )}
        </div>

        {/* Sprint */}
        <div className="space-y-1 pt-1">
          <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Sprint
          </span>
          {onSprintChange ? (
            <Select
              value={issue.sprintId ? String(issue.sprintId) : 'backlog'}
              onValueChange={(val) =>
                handleFieldChange('sprint', () =>
                  onSprintChange(val === 'backlog' ? null : Number(val)),
                )
              }
            >
              <SelectTrigger size="sm" className="h-8 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-medium text-[var(--md-sys-color-on-surface)] block">
              {issue.sprint?.name || <span className="text-[var(--md-sys-color-on-surface-variant)] italic">Backlog</span>}
            </span>
          )}
        </div>

        {/* Component */}
        <div className="space-y-1 pt-1">
          <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium">
            <Box className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Component
          </span>
          {onUpdateFields && components.length > 0 ? (
            <Select
              value={issue.componentId ? String(issue.componentId) : 'none'}
              onValueChange={(val) =>
                handleFieldChange('component', () =>
                  onUpdateFields({ componentId: val === 'none' ? null : Number(val) }),
                )
              }
            >
              <SelectTrigger size="sm" className="h-8 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {components.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-medium text-[var(--md-sys-color-on-surface)] block">
              {issue.component?.name || <span className="text-[var(--md-sys-color-on-surface-variant)] italic">None</span>}
            </span>
          )}
        </div>

        {/* Fix Version */}
        <div className="space-y-1 pt-1">
          <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium">
            <Milestone className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Fix Version
          </span>
          {onUpdateFields && versions.length > 0 ? (
            <Select
              value={issue.fixVersionId ? String(issue.fixVersionId) : 'none'}
              onValueChange={(val) =>
                handleFieldChange('fixVersion', () =>
                  onUpdateFields({ fixVersionId: val === 'none' ? null : Number(val) }),
                )
              }
            >
              <SelectTrigger size="sm" className="h-8 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.name} ({v.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-medium text-[var(--md-sys-color-on-surface)] block">
              {issue.fixVersion?.name || <span className="text-[var(--md-sys-color-on-surface-variant)] italic">None</span>}
            </span>
          )}
        </div>

        {/* Reporter */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium">Reporter</span>
          <UserProfilePopover user={issue.reporter}>
            <div className="flex items-center gap-1.5 cursor-pointer group">
              <Avatar
                name={issue.reporter.fullName}
                avatarUrl={issue.reporter.avatarUrl || undefined}
                size="sm"
                className="w-5 h-5 text-[10px]"
              />
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] group-hover:underline">
                {issue.reporter.fullName}
              </span>
            </div>
          </UserProfilePopover>
        </div>

        {/* Issue Type */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium">
            <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Issue Type
          </span>
          <Badge variant="neutral" className="text-[11px] font-mono">
            {issue.issueType}
          </Badge>
        </div>

        {/* Labels */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium">
            <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Labels
          </span>
          <div className="flex flex-wrap gap-1">
            {issue.labels && issue.labels.length > 0 ? (
              issue.labels.map((lbl) => (
                <span
                  key={lbl}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40"
                >
                  {lbl}
                </span>
              ))
            ) : (
              <span className="text-[var(--md-sys-color-on-surface-variant)] italic">None</span>
            )}
          </div>
        </div>

        <div className="h-px bg-[var(--md-sys-color-outline-variant)]/30 my-2" />

        {/* Created At */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
            Created
          </span>
          <span className="text-[var(--md-sys-color-on-surface-variant)] font-mono">
            {new Date(issue.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Updated At */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Updated</span>
          <span className="text-[var(--md-sys-color-on-surface-variant)] font-mono">
            {new Date(issue.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
};
