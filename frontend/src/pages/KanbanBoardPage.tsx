import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProjectsQuery,
  useIssuesQuery,
  useUpdateIssueStatusMutation,
  useUpdateIssueMutation,
  useAssignIssueToMeMutation,
  useCreateSavedFilterMutation,
  issueKeys,
} from '../api/queries';
import { type IssueItem, type IssueStatus, type PaginatedIssuesResponse } from '../api/client';
import { realtimeSocket } from '../api/socket';
import { useAuth } from '../store';
import { IssueModal } from '../components/kanban/IssueModal';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import { KanbanToolbar } from '../components/kanban/KanbanToolbar';
import { KanbanFlatBoard } from '../components/kanban/KanbanFlatBoard';
import { KanbanSwimlaneBoard } from '../components/kanban/KanbanSwimlaneBoard';
import { KanbanMobileView } from '../components/kanban/KanbanMobileView';
import { KanbanBoardSettingsModal } from '../components/kanban/KanbanBoardSettingsModal';
import { SaveFilterModal } from '../components/kanban/SaveFilterModal';
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
  const queryClient = useQueryClient();

  const selectedProjectId: number | 'ALL' = projectId ? Number(projectId) : 'ALL';

  // TanStack Query for projects
  const { data: projects = [] } = useProjectsQuery();

  // TanStack Query for issues
  const issueFilter = useMemo(
    () => (selectedProjectId === 'ALL' ? undefined : { projectId: selectedProjectId }),
    [selectedProjectId],
  );

  const {
    data: issuesData,
    isLoading: loading,
    refetch: loadIssues,
  } = useIssuesQuery(issueFilter);
  const issues = issuesData?.items ?? [];

  const updateStatusMutation = useUpdateIssueStatusMutation();
  const updateIssueMutation = useUpdateIssueMutation();
  const assignMutation = useAssignIssueToMeMutation();
  const createSavedFilterMutation = useCreateSavedFilterMutation();

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
  }, [searchParams, settings.viewMode]);

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
  const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState<boolean>(false);
  const [filterSavedMsg, setFilterSavedMsg] = useState<string | null>(null);

  // Real-time WebSocket synchronization across users and browser tabs
  useEffect(() => {
    realtimeSocket.connect();
    if (selectedProjectId !== 'ALL') {
      realtimeSocket.joinProject(selectedProjectId);
    }

    const unsubCreated = realtimeSocket.onIssueCreated((newIssue) => {
      queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(issueFilter), (old) => {
        const items = old?.items ?? [];
        if (items.some((i) => i.id === newIssue.id)) return old;
        if (selectedProjectId !== 'ALL' && newIssue.projectId !== selectedProjectId) return old;
        const nextItems = [newIssue, ...items];
        return {
          items: nextItems,
          total: (old?.total ?? 0) + 1,
          page: old?.page ?? 1,
          limit: old?.limit ?? 50,
          totalPages: Math.ceil(((old?.total ?? 0) + 1) / (old?.limit ?? 50)),
        };
      });
    });

    const unsubUpdated = realtimeSocket.onIssueUpdated((updatedIssue) => {
      queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(issueFilter), (old) => {
        if (!old) return old;
        const exists = old.items.some((i) => i.id === updatedIssue.id);
        let nextItems: IssueItem[];
        if (exists) {
          nextItems = old.items.map((i) => (i.id === updatedIssue.id ? updatedIssue : i));
        } else if (selectedProjectId === 'ALL' || updatedIssue.projectId === selectedProjectId) {
          nextItems = [updatedIssue, ...old.items];
        } else {
          return old;
        }
        return {
          ...old,
          items: nextItems,
          total: nextItems.length,
        };
      });
    });

    const unsubDeleted = realtimeSocket.onIssueDeleted(({ issueId }) => {
      queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(issueFilter), (old) => {
        if (!old) return old;
        const nextItems = old.items.filter((i) => i.id !== issueId);
        return {
          ...old,
          items: nextItems,
          total: Math.max(0, old.total - 1),
        };
      });
    });

    return () => {
      if (selectedProjectId !== 'ALL') {
        realtimeSocket.leaveProject(selectedProjectId);
      }
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [selectedProjectId, issueFilter, queryClient]);

  // Client-side filtering logic
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filterType !== 'ALL' && issue.issueType !== filterType) return false;
      if (filterPriority !== 'ALL' && issue.priority !== filterPriority) return false;
      if (quickFilters.onlyMine && user && issue.assignee?.id !== user.id) return false;
      if (quickFilters.unassignedOnly && issue.assignee !== null && issue.assignee !== undefined) return false;
      if (quickFilters.highPriorityOnly && issue.priority !== 'CRITICAL' && issue.priority !== 'HIGH') return false;

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

    try {
      await updateStatusMutation.mutateAsync({ issueId, status: nextStatus });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to transition issue status');
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

    try {
      if (!isSameAssignee) {
        await updateIssueMutation.mutateAsync({
          id: issueId,
          data: { assigneeId: newAssigneeId === null ? undefined : newAssigneeId },
        });
      }

      if (!isSameStatus) {
        await updateStatusMutation.mutateAsync({ issueId, status: nextStatus });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update issue');
    }
  };

  // Self-assignment handler
  const handleAssignToMe = async (issueId: number) => {
    try {
      await assignMutation.mutateAsync(issueId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to self-assign issue');
    }
  };

  // Quick add button handler in specific column or swimlane
  const handleQuickAddInStatus = (status: IssueStatus, assigneeId?: number | null) => {
    setEditingIssue(null);
    setDefaultCreateStatus(status);
    setDefaultCreateAssigneeId(assigneeId ?? null);
    setIsCreateModalOpen(true);
  };

  // Save current filter query via modal dialog
  const handleSaveCurrentFilter = () => {
    setIsSaveFilterModalOpen(true);
  };

  const handleConfirmSaveFilter = async (filterName: string) => {
    try {
      const criteria = {
        issueType: filterType !== 'ALL' ? filterType : undefined,
        priority: filterPriority !== 'ALL' ? filterPriority : undefined,
        search: searchTerm.trim() || undefined,
      };
      await createSavedFilterMutation.mutateAsync({
        name: filterName.trim(),
        criteria: JSON.stringify(criteria),
      });
      setFilterSavedMsg('Filter saved! Available in your Personal Dashboard.');
      setTimeout(() => setFilterSavedMsg(null), 3000);
    } catch {
      // Ignored
    }
  };

  const handleSelectProject = (val: number | 'ALL') => {
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
        onRefresh={() => loadIssues()}
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
          if (defaultCreateStatus && defaultCreateStatus !== savedIssue.status) {
            updateStatusMutation.mutate({ issueId: savedIssue.id, status: defaultCreateStatus });
          } else {
            queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
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

      {/* Save Filter Modal Dialog */}
      <SaveFilterModal
        isOpen={isSaveFilterModalOpen}
        onClose={() => setIsSaveFilterModalOpen(false)}
        onSave={handleConfirmSaveFilter}
        defaultFilterName={`Filter: ${filterType !== 'ALL' ? filterType : ''} ${filterPriority !== 'ALL' ? filterPriority : ''}`.trim() || 'Custom Filter'}
      />
    </div>
  );
};
