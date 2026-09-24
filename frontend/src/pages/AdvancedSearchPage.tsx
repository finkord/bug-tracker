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
      // Error
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
      // Handle error
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

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-sys-color-primary-container)] text-xs font-semibold text-[var(--md-sys-color-on-primary-container)] mb-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search & Query Builder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">
            Advanced Search
          </h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Filter defects across projects, sprints, statuses, and custom criteria.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredIssues.length === 0}
            className="px-4 py-2 rounded-full m3-btn-outline text-xs font-semibold flex items-center gap-1.5"
            title="Export results to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterNameModalOpen(true)}
            className="px-4 py-2 rounded-full m3-btn-filled text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Filter</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Saved Filter Quick-Load Chips */}
      {savedFilters.length > 0 && (
        <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider px-2 flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Saved Presets:</span>
          </span>
          {savedFilters.map((f) => (
            <div
              key={f.id}
              onClick={() => handleApplySavedFilter(f)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors shadow-2xs group"
            >
              <span>{f.name}</span>
              <button
                type="button"
                onClick={(e) => handleDeleteSavedFilter(f.id, e)}
                className="opacity-40 group-hover:opacity-100 hover:text-rose-500 p-0.5 rounded transition-opacity"
                title="Delete filter preset"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Query Filter Builder Panel */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl p-5 shadow-xs space-y-4">
        {/* Full Text Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateUrlParams({ q: e.target.value });
            }}
            placeholder="Search by issue key (e.g. CORE-101), title keywords, or description..."
            className="w-full text-sm pl-11 pr-4 py-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
          />
        </div>

        {/* Multi-Criteria Filters Row (Priority only, Severity removed) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* Project */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setSelectedProjectId(val);
                updateUrlParams({ projectId: String(val) });
              }}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
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
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                updateUrlParams({ status: e.target.value });
              }}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">To Do (Open)</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Code Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority (Sole urgency field) */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                updateUrlParams({ priority: e.target.value });
              }}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
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
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Assignee
            </label>
            <select
              value={selectedAssigneeId}
              onChange={(e) => {
                setSelectedAssigneeId(e.target.value);
                updateUrlParams({ assigneeId: e.target.value });
              }}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
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
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Sprint
            </label>
            <select
              value={selectedSprint}
              onChange={(e) => {
                setSelectedSprint(e.target.value);
                updateUrlParams({ sprint: e.target.value });
              }}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
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
            <span className="font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2.5 py-0.5 rounded-full">
              {filteredIssues.length} issues found
            </span>
            {(query || selectedProjectId !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || selectedAssigneeId !== 'ALL' || selectedSprint !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
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
              className="text-xs font-semibold px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
            >
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Last Updated</option>
              <option value="priority">Priority</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
              title={`Switch to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--md-sys-color-surface)] border border-dashed border-[var(--md-sys-color-outline-variant)] text-center space-y-3">
          <Filter className="w-10 h-10 mx-auto text-[var(--md-sys-color-on-surface-variant)] opacity-40" />
          <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
            No matching issues found
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto">
            Try adjusting your search query, clearing specific filters, or selecting "All Projects".
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-full m3-btn-outline text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse table-auto">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Key</th>
                  <th className="py-3 px-4 font-bold">Title</th>
                  <th className="py-3 px-4 font-bold">Project</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Priority</th>
                  <th className="py-3 px-4 font-bold">Sprint</th>
                  <th className="py-3 px-4 font-bold">Assignee</th>
                  <th className="py-3 px-4 font-bold text-right">Logged / Est</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[var(--md-sys-color-primary)] whitespace-nowrap">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        {issue.key}
                      </Link>
                    </td>

                    <td className="py-3 px-4 max-w-md">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors block truncate"
                        title={issue.title}
                      >
                        {issue.title}
                      </Link>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                        {issue.projectName || 'CORE'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] uppercase">
                        {issue.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        issue.priority === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : issue.priority === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                      }`}>
                        {issue.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {issue.sprint ? (
                        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 w-max">
                          <Layers className="w-3 h-3" />
                          <span>{issue.sprint}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] opacity-60">
                          Backlog
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {issue.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={issue.assignee.fullName}
                            avatarUrl={issue.assignee.avatarUrl}
                            role={issue.assignee.systemRole}
                            size="xs"
                          />
                          <span className="truncate max-w-[120px] font-medium text-[var(--md-sys-color-on-surface)]">
                            {issue.assignee.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic opacity-60">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-right whitespace-nowrap">
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

      {/* Save Filter Modal */}
      {filterNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-[28px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span>Save Search Filter</span>
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Name this filter preset to pin it directly to your personal dashboard.
            </p>

            <form onSubmit={handleSaveFilter} className="space-y-4">
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
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setFilterNameModalOpen(false)}
                  className="px-4 py-2 rounded-full m3-btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full m3-btn-filled text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
