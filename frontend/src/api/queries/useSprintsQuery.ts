import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateSprintPayload,
  type UpdateSprintPayload,
  type CompleteSprintPayload,
} from '../client.js';
import { issueKeys } from './useIssuesQuery.js';

export const sprintQueries = {
  all: ['sprints'] as const,
  project: (projectId?: number, teamId?: number) =>
    queryOptions({
      queryKey: [...sprintQueries.all, 'project', projectId, { teamId }] as const,
      queryFn: () => api.getProjectSprints(projectId!, teamId),
      enabled: typeof projectId === 'number' && !isNaN(projectId),
    }),
  burndown: (projectId?: number, sprintId?: number) =>
    queryOptions({
      queryKey: [...sprintQueries.all, 'burndown', projectId, sprintId] as const,
      queryFn: () => api.getSprintBurndown(projectId!, sprintId!),
      enabled:
        typeof projectId === 'number' &&
        !isNaN(projectId) &&
        typeof sprintId === 'number' &&
        !isNaN(sprintId),
    }),
  flowMetrics: (projectId?: number, sprintId?: number) =>
    queryOptions({
      queryKey: [...sprintQueries.all, 'flow-metrics', projectId, sprintId] as const,
      queryFn: () => api.getSprintFlowMetrics(projectId!, sprintId!),
      enabled:
        typeof projectId === 'number' &&
        !isNaN(projectId) &&
        typeof sprintId === 'number' &&
        !isNaN(sprintId),
    }),
};

// Aliased for full backwards compatibility
export const sprintKeys = {
  all: sprintQueries.all,
  project: (projectId?: number, teamId?: number) => sprintQueries.project(projectId, teamId).queryKey,
  burndown: (projectId?: number, sprintId?: number) => sprintQueries.burndown(projectId, sprintId).queryKey,
  flowMetrics: (projectId?: number, sprintId?: number) => sprintQueries.flowMetrics(projectId, sprintId).queryKey,
};

export function useProjectSprintsQuery(projectId?: number, teamId?: number) {
  return useQuery(sprintQueries.project(projectId, teamId));
}

export function useSprintBurndownQuery(projectId?: number, sprintId?: number) {
  return useQuery(sprintQueries.burndown(projectId, sprintId));
}

export function useSprintFlowMetricsQuery(projectId?: number, sprintId?: number) {
  return useQuery(sprintQueries.flowMetrics(projectId, sprintId));
}

export function useCreateSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: CreateSprintPayload }) =>
      api.createSprint(projectId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: sprintQueries.project(vars.projectId).queryKey });
    },
  });
}

export function useUpdateSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      sprintId,
      data,
    }: {
      projectId: number;
      sprintId: number;
      data: UpdateSprintPayload;
    }) => api.updateSprint(projectId, sprintId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: sprintQueries.project(vars.projectId).queryKey });
    },
  });
}

export function useStartSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, sprintId }: { projectId: number; sprintId: number }) =>
      api.startSprint(projectId, sprintId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: sprintQueries.project(vars.projectId).queryKey });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useCompleteSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      sprintId,
      data,
    }: {
      projectId: number;
      sprintId: number;
      data?: CompleteSprintPayload;
    }) => api.completeSprint(projectId, sprintId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: sprintQueries.project(vars.projectId).queryKey });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useDeleteSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, sprintId }: { projectId: number; sprintId: number }) =>
      api.deleteSprint(projectId, sprintId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: sprintQueries.project(vars.projectId).queryKey });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}
