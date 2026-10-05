import type { components } from './api.generated.js';

export type SystemRole = components['schemas']['UpdateUserRoleDto']['role'];

export interface UserPreferences {
  theme?: 'light' | 'dark';
  showCollapsedLabels?: boolean;
  emailNotifications?: boolean;
  compactMode?: boolean;
  [key: string]: unknown;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  systemRole: SystemRole;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  preferences?: UserPreferences;
  groups?: string[];
  isAdmin?: boolean;
  isRoot?: boolean;
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

export interface AssigneeUser {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  systemRole?: SystemRole;
  jobTitle?: string | null;
}

export type RegisterPayload = Partial<components['schemas']['RegisterDto']> & {
  email: string;
  fullName: string;
  jobTitle?: string;
};

export type LoginPayload = Partial<components['schemas']['LoginDto']> & {
  email: string;
};

export type ResetPasswordPayload = components['schemas']['ResetPasswordDto'] & {
  password?: string;
};

export type Verify2faPayload = components['schemas']['Verify2faDto'];
export type Enable2faPayload = components['schemas']['Enable2faDto'];
export type ForgotPasswordPayload = components['schemas']['ForgotPasswordDto'];
export type SetPasswordPayload = components['schemas']['SetPasswordDto'];

