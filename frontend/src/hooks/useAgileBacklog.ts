import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useIssuesQuery,
  useProjectSprintsQuery,
  useCreateSprintMutation,
  useUpdateSprintMutation,
  useStartSprintMutation,
  useCompleteSprintMutation,
  useDeleteSprintMutation,
  useUpdateIssueSprintMutation,
  useUpdateIssueStatusMutation,
  useAssignIssueToMeMutation,
  issueKeys,
  sprintKeys,
} from '../api/queries';
import { api, type IssueItem, type IssueStatus } from '../api/client';
import { realtimeSocket } from '../api/socket';
import { useAuth } from '../store';
import type {
  SprintDefinition,
  AgileFilterState,
} from '../types/agile';
import { DEFAULT_AGILE_FILTERS } from '../types/agile';

export function useAgileBacklog(selectedProjectId: number | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<AgileFilterState>(DEFAULT_AGILE_FILTERS);
  const [error, setError] = useState<string | null>(null);

  // TanStack Query for issues in selected project
  const issueFilter = useMemo(
    () => (selectedProjectId ? { projectId: selectedProjectId } : undefined),
    [selectedProjectId],
  );

  const {
    data: issues = [],
    isLoading: issuesLoading,
    error: issuesError,
    refetch: refetchIssues,
  } = useIssuesQuery(issueFilter);

  // TanStack Query for sprints in selected project
  const {
    data: sprintsData = [],
    isLoading: sprintsLoading,
    error: sprintsError,
    refetch: refetchSprints,
  } = useProjectSprintsQuery(selectedProjectId ?? undefined);

  // Sprint & Issue mutations
  const createSprintMutation = useCreateSprintMutation();
  const updateSprintMutation = useUpdateSprintMutation();
  const startSprintMutation = useStartSprintMutation();
  const completeSprintMutation = useCompleteSprintMutation();
  const deleteSprintMutation = useDeleteSprintMutation();

  const updateSprintOnIssueMutation = useUpdateIssueSprintMutation();
  const updateStatusMutation = useUpdateIssueStatusMutation();
  const assignMutation = useAssignIssueToMeMutation();

  const loading = issuesLoading || sprintsLoading;

  // Real-time WebSocket synchronization with TanStack Query Cache
  useEffect(() => {
    if (!selectedProjectId) return;
    realtimeSocket.connect();
    realtimeSocket.joinProject(selectedProjectId);

    const unsubCreated = realtimeSocket.onIssueCreated((newIssue) => {
      if (newIssue.projectId === selectedProjectId) {
        queryClient.setQueryData<IssueItem[]>(issueKeys.list(issueFilter), (old = []) => {
          return old.some((i) => i.id === newIssue.id) ? old : [newIssue, ...old];
        });
      }
    });

    const unsubUpdated = realtimeSocket.onIssueUpdated((updatedIssue) => {
      if (updatedIssue.projectId === selectedProjectId) {
        queryClient.setQueryData<IssueItem[]>(issueKeys.list(issueFilter), (old = []) => {
          return old.map((i) => (i.id === updatedIssue.id ? updatedIssue : i));
        });
      }
    });

    const unsubDeleted = realtimeSocket.onIssueDeleted(({ issueId }) => {
      queryClient.setQueryData<IssueItem[]>(issueKeys.list(issueFilter), (old = []) => {
        return old.filter((i) => i.id !== issueId);
      });
    });

    return () => {
      realtimeSocket.leaveProject(selectedProjectId);
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [selectedProjectId, issueFilter, queryClient]);

  // Sprint definitions mapped from backend sprints and any legacy strings
  const sprintDefinitions = useMemo(() => {
    const loadedDefs: Record<string, SprintDefinition> = {};
    sprintsData.forEach((s) => {
      loadedDefs[s.name] = {
        id: s.id,
        projectId: s.projectId,
        name: s.name,
        goal: s.goal || '',
        startDate: s.startDate || '',
        endDate: s.endDate || '',
        status: s.status,
      };
    });

    // Check issues for any unmapped sprint name
    issues.forEach((issue) => {
      if (issue.sprint && issue.sprint.toUpperCase() !== 'BACKLOG' && !loadedDefs[issue.sprint]) {
        loadedDefs[issue.sprint] = {
          name: issue.sprint,
          goal: 'Imported from issue',
          startDate: '',
          endDate: '',
          status: 'PLANNED',
        };
      }
    });

    return loadedDefs;
  }, [sprintsData, issues]);

  // Filtered issues computation
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

  const allSprintNames = useMemo(() => Object.keys(sprintDefinitions), [sprintDefinitions]);

  const activeSprint = useMemo(() => {
    const foundName = Object.keys(sprintDefinitions).find(
      (name) => sprintDefinitions[name].status === 'ACTIVE',
    );
    return foundName ? sprintDefinitions[foundName] : null;
  }, [sprintDefinitions]);

  const sprintList = useMemo(() => {
    return Object.values(sprintDefinitions).sort((a, b) => {
      const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 };
      return order[a.status] - order[b.status];
    });
  }, [sprintDefinitions]);

  const loadData = async () => {
    await Promise.all([refetchIssues(), refetchSprints()]);
  };

  const setIssues = (updater: IssueItem[] | ((prev: IssueItem[]) => IssueItem[])) => {
    queryClient.setQueryData<IssueItem[]>(issueKeys.list(issueFilter), (old = []) => {
      return typeof updater === 'function' ? updater(old) : updater;
    });
  };

  // Issue manipulation
  const handleMoveToSprint = async (issueId: number, sprintName: string | null) => {
    try {
      await updateSprintOnIssueMutation.mutateAsync({ id: issueId, sprint: sprintName || null });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to move issue');
    }
  };

  const handleStatusChange = async (issueId: number, nextStatus: IssueStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ issueId, status: nextStatus });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update issue status');
    }
  };

  const handleAssignToMe = async (issueId: number) => {
    try {
      await assignMutation.mutateAsync(issueId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign issue');
    }
  };

  // Sprint lifecycle
  const handleSaveSprint = async (sprintData: SprintDefinition, editingSprint?: SprintDefinition | null) => {
    if (!selectedProjectId) return;
    try {
      if (editingSprint && editingSprint.id) {
        await updateSprintMutation.mutateAsync({
          projectId: selectedProjectId,
          sprintId: editingSprint.id,
          data: {
            name: sprintData.name,
            goal: sprintData.goal,
            startDate: sprintData.startDate,
            endDate: sprintData.endDate,
            status: sprintData.status,
          },
        });
      } else {
        await createSprintMutation.mutateAsync({
          projectId: selectedProjectId,
          data: {
            name: sprintData.name,
            goal: sprintData.goal,
            startDate: sprintData.startDate,
            endDate: sprintData.endDate,
            status: sprintData.status,
          },
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save sprint');
    }
  };

  const handleStartSprint = async (sprintName: string) => {
    if (!selectedProjectId) return;
    const target = sprintDefinitions[sprintName];
    if (!target) return;
    try {
      if (target.id) {
        await startSprintMutation.mutateAsync({ projectId: selectedProjectId, sprintId: target.id });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start sprint');
    }
  };

  const handleConfirmCompleteSprint = async (sprintName: string, rolloverTarget: string) => {
    if (!selectedProjectId) return;
    const targetSprint = sprintDefinitions[sprintName];
    if (!targetSprint) return;
    try {
      const rolloverSprint = rolloverTarget !== 'BACKLOG' ? sprintDefinitions[rolloverTarget] : null;
      if (targetSprint.id) {
        await completeSprintMutation.mutateAsync({
          projectId: selectedProjectId,
          sprintId: targetSprint.id,
          data: {
            transferSprintId: rolloverSprint?.id || null,
          },
        });
      } else {
        const sprintIssues = issues.filter((i) => i.sprint === sprintName);
        const incomplete = sprintIssues.filter(
          (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED',
        );
        const newSprintVal = rolloverTarget === 'BACKLOG' ? null : rolloverTarget;
        for (const issue of incomplete) {
          await updateSprintOnIssueMutation.mutateAsync({ id: issue.id, sprint: newSprintVal });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete sprint');
    }
  };

  const handleDeleteSprint = async (sprintName: string) => {
    if (!selectedProjectId) return;
    if (!window.confirm(`Are you sure you want to delete ${sprintName}? Tickets will be moved to the backlog.`)) {
      return;
    }
    const target = sprintDefinitions[sprintName];
    try {
      if (target?.id) {
        await deleteSprintMutation.mutateAsync({ projectId: selectedProjectId, sprintId: target.id });
      } else {
        const inSprint = issues.filter((i) => i.sprint === sprintName);
        for (const issue of inSprint) {
          await updateSprintOnIssueMutation.mutateAsync({ id: issue.id, sprint: null });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete sprint');
    }
  };

  const activeError = error || (issuesError instanceof Error ? issuesError.message : null) || (sprintsError instanceof Error ? sprintsError.message : null);

  return {
    issues,
    setIssues,
    sprintDefinitions,
    loading,
    error: activeError,
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
    handleSaveSprint,
    handleStartSprint,
    handleConfirmCompleteSprint,
    handleDeleteSprint,
  };
}
