import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  MeasuringStrategy,
  type CollisionDetection,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AgileToolbar } from '../components/agile/AgileToolbar';
import { SprintContainer } from '../components/agile/SprintContainer';
import { BacklogSection } from '../components/agile/BacklogSection';
import { ActiveSprintBoard } from '../components/agile/ActiveSprintBoard';
import { SprintFormModal } from '../components/agile/SprintFormModal';
import { CompleteSprintModal } from '../components/agile/CompleteSprintModal';
import { SprintAnalyticsModal } from '../components/kanban/SprintAnalyticsModal';
import { IssueModal } from '../components/kanban/IssueModal';
import { useAgileBacklog } from '../hooks/useAgileBacklog';
import { useListKeyboardNavigation } from '../hooks';
import { useUpdateIssueMutation, issueQueries } from '../api/queries';
import { useAuth } from '../store';
import { useIssueSelectionStore } from '../store/useIssueSelectionStore';
import type { IssueItem, PaginatedIssuesResponse } from '../api/client';
import type {
  SprintDefinition,
  AgileViewMode,
} from '../types/agile';
import { Loader2 } from 'lucide-react';
import { useProjectsQuery } from '../api/queries';
import { FloatingBulkActionBar } from '../components/common/FloatingBulkActionBar';
import { AgileBacklogLeftDrawer } from '../components/agile/AgileBacklogLeftDrawer';
import { ConfirmDialog } from '../components/ui';

const BACKLOG_DRAWER_STORAGE_KEY = 'bugtracker_backlog_drawer';
const EMPTY_ISSUES: IssueItem[] = [];

interface AgileGhostRowProps {
  issue: IssueItem;
  selectedCount?: number;
}

const AgileGhostRow: React.FC<AgileGhostRowProps> = React.memo(({ issue, selectedCount }) => {
  return (
    <div
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border-2 border-[var(--md-sys-color-primary)] shadow-2xl w-[500px] max-w-[90vw] select-none pointer-events-none relative"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/40 px-2 py-0.5 rounded-full shrink-0">
          {issue.key}
        </span>
        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
          {issue.title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
          {issue.status}
        </span>
        {issue.assignee && (
          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] max-w-[100px] truncate">
            {issue.assignee.fullName}
          </span>
        )}
      </div>

      {selectedCount && selectedCount > 1 ? (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold shadow-md ring-2 ring-[var(--md-sys-color-surface)]">
          +{selectedCount - 1} more
        </span>
      ) : null}
    </div>
  );
});

const backlogCollisionDetection: CollisionDetection = (args) => {
  const { pointerCoordinates, droppableContainers } = args;
  if (!pointerCoordinates) {
    return [];
  }

  const el = document.elementFromPoint(pointerCoordinates.x, pointerCoordinates.y);
  if (el) {
    const zoneEl = el.closest<HTMLElement>('[data-drop-zone]');
    if (zoneEl) {
      const dropType = zoneEl.getAttribute('data-drop-zone');
      let targetContainerId: string | undefined;

      if (dropType === 'sprint') {
        const sId = zoneEl.getAttribute('data-sprint-id');
        targetContainerId = `sprint-${sId}`;
      } else if (dropType === 'backlog') {
        targetContainerId = 'backlog';
      } else if (dropType === 'epic') {
        const epId = zoneEl.getAttribute('data-epic-id');
        targetContainerId = `drawer-epic-${epId}`;
      } else if (dropType === 'version') {
        const vId = zoneEl.getAttribute('data-version-id');
        targetContainerId = `drawer-version-${vId}`;
      }

      if (targetContainerId) {
        const container = droppableContainers.find((c) => c.id === targetContainerId);
        if (container) {
          return [{ id: container.id, data: { droppableContainer: container, value: 1 } }];
        }
      }
    }
  }

  return pointerWithin(args);
};

