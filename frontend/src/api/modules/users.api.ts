import { request } from '../http.js';
import type { UserProfile, AssigneeUser, LoginAuditLogItem, SystemRole } from '../types/auth.types.js';
import type { SavedFilterItem } from '../types/worklogs.types.js';

export const usersApi = {
  getProfile: () => request<UserProfile>('/users/me'),

  updateAvatar: (avatarUrl: string) =>
    request<{ message: string; avatarUrl: string }>('/users/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    }),

  getSavedFilters: () => request<SavedFilterItem[]>('/users/me/filters'),

  createSavedFilter: (name: string, criteria: string) =>
    request<SavedFilterItem>('/users/me/filters', {
      method: 'POST',
      body: JSON.stringify({ name, criteria }),
    }),

  deleteSavedFilter: (id: number) =>
    request<{ message: string }>(`/users/me/filters/${id}`, {
      method: 'DELETE',
    }),

  getAssignees: () => request<AssigneeUser[]>('/users/assignees'),

  getAdminStats: () =>
    request<{
      totalUsers: number;
      activeUsers: number;
      blockedUsers: number;
      twoFactorAdoptionCount: number;
      twoFactorPercentage: number;
      roleBreakdown?: Record<string, number>;
    }>('/users/stats'),

  getUsers: (
    paramsOrPage: number | {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      isBlocked?: boolean;
      isActivated?: boolean;
    } = 1,
    limitArg = 50,
  ) => {
    let params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      isBlocked?: boolean;
      isActivated?: boolean;
    };
    if (typeof paramsOrPage === 'number') {
      params = { page: paramsOrPage, limit: limitArg };
    } else {
      params = paramsOrPage;
    }
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (typeof params.isBlocked === 'boolean') query.set('isBlocked', String(params.isBlocked));
    if (typeof params.isActivated === 'boolean') query.set('isActivated', String(params.isActivated));
    const qs = query.toString();
    return request<{
      items: UserProfile[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/users${qs ? `?${qs}` : ''}`);
  },

  updateUserRole: (id: number, role: SystemRole, jobTitle?: string) =>
    request<{ message: string; userId: number; systemRole: SystemRole; jobTitle?: string }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, jobTitle }),
    }),

  updateProfile: (payload: { fullName?: string; jobTitle?: string }) =>
    request<{ message: string; user: UserProfile }>('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  adminActivateUser: (id: number) =>
    request<{ message: string; userId: number; isActivated: boolean }>(`/users/${id}/activate`, {
      method: 'PATCH',
    }),

  adminResetUser2Fa: (id: number) =>
    request<{ message: string; userId: number; twoFactorEnabled: boolean }>(`/users/${id}/reset-2fa`, {
      method: 'PATCH',
    }),

  blockUser: (id: number) =>
    request<{ message: string; userId: number; isBlocked: boolean }>(`/users/${id}/block`, {
      method: 'PATCH',
    }),

  unblockUser: (id: number) =>
    request<{ message: string; userId: number; isBlocked: boolean }>(`/users/${id}/unblock`, {
      method: 'PATCH',
    }),

  deleteUser: (id: number) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  getLoginAuditLogs: (page = 1, limit = 50) =>
    request<{ items: LoginAuditLogItem[]; total: number }>(
      `/admin/security/login-logs?page=${page}&limit=${limit}`,
    ),
};
