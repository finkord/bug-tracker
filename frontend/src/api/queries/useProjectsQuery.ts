import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateProjectPayload, type UpdateProjectPayload } from '../client';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  people: (id: number) => [...projectKeys.detail(id), 'people'] as const,
  permissions: (id: number) => [...projectKeys.detail(id), 'permissions'] as const,
  quickFilters: (id: number) => [...projectKeys.detail(id), 'quick-filters'] as const,
  components: (id: number) => [...projectKeys.detail(id), 'components'] as const,
  versions: (id: number) => [...projectKeys.detail(id), 'versions'] as const,
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

export function useProjectQuickFiltersQuery(projectId?: number) {
  return useQuery({
    queryKey: projectKeys.quickFilters(projectId!),
    queryFn: () => api.getQuickFilters(projectId!),
    enabled: typeof projectId === 'number' && !isNaN(projectId),
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
      data?: import('../client').CreateQuickFilterPayload;
      payload?: import('../client').CreateQuickFilterPayload;
    }) => api.createQuickFilter(projectId, (data || payload)!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.quickFilters(created.projectId) });
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
      data?: import('../client').UpdateQuickFilterPayload;
      payload?: import('../client').UpdateQuickFilterPayload;
    }) => api.updateQuickFilter(projectId, filterId, (data || payload)!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.quickFilters(updated.projectId) });
    },
  });
}

export function useDeleteQuickFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, filterId }: { projectId: number; filterId: number }) =>
      api.deleteQuickFilter(projectId, filterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.quickFilters(variables.projectId) });
    },
  });
}

export function useProjectComponentsQuery(projectId?: number) {
  return useQuery({
    queryKey: projectKeys.components(projectId!),
    queryFn: () => api.getProjectComponents(projectId!),
    enabled: typeof projectId === 'number' && !isNaN(projectId),
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
      data?: import('../client').CreateComponentPayload;
      payload?: import('../client').CreateComponentPayload;
    }) => api.createProjectComponent(projectId, (data || payload)!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.components(created.projectId) });
    },
  });
}

export function useDeleteProjectComponentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, componentId }: { projectId: number; componentId: number }) =>
      api.deleteProjectComponent(projectId, componentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.components(variables.projectId) });
    },
  });
}

export function useProjectVersionsQuery(projectId?: number) {
  return useQuery({
    queryKey: projectKeys.versions(projectId!),
    queryFn: () => api.getVersions(projectId!),
    enabled: typeof projectId === 'number' && !isNaN(projectId),
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
      data?: import('../client').CreateProjectVersionPayload;
      payload?: import('../client').CreateProjectVersionPayload;
    }) => api.createVersion(projectId, (data || payload)!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.versions(created.projectId) });
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
      data?: import('../client').UpdateProjectVersionPayload;
      payload?: import('../client').UpdateProjectVersionPayload;
    }) => api.updateVersion(projectId, versionId, (data || payload)!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.versions(updated.projectId) });
    },
  });
}

export function useDeleteProjectVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, versionId }: { projectId: number; versionId: number }) =>
      api.deleteVersion(projectId, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.versions(variables.projectId) });
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
      data?: import('../client').ReleaseVersionPayload;
      payload?: import('../client').ReleaseVersionPayload;
    }) => api.releaseVersion(projectId, versionId, data || payload),
    onSuccess: (released) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.versions(released.projectId) });
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
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
    },
  });
}

export function useUpdateProjectAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, avatarUrl }: { projectId: number; avatarUrl: string }) =>
      api.updateProjectAvatar(projectId, avatarUrl),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
    },
  });
}



