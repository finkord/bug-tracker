import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type SystemRole } from '../client';
import { rbacKeys } from './useRbacQuery';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...userKeys.lists(), params ?? {}] as const,
  assignees: (params?: Record<string, unknown>) => [...userKeys.all, 'assignees', params ?? {}] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
  stats: () => [...userKeys.all, 'admin-stats'] as const,
  auditLogs: (page?: number, limit?: number) =>
    [...userKeys.all, 'audit-logs', { page, limit }] as const,
  savedFilters: () => [...userKeys.all, 'saved-filters'] as const,
  preferences: () => [...userKeys.all, 'preferences'] as const,
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

export function useAssigneesQuery(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: userKeys.assignees(params),
    queryFn: () => api.getAssignees(params),
  });
}

export function useProfileQuery() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => api.getProfile(),
  });
}

export function useUserDetailQuery(id?: number) {
  return useQuery({
    queryKey: userKeys.detail(id || 0),
    queryFn: () => api.getUserById(id!),
    enabled: typeof id === 'number' && !Number.isNaN(id) && id > 0,
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
    mutationFn: (payload: {
      name: string;
      criteria: string;
      description?: string;
      isFavorite?: boolean;
    }) => api.createSavedFilter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.savedFilters() });
    },
  });
}

export function useUpdateSavedFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number;
      name?: string;
      criteria?: string;
      description?: string;
      isFavorite?: boolean;
    }) => api.updateSavedFilter(id, payload),
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
      queryClient.invalidateQueries({ queryKey: rbacKeys.groups() });
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

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

export function useUserPreferencesQuery() {
  return useQuery({
    queryKey: userKeys.preferences(),
    queryFn: () => api.getPreferences(),
  });
}

export function useUpdateUserPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Record<string, unknown>) => api.updatePreferences(prefs),
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.preferences(), updated);
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

