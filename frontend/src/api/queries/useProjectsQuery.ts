import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateProjectPayload,
  type UpdateProjectPayload,
  type CreateQuickFilterPayload,
  type UpdateQuickFilterPayload,
  type CreateComponentPayload,
  type UpdateComponentPayload,
  type CreateProjectVersionPayload,
  type UpdateProjectVersionPayload,
  type ReleaseVersionPayload,
} from '../client.js';

export const projectQueries = {
  all: ['projects'] as const,
  lists: () => [...projectQueries.all, 'list'] as const,
  list: (options?: { enabled?: boolean }) =>
    queryOptions({
      queryKey: projectQueries.lists(),
      queryFn: () => api.getProjects(),
      enabled: options?.enabled,
    }),
  details: () => [...projectQueries.all, 'detail'] as const,
  detail: (id: number) =>
    queryOptions({
      queryKey: [...projectQueries.details(), id] as const,
      queryFn: () => api.getProject(id),
      enabled: typeof id === 'number' && !isNaN(id),
    }),
  people: (id: number) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, 'people'] as const,
      queryFn: () => api.getProjectPeople(id),
      enabled: typeof id === 'number' && !isNaN(id),
    }),
  permissions: (id: number) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, 'permissions'] as const,
      queryFn: () => api.getMyProjectPermissions(id),
      enabled: typeof id === 'number' && !isNaN(id),
    }),
  quickFilters: (id: number) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, 'quick-filters'] as const,
      queryFn: () => api.getQuickFilters(id),
      enabled: typeof id === 'number' && !isNaN(id),
    }),
  components: (id: number) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, 'components'] as const,
      queryFn: () => api.getProjectComponents(id),
      enabled: typeof id === 'number' && !isNaN(id),
    }),
  versions: (id: number) =>
    queryOptions({
      queryKey: [...projectQueries.detail(id).queryKey, 'versions'] as const,
      queryFn: () => api.getVersions(id),
      enabled: typeof id === 'number' && !isNaN(id),
    }),
};

// Aliased for full backwards compatibility
export const projectKeys = {
  all: projectQueries.all,
  lists: projectQueries.lists,
  details: projectQueries.details,
  detail: (id: number) => projectQueries.detail(id).queryKey,
  people: (id: number) => projectQueries.people(id).queryKey,
  permissions: (id: number) => projectQueries.permissions(id).queryKey,
  quickFilters: (id: number) => projectQueries.quickFilters(id).queryKey,
  components: (id: number) => projectQueries.components(id).queryKey,
  versions: (id: number) => projectQueries.versions(id).queryKey,
};

export function useProjectsQuery(options?: { enabled?: boolean }) {
  return useQuery(projectQueries.list(options));
}

export function useProjectDetailQuery(projectId?: number) {
  return useQuery(projectQueries.detail(projectId!));
}

export function useProjectPeopleQuery(projectId?: number) {
  return useQuery(projectQueries.people(projectId!));
}

export function useMyProjectPermissionsQuery(projectId?: number) {
  return useQuery(projectQueries.permissions(projectId!));
}

export function useProjectQuickFiltersQuery(projectId?: number) {
  return useQuery(projectQueries.quickFilters(projectId!));
}

export function useProjectComponentsQuery(projectId?: number) {
  return useQuery(projectQueries.components(projectId!));
}

export function useProjectVersionsQuery(projectId?: number) {
  return useQuery(projectQueries.versions(projectId!));
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectPayload) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      payload,
    }: {
      id: number;
      data?: UpdateProjectPayload;
      payload?: UpdateProjectPayload;
    }) => api.updateProject(id, (data || payload)!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
      queryClient.invalidateQueries({ queryKey: projectQueries.detail(updated.id).queryKey });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
    },
  });
}

export function useCreateQuickFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      data,
      payload,
    }: {
      projectId: number;
      data?: CreateQuickFilterPayload;
      payload?: CreateQuickFilterPayload;
    }) => api.createQuickFilter(projectId, (data || payload)!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.quickFilters(created.projectId).queryKey });
    },
  });
}

export function useUpdateQuickFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      filterId,
      data,
      payload,
    }: {
      projectId: number;
      filterId: number;
      data?: UpdateQuickFilterPayload;
      payload?: UpdateQuickFilterPayload;
    }) => api.updateQuickFilter(projectId, filterId, (data || payload)!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.quickFilters(updated.projectId).queryKey });
    },
  });
}

export function useDeleteQuickFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, filterId }: { projectId: number; filterId: number }) =>
      api.deleteQuickFilter(projectId, filterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.quickFilters(variables.projectId).queryKey });
    },
  });
}

export function useCreateProjectComponentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      data,
      payload,
    }: {
      projectId: number;
      data?: CreateComponentPayload;
      payload?: CreateComponentPayload;
    }) => api.createProjectComponent(projectId, (data || payload)!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.components(created.projectId).queryKey });
    },
  });
}

export function useUpdateProjectComponentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      componentId,
      data,
      payload,
    }: {
      projectId: number;
      componentId: number;
      data?: UpdateComponentPayload;
      payload?: UpdateComponentPayload;
    }) => api.updateProjectComponent(projectId, componentId, (data || payload)!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.components(updated.projectId).queryKey });
    },
  });
}

export function useDeleteProjectComponentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, componentId }: { projectId: number; componentId: number }) =>
      api.deleteProjectComponent(projectId, componentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.components(variables.projectId).queryKey });
    },
  });
}

export function useCreateProjectVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      data,
      payload,
    }: {
      projectId: number;
      data?: CreateProjectVersionPayload;
      payload?: CreateProjectVersionPayload;
    }) => api.createVersion(projectId, (data || payload)!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.versions(created.projectId).queryKey });
    },
  });
}

export function useUpdateProjectVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      versionId,
      data,
      payload,
    }: {
      projectId: number;
      versionId: number;
      data?: UpdateProjectVersionPayload;
      payload?: UpdateProjectVersionPayload;
    }) => api.updateVersion(projectId, versionId, (data || payload)!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.versions(updated.projectId).queryKey });
    },
  });
}

export function useDeleteProjectVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, versionId }: { projectId: number; versionId: number }) =>
      api.deleteVersion(projectId, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.versions(variables.projectId).queryKey });
    },
  });
}

export function useReleaseProjectVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      versionId,
      data,
      payload,
    }: {
      projectId: number;
      versionId: number;
      data?: ReleaseVersionPayload;
      payload?: ReleaseVersionPayload;
    }) => api.releaseVersion(projectId, versionId, data || payload),
    onSuccess: (released) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.versions(released.projectId).queryKey });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

export function useUploadProjectAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, file }: { projectId: number; file: File }) =>
      api.uploadProjectAvatar(projectId, file),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
      queryClient.invalidateQueries({ queryKey: projectQueries.detail(vars.projectId).queryKey });
    },
  });
}

export function useUpdateProjectAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, avatarUrl }: { projectId: number; avatarUrl: string }) =>
      api.updateProjectAvatar(projectId, avatarUrl),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
      queryClient.invalidateQueries({ queryKey: projectQueries.detail(vars.projectId).queryKey });
    },
  });
}
