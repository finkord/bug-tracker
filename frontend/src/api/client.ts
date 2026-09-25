const API_BASE_URL = 'http://localhost:3000/api/v1';

export type SystemRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'QA_ENGINEER' | 'DEVOPS_ENGINEER' | 'SECURITY_ENGINEER' | 'USER';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  systemRole: SystemRole;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  isActivated: boolean;
  isBlocked: boolean;
  twoFactorEnabled: boolean;
  oauthProvider?: 'LOCAL' | 'GITHUB' | 'GOOGLE';
  hasPassword?: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user?: UserProfile;
}

export interface Login2FaChallenge {
  require2fa: boolean;
  tempToken: string;
  message: string;
  challengeToken?: string;
  email?: string;
}

export interface LoginAuditLogItem {
  id: number;
  userId?: number | null;
  user?: Partial<UserProfile>;
  attemptedEmail: string;
  ipAddress: string;
  userAgent?: string;
  status:
    | 'SUCCESS'
    | 'FAILED'
    | 'LOCKED_OUT'
    | 'TWO_FACTOR_SUCCESS'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_BLOCKED'
    | 'FAILED_PASSWORD'
    | 'TWO_FACTOR_FAILED'
    | 'REQUIRE_2FA'
    | string;
  failureReason: string | null;
  createdAt: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  key: string;
  description: string | null;
  leadId: number;
  lead: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  totalIssues: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
}

export type IssueType = 'BUG' | 'TASK' | 'FEATURE' | 'IMPROVEMENT';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'RESOLVED' | 'CLOSED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueSeverity = 'MINOR' | 'MAJOR' | 'BLOCKER' | 'TRIVIAL';

export interface AssigneeUser {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  systemRole?: SystemRole;
  jobTitle?: string | null;
}

export interface IssueComment {
  id: number;
  text: string;
  author: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  };
  createdAt: string;
}

export interface WorklogItem {
  id: number;
  timeSpentHours: number;
  dateLogged: string;
  description: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  };
  issue?: {
    id: number;
    key: string;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    projectName?: string;
  };
}

export interface SavedFilterItem {
  id: number;
  userId: number;
  name: string;
  criteria: string; // JSON serialized filter query
  createdAt: string;
}

export interface TeamTimesheetMatrix {
  startDate: string;
  endDate: string;
  days: string[];
  members: Array<{
    userId: number;
    fullName: string;
    email: string;
    systemRole: SystemRole;
    avatarUrl: string | null;
    dailyHours: Record<string, number>;
    totalPeriodHours: number;
  }>;
  dailyTotals: Record<string, number>;
  grandTotal: number;
}

export interface WorklogStats {
  totalHoursLogged: number;
  hoursLoggedToday: number;
  hoursLoggedThisWeek: number;
  byProject: Array<{ projectId: number; projectName: string; projectKey: string; totalHours: number }>;
  byUser: Array<{ userId: number; fullName: string; email: string; avatarUrl: string | null; totalHours: number }>;
}

export interface IssueItem {
  id: number;
  key: string;
  projectId: number;
  projectKey: string;
  projectName: string;
  issueNum: number;
  title: string;
  description: string | null;
  issueType: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  severity: IssueSeverity;
  estimatedHours: number;
  loggedHours: number;
  sprint: string | null;
  reporter: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  };
  assignee: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  } | null;
  commentsCount?: number;
  comments?: IssueComment[];
  worklogs?: WorklogItem[];
  attachments?: AttachmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentItem {
  id: number;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
  fid: string;
  uploader?: {
    id: number;
    fullName: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  };
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
}

export interface CreateIssuePayload {
  projectId: number;
  title: string;
  description?: string;
  issueType?: IssueType;
  priority?: IssuePriority;
  severity?: IssueSeverity;
  estimatedHours?: number;
  sprint?: string;
  assigneeId?: number;
}

// Low-level fetch wrapper with authorization header and error handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const data: AuthTokens = await refreshRes.json();
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          headers['Authorization'] = `Bearer ${data.accessToken}`;
          const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          if (retryRes.ok) {
            return retryRes.json();
          }
        }
      } catch {
        // Fall through to eviction
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(
      new CustomEvent('bt:unauthorized', {
        detail: { message: 'Your session has expired. Please sign in again.' },
      }),
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }

  return data as T;
}

