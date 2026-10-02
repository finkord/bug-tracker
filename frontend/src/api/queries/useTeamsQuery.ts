import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateTeamPayload,
  type UpdateTeamPayload,
  type AddTeamMemberPayload,
  type UpdateTeamMemberPayload,
} from '../client.js';

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (projectId?: number) => [...teamKeys.lists(), { projectId }] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: number) => [...teamKeys.details(), id] as const,
  capacities: () => [...teamKeys.all, 'capacity'] as const,
  capacity: (teamId: number, sprintWeeks?: number) =>
    [...teamKeys.capacities(), teamId, { sprintWeeks }] as const,
};

export function useTeamsQuery(projectId?: number) {
  return useQuery({
    queryKey: teamKeys.list(projectId),
    queryFn: () => api.getTeams(projectId),
  });
}

export function useTeamQuery(id: number) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => api.getTeam(id),
    enabled: Boolean(id),
  });
}

export function useTeamCapacityQuery(teamId: number, sprintWeeks = 2) {
  return useQuery({
    queryKey: teamKeys.capacity(teamId, sprintWeeks),
    queryFn: () => api.getTeamCapacity(teamId, sprintWeeks),
    enabled: Boolean(teamId),
  });
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => api.createTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useUpdateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTeamPayload }) =>
      api.updateTeam(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: teamKeys.capacities() });
    },
  });
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.capacities() });
    },
  });
}

export function useUploadTeamAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, file }: { teamId: number; file: File }) =>
      api.uploadTeamAvatar(teamId, file),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(vars.teamId) });
    },
  });
}

export function useUpdateTeamAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, avatarUrl }: { teamId: number; avatarUrl: string }) =>
      api.updateTeamAvatar(teamId, avatarUrl),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(vars.teamId) });
    },
  });
}

export function useAddTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: number;
      payload: AddTeamMemberPayload;
    }) => api.addTeamMember(teamId, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(vars.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.capacities() });
    },
  });
}

export function useUpdateTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      memberId,
      payload,
    }: {
      teamId: number;
      memberId: number;
      payload: UpdateTeamMemberPayload;
    }) => api.updateTeamMember(teamId, memberId, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(vars.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.capacities() });
    },
  });
}

export function useRemoveTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: number; memberId: number }) =>
      api.removeTeamMember(teamId, memberId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(vars.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.capacities() });
    },
  });
}