export const BacklogPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const selectedProjectId =
    selectedProject?.id ??
    (projectId && !Number.isNaN(Number(projectId)) ? Number(projectId) : 0);

  // Hook managing persistent sprint data, issues, websocket events and filtering
  const {
    issues,
    setIssues,
    sprintDefinitions,
    loading,
    error,
    setError,
    filters,
    setFilters,
    filteredIssues,
    allSprintNames,
    activeSprint,
    sprintList,
    loadData,
    handleMoveToSprint,
    handleBulkMoveToSprint,
    handleStatusChange,
    handleAssignToMe,
    handleSaveSprint: saveSprint,
    handleStartSprint,
    handleConfirmCompleteSprint,
    handleDeleteSprint,
  } = useAgileBacklog(selectedProjectId);

  const issuesBySprintId = useMemo(() => {
    const map = new Map<number | null, IssueItem[]>();
    map.set(null, []);
    for (const sprint of sprintList) {
      if (sprint.id !== undefined && sprint.id !== null) {
        map.set(sprint.id, []);
      }
    }
    for (const issue of filteredIssues) {
      const sId = issue.sprintId ?? null;
      const list = map.get(sId);
      if (list) {
        list.push(issue);
      } else {
        map.set(sId, [issue]);
      }
    }
    return map;
  }, [filteredIssues, sprintList]);

  // View Mode: 'backlog' (Planning) vs 'board' (Active Sprint Scrum Execution)
  const [viewMode, setViewMode] = useState<AgileViewMode>('backlog');

  // Collapse toggles state
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  const [isBacklogCollapsed, setIsBacklogCollapsed] = useState<boolean>(false);

  // Left Drawer state ('epics' | 'versions' | 'closed')
  const [drawerState, setDrawerState] = useState<'epics' | 'versions' | 'closed'>(() => {
    try {
      const stored = localStorage.getItem(BACKLOG_DRAWER_STORAGE_KEY);
      if (stored === 'epics' || stored === 'versions' || stored === 'closed') {
        return stored;
      }
    } catch {
      // Ignored
    }
    return 'closed'; // Default collapsed on desktop (Jira-aligned)
  });

  const handleToggleDrawer = useCallback((tab: 'epics' | 'versions') => {
    setDrawerState((prev) => {
      const next = prev === tab ? 'closed' : tab;
      try {
        localStorage.setItem(BACKLOG_DRAWER_STORAGE_KEY, next);
      } catch {
        // Ignored
      }
      return next;
    });
  }, []);

  // Modals & Drag State
  const [isSprintFormOpen, setIsSprintFormOpen] = useState<boolean>(false);
  const [sprintFormMode, setSprintFormMode] = useState<'create' | 'edit' | 'start'>('create');
  const [editingSprint, setEditingSprint] = useState<SprintDefinition | null>(null);

  const [isCompleteSprintOpen, setIsCompleteSprintOpen] = useState<boolean>(false);
  const [completingSprint, setCompletingSprint] = useState<SprintDefinition | null>(null);

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);

  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState<boolean>(false);
  const [createIssueSprintId, setCreateIssueSprintId] = useState<number | null>(null);
  const [createIssueType, setCreateIssueType] = useState<import('../api/client').IssueType | undefined>(undefined);
  const [sprintToDelete, setSprintToDelete] = useState<{ id: number; name: string } | null>(null);
  const [activeIssue, setActiveIssue] = useState<IssueItem | null>(null);
  const selectedCount = useIssueSelectionStore((state) => state.selectedIds.size);

  const handleOpenIssue = useCallback(
    (issue: { key: string }) => {
      navigate(`/issues/${issue.key}`, { state: { from: 'backlog', label: 'Back to Backlog' } });
    },
    [navigate],
  );

  const handleDrawerTabChange = useCallback((tab: 'epics' | 'versions') => {
    setDrawerState(tab);
    try {
      localStorage.setItem(BACKLOG_DRAWER_STORAGE_KEY, tab);
    } catch {
      // Ignored
    }
  }, []);

  const handleSelectEpic = useCallback(
    (epicId: number | 'ALL' | 'NONE') => {
      setFilters((prev) => ({ ...prev, epicId }));
    },
    [setFilters],
  );

  const handleSelectVersion = useCallback(
    (versionId: number | 'ALL' | 'NONE') => {
      setFilters((prev) => ({ ...prev, versionId }));
    },
    [setFilters],
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerState('closed');
    try {
      localStorage.setItem(BACKLOG_DRAWER_STORAGE_KEY, 'closed');
    } catch {
      // Ignored
    }
  }, []);

  const handleCreateEpic = useCallback(() => {
    setCreateIssueSprintId(null);
    setCreateIssueType('EPIC');
    setIsCreateIssueOpen(true);
  }, []);

  const handleOpenCreateSprint = useCallback(() => {
    setEditingSprint(null);
    setSprintFormMode('create');
    setIsSprintFormOpen(true);
  }, []);

  const handleOpenAnalytics = useCallback(() => {
    setIsAnalyticsOpen(true);
  }, []);

  const lastHoveredZoneRef = useRef<HTMLElement | null>(null);

  const clearHoveredZone = useCallback(() => {
    if (lastHoveredZoneRef.current) {
      lastHoveredZoneRef.current.removeAttribute('data-is-over');
      lastHoveredZoneRef.current = null;
    }
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const mouseEvent = event.activatorEvent as MouseEvent;
    const currentX = (mouseEvent.clientX ?? 0) + event.delta.x;
    const currentY = (mouseEvent.clientY ?? 0) + event.delta.y;

    const target = document.elementFromPoint(currentX, currentY);
    const dropZoneEl = target?.closest<HTMLElement>('[data-drop-zone]');

    if (dropZoneEl !== lastHoveredZoneRef.current) {
      if (lastHoveredZoneRef.current) {
        lastHoveredZoneRef.current.removeAttribute('data-is-over');
      }
      if (dropZoneEl) {
        dropZoneEl.setAttribute('data-is-over', 'true');
      }
      lastHoveredZoneRef.current = dropZoneEl || null;
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const issue = event.active.data.current?.issue as IssueItem | undefined;
    setActiveIssue(issue || null);
  }, []);

  const handleDragCancel = useCallback(() => {
    clearHoveredZone();
    setActiveIssue(null);
  }, [clearHoveredZone]);

  const updateIssueMutation = useUpdateIssueMutation();
  const updateIssueMutationRef = useRef(updateIssueMutation);
  useEffect(() => {
    updateIssueMutationRef.current = updateIssueMutation;
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    clearHoveredZone();
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const dragged = active.data.current?.issue as IssueItem | undefined;
    if (!dragged) return;

    const currentSelectedIds = useIssueSelectionStore.getState().selectedIds;
    const dragIds = currentSelectedIds.has(dragged.id) ? Array.from(currentSelectedIds) : [dragged.id];
    const targetType = over.data.current?.type;

    if (targetType === 'epic') {
      const epicId = (over.data.current?.epicId !== undefined
        ? over.data.current.epicId
        : undefined) as number | null | undefined;

      if (epicId !== undefined) {
        // Synchronous optimistic update
        queryClient.setQueriesData<PaginatedIssuesResponse>(
          { queryKey: issueQueries.lists() },
          (old) => {
            if (!old) return old;
            const dragIdSet = new Set(dragIds);
            return {
              ...old,
              items: old.items.map((i) =>
                dragIdSet.has(i.id) ? { ...i, epicId: epicId ?? null } : i,
              ),
            };
          },
        );

        dragIds.forEach((id) => {
          if (id !== epicId) {
            updateIssueMutationRef.current.mutate({
              id,
              data: { epicId: epicId ?? null },
            });
          }
        });
        useIssueSelectionStore.getState().clearSelection();
      }
      return;
    }

    if (targetType === 'version') {
      const versionId = (over.data.current?.versionId !== undefined
        ? over.data.current.versionId
        : undefined) as number | null | undefined;

      if (versionId !== undefined) {
        // Synchronous optimistic update
        queryClient.setQueriesData<PaginatedIssuesResponse>(
          { queryKey: issueQueries.lists() },
          (old) => {
            if (!old) return old;
            const dragIdSet = new Set(dragIds);
            return {
              ...old,
              items: old.items.map((i) =>
                dragIdSet.has(i.id) ? { ...i, fixVersionId: versionId ?? null } : i,
              ),
            };
          },
        );

        dragIds.forEach((id) => {
          updateIssueMutationRef.current.mutate({
            id,
            data: { fixVersionId: versionId ?? null },
          });
        });
        useIssueSelectionStore.getState().clearSelection();
      }
      return;
    }

    const targetSprintId = (over.data.current?.sprintId !== undefined
      ? over.data.current.sprintId
      : null) as number | null;

    if ((dragged.sprintId ?? null) === targetSprintId) return;

    if (dragIds.length > 1) {
      handleBulkMoveToSprint(dragIds, targetSprintId);
    } else {
      handleMoveToSprint(dragged.id, targetSprintId);
    }
    useIssueSelectionStore.getState().clearSelection();
  }, [clearHoveredZone, queryClient, handleBulkMoveToSprint, handleMoveToSprint]);

  // J/K/Enter/O high-velocity list keyboard navigation
  useListKeyboardNavigation({
    items: filteredIssues,
    onOpenItem: handleOpenIssue,
    enabled:
      !isSprintFormOpen &&
      !isCreateIssueOpen &&
      !isCompleteSprintOpen &&
      !isAnalyticsOpen,
  });

  const handleSaveSprint = useCallback((sprintData: SprintDefinition) => {
    saveSprint(sprintData, editingSprint);
  }, [saveSprint, editingSprint]);

  // Collapse toggles & action handlers with stable references
  const handleToggleSprintCollapse = useCallback((sprintName: string) => {
    setCollapsedSprints((prev) => ({
      ...prev,
      [sprintName]: !prev[sprintName],
    }));
  }, []);

  const handleToggleBacklogCollapse = useCallback(() => {
    setIsBacklogCollapsed((prev) => !prev);
  }, []);

  const handleCompleteSprintClick = useCallback((target: SprintDefinition) => {
    setCompletingSprint(target);
    setIsCompleteSprintOpen(true);
  }, []);

  const handleEditSprintClick = useCallback((s: SprintDefinition) => {
    setEditingSprint(s);
    setSprintFormMode('edit');
    setIsSprintFormOpen(true);
  }, []);

  const handleDeleteSprintClick = useCallback((sprintId: number, sprintName: string) => {
    setSprintToDelete({ id: sprintId, name: sprintName });
  }, []);

  const handleGoToActiveBoard = useCallback(() => {
    setViewMode('board');
  }, []);

  const handleQuickCreateInSprint = useCallback((sId: number) => {
    setCreateIssueSprintId(sId);
    setIsCreateIssueOpen(true);
  }, []);

  const handleQuickCreateInBacklog = useCallback(() => {
    setCreateIssueSprintId(null);
    setIsCreateIssueOpen(true);
  }, []);

  const activeProject =
    selectedProject ||
    projects.find((p) => p.id === selectedProjectId) ||
    projects[0] ||
    null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 animate-in fade-in duration-200">
      {/* Agile Toolbar */}
      <AgileToolbar
        activeProject={activeProject}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        onFiltersChange={setFilters}
        onOpenCreateSprint={handleOpenCreateSprint}
        onOpenAnalytics={handleOpenAnalytics}
        onRefresh={loadData}
        loading={loading}
        totalIssuesCount={filteredIssues.length}
        activeSprintName={activeSprint?.name}
        isDrawerOpen={drawerState !== 'closed'}
        drawerTab={drawerState === 'versions' ? 'versions' : 'epics'}
        onToggleDrawer={handleToggleDrawer}
      />

      {/* Error alert banner */}
      {error && (
        <div className="mt-2.5 p-3 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-bold underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Agile Content (Backlog Planning vs Active Sprint Board) */}
      <div className="flex-1 flex flex-col mt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--md-sys-color-primary)]" />
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              Loading agile backlog & sprints...
            </span>
          </div>
        ) : viewMode === 'board' ? (
          /* Active Sprint Execution Board */
          <ActiveSprintBoard
            sprint={activeSprint}
            issues={activeSprint ? filteredIssues.filter((i) => i.sprintId === activeSprint.id) : []}
            onSelectIssue={handleOpenIssue}
            onStatusChange={handleStatusChange}
            onAssignToMe={handleAssignToMe}
            onCompleteSprint={(sprint) => {
              setCompletingSprint(sprint);
              setIsCompleteSprintOpen(true);
            }}
            onGoToBacklog={() => setViewMode('backlog')}
            currentUserId={user?.id}
          />
        ) : (
          /* Backlog Planning View (Side Drawer + Stacked Sprints + Product Backlog) */
          <>
            <style>{`
              [data-drop-zone="sprint"][data-is-over="true"],
              [data-drop-zone="backlog"][data-is-over="true"],
              [data-drop-zone="epic"][data-is-over="true"],
              [data-drop-zone="version"][data-is-over="true"] {
                border-color: var(--md-sys-color-primary) !important;
                outline: 2px solid var(--md-sys-color-primary) !important;
                outline-offset: -2px;
                background-color: var(--md-sys-color-surface-container-high) !important;
              }
            `}</style>
            <DndContext
              sensors={sensors}
              collisionDetection={backlogCollisionDetection}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              measuring={{
                droppable: {
                  strategy: MeasuringStrategy.BeforeDragging,
                },
              }}
              autoScroll={false}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start w-full pb-8">
                {/* Left Rail: Epics & Releases Drawer */}
                {drawerState !== 'closed' && (
                  <AgileBacklogLeftDrawer
                    projectId={selectedProjectId}
                    projectKey={activeProject?.key}
                    issues={issues}
                    activeDrawerTab={drawerState === 'versions' ? 'versions' : 'epics'}
                    onDrawerTabChange={handleDrawerTabChange}
                    selectedEpicId={filters.epicId}
                    onSelectEpic={handleSelectEpic}
                    selectedVersionId={filters.versionId}
                    onSelectVersion={handleSelectVersion}
                    onClose={handleCloseDrawer}
                    onCreateEpic={handleCreateEpic}
                  />
                )}

                {/* Right Main Column: Stacked Sprints + Product Backlog */}
                <div className="flex-1 min-w-0 w-full space-y-4">
                  {/* Stacked Sprint Containers */}
                  {sprintList.map((sprint) => {
                    const sprintIssues = issuesBySprintId.get(sprint.id ?? null) ?? EMPTY_ISSUES;
                    return (
                      <SprintContainer
                        key={sprint.id || sprint.name}
                        sprint={sprint}
                        issues={sprintIssues}
                        availableSprints={sprintList}
                        isCollapsed={!!collapsedSprints[sprint.name]}
                        onToggleCollapse={handleToggleSprintCollapse}
                        onSelectIssue={handleOpenIssue}
                        onMoveToSprint={handleMoveToSprint}
                        onStartSprint={handleStartSprint}
                        onCompleteSprint={handleCompleteSprintClick}
                        onEditSprint={handleEditSprintClick}
                        onDeleteSprint={handleDeleteSprintClick}
                        onGoToActiveBoard={handleGoToActiveBoard}
                        onQuickCreateInSprint={handleQuickCreateInSprint}
                      />
                    );
                  })}

                  {/* Product Backlog Section */}
                  <BacklogSection
                    issues={issuesBySprintId.get(null) ?? EMPTY_ISSUES}
                    availableSprints={sprintList}
                    isCollapsed={isBacklogCollapsed}
                    onToggleCollapse={handleToggleBacklogCollapse}
                    onSelectIssue={handleOpenIssue}
                    onMoveToSprint={handleMoveToSprint}
                    onQuickCreateInBacklog={handleQuickCreateInBacklog}
                  />
                </div>
              </div>

              <DragOverlay
                className="pointer-events-none"
                style={{ pointerEvents: 'none' }}
                dropAnimation={null}
              >
                {activeIssue ? (
                  <AgileGhostRow
                    issue={activeIssue}
                    selectedCount={selectedCount}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>

      {/* Create / Edit Sprint Modal */}
      <SprintFormModal
        isOpen={isSprintFormOpen}
        onClose={() => {
          setIsSprintFormOpen(false);
          setEditingSprint(null);
        }}
        onSave={handleSaveSprint}
        editingSprint={editingSprint}
        mode={sprintFormMode}
        defaultSprintNumber={allSprintNames.length + 1}
      />

      {/* Complete Sprint Modal */}
      {completingSprint && (
        <CompleteSprintModal
          isOpen={isCompleteSprintOpen}
          onClose={() => {
            setIsCompleteSprintOpen(false);
            setCompletingSprint(null);
          }}
          sprint={completingSprint}
          issues={issues.filter((i) => i.sprintId === completingSprint.id)}
          availableSprints={sprintList}
          onConfirmComplete={handleConfirmCompleteSprint}
        />
      )}

      {/* Sprint Analytics & Burndown Modal */}
      {isAnalyticsOpen && (
        <SprintAnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          sprint={
            activeSprint ||
            sprintList[0] || {
              name: 'Sprint 1',
              goal: '',
              status: 'PLANNED',
            }
          }
          sprintIssues={issues.filter(
            (i) => i.sprintId === (activeSprint?.id || sprintList[0]?.id),
          )}
          allSprints={sprintDefinitions}
          allIssues={issues}
        />
      )}

      {/* Quick Create Issue Modal */}
      <IssueModal
        isOpen={isCreateIssueOpen}
        onClose={() => {
          setIsCreateIssueOpen(false);
          setCreateIssueSprintId(null);
          setCreateIssueType(undefined);
        }}
        onIssueSaved={(savedIssue) => {
          setIssues((prev) => [savedIssue, ...prev]);
          setCreateIssueSprintId(null);
          setCreateIssueType(undefined);
        }}
        defaultProjectId={selectedProjectId}
        defaultSprintId={createIssueSprintId}
        defaultIssueType={createIssueType}
      />

      {/* Floating Bulk Action Bar */}
      <FloatingBulkActionBar
        projectId={selectedProjectId}
        onActionComplete={() => loadData()}
      />

      {/* Delete Sprint Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!sprintToDelete}
        onClose={() => setSprintToDelete(null)}
        onConfirm={async () => {
          if (!sprintToDelete) return;
          await handleDeleteSprint(sprintToDelete.id);
          setSprintToDelete(null);
        }}
        title="Delete Sprint"
        description={`Are you sure you want to delete ${sprintToDelete?.name}? Tickets will be moved to the backlog.`}
        confirmLabel="Delete Sprint"
        variant="danger"
      />
    </div>
  );
};
