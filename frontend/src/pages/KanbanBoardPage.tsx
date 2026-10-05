import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProjectsQuery,
  useProjectQuickFiltersQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
  useTeamsQuery,
  useProjectSprintsQuery,
  useCompleteSprintMutation,
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
import { SaveFilterModal } from '../components/search/SaveFilterModal';
import { FloatingBulkActionBar } from '../components/common/FloatingBulkActionBar';
import { CompleteSprintModal } from '../components/agile/CompleteSprintModal';
import { SprintAnalyticsModal } from '../components/kanban/SprintAnalyticsModal';
import { Button } from '../components/ui';
import { useListKeyboardNavigation } from '../hooks';
import type {
  KanbanSettings,
  BoardViewMode,
} from '../types/kanban';
import { DEFAULT_KANBAN_SETTINGS } from '../types/kanban';
import {
  CheckCircle2,
  Zap,
  BarChart3,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'bt_kanban_settings';
const BOARD_MODE_STORAGE_KEY = 'bt_board_mode';

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

  // Board Mode: 'kanban' continuous flow vs 'scrum' active sprint execution
  const [boardMode, setBoardMode] = useState<'kanban' | 'scrum'>(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'scrum' || urlMode === 'kanban') return urlMode;
    try {
      const stored = localStorage.getItem(BOARD_MODE_STORAGE_KEY);
      if (stored === 'scrum' || stored === 'kanban') return stored;
    } catch {
      // Ignored
    }
    return 'kanban';
  });

  const handleBoardModeChange = (mode: 'kanban' | 'scrum') => {
    setBoardMode(mode);
    try {
      localStorage.setItem(BOARD_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignored
    }
  };

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState<string>(searchParams.get('issueType') || 'ALL');
  const [filterPriority, setFilterPriority] = useState<string>(searchParams.get('priority') || 'ALL');
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  // Queries for Components, Quick Filters, Versions, Teams, and Sprints
  const { data: projectQuickFilters = [] } = useProjectQuickFiltersQuery(selectedProjectId);
  const { data: projectComponents = [] } = useProjectComponentsQuery(selectedProjectId);
  const { data: projectVersions = [] } = useProjectVersionsQuery(selectedProjectId);
  const { data: teams = [] } = useTeamsQuery(selectedProjectId);
  const { data: projectSprints = [] } = useProjectSprintsQuery(
    selectedProjectId,
    selectedTeamId || undefined,
  );
  const completeSprintMutation = useCompleteSprintMutation();

  const [activeQuickFilterIds, setActiveQuickFilterIds] = useState<number[]>([]);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'layout' | 'quickFilters'>('layout');
  const [isCompleteSprintOpen, setIsCompleteSprintOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const activeSprint = useMemo(() => {
    return projectSprints.find((s) => s.status === 'ACTIVE') || null;
  }, [projectSprints]);

  const sprintDefinitions = useMemo(() => {
    const map: Record<string, any> = {};
    projectSprints.forEach((s) => {
      map[s.name] = s;
    });
    return map;
  }, [projectSprints]);

  const daysRemaining = useMemo(() => {
    if (!activeSprint?.endDate) return null;
    const end = new Date(activeSprint.endDate).getTime();
    const diff = end - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [activeSprint?.endDate]);

  const activeSprintIssues = useMemo(() => {
    if (!activeSprint) return [];
    return issues.filter((i) => i.sprintId === activeSprint.id);
  }, [issues, activeSprint]);

  const completedSprintIssuesCount = useMemo(() => {
    return activeSprintIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  }, [activeSprintIssues]);

  const handleToggleQuickFilter = (id: number) => {
    setActiveQuickFilterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirmCompleteSprint = async (
    sprintId: number,
    rolloverTargetSprintId: number | null,
  ) => {
    try {
      await completeSprintMutation.mutateAsync({
        projectId: selectedProjectId,
        sprintId,
        data: { transferSprintId: rolloverTargetSprintId },
      });
      setIsCompleteSprintOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete sprint');
    }
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

  // Filtering logic respecting board mode, dynamic quick filters, component, release, and team
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // In Scrum active sprint mode, only display tickets belonging to the active sprint
      if (boardMode === 'scrum') {
        if (!activeSprint || issue.sprintId !== activeSprint.id) return false;
      }
      if (filterType !== 'ALL' && issue.issueType !== filterType) return false;
      if (filterPriority !== 'ALL' && issue.priority !== filterPriority) return false;
      if (selectedComponentId !== null && issue.componentId !== selectedComponentId) return false;
      if (selectedVersionId !== null && issue.fixVersionId !== selectedVersionId) return false;
      if (selectedTeamId !== null) {
        if (issue.sprint?.id) {
          const sprint = projectSprints.find((s) => s.id === issue.sprint?.id);
          if (!sprint || sprint.teamId !== selectedTeamId) return false;
        } else {
          return false;
        }
      }

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
  }, [
    issues,
    boardMode,
    activeSprint,
    filterType,
    filterPriority,
    selectedComponentId,
    selectedVersionId,
    selectedTeamId,
    projectSprints,
    activeQuickFilterIds,
    projectQuickFilters,
    searchTerm,
    user,
  ]);

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

  const handleConfirmSaveFilter = async (payload: { name: string } | string) => {
    const filterName = typeof payload === 'string' ? payload : payload.name;
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
        boardMode={boardMode}
        onBoardModeChange={handleBoardModeChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        projectComponents={projectComponents}
        selectedComponentId={selectedComponentId}
        onSelectComponent={setSelectedComponentId}
        projectVersions={projectVersions}
        selectedVersionId={selectedVersionId}
        onSelectVersion={setSelectedVersionId}
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
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

      {/* Scrum Mode: Active Sprint Goal & Status Banner */}
      {boardMode === 'scrum' && (
        <div className="mt-3">
          {activeSprint ? (
            <div className="p-4 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span>{activeSprint.name}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] uppercase">
                    Active Sprint
                  </span>
                  {activeSprint.team && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{activeSprint.team.name}</span>
                    </span>
                  )}
                  {daysRemaining !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        daysRemaining < 0
                          ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'
                          : daysRemaining <= 2
                          ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
                          : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>
                        {daysRemaining < 0
                          ? `${Math.abs(daysRemaining)}d overdue`
                          : daysRemaining === 0
                          ? 'Ends today'
                          : `${daysRemaining}d left`}
                      </span>
                    </span>
                  )}
                </div>

                {activeSprint.goal ? (
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-1 italic">
                    Goal: {activeSprint.goal}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--md-sys-color-outline)] italic">
                    No sprint goal defined
                  </p>
                )}

                {/* Capacity & Progress Mini Bar */}
                <div className="flex items-center gap-3 mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <span>
                      {completedSprintIssuesCount}/{activeSprintIssues.length} issues done
                    </span>
                  </div>
                  <div className="w-32 h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--md-sys-color-primary)] transition-all duration-300"
                      style={{
                        width: `${
                          activeSprintIssues.length > 0
                            ? Math.round((completedSprintIssuesCount / activeSprintIssues.length) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] opacity-80">
                    {activeSprintIssues.length > 0
                      ? Math.round((completedSprintIssuesCount / activeSprintIssues.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAnalyticsOpen(true)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Sprint Analytics</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCompleteSprintOpen(true)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete Sprint</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 my-2 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-dashed border-[var(--md-sys-color-outline-variant)] text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  No Active Sprint
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-md">
                  There is currently no running sprint in this project. Start a planned sprint from the Backlog planning board to track active sprint delivery here.
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/projects/${selectedProject?.key || selectedProjectId}/backlog`)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <span>Go to Backlog Planning</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBoardModeChange('kanban')}
                  className="text-xs"
                >
                  <span>Switch to Kanban Continuous Flow</span>
                </Button>
              </div>
            </div>
          )}
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

      {/* Complete Sprint Modal */}
      {activeSprint && (
        <CompleteSprintModal
          isOpen={isCompleteSprintOpen}
          onClose={() => setIsCompleteSprintOpen(false)}
          sprint={activeSprint}
          issues={activeSprintIssues}
          availableSprints={projectSprints}
          onConfirmComplete={handleConfirmCompleteSprint}
        />
      )}

      {/* Sprint Analytics & Burndown Modal */}
      {activeSprint && (
        <SprintAnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          sprint={activeSprint}
          sprintIssues={activeSprintIssues}
          allSprints={sprintDefinitions}
          allIssues={issues}
        />
      )}
    </div>
  );
};
