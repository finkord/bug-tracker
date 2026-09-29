import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateSprintPayload,
  type UpdateSprintPayload,
  type CompleteSprintPayload,
} from '../client';
import { issueKeys } from './useIssuesQuery';

export const sprintKeys = {
  all: ['sprints'] as const,
  project: (projectId?: number) => [...sprintKeys.all, 'project', projectId] as const,
};

export function useProjectSprintsQuery(projectId?: number) {
  return useQuery({
    queryKey: sprintKeys.project(projectId),
    queryFn: () => api.getProjectSprints(projectId!),
    enabled: typeof projectId === 'number' && !isNaN(projectId),
  });
}

export function useCreateSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: CreateSprintPayload }) =>
      api.createSprint(projectId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.project(vars.projectId) });
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
      queryClient.invalidateQueries({ queryKey: sprintKeys.project(vars.projectId) });
    },
  });
}

export function useStartSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, sprintId }: { projectId: number; sprintId: number }) =>
      api.startSprint(projectId, sprintId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.project(vars.projectId) });
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
      queryClient.invalidateQueries({ queryKey: sprintKeys.project(vars.projectId) });
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
      queryClient.invalidateQueries({ queryKey: sprintKeys.project(vars.projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}
