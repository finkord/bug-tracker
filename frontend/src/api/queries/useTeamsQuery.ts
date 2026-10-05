import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateTeamPayload,
  type UpdateTeamPayload,
  type AddTeamMemberPayload,
  type UpdateTeamMemberPayload,
} from '../client.js';

export const teamQueries = {
  all: ['teams'] as const,
  lists: () => [...teamQueries.all, 'list'] as const,
  list: (projectId?: number) =>
    queryOptions({
      queryKey: [...teamQueries.lists(), { projectId }] as const,
      queryFn: () => api.getTeams(projectId),
    }),
  details: () => [...teamQueries.all, 'detail'] as const,
  detail: (id: number) =>
    queryOptions({
      queryKey: [...teamQueries.details(), id] as const,
      queryFn: () => api.getTeam(id),
      enabled: Boolean(id),
    }),
  capacities: () => [...teamQueries.all, 'capacity'] as const,
  capacity: (teamId: number, sprintWeeks = 2) =>
    queryOptions({
      queryKey: [...teamQueries.capacities(), teamId, { sprintWeeks }] as const,
      queryFn: () => api.getTeamCapacity(teamId, sprintWeeks),
      enabled: Boolean(teamId),
    }),
};

// Aliased for full backwards compatibility
export const teamKeys = teamQueries;

export function useTeamsQuery(projectId?: number) {
  return useQuery(teamQueries.list(projectId));
}

export function useTeamQuery(id: number) {
  return useQuery(teamQueries.detail(id));
}

export function useTeamCapacityQuery(teamId: number, sprintWeeks = 2) {
  return useQuery(teamQueries.capacity(teamId, sprintWeeks));
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => api.createTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueries.lists() });
    },
  });
}

export function useUpdateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTeamPayload }) =>
      api.updateTeam(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamQueries.lists() });
      queryClient.invalidateQueries({ queryKey: teamQueries.detail(data.id).queryKey });
      queryClient.invalidateQueries({ queryKey: teamQueries.capacities() });
    },
  });
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueries.lists() });
      queryClient.invalidateQueries({ queryKey: teamQueries.capacities() });
    },
  });
}

export function useUploadTeamAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, file }: { teamId: number; file: File }) =>
      api.uploadTeamAvatar(teamId, file),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teamQueries.lists() });
      queryClient.invalidateQueries({ queryKey: teamQueries.detail(vars.teamId).queryKey });
    },
  });
}

export function useUpdateTeamAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, avatarUrl }: { teamId: number; avatarUrl: string }) =>
      api.updateTeamAvatar(teamId, avatarUrl),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teamQueries.lists() });
      queryClient.invalidateQueries({ queryKey: teamQueries.detail(vars.teamId).queryKey });
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
      queryClient.invalidateQueries({ queryKey: teamQueries.lists() });
      queryClient.invalidateQueries({ queryKey: teamQueries.detail(vars.teamId).queryKey });
      queryClient.invalidateQueries({ queryKey: teamQueries.capacities() });
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
      queryClient.invalidateQueries({ queryKey: teamQueries.lists() });
      queryClient.invalidateQueries({ queryKey: teamQueries.detail(vars.teamId).queryKey });
      queryClient.invalidateQueries({ queryKey: teamQueries.capacities() });
    },
  });
}

export function useRemoveTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: number; memberId: number }) =>
      api.removeTeamMember(teamId, memberId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teamQueries.lists() });
      queryClient.invalidateQueries({ queryKey: teamQueries.detail(vars.teamId).queryKey });
      queryClient.invalidateQueries({ queryKey: teamQueries.capacities() });
    },
  });
}
