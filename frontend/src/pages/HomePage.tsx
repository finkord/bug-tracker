import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useModalStore } from '../store';
import {
  useIssuesQuery,
  useUpdateIssueStatusMutation,
  useProjectsQuery,
  useProjectSprintsQuery,
  useMyWorklogsQuery,
} from '../api/queries';
import type { IssueItem, IssuePriority, IssueStatus, SprintItem } from '../api/client';
import { Avatar } from '../components/common/Avatar';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import { IssueContextMenu } from '../components/common/IssueContextMenu';
import {
  Card,
  Button,
  Badge,
  EntityAvatar,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import {
  Plus,
  Clock,
  CheckCircle2,
  ListTodo,
  Calendar,
  ArrowRight,
  Activity,
  Flame,
  Kanban,
  History,
  FolderGit2,
  Sparkles,
  Cloud,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { GuestHeroSection } from '../components/home/GuestHeroSection';

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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { openCreateIssue } = useModalStore();

  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'in-progress' | 'todo' | 'done'>('in-progress');
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuIssue, setContextMenuIssue] = useState<IssueItem | null>(null);

  // Queries
  const { data: assignedIssuesData, isLoading: issuesLoading } = useIssuesQuery(
    user ? { assigneeId: user.id } : undefined,
  );
  const assignedIssues = assignedIssuesData?.items ?? [];

  const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery();
  const { data: myWorklogs } = useMyWorklogsQuery(1, 50);

  // Active project ID resolution to fetch current sprint context
  const primaryProjectId = useMemo(() => {
    if (assignedIssues.length > 0 && assignedIssues[0].projectId) {
      return assignedIssues[0].projectId;
    }
    return projects.length > 0 ? projects[0].id : undefined;
  }, [assignedIssues, projects]);

  const { data: sprints = [] } = useProjectSprintsQuery(primaryProjectId);

  const updateStatusMutation = useUpdateIssueStatusMutation();

  const handleStatusChange = async (issueId: number, nextStatus: IssueStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ issueId, status: nextStatus });
    } catch {
      // Handled by query mutation feedback
    }
  };

  const handleContextMenu = (e: React.MouseEvent, issue: IssueItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuIssue(issue);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Categorize assigned issues into workflow queues
  const inProgressIssues = useMemo(
    () =>
      assignedIssues.filter(
        (i) => i.status === 'IN_PROGRESS' || i.status === 'REVIEW',
      ),
    [assignedIssues],
  );

  const todoIssues = useMemo(
    () =>
      assignedIssues.filter(
        (i) => i.status === 'OPEN',
      ),
    [assignedIssues],
  );

  const doneIssues = useMemo(
    () =>
      assignedIssues.filter(
        (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
      ),
    [assignedIssues],
  );

  const criticalIssuesCount = useMemo(
    () => assignedIssues.filter((i) => i.priority === 'CRITICAL' && i.status !== 'CLOSED').length,
    [assignedIssues],
  );

  // Calculate today's and this week's logged hours
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayLoggedHours = useMemo(() => {
    const list = myWorklogs?.items || [];
    return list
      .filter((w) => w.dateLogged?.slice(0, 10) === todayStr)
      .reduce((acc, w) => acc + (Number(w.timeSpentHours) || 0), 0);
  }, [myWorklogs, todayStr]);

  // Cloud-synced worked on issues (derived from real PostgreSQL worklogs & assigned issues)
  const workedOnIssues = useMemo(() => {
    const list: {
      id: number;
      key: string;
      title: string;
      priority?: IssuePriority;
      status?: IssueStatus;
      loggedHours?: number;
      lastWorkedAt?: string;
    }[] = [];
    const seen = new Set<number>();

    // 1. Genuine backend worklogs
    for (const log of myWorklogs?.items || []) {
      if (log.issue && !seen.has(log.issue.id)) {
        seen.add(log.issue.id);
        list.push({
          id: log.issue.id,
          key: log.issue.key,
          title: log.issue.title,
          priority: log.issue.priority,
          status: log.issue.status,
          loggedHours: Number(log.timeSpentHours) || 0,
          lastWorkedAt: log.dateLogged || log.createdAt,
        });
      }
    }

    // 2. Active tasks in progress if no worklogs recorded yet
    if (list.length === 0) {
      for (const issue of inProgressIssues) {
        if (!seen.has(issue.id)) {
          seen.add(issue.id);
          list.push({
            id: issue.id,
            key: issue.key,
            title: issue.title,
            priority: issue.priority,
            status: issue.status,
            loggedHours: Number(issue.loggedHours) || 0,
            lastWorkedAt: issue.updatedAt || issue.createdAt,
          });
        }
        if (list.length >= 5) break;
      }
    }

    return list.slice(0, 5);
  }, [myWorklogs, inProgressIssues]);

  // Active sprint resolution
  const activeSprint = useMemo<SprintItem | undefined>(() => {
    // 1. Check if user has an assigned issue in an active sprint and resolve full sprint metadata
    const issueWithActiveSprint = assignedIssues.find((i) => i.sprint?.status === 'ACTIVE');
    if (issueWithActiveSprint?.sprint) {
      const matched = sprints.find((s) => s.id === issueWithActiveSprint.sprint!.id);
      if (matched) return matched;
    }
    // 2. Fallback to active sprint of primary project
    return sprints.find((s) => s.status === 'ACTIVE');
  }, [assignedIssues, sprints]);

  // Current tab issues list
  const currentTabIssues = useMemo(() => {
    switch (activeTab) {
      case 'in-progress':
        return inProgressIssues;
      case 'todo':
        return todoIssues;
      case 'done':
        return doneIssues;
      default:
        return inProgressIssues;
    }
  }, [activeTab, inProgressIssues, todoIssues, doneIssues]);

  // 1. Guest landing page view
  if (!user) {
    return <GuestHeroSection />;
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-6 animate-in fade-in duration-200">
      {/* ── Personal Morning Briefing Hero Card ── */}
      <Card
        variant="outlined"
        padding="lg"
        rounded="2xl"
        className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xs space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar
              name={user.fullName}
              avatarUrl={user.avatarUrl}
              role={user.systemRole}
              size="lg"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight truncate">
                  {getGreeting()}, {user.fullName}!
                </h1>
                <Badge variant={user.systemRole === 'ADMIN' ? 'primary' : 'neutral'} size="sm">
                  {user.systemRole}
                </Badge>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Personal Engineering Workspace • {inProgressIssues.length} tasks in progress • {todayLoggedHours}h logged today
              </p>
            </div>
          </div>

          {/* Morning Fast Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => openCreateIssue({ assigneeId: user.id })}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Issue
            </Button>
            <Link to="/time-tracking">
              <Button
                type="button"
                variant="outlined"
                size="sm"
                leftIcon={<Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
              >
                Time Logs
              </Button>
            </Link>
            <Link to="/my-issues">
              <Button
                type="button"
                variant="outlined"
                size="sm"
                leftIcon={<ListTodo className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
              >
                My Issues
              </Button>
            </Link>
            <Link to="/projects">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}
                title="All Projects"
              >
                Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Morning Momentum Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20 text-xs">
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/50 border border-[var(--md-sys-color-outline-variant)]/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
              In Progress
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-base font-black text-[var(--md-sys-color-primary)]">
                {inProgressIssues.length}
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">active tasks</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/50 border border-[var(--md-sys-color-outline-variant)]/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
              To Do & Backlog
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-base font-black text-[var(--md-sys-color-on-surface)]">
                {todoIssues.length}
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">ready to pick</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/50 border border-[var(--md-sys-color-outline-variant)]/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
              Blockers & Critical
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`font-mono text-base font-black ${criticalIssuesCount > 0 ? 'text-[var(--md-sys-color-error)]' : 'text-[var(--md-sys-color-on-surface)]'}`}>
                {criticalIssuesCount}
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">urgent attention</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/50 border border-[var(--md-sys-color-outline-variant)]/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
              Hours Logged Today
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-base font-black text-[var(--md-sys-color-tertiary)]">
                {todayLoggedHours}h
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">recorded</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Main Workspace Grid (2/3 Left Queue, 1/3 Right Activity & Context) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Your Work Tabbed Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            variant="outlined"
            padding="lg"
            rounded="2xl"
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-4 shadow-2xs"
          >
            {/* Queue Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/20">
              <div>
                <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Your Work</span>
                </h2>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Tasks and tickets assigned to you across all projects
                </p>
              </div>

              {/* Status Queue Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/60 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('in-progress')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'in-progress'
                      ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-2xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                >
                  In Progress ({inProgressIssues.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('todo')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'todo'
                      ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-2xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                >
                  To Do ({todoIssues.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('done')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'done'
                      ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-2xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                >
                  Done ({doneIssues.length})
                </button>
              </div>
            </div>

            {/* Tasks List */}
            {issuesLoading ? (
              <div className="py-12 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] animate-pulse">
                Loading your assigned workflow tasks...
              </div>
            ) : currentTabIssues.length === 0 ? (
              <div className="py-12 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)]/50 text-[var(--md-sys-color-primary)] flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                  {activeTab === 'in-progress'
                    ? 'No tasks currently in progress'
                    : activeTab === 'todo'
                      ? 'Your to-do list is clear'
                      : 'No recently completed tasks'}
                </h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto">
                  {activeTab === 'in-progress'
                    ? 'Pick an open item from your sprint backlog or Kanban board to start your day.'
                    : 'Create a new ticket or pick up work from your project boards.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentTabIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onContextMenu={(e) => handleContextMenu(e, issue)}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/60 hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/20 hover:border-[var(--md-sys-color-outline-variant)]/50 cursor-pointer transition-all duration-150 group shadow-2xs"
                  >
                    {/* Left: Key, Project, Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <a
                        href={`/issues/${issue.key}`}
                        onClick={(e) => {
                          if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                          e.preventDefault();
                          setSelectedIssueId(issue.id);
                        }}
                        className="font-mono text-xs font-black text-[var(--md-sys-color-primary)] hover:underline shrink-0 bg-[var(--md-sys-color-primary-container)]/50 px-2 py-0.5 rounded-lg"
                      >
                        {issue.key}
                      </a>

                      {issue.projectKey && (
                        <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)]/70 uppercase tracking-wider hidden sm:inline shrink-0">
                          [{issue.projectKey}]
                        </span>
                      )}

                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                        {issue.title}
                      </span>
                    </div>

                    {/* Right: Metrics, Priority, Status Dropdown */}
                    <div
                      className="flex items-center gap-2 shrink-0 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 hidden md:flex">
                        <Clock className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                        <span>{issue.loggedHours || 0}h</span>
                        {issue.estimatedHours > 0 && <span className="opacity-60">/ {issue.estimatedHours}h</span>}
                      </span>

                      <Badge variant={mapPriorityVariant(issue.priority)} size="sm">
                        {issue.priority}
                      </Badge>

                      {/* Inline Status Transition Select */}
                      <div className="w-28">
                        <Select
                          value={issue.status}
                          onValueChange={(val) => handleStatusChange(issue.id, val as IssueStatus)}
                        >
                          <SelectTrigger size="sm" className="h-7 text-xs rounded-lg bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)]/40 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">To Do</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="REVIEW">Review</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Link
                        to={`/issues/${issue.key || issue.id}`}
                        className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface)] transition-colors"
                        title="Open issue page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Sprint Context & Live Activity */}
        <div className="space-y-6">
          {/* Active Sprint Widget */}
          <Card
            variant="outlined"
            padding="md"
            rounded="2xl"
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>Active Sprint Context</span>
              </h2>
              {activeSprint && (
                <Badge variant="primary" size="sm">
                  ACTIVE
                </Badge>
              )}
            </div>

            {activeSprint ? (
              <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/60 border border-[var(--md-sys-color-outline-variant)]/20 space-y-2.5">
                <div>
                  <h3 className="text-xs font-black text-[var(--md-sys-color-on-surface)]">
                    {activeSprint.name}
                  </h3>
                  {activeSprint.goal && (
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 mt-0.5">
                      Goal: {activeSprint.goal}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                    <span>
                      {activeSprint.endDate ? `Ends ${new Date(activeSprint.endDate).toLocaleDateString()}` : 'In progress'}
                    </span>
                  </div>

                  <Link
                    to={`/projects/${assignedIssues[0]?.projectKey || projects[0]?.key || 'BUGT'}/board`}
                    className="font-bold text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Board</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/40 border border-[var(--md-sys-color-outline-variant)]/20 text-center space-y-2 text-xs">
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  No active sprint currently running for your primary project.
                </p>
                <Link
                  to="/projects"
                  className="font-semibold text-xs text-[var(--md-sys-color-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Select a Project Backlog</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </Card>

          {/* Cloud Synced Worked On Feed */}
          <Card
            variant="outlined"
            padding="md"
            rounded="2xl"
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>Recently Worked On</span>
              </h2>
              {/* <span className="text-[10px] font-semibold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cloud className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                <span>Cloud Synced</span>
              </span> */}
            </div>

            {workedOnIssues.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-high)]/40 border border-[var(--md-sys-color-outline-variant)]/20 text-center space-y-1 text-xs">
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  No worklogs or active progress recorded in the cloud yet.
                </p>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]/70">
                  Time logged on any ticket syncs across all your devices.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {workedOnIssues.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIssueId(item.id)}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] border border-transparent hover:border-[var(--md-sys-color-outline-variant)]/20 transition-all cursor-pointer group text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] shrink-0 bg-[var(--md-sys-color-primary-container)]/30 px-1.5 py-0.5 rounded">
                        {item.key}
                      </span>
                      <span className="text-xs text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition truncate font-medium">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.loggedHours !== undefined && item.loggedHours > 0 && (
                        <span className="font-mono text-[10px] text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
                          {item.loggedHours}h
                        </span>
                      )}
                      <Badge variant={mapPriorityVariant(item.priority)} size="sm">
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Projects Shortcuts */}
          <Card
            variant="outlined"
            padding="md"
            rounded="2xl"
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3 shadow-2xs text-xs"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
                Active Projects
              </h2>
              <Link
                to="/projects"
                className="text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline"
              >
                All Projects
              </Link>
            </div>

            <div className="space-y-1.5">
              {projects.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.key || p.id}/board`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <EntityAvatar
                      name={p.name}
                      avatarUrl={p.avatarUrl}
                      projectKey={p.key}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] block truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                        {p.openIssues ?? 0} open issues
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition shrink-0" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* In-place Issue Details Modal */}
      {selectedIssueId !== null && (
        <IssueDetailsModal
          isOpen={true}
          issueId={selectedIssueId}
          onClose={() => setSelectedIssueId(null)}
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
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};
