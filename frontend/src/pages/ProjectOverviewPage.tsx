import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useProjectsQuery,
  useIssuesQuery,
  useProjectSprintsQuery,
  useTeamsQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
  useAssignIssueToMeMutation,
  useUpdateIssueStatusMutation,
} from '../api/queries';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import { IssueContextMenu } from '../components/common/IssueContextMenu';
import { ProjectReleasesModal } from '../components/releases/ProjectReleasesModal';
import { UserIdentity } from '../components/common/UserIdentity';
import { Card, Button, Badge, EntityAvatar } from '../components/ui/index.js';
import { NotFoundPage } from './NotFoundPage';
import { useAuth } from '../store';
import type { IssueItem, IssuePriority, IssueStatus, SprintItem } from '../api/client';
import {
  Kanban,
  Layers,
  Settings,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Activity,
  Flame,
  Tag,
  Users2,
  FolderTree,
  ChevronRight,
  Shield,
  Search,
} from 'lucide-react';

const mapPriorityVariant = (
  priority?: IssuePriority,
): 'critical' | 'high' | 'medium' | 'low' | 'neutral' => {
  switch (priority) {
    case 'CRITICAL':
      return 'critical';
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'medium';
    case 'LOW':
      return 'low';
    default:
      return 'neutral';
  }
};

const mapStatusVariant = (
  status?: IssueStatus,
): 'open' | 'in-progress' | 'review' | 'resolved' | 'closed' | 'neutral' => {
  switch (status) {
    case 'OPEN':
      return 'open';
    case 'IN_PROGRESS':
      return 'in-progress';
    case 'REVIEW':
      return 'review';
    case 'RESOLVED':
      return 'resolved';
    case 'CLOSED':
      return 'closed';
    default:
      return 'neutral';
  }
};

