import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  api,
  type IssueItem,
  type ProjectItem,
  type AssigneeUser,
  type SavedFilterItem,
} from '../api/client';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Tooltip } from '../components/ui/Tooltip';
import {
  Search,
  Filter,
  Save,
  RotateCcw,
  Download,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  Bookmark,
  CheckCircle2,
  Trash2,
  SlidersHorizontal,
  FolderGit2,
} from 'lucide-react';

export const AdvancedSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter criteria state (Clean Priority-only model)
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>(() => {
    const p = searchParams.get('projectId');
    return p ? Number(p) : 'ALL';
  });
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>(searchParams.get('priority') || 'ALL');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(searchParams.get('assigneeId') || 'ALL');
  const [selectedSprint, setSelectedSprint] = useState<string>(searchParams.get('sprint') || 'ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data state
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [assignees, setAssignees] = useState<AssigneeUser[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Save filter modal state
  const [filterNameModalOpen, setFilterNameModalOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load data & saved filters
  const loadAll = async () => {
    setLoading(true);
    try {
      const [issuesData, projectsData, assigneesData, filtersData] = await Promise.all([
        api.getIssues(),
        api.getProjects().catch(() => []),
        api.getAssignees().catch(() => []),
        api.getSavedFilters().catch(() => []),
      ]);
      setIssues(issuesData);
      setProjects(projectsData);
      setAssignees(assigneesData);
      setSavedFilters(filtersData);
    } catch {
      // Graceful error fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Sync state to URL search params
  const updateUrlParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === 'ALL') {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setSearchParams(next, { replace: true });
  };

  // Sprints list
  const allSprints = useMemo(() => {
    const sprints = new Set<string>();
    issues.forEach((i) => {
      if (i.sprint) sprints.add(i.sprint);
    });
    return Array.from(sprints).sort();
  }, [issues]);

  // Client-side filtering & sorting
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const keyMatch = issue.key.toLowerCase().includes(q);
        const titleMatch = issue.title.toLowerCase().includes(q);
        const descMatch = issue.description?.toLowerCase().includes(q) || false;
        if (!keyMatch && !titleMatch && !descMatch) return false;
      }

      if (selectedProjectId !== 'ALL' && issue.projectId !== selectedProjectId) {
        return false;
      }

      if (selectedStatus !== 'ALL' && issue.status !== selectedStatus) {
        return false;
      }

      if (selectedPriority !== 'ALL' && issue.priority !== selectedPriority) {
        return false;
      }

      if (selectedAssigneeId === 'UNASSIGNED') {
        if (issue.assignee) return false;
      } else if (selectedAssigneeId !== 'ALL') {
        if (issue.assignee?.id !== Number(selectedAssigneeId)) return false;
      }

      if (selectedSprint === 'BACKLOG') {
        if (issue.sprint) return false;
      } else if (selectedSprint !== 'ALL') {
        if (issue.sprint !== selectedSprint) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'updatedAt') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'priority') {
        const priorityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        comparison = (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [
    issues,
    query,
    selectedProjectId,
    selectedStatus,
    selectedPriority,
    selectedAssigneeId,
    selectedSprint,
    sortBy,
    sortOrder,
  ]);

  // Reset all filters
  const handleResetFilters = () => {
    setQuery('');
    setSelectedProjectId('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedAssigneeId('ALL');
    setSelectedSprint('ALL');
    setSearchParams(new URLSearchParams());
  };

  // Apply a saved filter preset
  const handleApplySavedFilter = (filter: SavedFilterItem) => {
    try {
      const parsed = JSON.parse(filter.criteria);
      if (parsed.query !== undefined) setQuery(parsed.query);
      if (parsed.projectId !== undefined) setSelectedProjectId(parsed.projectId);
      if (parsed.status !== undefined) setSelectedStatus(parsed.status);
      if (parsed.priority !== undefined) setSelectedPriority(parsed.priority);
      if (parsed.assigneeId !== undefined) setSelectedAssigneeId(parsed.assigneeId);
      if (parsed.sprint !== undefined) setSelectedSprint(parsed.sprint);

      const params: Record<string, string> = {};
      if (parsed.query) params.q = parsed.query;
      if (parsed.projectId && parsed.projectId !== 'ALL') params.projectId = String(parsed.projectId);
      if (parsed.status && parsed.status !== 'ALL') params.status = parsed.status;
      if (parsed.priority && parsed.priority !== 'ALL') params.priority = parsed.priority;
      if (parsed.assigneeId && parsed.assigneeId !== 'ALL') params.assigneeId = parsed.assigneeId;
      if (parsed.sprint && parsed.sprint !== 'ALL') params.sprint = parsed.sprint;
      setSearchParams(new URLSearchParams(params), { replace: true });
    } catch {
      // JSON parse error
    }
  };

  // Delete a saved filter preset
  const handleDeleteSavedFilter = async (filterId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteSavedFilter(filterId);
      setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
    } catch {
      // Error handling
    }
  };

  // Save current query as a named filter
  const handleSaveFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    try {
      const criteriaObj = {
        query,
        projectId: selectedProjectId,
        status: selectedStatus,
        priority: selectedPriority,
        assigneeId: selectedAssigneeId,
        sprint: selectedSprint,
      };
      const created = await api.createSavedFilter(newFilterName.trim(), JSON.stringify(criteriaObj));
      setSavedFilters((prev) => [created, ...prev]);
      setSaveSuccessMsg(`Filter "${newFilterName.trim()}" saved to your dashboard!`);
      setFilterNameModalOpen(false);
      setNewFilterName('');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch {
      // Error handling
    }
  };

  // Export current filtered results to CSV
  const handleExportCSV = () => {
    const headers = ['Key', 'Title', 'Project', 'Status', 'Priority', 'Sprint', 'Assignee', 'Logged Hours', 'Est Hours'];
    const rows = filteredIssues.map((i) => [
      i.key,
      `"${i.title.replace(/"/g, '""')}"`,
      i.projectName || 'CORE',
      i.status,
      i.priority,
      i.sprint || 'Backlog',
      i.assignee?.fullName || 'Unassigned',
      i.loggedHours || 0,
      i.estimatedHours || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bugtracker-search-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'open' as const;
      case 'IN_PROGRESS':
        return 'in-progress' as const;
      case 'REVIEW':
        return 'review' as const;
      case 'RESOLVED':
        return 'resolved' as const;
      case 'CLOSED':
        return 'closed' as const;
      default:
        return 'neutral' as const;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'critical' as const;
      case 'HIGH':
        return 'high' as const;
      case 'MEDIUM':
        return 'medium' as const;
      case 'LOW':
        return 'low' as const;
      default:
        return 'neutral' as const;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-in fade-in duration-200">
      {/* Page Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[11px] font-semibold text-[var(--md-sys-color-on-primary-container)] mb-1.5">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Search & Query Builder</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
            Advanced Search
          </h1>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Filter defects across projects, sprints, statuses, and custom criteria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredIssues.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            type="button"
            variant="filled"
            size="sm"
            onClick={() => setFilterNameModalOpen(true)}
            leftIcon={<Bookmark className="w-3.5 h-3.5" />}
          >
            Save Filter
          </Button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Saved Filter Quick-Load Chips */}
      {savedFilters.length > 0 && (
        <Card variant="outlined" padding="sm" rounded="xl" className="flex flex-wrap items-center gap-2 bg-[var(--md-sys-color-surface-container-low)]">
          <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider px-1 flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
            <span>Saved Presets:</span>
          </span>
          {savedFilters.map((f) => (
            <div
              key={f.id}
              onClick={() => handleApplySavedFilter(f)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors group"
            >
              <span>{f.name}</span>
              <Tooltip content="Delete preset">
                <button
                  type="button"
                  onClick={(e) => handleDeleteSavedFilter(f.id, e)}
                  className="opacity-40 group-hover:opacity-100 hover:text-[var(--md-sys-color-error)] p-0.5 rounded transition-opacity"
                  aria-label="Delete filter preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </Tooltip>
            </div>
          ))}
        </Card>
      )}

      {/* Query Filter Builder Panel */}
      <Card variant="outlined" padding="md" rounded="xl" className="space-y-4 shadow-xs">
        {/* Full Text Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateUrlParams({ q: e.target.value });
            }}
            placeholder="Search by issue key (e.g. CORE-101), title keywords, or description..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
          />
        </div>

        {/* Multi-Criteria Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Project */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setSelectedProjectId(val);
                updateUrlParams({ projectId: String(val) });
              }}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                updateUrlParams({ status: e.target.value });
              }}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">To Do (Open)</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Code Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                updateUrlParams({ priority: e.target.value });
              }}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Assignee
            </label>
            <select
              value={selectedAssigneeId}
              onChange={(e) => {
                setSelectedAssigneeId(e.target.value);
                updateUrlParams({ assigneeId: e.target.value });
              }}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.systemRole})
                </option>
              ))}
            </select>
          </div>

          {/* Sprint */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Sprint
            </label>
            <select
              value={selectedSprint}
              onChange={(e) => {
                setSelectedSprint(e.target.value);
                updateUrlParams({ sprint: e.target.value });
              }}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
            >
              <option value="ALL">All Sprints</option>
              <option value="BACKLOG">Backlog (No Sprint)</option>
              {allSprints.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Toolbar: Matches Count & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)] text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {filteredIssues.length} issues found
            </Badge>
            {(query || selectedProjectId !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || selectedAssigneeId !== 'ALL' || selectedSprint !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>

          {/* Sorting controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
            >
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Last Updated</option>
              <option value="priority">Priority</option>
            </select>
            <Tooltip content={`Switch to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}>
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-1 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                aria-label={`Switch to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </Tooltip>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
        </div>
      ) : filteredIssues.length === 0 ? (
        <Card variant="outlined" padding="lg" rounded="xl" className="text-center space-y-3 border-dashed">
          <Filter className="w-10 h-10 mx-auto text-[var(--md-sys-color-on-surface-variant)] opacity-40" />
          <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            No matching issues found
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto">
            Try adjusting your search query, clearing specific filters, or selecting "All Projects".
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse table-auto">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3.5 font-bold">Key</th>
                  <th className="py-2.5 px-3.5 font-bold">Title</th>
                  <th className="py-2.5 px-3.5 font-bold">Project</th>
                  <th className="py-2.5 px-3.5 font-bold">Status</th>
                  <th className="py-2.5 px-3.5 font-bold">Priority</th>
                  <th className="py-2.5 px-3.5 font-bold">Sprint</th>
                  <th className="py-2.5 px-3.5 font-bold">Assignee</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Logged / Est</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-[var(--md-sys-color-surface-container-high)]/40 transition-colors"
                  >
                    <td className="py-2.5 px-3.5 font-mono font-bold text-[var(--md-sys-color-primary)] whitespace-nowrap">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        {issue.key}
                      </Link>
                    </td>

                    <td className="py-2.5 px-3.5 max-w-md">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors block truncate"
                        title={issue.title}
                      >
                        {issue.title}
                      </Link>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 opacity-60" />
                        {issue.projectName || 'CORE'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(issue.status)} size="sm">
                        {issue.status}
                      </Badge>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <Badge variant={getPriorityBadgeVariant(issue.priority)} size="sm">
                        {issue.priority}
                      </Badge>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {issue.sprint ? (
                        <span className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/50 px-2 py-0.5 rounded-md flex items-center gap-1 w-max">
                          <Layers className="w-3 h-3" />
                          <span>{issue.sprint}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] opacity-60">
                          Backlog
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {issue.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={issue.assignee.fullName}
                            avatarUrl={issue.assignee.avatarUrl}
                            role={issue.assignee.systemRole}
                            size="xs"
                          />
                          <span className="truncate max-w-[120px] font-medium text-[var(--md-sys-color-on-surface)] text-xs">
                            {issue.assignee.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic opacity-60">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 font-mono text-right whitespace-nowrap text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {issue.loggedHours || 0}h
                      </span>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-50 mx-1">/</span>
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">
                        {issue.estimatedHours || 0}h
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Filter Radix Modal */}
      <Modal
        isOpen={filterNameModalOpen}
        onClose={() => setFilterNameModalOpen(false)}
        title="Save Search Filter"
        description="Name this filter preset to pin it directly to your query dashboard."
        size="sm"
      >
        <form onSubmit={handleSaveFilter} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
              Filter Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Critical Unassigned Bugs"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilterNameModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Preset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
