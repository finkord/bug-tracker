import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type SystemRole } from '../client';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...userKeys.lists(), params ?? {}] as const,
  assignees: () => [...userKeys.all, 'assignees'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  stats: () => [...userKeys.all, 'admin-stats'] as const,
  auditLogs: (page?: number, limit?: number) =>
    [...userKeys.all, 'audit-logs', { page, limit }] as const,
  savedFilters: () => [...userKeys.all, 'saved-filters'] as const,
};

export function useUsersQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isBlocked?: boolean;
  isActivated?: boolean;
}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => api.getUsers(params),
  });
}

export function useAssigneesQuery() {
  return useQuery({
    queryKey: userKeys.assignees(),
    queryFn: () => api.getAssignees(),
  });
}

export function useProfileQuery() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => api.getProfile(),
  });
}

export function useAdminStatsQuery() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: () => api.getAdminStats(),
  });
}

export function useLoginAuditLogsQuery(page = 1, limit = 50) {
  return useQuery({
    queryKey: userKeys.auditLogs(page, limit),
    queryFn: () => api.getLoginAuditLogs(page, limit),
  });
}

export function useSavedFiltersQuery() {
  return useQuery({
    queryKey: userKeys.savedFilters(),
    queryFn: () => api.getSavedFilters(),
  });
}

export function useCreateSavedFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, criteria }: { name: string; criteria: string }) =>
      api.createSavedFilter(name, criteria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.savedFilters() });
    },
  });
}

export function useDeleteSavedFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSavedFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.savedFilters() });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { fullName?: string; jobTitle?: string }) =>
      api.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}

export function useUpdateAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (avatarUrl: string) => api.updateAvatar(avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      role,
      jobTitle,
    }: {
      id: number;
      role: SystemRole;
      jobTitle?: string;
    }) => api.updateUserRole(id, role, jobTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useBlockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.blockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

export function useUnblockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.unblockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

export function useAdminActivateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.adminActivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

export function useAdminResetUser2FaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.adminResetUser2Fa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}