export const ProjectOverviewPage: React.FC = () => {
  const { projectId: projectParam } = useParams<{ projectId?: string }>();
  const { user } = useAuth();
  const assignMutation = useAssignIssueToMeMutation();
  const updateStatusMutation = useUpdateIssueStatusMutation();

  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [isReleasesOpen, setIsReleasesOpen] = useState<boolean>(false);
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
      // Handled by query mutation state
    }
  };

  const handleStatusChange = async (issueId: number, status: IssueStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ issueId, status });
    } catch {
      // Handled by query mutation state
    }
  };

  const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery();

  // Dual resolution by key or numeric ID
  const project = useMemo(() => {
    if (!projectParam) return undefined;
    const num = Number(projectParam);
    if (!Number.isNaN(num)) {
      return projects.find((p) => p.id === num);
    }
    return projects.find((p) => p.key?.toUpperCase() === projectParam.toUpperCase());
  }, [projects, projectParam]);

  const effectiveProjectId = project?.id;
  const projectKey = project?.key || projectParam || '';

  // Issues query for this project
  const { data: issuesData, isLoading: issuesLoading } = useIssuesQuery(
    effectiveProjectId ? { projectId: effectiveProjectId, limit: 50 } : undefined,
  );

  // Sprints, Teams, Components, Versions queries
  const { data: sprints = [] } = useProjectSprintsQuery(effectiveProjectId);
  const { data: teams = [] } = useTeamsQuery(effectiveProjectId);
  const { data: components = [] } = useProjectComponentsQuery(effectiveProjectId);
  const { data: versions = [] } = useProjectVersionsQuery(effectiveProjectId);

  const unreleasedVersions = useMemo(
    () => versions.filter((v) => v.status === 'UNRELEASED'),
    [versions],
  );

  const issues = issuesData?.items ?? [];

  // Compute metrics
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  const inProgressIssues = issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'REVIEW').length;
  const openIssues = issues.filter((i) => i.status === 'OPEN').length;

  const completionPercent = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  const totalEstimatedHours = issues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const totalLoggedHours = issues.reduce((acc, i) => acc + (i.loggedHours || 0), 0);

  const criticalCount = issues.filter((i) => i.priority === 'CRITICAL').length;
  const highCount = issues.filter((i) => i.priority === 'HIGH').length;
  const mediumCount = issues.filter((i) => i.priority === 'MEDIUM').length;
  const lowCount = issues.filter((i) => i.priority === 'LOW').length;

  const activeSprint = sprints.find((s: SprintItem) => s.status === 'ACTIVE');

  if (projectsLoading) {
    return (
      <div className="w-full p-12 flex items-center justify-center text-xs text-[var(--md-sys-color-on-surface-variant)] animate-pulse">
        Loading project overview...
      </div>
    );
  }

  if (!project && !projectsLoading) {
    return (
      <NotFoundPage
        title="Project Workspace Not Found"
        description={`We could not find a project matching "${projectParam}". It may have been deleted, archived, or you may not have access.`}
        resourceType="Project"
        resourceId={projectParam}
      />
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 space-y-6 animate-in fade-in duration-200">
      {/* ─── Hero Header Card ─── */}
      <Card
        variant="outlined"
        padding="lg"
        rounded="2xl"
        className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <EntityAvatar
              name={project?.name || ''}
              projectKey={project?.key}
              avatarUrl={project?.avatarUrl}
              size="lg"
            />
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="neutral" size="sm" className="font-mono uppercase font-bold tracking-wider">
                  {project?.key}
                </Badge>
                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Created {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                {project?.name}
              </h1>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-2xl">
                {project?.description || 'No description provided for this project workspace.'}
              </p>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link to={`/projects/${projectKey}/board`}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Kanban className="w-3.5 h-3.5" />}
              >
                Board
              </Button>
            </Link>
            <Link to={`/projects/${projectKey}/backlog`}>
              <Button
                variant="outlined"
                size="sm"
                leftIcon={<Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
              >
                Backlog
              </Button>
            </Link>
            <Button
              type="button"
              variant="outlined"
              size="sm"
              onClick={() => setIsReleasesOpen(true)}
              leftIcon={<Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
            >
              Releases
            </Button>
            <Link to={`/projects/${projectKey}/settings`}>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Settings className="w-3.5 h-3.5" />}
                title="Project Settings"
              >
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Lead and Collaborators Strip */}
        <div className="flex flex-wrap items-center gap-4 pt-3.5 border-t border-[var(--md-sys-color-outline-variant)]/20 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--md-sys-color-on-surface)]">Lead:</span>
            {project?.lead ? (
              <UserIdentity
                userId={project.lead.id}
                user={project.lead}
                name={project.lead.fullName || project.lead.email}
                avatarUrl={project.lead.avatarUrl}
                email={project.lead.email}
                size="xs"
                showName
                showEmail
              />
            ) : (
              <span className="italic opacity-60">Unassigned</span>
            )}
          </div>
        </div>
      </Card>

      {/* ─── High-Level Progress & Health Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Issue Progress Meter */}
        <Card
          variant="outlined"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-2.5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span>Completion Rate</span>
            </span>
            <span className="font-mono text-sm font-black text-[var(--md-sys-color-primary)]">
              {completionPercent}%
            </span>
          </div>
          <div className="w-full bg-[var(--md-sys-color-surface-container-high)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--md-sys-color-primary)] h-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            <span>{resolvedIssues} of {totalIssues} completed</span>
            <span>{openIssues} to do • {inProgressIssues} in progress</span>
          </div>
        </Card>

        {/* Time Tracking Meter */}
        <Card
          variant="outlined"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-2.5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" />
              <span>Time Logged</span>
            </span>
            <span className="font-mono text-sm font-black text-[var(--md-sys-color-tertiary)]">
              {totalLoggedHours}h / {totalEstimatedHours}h
            </span>
          </div>
          <div className="w-full bg-[var(--md-sys-color-surface-container-high)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--md-sys-color-tertiary)] h-full transition-all duration-300"
              style={{
                width: `${totalEstimatedHours > 0 ? Math.min(100, Math.round((totalLoggedHours / totalEstimatedHours) * 100)) : 0}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            <span>Hours logged vs estimated</span>
            <span>
              {totalEstimatedHours > totalLoggedHours ? `${totalEstimatedHours - totalLoggedHours}h remaining` : 'On budget'}
            </span>
          </div>
        </Card>

        {/* Priority Breakdown */}
        <Card
          variant="outlined"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-2.5 shadow-2xs sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[var(--md-sys-color-error)]" />
              <span>Priority Breakdown</span>
            </span>
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {totalIssues} total
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-center">
              <div className="font-mono text-xs font-black text-[var(--md-sys-color-error)]">{criticalCount}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold">Crit</div>
            </div>
            <div className="flex-1 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-center">
              <div className="font-mono text-xs font-black text-[var(--md-sys-color-tertiary)]">{highCount}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold">High</div>
            </div>
            <div className="flex-1 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-center">
              <div className="font-mono text-xs font-black text-[var(--md-sys-color-primary)]">{mediumCount}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold">Med</div>
            </div>
            <div className="flex-1 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-center">
              <div className="font-mono text-xs font-black text-[var(--md-sys-color-outline)]">{lowCount}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold">Low</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Main Grid: Active Sprint & Recent Tickets ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Sprint + Recent Issues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sprint Launchpad */}
          <Card
            variant="outlined"
            padding="lg"
            rounded="2xl"
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>Active Sprint</span>
              </h2>
              {activeSprint && (
                <Badge variant="primary" size="sm">
                  ACTIVE
                </Badge>
              )}
            </div>

            {activeSprint ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    {activeSprint.name}
                  </h3>
                  {activeSprint.goal && (
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      Goal: {activeSprint.goal}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[var(--md-sys-color-outline-variant)]/20 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span>
                      {activeSprint.startDate ? new Date(activeSprint.startDate).toLocaleDateString() : 'N/A'} -{' '}
                      {activeSprint.endDate ? new Date(activeSprint.endDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <Link
                    to={`/projects/${projectKey}/board`}
                    className="inline-flex items-center gap-1 font-semibold text-[var(--md-sys-color-primary)] hover:underline"
                  >
                    <span>Open Active Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-5 text-center space-y-2">
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  No active sprint currently running for this project.
                </p>
                <Link
                  to={`/projects/${projectKey}/backlog`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline"
                >
                  <span>Plan and start a sprint in Backlog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </Card>

          {/* Recent Issues List */}
          <Card
            variant="outlined"
            padding="lg"
            rounded="2xl"
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
                  Recent Issues
                </h2>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Latest tasks and tickets active in this workspace
                </p>
              </div>
              <Link
                to={`/search?jql=${encodeURIComponent(`project = "${projectKey}"`)}`}
                className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1"
              >
                <span>View all in Search</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {issuesLoading ? (
              <div className="py-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] animate-pulse">
                Loading recent tickets...
              </div>
            ) : issues.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                No issues filed for this project yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {issues.slice(0, 8).map((issue) => (
                  <div
                    key={issue.id}
                    onContextMenu={(e) => handleContextMenu(e, issue)}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/20 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <a
                        href={`/issues/${issue.key}`}
                        onClick={(e) => {
                          if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                          e.preventDefault();
                          setSelectedIssueId(issue.id);
                        }}
                        className="font-mono text-[11px] font-black text-[var(--md-sys-color-primary)] hover:underline shrink-0 bg-[var(--md-sys-color-primary-container)]/50 px-2 py-0.5 rounded-lg"
                      >
                        {issue.key}
                      </a>
                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {issue.assignee ? (
                        <UserIdentity
                          userId={issue.assignee.id}
                          user={issue.assignee}
                          name={issue.assignee.fullName || 'User'}
                          avatarUrl={issue.assignee.avatarUrl}
                          size="xs"
                        />
                      ) : (
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]/60 italic hidden sm:inline">
                          Unassigned
                        </span>
                      )}

                      <Badge variant={mapPriorityVariant(issue.priority)} size="sm">
                        {issue.priority}
                      </Badge>
                      <Badge variant={mapStatusVariant(issue.status)} size="sm">
                        {issue.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Project Details & Fast Links */}
        <div className="space-y-6">
          {/* Release Milestone & Deployment Readiness Card */}
          <Card
            variant="outlined"
            padding="md"
            rounded="2xl"
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Release Milestone</span>
                </h2>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Deployment milestone & version readiness
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsReleasesOpen(true)}
                className="text-xs font-semibold text-[var(--md-sys-color-primary)]"
              >
                View All
              </Button>
            </div>

            {unreleasedVersions.length > 0 ? (
              <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[var(--md-sys-color-on-surface)]">
                      {unreleasedVersions[0].name}
                    </span>
                    <Badge variant="neutral" size="sm">
                      Unreleased
                    </Badge>
                  </div>
                  {unreleasedVersions[0].releaseDate && (
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                      Target: {unreleasedVersions[0].releaseDate}
                    </span>
                  )}
                </div>

                {unreleasedVersions[0].description && (
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">
                    {unreleasedVersions[0].description}
                  </p>
                )}

                <div className="pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/10 flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  <span>
                    {unreleasedVersions[0].completedIssues || 0} of {unreleasedVersions[0].totalIssues || 0} issues
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReleasesOpen(true)}
                    className="font-semibold text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Release Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/20 text-center space-y-2 py-4">
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  No upcoming versions scheduled.
                </p>
                <Button
                  type="button"
                  variant="outlined"
                  size="xs"
                  onClick={() => setIsReleasesOpen(true)}
                  leftIcon={<Tag className="w-3 h-3 text-[var(--md-sys-color-primary)]" />}
                >
                  Manage Releases
                </Button>
              </div>
            )}
          </Card>

          {/* Project Details & Directory Info */}
          <Card
            variant="outlined"
            padding="md"
            rounded="2xl"
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-4 shadow-2xs text-xs"
          >
            <div>
              <h2 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
                Leadership & Directory
              </h2>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Ownership and workspace configuration summary
              </p>
            </div>

            {/* Lead Section */}
            <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                Project Lead
              </span>
              {project?.lead ? (
                <UserIdentity
                  userId={project.lead.id}
                  user={project.lead}
                  name={project.lead.fullName || project.lead.email}
                  avatarUrl={project.lead.avatarUrl}
                  email={project.lead.email}
                  size="sm"
                  showName
                  showEmail
                />
              ) : (
                <span className="text-xs italic text-[var(--md-sys-color-on-surface-variant)]">Unassigned</span>
              )}
            </div>

            {/* Quick Metrics Directory */}
            <div className="space-y-1.5">
              <Link
                to={`/projects/${projectKey}/settings/teams`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] transition group"
              >
                <div className="flex items-center gap-2">
                  <Users2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">Scrum Teams</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-xs text-[var(--md-sys-color-on-surface)]">{teams.length}</span>
                  <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition" />
                </div>
              </Link>

              <Link
                to={`/projects/${projectKey}/settings/components`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] transition group"
              >
                <div className="flex items-center gap-2">
                  <FolderTree className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">Components</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-xs text-[var(--md-sys-color-on-surface)]">{components.length}</span>
                  <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition" />
                </div>
              </Link>

              <Link
                to={`/projects/${projectKey}/settings/versions`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] transition group"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">Releases</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-xs text-[var(--md-sys-color-on-surface)]">{versions.length}</span>
                  <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition" />
                </div>
              </Link>

              <Link
                to={`/search?jql=${encodeURIComponent(`project = "${projectKey}"`)}`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] transition group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">Total Issues</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-xs text-[var(--md-sys-color-on-surface)]">{totalIssues}</span>
                  <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition" />
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* In-place ticket details modal */}
      {selectedIssueId !== null && (
        <IssueDetailsModal
          isOpen={true}
          issueId={selectedIssueId}
          onClose={() => setSelectedIssueId(null)}
        />
      )}

      {/* Project Releases and Versions Modal */}
      {effectiveProjectId && (
        <ProjectReleasesModal
          isOpen={isReleasesOpen}
          onClose={() => setIsReleasesOpen(false)}
          projectId={effectiveProjectId}
          projectKey={projectKey}
        />
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
