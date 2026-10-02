import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useProjectsQuery,
  useIssuesQuery,
  useProjectSprintsQuery,
  useAssignIssueToMeMutation,
  useUpdateIssueStatusMutation,
} from '../api/queries';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import { IssueContextMenu } from '../components/common/IssueContextMenu';
import { ProjectReleasesModal } from '../components/releases/ProjectReleasesModal';
import { Avatar } from '../components/common/Avatar';
import { ProjectAvatar } from '../components/projects/ProjectAvatar';
import { Badge } from '../components/ui';
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
      // Ignored
    }
  };

  const handleStatusChange = async (issueId: number, status: IssueStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ issueId, status });
    } catch {
      // Ignored
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

  // Sprints query
  const { data: sprints = [] } = useProjectSprintsQuery(effectiveProjectId);

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
      <div className="w-full p-8 flex items-center justify-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
        Loading project overview...
      </div>
    );
  }

  if (!project && !projectsLoading) {
    return (
      <div className="w-full p-8 text-center space-y-4">
        <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
          Project Not Found
        </h2>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Could not find project matching &quot;{projectParam}&quot;.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold"
        >
          Return to Projects
        </Link>
      </div>
    );
  }

  const projectInitial = project?.name ? project.name.charAt(0).toUpperCase() : 'P';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 space-y-6 animate-in fade-in duration-200">
      {/* ─── Hero Header Card ─── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <ProjectAvatar
              name={project?.name || ''}
              projectKey={project?.key}
              avatarUrl={project?.avatarUrl}
              size="lg"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/40 px-2 py-0.5 rounded-lg">
                  {project?.key}
                </span>
                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Created {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
                {project?.name}
              </h1>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-2xl">
                {project?.description || 'No description provided for this project.'}
              </p>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/projects/${projectKey}/board`}
              className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-110 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </Link>
            <Link
              to={`/projects/${projectKey}/backlog`}
              className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold flex items-center gap-1.5 border border-[var(--md-sys-color-outline-variant)]/25 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Backlog</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsReleasesOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold flex items-center gap-1.5 border border-[var(--md-sys-color-outline-variant)]/25 transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Releases</span>
            </button>
            <Link
              to={`/projects/${projectKey}/settings`}
              className="p-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-semibold border border-[var(--md-sys-color-outline-variant)]/25 transition-colors"
              title="Project Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Lead and Collaborators Strip */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/15 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Lead:</span>
            {project?.lead ? (
              <div className="flex items-center gap-1.5">
                <Avatar name={project.lead.fullName || project.lead.email} size="sm" />
                <span className="font-medium text-[var(--md-sys-color-on-surface)]">{project.lead.fullName}</span>
                <span className="text-[11px] opacity-70">({project.lead.email})</span>
              </div>
            ) : (
              <span className="italic opacity-60">Unassigned</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── High-Level Progress & Health Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Issue Progress Meter */}
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span>Completion Rate</span>
            </span>
            <span className="font-mono text-sm font-bold text-[var(--md-sys-color-primary)]">
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
        </div>

        {/* Time Tracking Meter */}
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" />
              <span>Time Logged</span>
            </span>
            <span className="font-mono text-sm font-bold text-[var(--md-sys-color-tertiary)]">
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
        </div>

        {/* Priority Breakdown */}
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-2.5 sm:col-span-2 lg:col-span-1">
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
              <div className="font-mono text-xs font-bold text-[var(--md-sys-color-error)]">{criticalCount}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">Crit</div>
            </div>
            <div className="flex-1 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-center">
              <div className="font-mono text-xs font-bold text-[var(--md-sys-color-tertiary)]">{highCount}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">High</div>
            </div>
            <div className="flex-1 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-center">
              <div className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)]">{mediumCount}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">Med</div>
            </div>
            <div className="flex-1 p-2 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-center">
              <div className="font-mono text-xs font-bold text-[var(--md-sys-color-outline)]">{lowCount}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-semibold">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Grid: Active Sprint & Recent Tickets ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Sprint + Recent Issues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sprint Launchpad */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>Active Sprint</span>
              </h2>
              {activeSprint && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                  ACTIVE
                </span>
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

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/15 text-xs text-[var(--md-sys-color-on-surface-variant)]">
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
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  No active sprint currently running for this project.
                </p>
                <Link
                  to={`/projects/${projectKey}/backlog`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline"
                >
                  <span>Plan and start a sprint in Backlog</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Recent Issues List */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Recent Issues
              </h2>
              <Link
                to={`/search?jql=${encodeURIComponent(`project = "${projectKey}"`)}`}
                className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1"
              >
                <span>View all in Search</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {issuesLoading ? (
              <div className="py-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Loading recent tickets...
              </div>
            ) : issues.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                No issues filed for this project yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {issues.slice(0, 7).map((issue) => (
                  <div
                    key={issue.id}
                    onContextMenu={(e) => handleContextMenu(e, issue)}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/20 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <a
                        href={`/issues/${issue.key}`}
                        onClick={(e) => {
                          if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                          e.preventDefault();
                          setSelectedIssueId(issue.id);
                        }}
                        className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline shrink-0 bg-[var(--md-sys-color-primary-container)]/50 px-1.5 py-0.5 rounded"
                      >
                        {issue.key}
                      </a>
                      <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
          </div>
        </div>

        {/* Right Column (1 Col): Project Details & Fast Links */}
        <div className="space-y-6">
          {/* Quick Views Navigation */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-3">
            <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              Project Views
            </h2>
            <div className="space-y-1.5">
              <Link
                to={`/projects/${projectKey}/board`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Kanban className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Kanban Board</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
              <Link
                to={`/projects/${projectKey}/backlog`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Backlog & Sprints</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
              <Link
                to={`/projects/${projectKey}/settings`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Project Settings</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Project Details Info */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/25 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              Project Details
            </h2>
            <div className="space-y-2 text-[var(--md-sys-color-on-surface-variant)]">
              <div className="flex items-center justify-between">
                <span>Key</span>
                <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">{project?.key}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Lead</span>
                <span className="font-medium text-[var(--md-sys-color-on-surface)]">
                  {project?.lead?.fullName || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Issues</span>
                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{totalIssues}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Sprints</span>
                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{sprints.length}</span>
              </div>
            </div>
          </div>
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
