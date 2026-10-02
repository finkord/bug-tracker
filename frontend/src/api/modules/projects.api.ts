import { request } from '../http.js';
import type {
  ProjectItem,
  CreateProjectPayload,
  ProjectQuickFilterItem,
  CreateQuickFilterPayload,
  UpdateQuickFilterPayload,
  ProjectComponentItem,
  CreateComponentPayload,
} from '../types/projects.types.js';

export const projectsApi = {
  getProjects: () => request<ProjectItem[]>('/projects'),

  getProject: (id: number) => request<ProjectItem>(`/projects/${id}`),

  createProject: (payload: CreateProjectPayload) =>
    request<ProjectItem>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProject: (id: number, payload: Partial<CreateProjectPayload>) =>
    request<ProjectItem>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteProject: (id: number) =>
    request<{ success: boolean; message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  getQuickFilters: (projectId: number) =>
    request<ProjectQuickFilterItem[]>(`/projects/${projectId}/quick-filters`),

  createQuickFilter: (projectId: number, payload: CreateQuickFilterPayload) =>
    request<ProjectQuickFilterItem>(`/projects/${projectId}/quick-filters`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateQuickFilter: (projectId: number, filterId: number, payload: UpdateQuickFilterPayload) =>
    request<ProjectQuickFilterItem>(`/projects/${projectId}/quick-filters/${filterId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteQuickFilter: (projectId: number, filterId: number) =>
    request<{ success: boolean; message: string }>(`/projects/${projectId}/quick-filters/${filterId}`, {
      method: 'DELETE',
    }),

  getProjectComponents: (projectId: number) =>
    request<ProjectComponentItem[]>(`/projects/${projectId}/components`),

  createProjectComponent: (projectId: number, payload: CreateComponentPayload) =>
    request<ProjectComponentItem>(`/projects/${projectId}/components`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteProjectComponent: (projectId: number, componentId: number) =>
    request<{ success: boolean; message: string }>(
      `/projects/${projectId}/components/${componentId}`,
      {
        method: 'DELETE',
      },
    ),

  getVersions: (projectId: number) =>
    request<import('../types/projects.types.js').ProjectVersionItem[]>(`/projects/${projectId}/versions`),

  createVersion: (
    projectId: number,
    payload: import('../types/projects.types.js').CreateProjectVersionPayload,
  ) =>
    request<import('../types/projects.types.js').ProjectVersionItem>(`/projects/${projectId}/versions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateVersion: (
    projectId: number,
    versionId: number,
    payload: import('../types/projects.types.js').UpdateProjectVersionPayload,
  ) =>
    request<import('../types/projects.types.js').ProjectVersionItem>(
      `/projects/${projectId}/versions/${versionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    ),

  deleteVersion: (projectId: number, versionId: number) =>
    request<{ success: boolean; message: string }>(
      `/projects/${projectId}/versions/${versionId}`,
      {
        method: 'DELETE',
      },
    ),

  releaseVersion: (
    projectId: number,
    versionId: number,
    payload?: import('../types/projects.types.js').ReleaseVersionPayload,
  ) =>
    request<import('../types/projects.types.js').ProjectVersionItem>(
      `/projects/${projectId}/versions/${versionId}/release`,
      {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      },
    ),

  getReleaseNotes: (projectId: number, versionId: number) =>
    request<import('../types/projects.types.js').ReleaseNotesResponse>(
      `/projects/${projectId}/versions/${versionId}/release-notes`,
    ),

  uploadProjectAvatar: async (
    projectId: number,
    file: File,
  ): Promise<{ message: string; avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const { API_BASE_URL } = await import('../http.js');
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/avatar/upload`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload project avatar');
    }

    return res.json();
  },

  updateProjectAvatar: (projectId: number, avatarUrl: string) =>
    request<{ message: string; avatarUrl: string }>(`/projects/${projectId}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    }),
};

