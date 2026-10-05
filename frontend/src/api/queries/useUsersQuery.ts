import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type SystemRole,
  type CreateSavedFilterPayload,
  type UpdateSavedFilterPayload,
} from '../client.js';
import { rbacKeys } from './useRbacQuery.js';

export const userQueries = {
  all: ['users'] as const,
  lists: () => [...userQueries.all, 'list'] as const,
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isBlocked?: boolean;
    isActivated?: boolean;
  }) =>
    queryOptions({
      queryKey: [...userQueries.lists(), params ?? {}] as const,
      queryFn: () => api.getUsers(params),
    }),
  assignees: (params?: { search?: string; page?: number; limit?: number }) =>
    queryOptions({
      queryKey: [...userQueries.all, 'assignees', params ?? {}] as const,
      queryFn: () => api.getAssignees(params),
    }),
  profile: () =>
    queryOptions({
      queryKey: [...userQueries.all, 'profile'] as const,
      queryFn: () => api.getProfile(),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...userQueries.all, 'detail', id] as const,
      queryFn: () => api.getUserById(id),
      enabled: typeof id === 'number' && !Number.isNaN(id) && id > 0,
    }),
  stats: () =>
    queryOptions({
      queryKey: [...userQueries.all, 'admin-stats'] as const,
      queryFn: () => api.getAdminStats(),
    }),
  auditLogs: (page = 1, limit = 50) =>
    queryOptions({
      queryKey: [...userQueries.all, 'audit-logs', { page, limit }] as const,
      queryFn: () => api.getLoginAuditLogs(page, limit),
    }),
  savedFilters: () =>
    queryOptions({
      queryKey: [...userQueries.all, 'saved-filters'] as const,
      queryFn: () => api.getSavedFilters(),
    }),
  preferences: () =>
    queryOptions({
      queryKey: [...userQueries.all, 'preferences'] as const,
      queryFn: () => api.getPreferences(),
    }),
};

// Aliased for full backwards compatibility
export const userKeys = {
  all: userQueries.all,
  lists: userQueries.lists,
  list: (params?: Record<string, unknown>) => userQueries.list(params as any).queryKey,
  assignees: (params?: Record<string, unknown>) => userQueries.assignees(params as any).queryKey,
  profile: () => userQueries.profile().queryKey,
  detail: (id: number) => userQueries.detail(id).queryKey,
  stats: () => userQueries.stats().queryKey,
  auditLogs: (page?: number, limit?: number) => userQueries.auditLogs(page, limit).queryKey,
  savedFilters: () => userQueries.savedFilters().queryKey,
  preferences: () => userQueries.preferences().queryKey,
};

export function useUsersQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isBlocked?: boolean;
  isActivated?: boolean;
}) {
  return useQuery(userQueries.list(params));
}

export function useAssigneesQuery(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery(userQueries.assignees(params));
}

export function useProfileQuery() {
  return useQuery(userQueries.profile());
}

export function useUserDetailQuery(id?: number) {
  return useQuery(userQueries.detail(id || 0));
}

export function useAdminStatsQuery() {
  return useQuery(userQueries.stats());
}

export function useLoginAuditLogsQuery(page = 1, limit = 50) {
  return useQuery(userQueries.auditLogs(page, limit));
}

export function useSavedFiltersQuery() {
  return useQuery(userQueries.savedFilters());
}

export function useCreateSavedFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSavedFilterPayload) => api.createSavedFilter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.savedFilters().queryKey });
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
    } & UpdateSavedFilterPayload) => api.updateSavedFilter(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.savedFilters().queryKey });
    },
  });
}

export function useDeleteSavedFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSavedFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.savedFilters().queryKey });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { fullName?: string; jobTitle?: string }) =>
      api.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.profile().queryKey });
    },
  });
}

export function useUpdateAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (avatarUrl: string) => api.updateAvatar(avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.profile().queryKey });
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
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });
      queryClient.invalidateQueries({ queryKey: rbacKeys.groups() });
    },
  });
}

export function useBlockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.blockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });
      queryClient.invalidateQueries({ queryKey: userQueries.stats().queryKey });
    },
  });
}

export function useUnblockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.unblockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });
      queryClient.invalidateQueries({ queryKey: userQueries.stats().queryKey });
    },
  });
}

export function useAdminActivateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.adminActivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });
      queryClient.invalidateQueries({ queryKey: userQueries.stats().queryKey });
    },
  });
}

export function useAdminResetUser2FaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.adminResetUser2Fa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });
      queryClient.invalidateQueries({ queryKey: userQueries.stats().queryKey });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });
      queryClient.invalidateQueries({ queryKey: userQueries.stats().queryKey });
    },
  });
}

export function useUserPreferencesQuery() {
  return useQuery(userQueries.preferences());
}

export function useUpdateUserPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Record<string, unknown>) => api.updatePreferences(prefs),
    onSuccess: (updated) => {
      queryClient.setQueryData(userQueries.preferences().queryKey, updated);
      queryClient.invalidateQueries({ queryKey: userQueries.profile().queryKey });
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.profile().queryKey });
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });
    },
  });
}
