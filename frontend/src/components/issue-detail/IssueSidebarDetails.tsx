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
  PriorityBadge,
  StatusBadge,
  UserPicker,
  Button,
  Dropdown,
  type DropdownMenuItemConfig,
} from '../ui/index.js';
import {
  Calendar,
  Layers,
  Tags,
  Box,
  Milestone,
  AlertTriangle,
  Loader2,
  SlidersHorizontal,
  Clock,
  Plus,
  MoreHorizontal,
  Trash2,
  Share2,
  Check,
  Radio,
  Pencil,
  Zap,
  CornerDownRight,
} from 'lucide-react';
import {
  useAssigneesQuery,
  useProjectSprintsQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
  useMyProjectPermissionsQuery,
  useIssuesQuery,
} from '../../api/queries/index.js';
import { IssueTypeIcon } from '../ui/IssueTypeIcon.js';
import { Avatar } from '../common/Avatar.js';
import { UserProfilePopover } from '../common/UserProfilePopover.js';

interface IssueSidebarDetailsProps {
  issue: IssueItem;
  currentUser: UserProfile | null;
  activeViewers?: Array<{ id: number; fullName: string; avatarUrl?: string }>;
  onAssignToMe: () => Promise<void>;
  onSprintChange?: (sprintId: number | null) => Promise<void>;
  onStatusChange?: (status: IssueStatus) => Promise<void>;
  onDeleteClick?: () => void;
  onUpdateFields?: (data: Partial<{
    priority: IssuePriority;
    issueType: IssueType;
    assigneeId: number | null;
    reporterId: number;
    componentId: number | null;
    fixVersionId: number | null;
    estimatedHours: number;
    epicId: number | null;
    parentId: number | null;
  }>) => Promise<void>;
  onOpenLogWorkModal?: () => void;
  onViewWorklogsTab?: () => void;
}