export const api = {
  // Authentication & Session
  register: (payload: any) =>
    request<{ message: string; userId: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  activate: (token: string) =>
    request<{ message: string; email: string }>(`/auth/activate?token=${encodeURIComponent(token)}`),

  activateAccount: (token: string) =>
    request<{ message: string; email: string }>(`/auth/activate?token=${encodeURIComponent(token)}`),

  login: (payload: any) =>
    request<
      | AuthTokens
      | { require2fa: true; tempToken: string; message: string; email: string }
      | { requires2Fa: true; challengeToken: string; message: string; email: string }
    >('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verify2fa: (data: { tempToken?: string; challengeToken?: string; code?: string; totpCode?: string }) =>
    request<AuthTokens>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        challengeToken: data.challengeToken || data.tempToken,
        totpCode: data.totpCode || data.code,
      }),
    }),

  verify2Fa: (challengeToken: string, totpCode: string) =>
    request<AuthTokens>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, totpCode }),
    }),

  generate2fa: () =>
    request<{ secret: string; qrCodeDataUrl: string; otpauthUrl: string }>('/auth/2fa/generate', {
      method: 'POST',
    }),

  generate2Fa: () =>
    request<{ secret: string; qrCodeDataUrl: string; otpauthUrl: string }>('/auth/2fa/generate', {
      method: 'POST',
    }),

  enable2fa: (totpCode: string) =>
    request<{ message: string }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    }),

  enable2Fa: (totpCode: string) =>
    request<{ message: string }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    }),

  disable2fa: (totpCode: string) =>
    request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    }),

  disable2Fa: (totpCode: string) =>
    request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: any) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  setPassword: (payload: string | { newPassword: string }) =>
    request<{ message: string }>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { password: payload } : { password: payload.newPassword }),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  // User & Profile
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

  // Administration & Security
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

  getLoginAuditLogs: (page = 1, limit = 50) =>
    request<{ items: LoginAuditLogItem[]; total: number }>(
      `/admin/security/login-logs?page=${page}&limit=${limit}`,
    ),

  // Projects Endpoints
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

  // Issues & Kanban Endpoints
  getIssues: (params: {
    projectId?: number;
    status?: IssueStatus;
    priority?: IssuePriority;
    issueType?: IssueType;
    assigneeId?: number;
    sprint?: string;
    search?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.projectId) query.set('projectId', String(params.projectId));
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.issueType) query.set('issueType', params.issueType);
    if (params.assigneeId) query.set('assigneeId', String(params.assigneeId));
    if (params.sprint) query.set('sprint', params.sprint);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return request<IssueItem[]>(`/issues${qs ? `?${qs}` : ''}`);
  },
  getIssue: (idOrKey: string | number) => request<IssueItem>(`/issues/${idOrKey}`),
  createIssue: (payload: CreateIssuePayload) =>
    request<IssueItem>('/issues', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateIssueStatus: (id: number, status: IssueStatus) =>
    request<IssueItem>(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  assignIssueToMe: (id: number) =>
    request<IssueItem>(`/issues/${id}/assign-me`, {
      method: 'PATCH',
    }),
  updateIssueSprint: (id: number, sprint: string | null) =>
    request<IssueItem>(`/issues/${id}/sprint`, {
      method: 'PATCH',
      body: JSON.stringify({ sprint }),
    }),
  updateIssue: (id: number, payload: Partial<CreateIssuePayload>) =>
    request<IssueItem>(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  uploadAttachment: async (issueId: number, file: File): Promise<AttachmentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('bt_access_token');
    const res = await fetch(`${API_BASE_URL}/issues/${issueId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to upload attachment' }));
      throw new Error(err.message || 'Failed to upload attachment');
    }
    return res.json();
  },

  deleteAttachment: (issueId: number, attachmentId: number) =>
    request<{ message: string }>(`/issues/${issueId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),

  getAttachments: (issueId: number) =>
    request<AttachmentItem[]>(`/issues/${issueId}/attachments`),

  deleteIssue: (id: number) =>
    request<{ success: boolean; message: string }>(`/issues/${id}`, {
      method: 'DELETE',
    }),
  addIssueComment: (issueId: number, text: string) =>
    request<IssueComment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Worklog / Time Tracking Endpoints
  logWork: (issueId: number, payload: { timeSpentHours: number; dateLogged?: string; description?: string }) =>
    request<IssueItem>(`/issues/${issueId}/worklogs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getIssueWorklogs: (issueId: number) => request<WorklogItem[]>(`/issues/${issueId}/worklogs`),
  getMyWorklogs: () => request<WorklogItem[]>('/issues/worklogs/me'),
    getWorklogStats: () => request<WorklogStats>('/issues/worklogs/stats'),
  getTeamTimesheetMatrix: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<TeamTimesheetMatrix>(`/issues/worklogs/matrix${query}`);
  },
};
