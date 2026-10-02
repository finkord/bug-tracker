import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProjectsQuery,
  useProjectQuickFiltersQuery,
  useProjectComponentsQuery,
  useIssuesQuery,
  useUpdateIssueStatusMutation,
  useUpdateIssueMutation,
  useAssignIssueToMeMutation,
  useCreateSavedFilterMutation,
  issueKeys,
} from '../api/queries';
import {
  type IssueItem,
  type IssueStatus,
  type IssuePriority,
  type PaginatedIssuesResponse,
} from '../api/client';
import { realtimeSocket } from '../api/socket';
import { useAuth } from '../store';
import { IssueModal } from '../components/kanban/IssueModal';
import { KanbanToolbar } from '../components/kanban/KanbanToolbar';
import { KanbanFlatBoard } from '../components/kanban/KanbanFlatBoard';
import { KanbanSwimlaneBoard } from '../components/kanban/KanbanSwimlaneBoard';
import { KanbanMobileView } from '../components/kanban/KanbanMobileView';
import { KanbanBoardSettingsModal } from '../components/kanban/KanbanBoardSettingsModal';
import { SaveFilterModal } from '../components/kanban/SaveFilterModal';
import { FloatingBulkActionBar } from '../components/common/FloatingBulkActionBar';
import { useListKeyboardNavigation } from '../hooks';
import type {
  KanbanSettings,
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

  const handleOpenIssue = (issue: { key: string }) => {
    navigate(`/issues/${issue.key}`, { state: { from: 'board', label: 'Back to Board' } });
  };

  // TanStack Query for projects
  const { data: projects = [] } = useProjectsQuery();

  const selectedProject = useMemo(() => {
    if (!projectId || !projects.length) return undefined;
    const numId = Number(projectId);
    if (!Number.isNaN(numId)) {
      return projects.find((p) => p.id === numId);
    }
    return projects.find(
      (p) => p.key?.toUpperCase() === projectId.toUpperCase(),
    );
  }, [projects, projectId]);

  const selectedProjectId: number =
    selectedProject?.id ??
    (projectId && !Number.isNaN(Number(projectId)) ? Number(projectId) : 0);

  // TanStack Query for issues
  const issueFilter = useMemo(
    () => ({ projectId: selectedProjectId }),
    [selectedProjectId],
  );

  const {
    data: issuesData,
    isLoading: loading,
    refetch: loadIssues,
  } = useIssuesQuery(issueFilter);
  const issues = useMemo(() => issuesData?.items ?? [], [issuesData?.items]);

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

  // Synchronize backend project WIP limits if configured
  useEffect(() => {
    if (selectedProject?.wipLimits && Object.keys(selectedProject.wipLimits).length > 0) {
      setSettings((prev) => ({
        ...prev,
        wipLimits: {
          ...prev.wipLimits,
          ...selectedProject.wipLimits,
        },
      }));
    }
  }, [selectedProject?.wipLimits]);

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
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  // Quick Filters & Components State
  const { data: projectQuickFilters = [] } = useProjectQuickFiltersQuery(selectedProjectId);
  const { data: projectComponents = [] } = useProjectComponentsQuery(selectedProjectId);
  const [activeQuickFilterIds, setActiveQuickFilterIds] = useState<number[]>([]);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'layout' | 'quickFilters'>('layout');

  const handleToggleQuickFilter = (id: number) => {
    setActiveQuickFilterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [defaultCreateAssigneeId, setDefaultCreateAssigneeId] = useState<number | null>(null);
  const [defaultCreateStatus, setDefaultCreateStatus] = useState<IssueStatus | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueItem | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState<boolean>(false);
  const [filterSavedMsg, setFilterSavedMsg] = useState<string | null>(null);

  // Real-time WebSocket synchronization across users and browser tabs
  useEffect(() => {
    realtimeSocket.connect();
    realtimeSocket.joinProject(selectedProjectId);

    const unsubCreated = realtimeSocket.onIssueCreated((newIssue) => {
      queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(issueFilter), (old) => {
        const items = old?.items ?? [];
        if (items.some((i) => i.id === newIssue.id)) return old;
        if (newIssue.projectId !== selectedProjectId) return old;
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
        } else if (updatedIssue.projectId === selectedProjectId) {
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
      realtimeSocket.leaveProject(selectedProjectId);
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [selectedProjectId, issueFilter, queryClient]);

  // Filtering logic respecting dynamic quick filters and component
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filterType !== 'ALL' && issue.issueType !== filterType) return false;
      if (filterPriority !== 'ALL' && issue.priority !== filterPriority) return false;
      if (selectedComponentId !== null && issue.componentId !== selectedComponentId) return false;

      // Evaluate active quick filter JQL conditions
      for (const filterId of activeQuickFilterIds) {
        const qf = projectQuickFilters.find((f) => f.id === filterId);
        if (!qf) continue;
        const qLower = qf.jqlQuery.toLowerCase();
        if (qLower.includes('currentuser()') || qLower.includes('assignee = me')) {
          if (!user || issue.assignee?.id !== user.id) return false;
        } else if (qLower.includes('unassigned') || qLower.includes('is empty') || qLower.includes('is null')) {
          if (issue.assignee !== null && issue.assignee !== undefined) return false;
        } else if (qLower.includes('critical') && qLower.includes('high')) {
          if (issue.priority !== 'CRITICAL' && issue.priority !== 'HIGH') return false;
        } else if (qLower.includes('critical')) {
          if (issue.priority !== 'CRITICAL') return false;
        } else if (qLower.includes('type = "bug"') || qLower.includes('type = bug')) {
          if (issue.issueType !== 'BUG') return false;
        }
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(term);
        const matchKey = issue.key.toLowerCase().includes(term);
        const matchDesc = issue.description?.toLowerCase().includes(term) ?? false;
        if (!matchTitle && !matchKey && !matchDesc) return false;
      }

      return true;
    });
  }, [issues, filterType, filterPriority, selectedComponentId, activeQuickFilterIds, projectQuickFilters, searchTerm, user]);

  // J/K/Enter/O high-velocity list keyboard navigation
  const { focusedId } = useListKeyboardNavigation({
    items: filteredIssues,
    onOpenItem: handleOpenIssue,
    enabled: !isCreateModalOpen && !isSettingsModalOpen,
  });

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

  // Cross-swimlane drop handler supporting Assignee, Epic, and Priority/Expedite
  const handleSwimlaneDrop = async (
    issueId: number,
    nextStatus: IssueStatus,
    patch?: { assigneeId?: number | null; parentId?: number | null; priority?: IssuePriority },
  ) => {
    const original = issues.find((i) => i.id === issueId);
    if (!original) return;

    try {
      if (patch && Object.keys(patch).length > 0) {
        await updateIssueMutation.mutateAsync({
          id: issueId,
          data: {
            assigneeId: patch.assigneeId === null ? undefined : patch.assigneeId,
            parentId: patch.parentId === null ? undefined : patch.parentId,
            priority: patch.priority,
          },
        });
      }

      if (original.status !== nextStatus) {
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

  const activeProject = selectedProject || projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 animate-in fade-in duration-200">
      {/* Kanban Action Toolbar */}
      <KanbanToolbar
        activeProject={activeProject}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        projectComponents={projectComponents}
        selectedComponentId={selectedComponentId}
        onSelectComponent={setSelectedComponentId}
        projectQuickFilters={projectQuickFilters}
        activeQuickFilterIds={activeQuickFilterIds}
        onToggleQuickFilter={handleToggleQuickFilter}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettingsModal={(tab) => {
          setSettingsInitialTab(tab || 'layout');
          setIsSettingsModalOpen(true);
        }}
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
            onSelectIssue={handleOpenIssue}
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
            onSelectIssue={handleOpenIssue}
            onStatusChange={handleStatusChange}
            onAssigneeAndStatusChange={handleAssigneeAndStatusChange}
            onSwimlaneDrop={handleSwimlaneDrop}
            onAssignToMe={handleAssignToMe}
            onQuickAddInStatus={handleQuickAddInStatus}
            currentUserId={user?.id}
            focusedIssueId={focusedId}
          />
        ) : (
          <KanbanFlatBoard
            issues={filteredIssues}
            loading={loading}
            settings={settings}
            onSelectIssue={handleOpenIssue}
            onStatusChange={handleStatusChange}
            onAssignToMe={handleAssignToMe}
            onQuickAddInStatus={handleQuickAddInStatus}
            currentUserId={user?.id}
            focusedIssueId={focusedId}
          />
        )}
      </div>

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
        defaultProjectId={selectedProjectId}
        defaultAssigneeId={defaultCreateAssigneeId}
        editingIssue={editingIssue}
      />

      {/* Board Settings Modal */}
      <KanbanBoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        projectId={selectedProjectId}
        initialTab={settingsInitialTab}
      />

      {/* Save Filter Modal Dialog */}
      <SaveFilterModal
        isOpen={isSaveFilterModalOpen}
        onClose={() => setIsSaveFilterModalOpen(false)}
        onSave={handleConfirmSaveFilter}
        defaultFilterName={`Filter: ${filterType !== 'ALL' ? filterType : ''} ${filterPriority !== 'ALL' ? filterPriority : ''}`.trim() || 'Custom Filter'}
      />

      {/* Floating Bulk Action Bar */}
      <FloatingBulkActionBar projectId={selectedProjectId} />
    </div>
  );
};