export const IssueSidebarDetails: React.FC<IssueSidebarDetailsProps> = ({
  issue,
  currentUser,
  activeViewers = [],
  onAssignToMe: _onAssignToMe,
  onSprintChange,
  onStatusChange,
  onDeleteClick,
  onUpdateFields,
  onOpenLogWorkModal,
  onViewWorklogsTab,
}) => {
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [estimateDraft, setEstimateDraft] = useState(String(issue.estimatedHours || ''));

  const handleSaveEstimate = async () => {
    setIsEditingEstimate(false);
    const parsed = Math.max(0, parseFloat(estimateDraft.trim()) || 0);
    if (parsed === (issue.estimatedHours || 0)) return;
    if (onUpdateFields) {
      await handleFieldChange('estimate', () =>
        onUpdateFields({ estimatedHours: parsed }),
      );
    }
  };

  const { data: assigneesData } = useAssigneesQuery({ limit: 100 });
  const { data: sprints = [] } = useProjectSprintsQuery(issue.projectId);
  const { data: components = [] } = useProjectComponentsQuery(issue.projectId);
  const { data: versions = [] } = useProjectVersionsQuery(issue.projectId);
  const { data: projectPermissions } = useMyProjectPermissionsQuery(issue.projectId);
  const { data: epicsData } = useIssuesQuery({ projectId: issue.projectId, issueType: 'EPIC', limit: 100 });
  const epics = epicsData?.items ?? [];

  const isSystemAdmin = Boolean(currentUser?.isAdmin || currentUser?.systemRole === 'ADMIN');
  const hasProjectAdmin = Boolean(projectPermissions?.ADMINISTER_PROJECTS);
  const hasDeletePermission = Boolean(projectPermissions?.DELETE_ISSUES);

  const isReporter = Boolean(
    currentUser && issue.reporter?.id === currentUser.id,
  );
  const isUnstarted = issue.status === 'OPEN';
  const hasZeroWorklogs = !issue.loggedHours || Number(issue.loggedHours) === 0;
  const isWithin24Hours = issue.createdAt
    ? Date.now() - new Date(issue.createdAt).getTime() <= 24 * 60 * 60 * 1000
    : false;
  const isReporterGracePeriod = isReporter && isUnstarted && hasZeroWorklogs && isWithin24Hours;

  const canDelete = Boolean(
    currentUser &&
      (isSystemAdmin || hasProjectAdmin || hasDeletePermission || isReporterGracePeriod),
  );

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/issues/${issue.key}`;
      await navigator.clipboard.writeText(url);
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 2000);
    } catch {
      // Ignored
    }
  };

  const dropdownItems: DropdownMenuItemConfig[] = [
    {
      label: hasCopiedLink ? 'Link Copied!' : 'Copy Link to Issue',
      icon: hasCopiedLink ? <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" /> : <Share2 className="w-3.5 h-3.5" />,
      onClick: handleCopyLink,
    },
  ];

  if (canDelete && onDeleteClick) {
    dropdownItems.push(
      { label: '', divider: true },
      {
        label: 'Delete Issue',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        onClick: onDeleteClick,
        danger: true,
      },
    );
  }

  const assignees = assigneesData?.items || [];

  const handleFieldChange = async (fieldName: string, changeFn: () => Promise<void>) => {
    setUpdatingField(fieldName);
    try {
      await changeFn();
    } finally {
      setUpdatingField(null);
    }
  };

  const estimated = issue.estimatedHours || 0;
  const logged = issue.loggedHours || 0;
  const progressPercent = estimated > 0 ? Math.min(Math.round((logged / estimated) * 100), 100) : 0;
  const isOverEstimated = logged > estimated && estimated > 0;

  return (
    <div className="space-y-4">
      {/* High-Density Unified Inspector Dock */}
      <Card className="p-4 space-y-4 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            Details & Properties
          </h3>
          <div className="flex items-center gap-1.5">
            {updatingField && (
              <div className="flex items-center gap-1 text-[11px] text-[var(--md-sys-color-primary)] font-medium mr-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            <Dropdown
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                  title="More actions"
                  aria-label="More issue actions"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              }
              items={dropdownItems}
            />
          </div>
        </div>

        {/* Active Viewers Indicator */}
        {activeViewers.length > 0 && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="w-3 h-3 text-[var(--md-sys-color-primary)] animate-pulse" />
              Viewing:
            </span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {activeViewers.map((viewer) => (
                <UserProfilePopover key={viewer.id} user={viewer}>
                  <div className="inline-block ring-2 ring-[var(--md-sys-color-surface)] rounded-full cursor-pointer hover:ring-[var(--md-sys-color-primary)] transition-all">
                    <Avatar
                      name={viewer.fullName}
                      avatarUrl={viewer.avatarUrl || undefined}
                      size="sm"
                      className="w-5 h-5 text-[10px]"
                    />
                  </div>
                </UserProfilePopover>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3.5 text-xs">
          {/* Status Cockpit */}
          <div className="space-y-1">
            <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium text-[11px]">
              Status
            </span>
            <div>
              <StatusBadge
                status={issue.status}
                interactive={Boolean(onStatusChange)}
                onStatusChange={
                  onStatusChange
                    ? (newStatus) => {
                        handleFieldChange('status', () =>
                          onStatusChange(newStatus as IssueStatus),
                        );
                      }
                    : undefined
                }
                size="sm"
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

          {/* Assignee */}
          <div className="space-y-1">
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

          {/* Reporter */}
          <div className="space-y-1">
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
          <div className="space-y-1">
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

          {/* Epic Link (for non-Epic issues) */}
          {issue.issueType !== 'EPIC' && (
            <div className="space-y-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
                <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
                Epic Link
              </span>
              {onUpdateFields && epics.length > 0 ? (
                <Select
                  value={issue.epicId ? String(issue.epicId) : 'none'}
                  onValueChange={(val) =>
                    handleFieldChange('epic', () =>
                      onUpdateFields({ epicId: val === 'none' ? null : Number(val) }),
                    )
                  }
                >
                  <SelectTrigger size="sm" className="h-8 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Epic</SelectItem>
                    {epics.map((ep) => (
                      <SelectItem key={ep.id} value={String(ep.id)}>
                        {ep.key} - {ep.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="font-medium text-[var(--md-sys-color-on-surface)] block text-xs">
                  {issue.epic ? (
                    <a
                      href={`/issues/${issue.epic.key}`}
                      className="text-[var(--md-sys-color-primary)] hover:underline font-mono"
                    >
                      {issue.epic.key} - {issue.epic.title}
                    </a>
                  ) : (
                    <span className="text-[var(--md-sys-color-on-surface-variant)] italic">No Epic</span>
                  )}
                </span>
              )}
            </div>
          )}

          {/* Parent Issue (for Subtasks) */}
          {issue.issueType === 'SUBTASK' && issue.parent && (
            <div className="space-y-1">
              <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
                <CornerDownRight className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                Parent Issue
              </span>
              <a
                href={`/issues/${issue.parent.key}`}
                className="font-medium text-xs font-mono text-[var(--md-sys-color-primary)] hover:underline block truncate"
              >
                {issue.parent.key} - {issue.parent.title}
              </a>
            </div>
          )}

          {/* Component */}
          <div className="space-y-1">
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
          <div className="space-y-1">
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

          {/* Issue Type (Distinct Icon with Interactive Select) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
              <IssueTypeIcon type={issue.issueType} />
              Issue Type
            </span>
            {onUpdateFields && issue.issueType !== 'SUBTASK' ? (
              <Select
                value={issue.issueType}
                onValueChange={(val) =>
                  handleFieldChange('issueType', () =>
                    onUpdateFields({ issueType: val as IssueType }),
                  )
                }
              >
                <SelectTrigger size="sm" aria-label="Change issue type" className="h-7 w-auto min-w-[90px] rounded-lg bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-[var(--md-sys-color-outline-variant)]/40 px-2 py-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TASK">
                    <div className="flex items-center gap-1.5">
                      <IssueTypeIcon type="TASK" />
                      <span>Task</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BUG">
                    <div className="flex items-center gap-1.5">
                      <IssueTypeIcon type="BUG" />
                      <span>Bug</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="STORY">
                    <div className="flex items-center gap-1.5">
                      <IssueTypeIcon type="STORY" />
                      <span>Story</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="EPIC">
                    <div className="flex items-center gap-1.5">
                      <IssueTypeIcon type="EPIC" />
                      <span>Epic</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="neutral" className="text-[11px] font-mono">
                {issue.issueType}
              </Badge>
            )}
          </div>

          {/* Labels (Tags Icon - distinct from Issue Type!) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 font-medium text-[11px]">
              <Tags className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
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
                <span className="text-[var(--md-sys-color-on-surface-variant)] italic">No labels</span>
              )}
            </div>
          </div>

          {/* Integrated Time Tracking Gauge */}
          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onViewWorklogsTab}
                className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
                title="View worklog history in activity section"
              >
                <Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Time Tracking</span>
              </button>
              {onOpenLogWorkModal && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onOpenLogWorkModal}
                  className="h-6 w-6 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/50"
                  title="Log time on this issue"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  {logged}h <span className="font-normal text-[var(--md-sys-color-on-surface-variant)]">logged</span>
                </span>

                {/* Inline Editable Original Estimate (Jira Standard) */}
                {isEditingEstimate ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.5"
                      value={estimateDraft}
                      onChange={(e) => setEstimateDraft(e.target.value)}
                      onBlur={handleSaveEstimate}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEstimate();
                        if (e.key === 'Escape') {
                          setEstimateDraft(String(issue.estimatedHours || ''));
                          setIsEditingEstimate(false);
                        }
                      }}
                      className="w-16 px-1.5 py-0.5 text-[11px] font-mono font-bold rounded-md bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                      autoFocus
                      placeholder="0"
                    />
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono">h</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEstimateDraft(String(issue.estimatedHours || ''));
                      setIsEditingEstimate(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer group/est p-0.5 -m-0.5 rounded-md hover:bg-[var(--md-sys-color-surface-container)]"
                    title="Click to edit original estimate"
                  >
                    <span>{estimated > 0 ? `${estimated}h estimate` : 'Set estimate'}</span>
                    <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/est:opacity-100 transition-opacity text-[var(--md-sys-color-primary)]" />
                  </button>
                )}
              </div>

              <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isOverEstimated
                      ? 'bg-[var(--md-sys-color-error)]'
                      : 'bg-[var(--md-sys-color-primary)]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                {estimated > 0 ? (
                  <>
                    <span>{progressPercent}% spent</span>
                    {isOverEstimated ? (
                      <span className="text-[var(--md-sys-color-error)] font-medium">
                        +{logged - estimated}h over
                      </span>
                    ) : (
                      <span>{Math.max(0, estimated - logged)}h remaining</span>
                    )}
                  </>
                ) : (
                  <span className="italic">No estimate configured</span>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                Created
              </span>
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-mono">
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Updated</span>
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-mono">
                {new Date(issue.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
