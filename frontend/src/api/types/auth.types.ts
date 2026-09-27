export type SystemRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER'
  | 'QA_ENGINEER'
  | 'DEVOPS_ENGINEER'
  | 'SECURITY_ENGINEER'
  | 'USER';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  systemRole: SystemRole;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  groups?: string[];
  isAdmin?: boolean;
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
