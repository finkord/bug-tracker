import { request } from '../http.js';
import type {
  SprintItem,
  CreateSprintPayload,
  UpdateSprintPayload,
  CompleteSprintPayload,
} from '../types/sprints.types.js';

export const sprintsApi = {
  getProjectSprints: (projectId: number) =>
    request<SprintItem[]>(`/projects/${projectId}/sprints`),

  createSprint: (projectId: number, payload: CreateSprintPayload) =>
    request<SprintItem>(`/projects/${projectId}/sprints`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSprint: (projectId: number, sprintId: number, payload: UpdateSprintPayload) =>
    request<SprintItem>(`/projects/${projectId}/sprints/${sprintId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  startSprint: (projectId: number, sprintId: number) =>
    request<SprintItem>(`/projects/${projectId}/sprints/${sprintId}/start`, {
      method: 'POST',
    }),

  completeSprint: (
    projectId: number,
    sprintId: number,
    payload: CompleteSprintPayload = {},
  ) =>
    request<SprintItem>(`/projects/${projectId}/sprints/${sprintId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteSprint: (projectId: number, sprintId: number) =>
    request<{ success: boolean; message: string }>(
      `/projects/${projectId}/sprints/${sprintId}`,
      {
        method: 'DELETE',
      },
    ),
};
