import { realtimeSocket } from '../api/socket';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  api,
  type IssueItem,
  type ProjectItem,
  type IssueStatus,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IssueModal } from '../components/kanban/IssueModal';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import { KanbanToolbar } from '../components/kanban/KanbanToolbar';
import { KanbanFlatBoard } from '../components/kanban/KanbanFlatBoard';
import { KanbanSwimlaneBoard } from '../components/kanban/KanbanSwimlaneBoard';
import { KanbanMobileView } from '../components/kanban/KanbanMobileView';
import { KanbanBoardSettingsModal } from '../components/kanban/KanbanBoardSettingsModal';
import type {
  KanbanSettings,
  QuickFilterState,
  BoardViewMode,
} from '../types/kanban';
import { DEFAULT_KANBAN_SETTINGS } from '../types/kanban';
import { CheckCircle2 } from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'bt_kanban_settings';

export const KanbanBoardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Project and issues state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>(
    projectId ? Number(projectId) : 'ALL',
  );
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Responsive screen detection (<640px is mobile single column / tab mode)
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Board Settings State with localStorage persistence
  const [settings, setSettings] = useState<KanbanSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_KANBAN_SETTINGS, ...parsed };
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_KANBAN_SETTINGS;
  });

  // URL query param override for view mode (e.g. ?view=swimlanes or ?view=flat)
  useEffect(() => {
    const viewParam = searchParams.get('view') as BoardViewMode | null;
    if (viewParam && (viewParam === 'flat' || viewParam === 'swimlanes')) {
      if (settings.viewMode !== viewParam) {
        setSettings((prev) => ({ ...prev, viewMode: viewParam }));
      }
    }
  }, [searchParams]);

  // Persist settings whenever they change
  const handleUpdateSettings = (newSettings: KanbanSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // Ignored
    }
  };

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState<string>(searchParams.get('issueType') || 'ALL');
  const [filterPriority, setFilterPriority] = useState<string>(searchParams.get('priority') || 'ALL');
  const [quickFilters, setQuickFilters] = useState<QuickFilterState>({
    onlyMine: false,
    unassignedOnly: false,
    highPriorityOnly: false,
  });

  const handleToggleQuickFilter = (key: keyof QuickFilterState) => {
    setQuickFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [defaultCreateAssigneeId, setDefaultCreateAssigneeId] = useState<number | null>(null);
  const [defaultCreateStatus, setDefaultCreateStatus] = useState<IssueStatus | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueItem | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  const [filterSavedMsg, setFilterSavedMsg] = useState<string | null>(null);

  // Load projects list
  useEffect(() => {
    api.getProjects()
      .then((data) => {
        setProjects(data);
        if (projectId) {
          const found = data.find((p) => p.id === Number(projectId));
          if (found) setSelectedProjectId(found.id);
        }
      })
      .catch(() => {});
  }, [projectId]);

  // Load issues
  const loadIssues = useCallback(async () => {
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
  }, [selectedProjectId]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

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

  // Client-side filtering logic
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Type filter
      if (filterType !== 'ALL' && issue.issueType !== filterType) return false;

      // Priority filter
      if (filterPriority !== 'ALL' && issue.priority !== filterPriority) return false;

      // Quick filter: Only My Issues
      if (quickFilters.onlyMine && user && issue.assignee?.id !== user.id) return false;

      // Quick filter: Unassigned Only
      if (quickFilters.unassignedOnly && issue.assignee !== null && issue.assignee !== undefined) return false;

      // Quick filter: High / Critical Priority Only
      if (quickFilters.highPriorityOnly && issue.priority !== 'CRITICAL' && issue.priority !== 'HIGH') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(term);
        const matchKey = issue.key.toLowerCase().includes(term);
        const matchDesc = issue.description?.toLowerCase().includes(term) ?? false;
        if (!matchTitle && !matchKey && !matchDesc) return false;
      }

      return true;
    });
  }, [issues, filterType, filterPriority, quickFilters, searchTerm, user]);

  // Status transition handler
  const handleStatusChange = async (issueId: number, nextStatus: IssueStatus) => {
    const original = issues.find((i) => i.id === issueId);
    if (!original || original.status === nextStatus) return;

    // Optimistic update
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: nextStatus } : i)));

    try {
      const updated = await api.updateIssueStatus(issueId, nextStatus);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
    } catch (err: any) {
      // Rollback
      setIssues((prev) => prev.map((i) => (i.id === issueId ? original : i)));
      setError(err.message || 'Failed to transition issue status');
    }
  };

  // Cross-swimlane and cross-status change handler
  const handleAssigneeAndStatusChange = async (
    issueId: number,
    newAssigneeId: number | null,
    nextStatus: IssueStatus,
  ) => {
    const original = issues.find((i) => i.id === issueId);
    if (!original) return;

    const isSameAssignee = (original.assignee?.id ?? null) === newAssigneeId;
    const isSameStatus = original.status === nextStatus;

    if (isSameAssignee && isSameStatus) return;

    // Optimistic update
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id !== issueId) return i;
        let newAssignee = i.assignee;
        if (!isSameAssignee) {
          if (newAssigneeId === null) {
            newAssignee = null;
          } else {
            // Find assignee details from other issues if available
            const foundUserIssue = issues.find((other) => other.assignee?.id === newAssigneeId);
            newAssignee = foundUserIssue?.assignee || {
              id: newAssigneeId,
              fullName: `User #${newAssigneeId}`,
              email: '',
            };
          }
        }
        return {
          ...i,
          status: nextStatus,
          assignee: newAssignee,
        };
      }),
    );

    try {
      // If assignee changed, update assignee
      if (!isSameAssignee) {
        await api.updateIssue(issueId, {
          assigneeId: newAssigneeId === null ? undefined : newAssigneeId,
        });
      }

      // If status changed, update status
      if (!isSameStatus) {
        await api.updateIssueStatus(issueId, nextStatus);
      }

      // Fetch fresh issue data to guarantee consistency
      const fresh = await api.getIssue(issueId);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? fresh : i)));
    } catch (err: any) {
      // Rollback
      setIssues((prev) => prev.map((i) => (i.id === issueId ? original : i)));
      setError(err.message || 'Failed to update issue');
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

  // Quick add button handler in specific column or swimlane
  const handleQuickAddInStatus = (status: IssueStatus, assigneeId?: number | null) => {
    setEditingIssue(null);
    setDefaultCreateStatus(status);
    setDefaultCreateAssigneeId(assigneeId ?? null);
    setIsCreateModalOpen(true);
  };

  // Save current filter query
  const handleSaveCurrentFilter = async () => {
    const filterName = prompt(
      'Enter a name for this custom filter:',
      `Filter: ${filterType !== 'ALL' ? filterType : ''} ${filterPriority !== 'ALL' ? filterPriority : ''}`,
    );
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

  const handleSelectProject = (val: number | 'ALL') => {
    setSelectedProjectId(val);
    if (typeof val === 'number') navigate(`/projects/${val}/board`);
    else navigate('/board');
  };

  const activeProject =
    typeof selectedProjectId === 'number'
      ? projects.find((p) => p.id === selectedProjectId) || null
      : null;

  return (
    <div className="w-full min-h-full flex flex-col px-3 sm:px-5 py-4 animate-in fade-in duration-200">
      {/* Kanban Action Toolbar */}
      <KanbanToolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        activeProject={activeProject}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        quickFilters={quickFilters}
        onToggleQuickFilter={handleToggleQuickFilter}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onRefresh={loadIssues}
        onSaveCurrentFilter={handleSaveCurrentFilter}
        loading={loading}
        totalFilteredCount={filteredIssues.length}
      />

      {/* Filter Saved Feedback Banner */}
      {filterSavedMsg && (
        <div className="mt-2.5 p-3 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-xs font-semibold flex items-center gap-2 animate-in fade-in shrink-0">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{filterSavedMsg}</span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="mt-2.5 p-3 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs shrink-0 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold underline cursor-pointer ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Board Surface (Responsive Render) */}
      <div className="flex-1 flex flex-col mt-2">
        {isMobile ? (
          <KanbanMobileView
            issues={filteredIssues}
            loading={loading}
            settings={settings}
            onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            onStatusChange={handleStatusChange}
            onAssignToMe={handleAssignToMe}
            onQuickAddInStatus={handleQuickAddInStatus}
            currentUserId={user?.id}
          />
        ) : settings.viewMode === 'swimlanes' ? (
          <KanbanSwimlaneBoard
            issues={filteredIssues}
            loading={loading}
            settings={settings}
            onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            onStatusChange={handleStatusChange}
            onAssigneeAndStatusChange={handleAssigneeAndStatusChange}
            onAssignToMe={handleAssignToMe}
            onQuickAddInStatus={handleQuickAddInStatus}
            currentUserId={user?.id}
          />
        ) : (
          <KanbanFlatBoard
            issues={filteredIssues}
            loading={loading}
            settings={settings}
            onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            onStatusChange={handleStatusChange}
            onAssignToMe={handleAssignToMe}
            onQuickAddInStatus={handleQuickAddInStatus}
            currentUserId={user?.id}
          />
        )}
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
          setDefaultCreateAssigneeId(null);
          setDefaultCreateStatus(null);
        }}
        onIssueSaved={(savedIssue) => {
          if (editingIssue) {
            setIssues((prev) => prev.map((i) => (i.id === savedIssue.id ? savedIssue : i)));
          } else {
            // If default status was selected, update status if needed
            if (defaultCreateStatus && defaultCreateStatus !== savedIssue.status) {
              api.updateIssueStatus(savedIssue.id, defaultCreateStatus)
                .then((updated) => {
                  setIssues((prev) => [updated, ...prev]);
                })
                .catch(() => {
                  setIssues((prev) => [savedIssue, ...prev]);
                });
            } else {
              setIssues((prev) => [savedIssue, ...prev]);
            }
          }
        }}
        defaultProjectId={selectedProjectId === 'ALL' ? projects[0]?.id : selectedProjectId}
        defaultAssigneeId={defaultCreateAssigneeId}
        editingIssue={editingIssue}
      />

      {/* Board Settings Modal */}
      <KanbanBoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
};
