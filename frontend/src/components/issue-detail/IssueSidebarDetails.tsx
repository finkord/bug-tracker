import React, { useState } from 'react';
import type { IssueItem, IssuePriority, IssueStatus, IssueType, UserProfile } from '../../api/types/index.js';
import {
  Card,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  StatusBadge,
  PriorityBadge,
  UserPicker,
} from '../ui/index.js';
import {
  Calendar,
  Layers,
  Tag,
  Box,
  Milestone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useAssigneesQuery,
  useProjectSprintsQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
} from '../../api/queries/index.js';

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
    reporterId: number;
    componentId: number | null;
    fixVersionId: number | null;
  }>) => Promise<void>;
}

export const IssueSidebarDetails: React.FC<IssueSidebarDetailsProps> = ({
  issue,
  currentUser,
  onAssignToMe: _onAssignToMe,
  onSprintChange,
  onStatusChange,
  onUpdateFields,
}) => {
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const { data: assigneesData } = useAssigneesQuery({ limit: 100 });
  const { data: sprints = [] } = useProjectSprintsQuery(issue.projectId);
  const { data: components = [] } = useProjectComponentsQuery(issue.projectId);
  const { data: versions = [] } = useProjectVersionsQuery(issue.projectId);

  const assignees = assigneesData?.items || [];

  const handleFieldChange = async (fieldName: string, changeFn: () => Promise<void>) => {
    setUpdatingField(fieldName);
    try {
      await changeFn();
    } finally {
      setUpdatingField(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Unified High-Density Properties Card (Linear & Jira standard) */}
      <Card className="p-4 space-y-4 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Properties
          </h3>
          {updatingField && (
            <div className="flex items-center gap-1 text-[11px] text-[var(--md-sys-color-primary)] font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
        </div>

        <div className="space-y-3 text-xs">
          {/* Status & Priority Row with Universal Badges */}
          <div className="grid grid-cols-2 gap-2">
            {/* Status */}
            <div className="space-y-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 font-medium text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                Status
              </span>
              <div>
                <StatusBadge
                  status={issue.status}
                  interactive={Boolean(onStatusChange)}
                  onStatusChange={(newStatus) =>
                    onStatusChange && handleFieldChange('status', () => onStatusChange(newStatus))
                  }
                  size="sm"
                  className="w-full justify-between"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 font-medium text-[11px]">
                <AlertTriangle className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                Priority
              </span>
              <div>
                <PriorityBadge
                  priority={issue.priority}
                  interactive={Boolean(onUpdateFields)}
                  onPriorityChange={(newPriority) =>
                    onUpdateFields &&
                    handleFieldChange('priority', () =>
                      onUpdateFields({ priority: newPriority as IssuePriority }),
                    )
                  }
                  size="sm"
                  className="w-full justify-between"
                />
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1 pt-1">
            <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium text-[11px]">
              Assignee
            </span>
            {onUpdateFields ? (
              <UserPicker
                value={issue.assignee?.id ?? null}
                fallbackUser={issue.assignee}
                onChange={(userId) => {
                  handleFieldChange('assignee', () =>
                    onUpdateFields({ assigneeId: userId }),
                  );
                }}
                users={assignees}
                currentUserId={currentUser?.id}
                currentUser={
                  currentUser
                    ? {
                        id: currentUser.id,
                        fullName: currentUser.fullName,
                        email: currentUser.email,
                        avatarUrl: currentUser.avatarUrl,
                        systemRole: currentUser.systemRole,
                      }
                    : null
                }
                placeholder="Unassigned"
                showAssignToMe
                showProfileOnAvatar
                size="md"
                className="w-full"
              />
            ) : (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)]">
                <span className="text-xs text-[var(--md-sys-color-on-surface)] font-medium">
                  {issue.assignee?.fullName || 'Unassigned'}
                </span>
              </div>
            )}
          </div>

          {/* Reporter (Editable via UserPicker, Linear/Jira Standard) */}
          <div className="space-y-1 pt-1">
            <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium text-[11px]">
              Reporter
            </span>
            {onUpdateFields ? (
              <UserPicker
                value={issue.reporter?.id ?? null}
                fallbackUser={issue.reporter}
                onChange={(userId) => {
                  if (userId && onUpdateFields) {
                    handleFieldChange('reporter', () =>
                      onUpdateFields({ reporterId: userId }),
                    );
                  }
                }}
                users={assignees}
                currentUserId={currentUser?.id}
                currentUser={
                  currentUser
                    ? {
                        id: currentUser.id,
                        fullName: currentUser.fullName,
                        email: currentUser.email,
                        avatarUrl: currentUser.avatarUrl,
                        systemRole: currentUser.systemRole,
                      }
                    : null
                }
                placeholder="Select reporter"
                showAssignToMe={false}
                allowUnassigned={false}
                showProfileOnAvatar
                size="md"
                className="w-full"
              />
            ) : (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)]">
                <span className="text-xs text-[var(--md-sys-color-on-surface)] font-medium">
                  {issue.reporter?.fullName || 'Author'}
                </span>
              </div>
            )}
          </div>

          {/* Sprint */}
          <div className="space-y-1 pt-1">
            <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
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
            <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
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
            <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
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

          {/* Issue Type */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
              <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              Issue Type
            </span>
            <Badge variant="neutral" className="text-[11px] font-mono">
              {issue.issueType}
            </Badge>
          </div>

          {/* Labels */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
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
    </div>
  );
};
