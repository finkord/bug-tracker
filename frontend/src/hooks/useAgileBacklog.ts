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
} from '../api/queries';
import { type IssueItem, type IssueStatus, type PaginatedIssuesResponse } from '../api/client';
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
    data: issuesData,
    isLoading: issuesLoading,
    error: issuesError,
    refetch: refetchIssues,
  } = useIssuesQuery(issueFilter);
  const issues = useMemo(() => issuesData?.items ?? [], [issuesData?.items]);

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
        queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(issueFilter), (old) => {
          const items = old?.items ?? [];
          if (items.some((i) => i.id === newIssue.id)) return old;
          const updatedItems = [newIssue, ...items];
          return {
            items: updatedItems,
            total: (old?.total ?? 0) + 1,
            page: old?.page ?? 1,
            limit: old?.limit ?? 50,
            totalPages: Math.ceil(((old?.total ?? 0) + 1) / (old?.limit ?? 50)),
          };
        });
      }
    });

    const unsubUpdated = realtimeSocket.onIssueUpdated((updatedIssue) => {
      if (updatedIssue.projectId === selectedProjectId) {
        queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(issueFilter), (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((i) => (i.id === updatedIssue.id ? updatedIssue : i)),
          };
        });
      }
    });

    const unsubDeleted = realtimeSocket.onIssueDeleted(({ issueId }) => {
      queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(issueFilter), (old) => {
        if (!old) return old;
        const filtered = old.items.filter((i) => i.id !== issueId);
        return {
          ...old,
          items: filtered,
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

  // Sprint definitions mapped cleanly from relational backend sprints
  const sprintDefinitions = useMemo(() => {
    const loadedDefs: Record<string, SprintDefinition> = {};
    sprintsData.forEach((s) => {
      loadedDefs[s.name] = {
        id: s.id,
        projectId: s.projectId,
        teamId: s.teamId || undefined,
        team: s.team || undefined,
        capacityHours: s.capacityHours || undefined,
        name: s.name,
        goal: s.goal || '',
        startDate: s.startDate || '',
        endDate: s.endDate || '',
        status: s.status,
      };
    });
    return loadedDefs;
  }, [sprintsData]);

  // Filtered issues computation
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.filterType !== 'ALL' && issue.issueType !== filters.filterType) return false;
      if (filters.filterPriority !== 'ALL' && issue.priority !== filters.filterPriority) return false;
      if (filters.onlyMine && user && issue.assignee?.id !== user.id) return false;
      if (filters.unassignedOnly && issue.assignee !== null && issue.assignee !== undefined) return false;
      if (filters.highPriorityOnly && issue.priority !== 'CRITICAL' && issue.priority !== 'HIGH') return false;
      if (filters.epicId && filters.epicId !== 'ALL') {
        if (filters.epicId === 'NONE') {
          if (issue.parentId || issue.issueType === 'EPIC') return false;
        } else {
          if (issue.parentId !== filters.epicId && issue.id !== filters.epicId) return false;
        }
      }
      if (filters.versionId && filters.versionId !== 'ALL') {
        if (filters.versionId === 'NONE') {
          if (issue.fixVersionId) return false;
        } else {
          if (issue.fixVersionId !== filters.versionId) return false;
        }
      }
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
    const found = sprintsData.find((s) => s.status === 'ACTIVE');
    if (!found) return null;
    return {
      id: found.id,
      projectId: found.projectId,
      teamId: found.teamId || undefined,
      team: found.team || undefined,
      capacityHours: found.capacityHours || undefined,
      name: found.name,
      goal: found.goal || '',
      startDate: found.startDate || '',
      endDate: found.endDate || '',
      status: found.status,
    } as SprintDefinition;
  }, [sprintsData]);

  const sprintList = useMemo(() => {
    let list = Object.values(sprintDefinitions);
    if (filters.teamId && filters.teamId !== 'ALL') {
      list = list.filter((s) => s.teamId === filters.teamId);
    }
    return list.sort((a, b) => {
      const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 };
      return order[a.status] - order[b.status];
    });
  }, [sprintDefinitions, filters.teamId]);

  const loadData = async () => {
    await Promise.all([refetchIssues(), refetchSprints()]);
  };

  const setIssues = (updater: IssueItem[] | ((prev: IssueItem[]) => IssueItem[])) => {
    queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(issueFilter), (old) => {
      const currentItems = old?.items ?? [];
      const nextItems = typeof updater === 'function' ? updater(currentItems) : updater;
      return {
        items: nextItems,
        total: nextItems.length,
        page: old?.page ?? 1,
        limit: old?.limit ?? 50,
        totalPages: Math.ceil(nextItems.length / (old?.limit ?? 50)),
      };
    });
  };

  // Issue manipulation via relational sprintId
  const handleMoveToSprint = async (issueId: number, sprintId: number | null) => {
    try {
      await updateSprintOnIssueMutation.mutateAsync({ id: issueId, sprintId });
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
            teamId: sprintData.teamId,
            capacityHours: sprintData.capacityHours,
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
            teamId: sprintData.teamId,
            capacityHours: sprintData.capacityHours,
          },
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save sprint');
    }
  };

  const handleStartSprint = async (sprintId: number) => {
    if (!selectedProjectId) return;
    try {
      await startSprintMutation.mutateAsync({ projectId: selectedProjectId, sprintId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start sprint');
    }
  };

  const handleConfirmCompleteSprint = async (sprintId: number, rolloverTargetSprintId: number | null) => {
    if (!selectedProjectId) return;
    try {
      await completeSprintMutation.mutateAsync({
        projectId: selectedProjectId,
        sprintId,
        data: {
          transferSprintId: rolloverTargetSprintId,
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete sprint');
    }
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!selectedProjectId) return;
    try {
      await deleteSprintMutation.mutateAsync({ projectId: selectedProjectId, sprintId });
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
