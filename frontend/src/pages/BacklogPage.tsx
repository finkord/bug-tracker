import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../store';
import type {
  SprintDefinition,
  AgileViewMode,
} from '../types/agile';
import { Loader2 } from 'lucide-react';
import { useProjectsQuery } from '../api/queries';
import { FloatingBulkActionBar } from '../components/common/FloatingBulkActionBar';
import { AgileBacklogLeftDrawer } from '../components/agile/AgileBacklogLeftDrawer';

const BACKLOG_DRAWER_STORAGE_KEY = 'bugtracker_backlog_drawer';

export const BacklogPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    handleStatusChange,
    handleAssignToMe,
    handleSaveSprint: saveSprint,
    handleStartSprint,
    handleConfirmCompleteSprint,
    handleDeleteSprint,
  } = useAgileBacklog(selectedProjectId);

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

  const handleToggleDrawer = (tab: 'epics' | 'versions') => {
    setDrawerState((prev) => {
      const next = prev === tab ? 'closed' : tab;
      try {
        localStorage.setItem(BACKLOG_DRAWER_STORAGE_KEY, next);
      } catch {
        // Ignored
      }
      return next;
    });
  };

  // Modals State
  const [isSprintFormOpen, setIsSprintFormOpen] = useState<boolean>(false);
  const [sprintFormMode, setSprintFormMode] = useState<'create' | 'edit' | 'start'>('create');
  const [editingSprint, setEditingSprint] = useState<SprintDefinition | null>(null);

  const [isCompleteSprintOpen, setIsCompleteSprintOpen] = useState<boolean>(false);
  const [completingSprint, setCompletingSprint] = useState<SprintDefinition | null>(null);

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);

  const handleOpenIssue = (issue: { key: string }) => {
    navigate(`/issues/${issue.key}`, { state: { from: 'backlog', label: 'Back to Backlog' } });
  };

  // Issue creation modal
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState<boolean>(false);
  const [createIssueSprintId, setCreateIssueSprintId] = useState<number | null>(null);

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

  const handleSaveSprint = (sprintData: SprintDefinition) => {
    saveSprint(sprintData, editingSprint);
  };

  // Collapse toggles
  const handleToggleSprintCollapse = (sprintName: string) => {
    setCollapsedSprints((prev) => ({
      ...prev,
      [sprintName]: !prev[sprintName],
    }));
  };

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
        onOpenCreateSprint={() => {
          setEditingSprint(null);
          setSprintFormMode('create');
          setIsSprintFormOpen(true);
        }}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
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
          <div className="flex flex-col md:flex-row gap-4 items-start w-full pb-8">
            {/* Left Rail: Epics & Releases Drawer */}
            {drawerState !== 'closed' && (
              <AgileBacklogLeftDrawer
                projectId={selectedProjectId}
                projectKey={activeProject?.key}
                issues={issues}
                activeDrawerTab={drawerState === 'versions' ? 'versions' : 'epics'}
                onDrawerTabChange={(tab) => {
                  setDrawerState(tab);
                  try {
                    localStorage.setItem(BACKLOG_DRAWER_STORAGE_KEY, tab);
                  } catch {
                    // Ignored
                  }
                }}
                selectedEpicId={filters.epicId}
                onSelectEpic={(epicId) => setFilters({ ...filters, epicId })}
                selectedVersionId={filters.versionId}
                onSelectVersion={(versionId) => setFilters({ ...filters, versionId })}
                onClose={() => {
                  setDrawerState('closed');
                  try {
                    localStorage.setItem(BACKLOG_DRAWER_STORAGE_KEY, 'closed');
                  } catch {
                    // Ignored
                  }
                }}
                onCreateEpic={() => {
                  setCreateIssueSprintId(null);
                  setIsCreateIssueOpen(true);
                }}
              />
            )}

            {/* Right Main Column: Stacked Sprints + Product Backlog */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              {/* Stacked Sprint Containers */}
              {sprintList.map((sprint) => {
                const sprintIssues = filteredIssues.filter((i) => i.sprintId === sprint.id);
                return (
                  <SprintContainer
                    key={sprint.id || sprint.name}
                    sprint={sprint}
                    issues={sprintIssues}
                    availableSprints={sprintList}
                    isCollapsed={!!collapsedSprints[sprint.name]}
                    onToggleCollapse={() => handleToggleSprintCollapse(sprint.name)}
                    onSelectIssue={handleOpenIssue}
                    onMoveToSprint={handleMoveToSprint}
                    onStartSprint={handleStartSprint}
                    onCompleteSprint={(target) => {
                      setCompletingSprint(target);
                      setIsCompleteSprintOpen(true);
                    }}
                    onEditSprint={(s) => {
                      setEditingSprint(s);
                      setSprintFormMode('edit');
                      setIsSprintFormOpen(true);
                    }}
                    onDeleteSprint={(sprintId, sprintName) => handleDeleteSprint(sprintId, sprintName)}
                    onGoToActiveBoard={() => setViewMode('board')}
                    onQuickCreateInSprint={(sId) => {
                      setCreateIssueSprintId(sId);
                      setIsCreateIssueOpen(true);
                    }}
                  />
                );
              })}

              {/* Product Backlog Section */}
              <BacklogSection
                issues={filteredIssues.filter((i) => !i.sprintId)}
                availableSprints={sprintList}
                isCollapsed={isBacklogCollapsed}
                onToggleCollapse={() => setIsBacklogCollapsed((prev) => !prev)}
                onSelectIssue={handleOpenIssue}
                onMoveToSprint={handleMoveToSprint}
                onQuickCreateInBacklog={() => {
                  setCreateIssueSprintId(null);
                  setIsCreateIssueOpen(true);
                }}
              />
            </div>
          </div>
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
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
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
        }}
        onIssueSaved={(savedIssue) => {
          setIssues((prev) => [savedIssue, ...prev]);
          setCreateIssueSprintId(null);
        }}
        defaultProjectId={selectedProjectId}
        defaultSprintId={createIssueSprintId}
      />

      {/* Floating Bulk Action Bar */}
      <FloatingBulkActionBar
        projectId={selectedProjectId}
        onActionComplete={() => loadData()}
      />
    </div>
  );
};
