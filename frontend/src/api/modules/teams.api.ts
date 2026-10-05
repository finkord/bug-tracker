import { request, uploadFile } from '../http.js';
import type {
  TeamItem,
  TeamMemberItem,
  CreateTeamPayload,
  UpdateTeamPayload,
  AddTeamMemberPayload,
  UpdateTeamMemberPayload,
  TeamCapacityReport,
} from '../types/teams.types.js';

export const teamsApi = {
  getTeams: (projectId?: number) => {
    const qs = projectId ? `?projectId=${projectId}` : '';
    return request<TeamItem[]>(`/teams${qs}`);
  },

  getTeam: (id: number) => {
    return request<TeamItem>(`/teams/${id}`);
  },

  createTeam: (payload: CreateTeamPayload) => {
    return request<TeamItem>('/teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTeam: (id: number, payload: UpdateTeamPayload) => {
    return request<TeamItem>(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteTeam: (id: number) => {
    return request<{ message: string }>(`/teams/${id}`, {
      method: 'DELETE',
    });
  },

  addTeamMember: (teamId: number, payload: AddTeamMemberPayload) => {
    return request<TeamMemberItem>(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTeamMember: (
    teamId: number,
    memberId: number,
    payload: UpdateTeamMemberPayload,
  ) => {
    return request<TeamMemberItem>(`/teams/${teamId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  removeTeamMember: (teamId: number, memberId: number) => {
    return request<{ message: string }>(`/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  getTeamCapacity: (teamId: number, sprintWeeks = 2) => {
    return request<TeamCapacityReport>(
      `/teams/${teamId}/capacity?sprintWeeks=${sprintWeeks}`,
    );
  },

  uploadTeamAvatar: (teamId: number, file: File) =>
    uploadFile<{ message: string; avatarUrl: string }>(`/teams/${teamId}/avatar/upload`, file, 'avatar'),

  updateTeamAvatar: (teamId: number, avatarUrl: string) => {
    return request<{ message: string; avatarUrl: string }>(`/teams/${teamId}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    });
  },
};
