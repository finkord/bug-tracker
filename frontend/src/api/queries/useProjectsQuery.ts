import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateProjectPayload } from '../client';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  people: (id: number) => [...projectKeys.detail(id), 'people'] as const,
  permissions: (id: number) => [...projectKeys.detail(id), 'permissions'] as const,
};

export function useProjectsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => api.getProjects(),
    enabled: options?.enabled,
  });
}


export function useProjectDetailQuery(projectId?: number) {
  return useQuery({
    queryKey: projectKeys.detail(projectId!),
    queryFn: () => api.getProject(projectId!),
    enabled: typeof projectId === 'number' && !isNaN(projectId),
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectPayload) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateProjectPayload> }) =>
      api.updateProject(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(updated.id) });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useProjectPeopleQuery(projectId?: number) {
  return useQuery({
    queryKey: projectKeys.people(projectId!),
    queryFn: () => api.getProjectPeople(projectId!),
    enabled: typeof projectId === 'number' && !isNaN(projectId),
  });
}

export function useMyProjectPermissionsQuery(projectId?: number) {
  return useQuery({
    queryKey: projectKeys.permissions(projectId!),
    queryFn: () => api.getMyProjectPermissions(projectId!),
    enabled: typeof projectId === 'number' && !isNaN(projectId),
  });
}
