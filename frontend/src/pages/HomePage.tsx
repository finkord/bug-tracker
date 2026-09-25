import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  api,
  type IssueItem,
  type ProjectItem,
  type SavedFilterItem,
  type IssueStatus,
} from '../api/client';
import { Avatar } from '../components/common/Avatar';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Shield,
  ArrowRight,
  ExternalLink,
  Kanban,
  Clock,
  Filter,
  CheckCircle2,
  Trash2,
  PlusCircle,
  FolderGit2,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is authenticated, we fetch their personal dashboard data
  const [assignedIssues, setAssignedIssues] = useState<IssueItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilterItem[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);

  // New filter creation state
  const [newFilterName, setNewFilterName] = useState('');
  const [showNewFilterInput, setShowNewFilterInput] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingDashboard(true);
      Promise.all([
        api.getIssues({ assigneeId: user.id }),
        api.getProjects(),
        api.getSavedFilters(),
      ])
        .then(([issuesData, projectsData, filtersData]) => {
          setAssignedIssues(issuesData);
          setProjects(projectsData);
          setSavedFilters(filtersData);
        })
        .catch(() => {})
        .finally(() => setLoadingDashboard(false));
    }
  }, [user]);

  const handleStatusChange = async (issueId: number, nextStatus: IssueStatus) => {
    try {
      const updated = await api.updateIssueStatus(issueId, nextStatus);
      setAssignedIssues((prev) =>
        prev.map((i) => (i.id === issueId ? updated : i)),
      );
    } catch {
      // Ignored
    }
  };

  const handleDeleteFilter = async (filterId: number) => {
    try {
      await api.deleteSavedFilter(filterId);
      setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
    } catch {
      // Ignored
    }
  };

  const handleApplyFilter = (criteriaStr: string) => {
    try {
      const criteria = JSON.parse(criteriaStr);
      const params = new URLSearchParams();
      if (criteria.query) params.set('q', criteria.query);
      if (criteria.search) params.set('q', criteria.search);
      if (criteria.projectId && criteria.projectId !== 'ALL') params.set('projectId', String(criteria.projectId));
      if (criteria.status && criteria.status !== 'ALL') params.set('status', criteria.status);
      if (criteria.priority && criteria.priority !== 'ALL') params.set('priority', criteria.priority);
      if (criteria.assigneeId && criteria.assigneeId !== 'ALL') params.set('assigneeId', String(criteria.assigneeId));
      if (criteria.sprint && criteria.sprint !== 'ALL') params.set('sprint', criteria.sprint);

      const qs = params.toString();
      navigate(`/search${qs ? `?${qs}` : ''}`);
    } catch {
      navigate('/search');
    }
  };

  const handleCreateQuickFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    try {
      const created = await api.createSavedFilter(
        newFilterName.trim(),
        JSON.stringify({ status: 'OPEN', priority: 'HIGH' }),
      );
      setSavedFilters((prev) => [created, ...prev]);
      setNewFilterName('');
      setShowNewFilterInput(false);
    } catch {
      // Ignored
    }
  };

  // ==========================================
  // 1. GUEST VIEW: Landing Page
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center max-w-4xl mx-auto px-4 py-12 space-y-10 animate-in fade-in duration-300 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-xs font-bold text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Unified Bug Tracking & Enterprise Security Platform</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--md-sys-color-on-surface)] leading-tight">
            Developer Issues with <br />
            <span className="text-[var(--md-sys-color-primary)]">Enterprise Security</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            High-performance issue tracking built for modern engineering teams. Powered by NestJS, React 19, Material 3 Expressive aesthetics, and zero-trust authentication.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
          <Link to="/register" className="w-full sm:w-auto flex-1">
            <Button
              type="button"
              variant="filled"
              size="lg"
              className="w-full shadow-xs"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto flex-1">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-6 text-left">
          <Card variant="outlined" padding="md" rounded="xl" className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
              <Kanban className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            </div>
            <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
              Agile Kanban Boards
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              5-column FSM workflow, drag-and-drop cards, and live triage.
            </p>
          </Card>

          <Card variant="outlined" padding="md" rounded="xl" className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[var(--md-sys-color-secondary)]" />
            </div>
            <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
              Zero-Trust Security
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Argon2id hashing, RFC 6238 2FA TOTP, Turnstile bot defense.
            </p>
          </Card>

          <Card variant="outlined" padding="md" rounded="xl" className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" />
            </div>
            <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
              Effort & Time Tracking
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Log developer hours, track sprint progress, and inspect team velocity.
            </p>
          </Card>
        </div>

        {/* REST API link */}
        <div className="pt-2">
          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
          >
            <span>Explore Swagger OpenAPI Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. AUTHENTICATED VIEW: Personal Dashboard
  // ==========================================
  const activeAssigned = assignedIssues.filter((i) => i.status !== 'CLOSED');

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <Card variant="outlined" padding="md" rounded="xl" className="shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar
              name={user.fullName}
              avatarUrl={user.avatarUrl}
              role={user.systemRole}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                  Welcome back, {user.fullName}!
                </h1>
                <Badge variant={user.systemRole === 'ADMIN' ? 'primary' : 'neutral'} size="sm">
                  {user.systemRole}
                </Badge>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Personal Engineering Dashboard • {activeAssigned.length} active tasks requiring your attention
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/projects">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}
              >
                All Projects
              </Button>
            </Link>
            <Link to="/time-tracking">
              <Button
                type="button"
                variant="filled"
                size="sm"
                leftIcon={<Clock className="w-3.5 h-3.5" />}
              >
                Time Logs
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Assigned to Me & Project Jump */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section: Assigned to Me */}
          <Card variant="outlined" padding="md" rounded="xl" className="space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Assigned to Me ({activeAssigned.length})
                </h2>
              </div>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Active workflow issues
              </span>
            </div>

            {loadingDashboard ? (
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic py-8 text-center">
                Loading your assigned tasks...
              </p>
            ) : activeAssigned.length === 0 ? (
              <div className="p-8 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-dashed border-[var(--md-sys-color-outline-variant)] text-center space-y-2">
                <Sparkles className="w-6 h-6 mx-auto text-[var(--md-sys-color-primary)]" />
                <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                  You have no pending assigned tickets!
                </p>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Pick a task from your project Kanban board or create a new issue.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAssigned.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] shrink-0">
                        {issue.key}
                      </span>
                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                        <span>{issue.loggedHours || 0}h</span>
                        {issue.estimatedHours > 0 && <span className="opacity-60">/ {issue.estimatedHours}h</span>}
                      </span>

                      <Badge variant="neutral" size="sm">
                        {issue.priority}
                      </Badge>

                      {/* Quick Status Select */}
                      <select
                        aria-label={`Status for ${issue.key}`}
                        value={issue.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(issue.id, e.target.value as IssueStatus)}
                        className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
                      >
                        <option value="OPEN">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="REVIEW">Review</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>

                      <Link
                        to={`/issues/${issue.key || issue.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                        title="Open full page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section: Quick Workspace Jump */}
          <Card variant="outlined" padding="md" rounded="xl" className="space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <Kanban className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Project Kanban Boards
                </h2>
              </div>
              <Link to="/projects" className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2.5 hover:shadow-2xs transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)]">
                      {p.key}
                    </span>
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      {p.openIssues ?? 0} open issues
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-1 mt-0.5">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
                    <Link
                      to={`/projects/${p.id}/board`}
                      className="flex-1"
                    >
                      <Button
                        type="button"
                        variant="filled"
                        size="xs"
                        className="w-full"
                        leftIcon={<Kanban className="w-3 h-3" />}
                      >
                        Board
                      </Button>
                    </Link>
                    <Link
                      to={`/projects/${p.id}/backlog`}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        leftIcon={<Layers className="w-3 h-3" />}
                      >
                        Backlog
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (1 span): Saved Filters */}
        <div className="space-y-6">
          <Card variant="outlined" padding="md" rounded="xl" className="space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <h3 className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
                  My Saved Filters ({savedFilters.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewFilterInput(!showNewFilterInput)}
                className="p-1 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
                title="Create saved filter"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              One-click queries for the Kanban board and advanced search.
            </p>

            {/* Quick create filter form */}
            {showNewFilterInput && (
              <form onSubmit={handleCreateQuickFilter} className="flex gap-2 p-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                <input
                  type="text"
                  required
                  placeholder="Filter name (e.g. Critical)"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  className="flex-1 text-xs px-2 py-1 bg-transparent text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
                <Button
                  type="submit"
                  variant="filled"
                  size="xs"
                >
                  Save
                </Button>
              </form>
            )}

            {/* Saved Filters List */}
            {savedFilters.length === 0 ? (
              <div className="p-6 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                No saved search filters yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {savedFilters.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyFilter(f.criteria)}
                      className="text-left text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors truncate flex-1 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Filter className="w-3 h-3 text-[var(--md-sys-color-primary)] shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteFilter(f.id)}
                      className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] transition-colors cursor-pointer"
                      title="Delete filter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        isOpen={!!selectedIssueId}
        issueId={selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onIssueUpdated={(updated) => {
          setAssignedIssues((prev) =>
            prev.map((i) => (i.id === updated.id ? updated : i)),
          );
        }}
        onIssueDeleted={(deletedId) => {
          setAssignedIssues((prev) => prev.filter((i) => i.id !== deletedId));
        }}
      />
    </div>
  );
};
