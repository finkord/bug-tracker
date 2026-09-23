// Base API client communicating with NestJS backend via Vite proxy (/api/v1)

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  systemRole: 'ADMIN' | 'USER';
  isActivated: boolean;
  isBlocked: boolean;
  twoFactorEnabled: boolean;
  oauthProvider: 'LOCAL' | 'GITHUB' | 'GOOGLE';
  hasPassword?: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user?: UserProfile;
}

export interface Login2FaChallenge {
  require2fa: true;
  tempToken: string;
  message: string;
}

export interface LoginAuditLogItem {
  id: number;
  userId: number | null;
  user?: Partial<UserProfile>;
  attemptedEmail: string;
  ipAddress: string;
  userAgent?: string;
  status:
    | 'SUCCESS'
    | 'FAILED_PASSWORD'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_BLOCKED'
    | 'USER_NOT_FOUND'
    | 'REQUIRE_2FA'
    | 'TWO_FACTOR_FAILED'
    | 'TWO_FACTOR_SUCCESS';
  failureReason: string | null;
  createdAt: string;
}

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      Array.isArray(data?.message)
        ? data.message.join('. ')
        : data?.message || data?.error || 'Request failed';
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

export const api = {
  // Authentication Endpoints
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    captchaToken: string;
  }) =>
    request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  activate: (token: string) =>
    request<{ message: string; isActivated: boolean }>(`/auth/activate?token=${encodeURIComponent(token)}`),

  login: (payload: { email: string; password: string }) =>
    request<AuthTokens | Login2FaChallenge>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ message: string; userId?: number }>('/auth/logout', {
      method: 'POST',
    }),

  verify2fa: (payload: { tempToken: string; code: string }) =>
    request<AuthTokens>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generate2fa: () =>
    request<{ secret: string; qrCodeDataUrl: string }>('/auth/2fa/generate', {
      method: 'POST',
    }),

  enable2fa: (code: string) =>
    request<{ message: string; twoFactorEnabled: boolean }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  disable2fa: (code: string) =>
    request<{ message: string; twoFactorEnabled: boolean }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  setPassword: (payload: { currentPassword?: string; newPassword: string }) =>
    request<{ message: string; hasPassword: boolean }>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  mockOAuthLogin: (payload: {
    provider: 'GITHUB' | 'GOOGLE';
    oauthId: string;
    email: string;
    fullName: string;
  }) =>
    request<AuthTokens>('/auth/oauth/mock', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // User Profile
  getProfile: () => request<UserProfile>('/users/me'),

  // Admin Metrics & RBAC Controls
  getUserStats: () =>
    request<{
      totalUsers: number;
      activeUsers: number;
      blockedUsers: number;
      twoFactorAdoptionCount: number;
      twoFactorPercentage: number;
    }>('/users/stats'),

  getUsers: (
    paramsOrPage:
      | number
      | {
          page?: number;
          limit?: number;
          search?: string;
          role?: string;
          isBlocked?: boolean;
          isActivated?: boolean;
        } = {},
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

  updateUserRole: (id: number, role: 'ADMIN' | 'USER') =>
    request<{ message: string; userId: number; systemRole: 'ADMIN' | 'USER' }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
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

  getLoginAuditLogs: (page = 1, limit = 50) =>
    request<{ items: LoginAuditLogItem[]; total: number }>(
      `/admin/security/login-logs?page=${page}&limit=${limit}`,
    ),
};

