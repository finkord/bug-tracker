import { realtimeSocket } from '../api/socket';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  api,
  type IssueItem,
  type ProjectItem,
  type IssueStatus,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IssueCard } from '../components/kanban/IssueCard';
import { IssueModal } from '../components/kanban/IssueModal';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import {
  Kanban,
  Plus,
  Search,
  RefreshCw,
  Layers,
  BookmarkPlus,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const COLUMNS: { status: IssueStatus; title: string; badgeColor: string }[] = [
  { status: 'OPEN', title: 'To Do', badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  { status: 'IN_PROGRESS', title: 'In Progress', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { status: 'REVIEW', title: 'Code Review', badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { status: 'RESOLVED', title: 'Resolved', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { status: 'CLOSED', title: 'Closed', badgeColor: 'bg-zinc-500/10 text-zinc-500' },
];

export const KanbanBoardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>(
    projectId ? Number(projectId) : 'ALL',
  );

  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState<string>(searchParams.get('issueType') || 'ALL');
  const [filterPriority, setFilterPriority] = useState<string>(searchParams.get('priority') || 'ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingIssue, setEditingIssue] = useState<IssueItem | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  // Drag and drop state
  const [dragOverColumn, setDragOverColumn] = useState<IssueStatus | null>(null);
  const [filterSavedMsg, setFilterSavedMsg] = useState<string | null>(null);

  // Load projects list
  useEffect(() => {
    api.getProjects()
      .then((data) => {
        setProjects(data);
        if (projectId) {
          const found = data.find((p) => p.id === Number(projectId));
          if (found) setSelectedProjectId(found.id);
        } else if (data.length > 0 && selectedProjectId === 'ALL') {
          // Keep ALL as default
        }
      })
      .catch(() => {});
  }, [projectId]);

  // Load issues
  const loadIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIssues({
        projectId: selectedProjectId === 'ALL' ? undefined : selectedProjectId,
      });
      setIssues(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load issues from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [selectedProjectId]);

  // Real-time WebSocket synchronization across users and browser tabs
  useEffect(() => {
    realtimeSocket.connect();
    if (selectedProjectId !== 'ALL') {
      realtimeSocket.joinProject(selectedProjectId);
    }

    const unsubCreated = realtimeSocket.onIssueCreated((newIssue) => {
      setIssues((prev) => {
        if (prev.some((i) => i.id === newIssue.id)) return prev;
        if (selectedProjectId !== 'ALL' && newIssue.projectId !== selectedProjectId) return prev;
        return [newIssue, ...prev];
      });
    });

    const unsubUpdated = realtimeSocket.onIssueUpdated((updatedIssue) => {
      setIssues((prev) => {
        const exists = prev.some((i) => i.id === updatedIssue.id);
        if (exists) {
          return prev.map((i) => (i.id === updatedIssue.id ? updatedIssue : i));
        } else if (selectedProjectId === 'ALL' || updatedIssue.projectId === selectedProjectId) {
          return [updatedIssue, ...prev];
        }
        return prev;
      });
    });

    const unsubDeleted = realtimeSocket.onIssueDeleted(({ issueId }) => {
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    });

    return () => {
      if (selectedProjectId !== 'ALL') {
        realtimeSocket.leaveProject(selectedProjectId);
      }
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [selectedProjectId]);

  // Client-side filtering
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filterType !== 'ALL' && issue.issueType !== filterType) return false;
      if (filterPriority !== 'ALL' && issue.priority !== filterPriority) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(term);
        const matchKey = issue.key.toLowerCase().includes(term);
        const matchDesc = issue.description?.toLowerCase().includes(term) ?? false;
        if (!matchTitle && !matchKey && !matchDesc) return false;
      }
      return true;
    });
  }, [issues, filterType, filterPriority, searchTerm]);

  // Status transition handler
  const handleStatusChange = async (issueId: number, nextStatus: IssueStatus) => {
    try {
      const updated = await api.updateIssueStatus(issueId, nextStatus);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
    } catch (err: any) {
      setError(err.message || 'Failed to transition issue status');
    }
  };

  // Self-assignment handler
  const handleAssignToMe = async (issueId: number) => {
    try {
      const updated = await api.assignIssueToMe(issueId);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
    } catch (err: any) {
      setError(err.message || 'Failed to self-assign issue');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) setDragOverColumn(status);
  };

  const handleDragLeave = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    if (dragOverColumn === status) setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const issueIdStr = e.dataTransfer.getData('text/plain');
    if (!issueIdStr) return;

    const issueId = Number(issueIdStr);
    const target = issues.find((i) => i.id === issueId);
    if (!target || target.status === status) return;

    await handleStatusChange(issueId, status);
  };

  // Save current filter query
  const handleSaveCurrentFilter = async () => {
    const filterName = prompt('Enter a name for this custom filter:', `Filter: ${filterType !== 'ALL' ? filterType : ''} ${filterPriority !== 'ALL' ? filterPriority : ''}`);
    if (!filterName || !filterName.trim()) return;

    try {
      const criteria = {
        issueType: filterType !== 'ALL' ? filterType : undefined,
        priority: filterPriority !== 'ALL' ? filterPriority : undefined,
        search: searchTerm.trim() || undefined,
      };
      await api.createSavedFilter(filterName.trim(), JSON.stringify(criteria));
      setFilterSavedMsg('Filter saved! Available in your Personal Dashboard.');
      setTimeout(() => setFilterSavedMsg(null), 3000);
    } catch {
      // Ignored
    }
  };

  const activeProject = typeof selectedProjectId === 'number' ? projects.find((p) => p.id === selectedProjectId) : null;

  return (
    <div className="max-w-[1700px] mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-8rem)] animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
        {/* Left: Title & Project Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold shadow-xs">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--md-sys-color-on-surface)] leading-tight">
              Kanban Board
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                aria-label="Workspace selector"
                value={selectedProjectId}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setSelectedProjectId(val);
                  if (typeof val === 'number') navigate(`/projects/${val}/board`);
                  else navigate('/board');
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                <option value="ALL">All Workspaces</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>

              {activeProject && (
                <Link
                  to={`/projects/${activeProject.id}/backlog`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline"
                >
                  <Layers className="w-3 h-3" />
                  <span>Agile Backlog</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right: Search, Filters, and New Issue Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="text"
              placeholder="Search title, key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
          >
            <option value="ALL">All Types</option>
            <option value="BUG">🐛 Bug</option>
            <option value="TASK">📋 Task</option>
            <option value="FEATURE">🚀 Feature</option>
            <option value="IMPROVEMENT">⚡ Improvement</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Save Filter Button */}
          {(filterType !== 'ALL' || filterPriority !== 'ALL' || searchTerm.trim()) && (
            <button
              type="button"
              onClick={handleSaveCurrentFilter}
              className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              title="Save filter to Dashboard"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadIssues}
            disabled={loading}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
            title="Refresh board"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Create Issue Button */}
          <button
            onClick={() => {
              setEditingIssue(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold m3-btn-filled shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {filterSavedMsg && (
        <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{filterSavedMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Kanban Columns Grid */}
      <div className="flex-1 mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colIssues = filteredIssues.filter((i) => i.status === col.status);
          const isOver = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={(e) => handleDragLeave(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex flex-col min-w-[260px] rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border transition-all duration-200 ${
                isOver
                  ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/20 shadow-md bg-[var(--md-sys-color-surface-container)]'
                  : 'border-[var(--md-sys-color-outline-variant)]/60'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-[var(--md-sys-color-outline-variant)]/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                    {col.title}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colIssues.length}
                  </span>
                </div>
              </div>

              {/* Column Issue Cards Container */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[300px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--md-sys-color-primary)]" />
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Loading...</span>
                  </div>
                ) : colIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-[var(--md-sys-color-outline-variant)]/50 rounded-xl text-center p-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <span>No issues</span>
                    <span className="text-[10px] opacity-70 mt-0.5">Drag tickets here</span>
                  </div>
                ) : (
                  colIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onClick={(item) => setSelectedIssueId(item.id)}
                      onStatusChange={handleStatusChange}
                      onAssignToMe={handleAssignToMe}
                      currentUserId={user?.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        isOpen={!!selectedIssueId}
        issueId={selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onIssueUpdated={(updated) => {
          setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        }}
        onIssueDeleted={(deletedId) => {
          setIssues((prev) => prev.filter((i) => i.id !== deletedId));
        }}
        onEditClick={(issueToEdit) => {
          setEditingIssue(issueToEdit);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Create / Edit Issue Modal */}
      <IssueModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingIssue(null);
        }}
        onIssueSaved={(savedIssue) => {
          if (editingIssue) {
            setIssues((prev) => prev.map((i) => (i.id === savedIssue.id ? savedIssue : i)));
          } else {
            setIssues((prev) => [savedIssue, ...prev]);
          }
        }}
        defaultProjectId={selectedProjectId === 'ALL' ? projects[0]?.id : selectedProjectId}
        editingIssue={editingIssue}
      />
    </div>
  );
};
