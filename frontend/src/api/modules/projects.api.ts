import { request } from '../http.js';
import type { ProjectItem, CreateProjectPayload } from '../types/projects.types.js';

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
};
