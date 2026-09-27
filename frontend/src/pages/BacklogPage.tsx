import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  api,
  type ProjectItem,
  type IssueItem,
  type IssueStatus,
} from '../api/client';
import { realtimeSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import { AgileToolbar } from '../components/agile/AgileToolbar';
import { SprintContainer } from '../components/agile/SprintContainer';
import { BacklogSection } from '../components/agile/BacklogSection';
import { ActiveSprintBoard } from '../components/agile/ActiveSprintBoard';
import { SprintFormModal } from '../components/agile/SprintFormModal';
import { CompleteSprintModal } from '../components/agile/CompleteSprintModal';
import { SprintAnalyticsModal } from '../components/kanban/SprintAnalyticsModal';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import { IssueModal } from '../components/kanban/IssueModal';
import type {
  SprintDefinition,
  AgileViewMode,
  AgileFilterState,
} from '../types/agile';
import { DEFAULT_AGILE_FILTERS } from '../types/agile';
import { Loader2 } from 'lucide-react';

export const BacklogPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Projects & Issues state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(
    projectId ? Number(projectId) : 1,
  );
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'backlog' (Planning) vs 'board' (Active Sprint Scrum Execution)
  const [viewMode, setViewMode] = useState<AgileViewMode>('backlog');

  // Filters State
  const [filters, setFilters] = useState<AgileFilterState>(DEFAULT_AGILE_FILTERS);

  // Sprint Definitions State
  const [sprintDefinitions, setSprintDefinitions] = useState<Record<string, SprintDefinition>>({});
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  const [isBacklogCollapsed, setIsBacklogCollapsed] = useState<boolean>(false);

  // Modals State
  const [isSprintFormOpen, setIsSprintFormOpen] = useState<boolean>(false);
  const [sprintFormMode, setSprintFormMode] = useState<'create' | 'edit' | 'start'>('create');
  const [editingSprint, setEditingSprint] = useState<SprintDefinition | null>(null);

  const [isCompleteSprintOpen, setIsCompleteSprintOpen] = useState<boolean>(false);
  const [completingSprintName, setCompletingSprintName] = useState<string | null>(null);

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  // Issue creation modal
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState<boolean>(false);
  const [createIssueSprint, setCreateIssueSprint] = useState<string | null>(null);

  // Load project list
  useEffect(() => {
    api.getProjects()
      .then((data) => {
        setProjects(data);
        if (projectId) {
          const found = data.find((p) => p.id === Number(projectId));
          if (found) setSelectedProjectId(found.id);
        } else if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      })
      .catch(() => {});
  }, [projectId]);

  // Load issues and stored sprints for current project
  const loadData = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const issuesData = await api.getIssues({ projectId: selectedProjectId });
      setIssues(issuesData);

      // Load stored sprints metadata from localStorage
      const storageKey = `bt_sprints_${selectedProjectId}`;
      let storedDefs: Record<string, SprintDefinition> = {};
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) storedDefs = JSON.parse(raw);
      } catch {
        // Fallback
      }

      // Ensure default Sprint 1 exists if none defined
      if (Object.keys(storedDefs).length === 0) {
        storedDefs['Sprint 1'] = {
          name: 'Sprint 1',
          goal: 'Core architecture, RBAC auth, and initial milestone deliverables',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          status: 'ACTIVE',
        };
      }

      // Register any sprints found in existing issues
      issuesData.forEach((issue) => {
        if (issue.sprint && issue.sprint.toUpperCase() !== 'BACKLOG' && !storedDefs[issue.sprint]) {
          storedDefs[issue.sprint] = {
            name: issue.sprint,
            goal: 'Feature deliverables and sprint triage',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            status: 'PLANNED',
          };
        }
      });

      setSprintDefinitions(storedDefs);
    } catch (err: any) {
      setError(err.message || 'Failed to load agile backlog data');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time WebSocket synchronization
  useEffect(() => {
    realtimeSocket.connect();
    if (selectedProjectId) {
      realtimeSocket.joinProject(selectedProjectId);
    }

    const unsubCreated = realtimeSocket.onIssueCreated((newIssue) => {
      if (newIssue.projectId === selectedProjectId) {
        setIssues((prev) => (prev.some((i) => i.id === newIssue.id) ? prev : [newIssue, ...prev]));
      }
    });

    const unsubUpdated = realtimeSocket.onIssueUpdated((updatedIssue) => {
      if (updatedIssue.projectId === selectedProjectId) {
        setIssues((prev) => prev.map((i) => (i.id === updatedIssue.id ? updatedIssue : i)));
      }
    });

    const unsubDeleted = realtimeSocket.onIssueDeleted(({ issueId }) => {
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    });

    return () => {
      if (selectedProjectId) {
        realtimeSocket.leaveProject(selectedProjectId);
      }
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [selectedProjectId]);

  // Save sprint definitions helper
  const saveSprintDefinitions = (newDefs: Record<string, SprintDefinition>) => {
    setSprintDefinitions(newDefs);
    if (selectedProjectId) {
      try {
        localStorage.setItem(`bt_sprints_${selectedProjectId}`, JSON.stringify(newDefs));
      } catch {
        // Ignored
      }
    }
  };

  // Client-side filtering logic
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.filterType !== 'ALL' && issue.issueType !== filters.filterType) return false;
      if (filters.filterPriority !== 'ALL' && issue.priority !== filters.filterPriority) return false;
      if (filters.onlyMine && user && issue.assignee?.id !== user.id) return false;
      if (filters.unassignedOnly && issue.assignee !== null && issue.assignee !== undefined) return false;
      if (filters.highPriorityOnly && issue.priority !== 'CRITICAL' && issue.priority !== 'HIGH') return false;
      if (filters.searchTerm.trim()) {
        const term = filters.searchTerm.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(term);
        const matchKey = issue.key.toLowerCase().includes(term);
        const matchDesc = issue.description?.toLowerCase().includes(term) ?? false;
        if (!matchTitle && !matchKey && !matchDesc) return false;
      }
      return true;
    });
  }, [issues, filters, user]);

  // Active sprint and sprint names
  const allSprintNames = useMemo(() => Object.keys(sprintDefinitions), [sprintDefinitions]);
  const activeSprint = useMemo(() => {
    const foundName = Object.keys(sprintDefinitions).find(
      (name) => sprintDefinitions[name].status === 'ACTIVE',
    );
    return foundName ? sprintDefinitions[foundName] : null;
  }, [sprintDefinitions]);

  // Sprints categorized for planning view
  const sprintList = useMemo(() => {
    return Object.values(sprintDefinitions).sort((a, b) => {
      // Active first, then Planned, then Completed
      const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 };
      return order[a.status] - order[b.status];
    });
  }, [sprintDefinitions]);

  // Move issue to sprint or backlog
  const handleMoveToSprint = async (issueId: number, sprintName: string | null) => {
    // Optimistic update
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, sprint: sprintName || null } : i)),
    );

    try {
      await api.updateIssueSprint(issueId, sprintName);
    } catch (err: any) {
      setError(err.message || 'Failed to move issue');
      loadData();
    }
  };

  // Status transition handler for Scrum board
  const handleStatusChange = async (issueId: number, nextStatus: IssueStatus) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: nextStatus } : i)),
    );

    try {
      await api.updateIssueStatus(issueId, nextStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to update issue status');
      loadData();
    }
  };

  // Self-assignment handler
  const handleAssignToMe = async (issueId: number) => {
    try {
      const updated = await api.assignIssueToMe(issueId);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
    } catch (err: any) {
      setError(err.message || 'Failed to assign issue');
    }
  };

  // Sprint lifecycle: Save / Edit Sprint
  const handleSaveSprint = (sprintData: SprintDefinition) => {
    const updated = {
      ...sprintDefinitions,
      [sprintData.name]: sprintData,
    };
    saveSprintDefinitions(updated);
  };

  // Sprint lifecycle: Start Sprint
  const handleStartSprint = (sprintName: string) => {
    const target = sprintDefinitions[sprintName];
    if (!target) return;

    // If another sprint was active, mark it planned or keep it
    const updated: Record<string, SprintDefinition> = {};
    Object.keys(sprintDefinitions).forEach((k) => {
      if (k === sprintName) {
        updated[k] = {
          ...sprintDefinitions[k],
          status: 'ACTIVE',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        };
      } else {
        updated[k] = sprintDefinitions[k];
      }
    });

    saveSprintDefinitions(updated);
  };

  // Sprint lifecycle: Complete Sprint
  const handleConfirmCompleteSprint = async (sprintName: string, rolloverTarget: string) => {
    const targetSprint = sprintDefinitions[sprintName];
    if (!targetSprint) return;

    const sprintIssues = issues.filter((i) => i.sprint === sprintName);
    const incomplete = sprintIssues.filter(
      (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED',
    );

    // Rollover incomplete issues
    const newSprintVal = rolloverTarget === 'BACKLOG' ? null : rolloverTarget;
    for (const issue of incomplete) {
      await api.updateIssueSprint(issue.id, newSprintVal);
    }

    const updated: Record<string, SprintDefinition> = {
      ...sprintDefinitions,
      [sprintName]: {
        ...targetSprint,
        status: 'COMPLETED',
      },
    };
    saveSprintDefinitions(updated);
    loadData();
  };

  // Sprint lifecycle: Delete Sprint
  const handleDeleteSprint = async (sprintName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${sprintName}? Tickets will be moved to the backlog.`)) {
      return;
    }

    const inSprint = issues.filter((i) => i.sprint === sprintName);
    for (const issue of inSprint) {
      await api.updateIssueSprint(issue.id, null);
    }

    const updated = { ...sprintDefinitions };
    delete updated[sprintName];
    saveSprintDefinitions(updated);
    loadData();
  };

  // Collapse toggles
  const handleToggleSprintCollapse = (sprintName: string) => {
    setCollapsedSprints((prev) => ({
      ...prev,
      [sprintName]: !prev[sprintName],
    }));
  };

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    navigate(`/projects/${id}/backlog`);
  };

  const activeProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  return (
    <div className="w-full min-h-full flex flex-col px-3 sm:px-5 py-4 animate-in fade-in duration-200">
      {/* Agile Toolbar */}
      <AgileToolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
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
            issues={activeSprint ? filteredIssues.filter((i) => i.sprint === activeSprint.name) : []}
            onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            onStatusChange={handleStatusChange}
            onAssignToMe={handleAssignToMe}
            onCompleteSprint={(name) => {
              setCompletingSprintName(name);
              setIsCompleteSprintOpen(true);
            }}
            onGoToBacklog={() => setViewMode('backlog')}
            currentUserId={user?.id}
          />
        ) : (
          /* Backlog Planning View (Stacked Sprints + Product Backlog) */
          <div className="w-full pb-8 space-y-4">
            {/* Stacked Sprint Containers */}
            {sprintList.map((sprint) => {
              const sprintIssues = filteredIssues.filter((i) => i.sprint === sprint.name);
              return (
                <SprintContainer
                  key={sprint.name}
                  sprint={sprint}
                  issues={sprintIssues}
                  availableSprints={allSprintNames}
                  isCollapsed={!!collapsedSprints[sprint.name]}
                  onToggleCollapse={() => handleToggleSprintCollapse(sprint.name)}
                  onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                  onMoveToSprint={handleMoveToSprint}
                  onStartSprint={handleStartSprint}
                  onCompleteSprint={(name) => {
                    setCompletingSprintName(name);
                    setIsCompleteSprintOpen(true);
                  }}
                  onEditSprint={(s) => {
                    setEditingSprint(s);
                    setSprintFormMode('edit');
                    setIsSprintFormOpen(true);
                  }}
                  onDeleteSprint={handleDeleteSprint}
                  onGoToActiveBoard={() => setViewMode('board')}
                  onQuickCreateInSprint={(sName) => {
                    setCreateIssueSprint(sName);
                    setIsCreateIssueOpen(true);
                  }}
                />
              );
            })}

            {/* Product Backlog Section */}
            <BacklogSection
              issues={filteredIssues.filter(
                (i) => !i.sprint || i.sprint.toUpperCase() === 'BACKLOG',
              )}
              availableSprints={allSprintNames}
              isCollapsed={isBacklogCollapsed}
              onToggleCollapse={() => setIsBacklogCollapsed((prev) => !prev)}
              onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
              onMoveToSprint={handleMoveToSprint}
              onQuickCreateInBacklog={() => {
                setCreateIssueSprint(null);
                setIsCreateIssueOpen(true);
              }}
            />
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
      {completingSprintName && (
        <CompleteSprintModal
          isOpen={isCompleteSprintOpen}
          onClose={() => {
            setIsCompleteSprintOpen(false);
            setCompletingSprintName(null);
          }}
          sprint={sprintDefinitions[completingSprintName] || null}
          issues={issues.filter((i) => i.sprint === completingSprintName)}
          availableSprints={allSprintNames}
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
            Object.values(sprintDefinitions)[0] || {
              name: 'Sprint 1',
              goal: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              status: 'PLANNED',
            }
          }
          sprintIssues={issues.filter(
            (i) =>
              i.sprint === (activeSprint?.name || Object.keys(sprintDefinitions)[0] || 'Sprint 1'),
          )}
          allSprints={sprintDefinitions}
          allIssues={issues}
        />
      )}

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
      />

      {/* Quick Create Issue Modal */}
      <IssueModal
        isOpen={isCreateIssueOpen}
        onClose={() => {
          setIsCreateIssueOpen(false);
          setCreateIssueSprint(null);
        }}
        onIssueSaved={async (savedIssue) => {
          if (createIssueSprint && savedIssue.sprint !== createIssueSprint) {
            try {
              await api.updateIssueSprint(savedIssue.id, createIssueSprint);
              savedIssue = { ...savedIssue, sprint: createIssueSprint };
            } catch (err) {
              console.error('Failed to set sprint on new issue', err);
            }
          }
          setIssues((prev) => [savedIssue, ...prev]);
          setCreateIssueSprint(null);
        }}
        defaultProjectId={selectedProjectId}
      />
    </div>
  );
};
