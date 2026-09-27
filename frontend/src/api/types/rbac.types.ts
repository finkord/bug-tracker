import type { UserProfile } from './auth.types.js';

export interface GroupItem {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  userGroups?: Array<{
    id: number;
    userId: number;
    user?: UserProfile;
  }>;
  createdAt: string;
}

export interface ProjectRoleItem {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export interface PermissionGrantItem {
  id: number;
  schemeId: number;
  permission: string;
  grantType: 'ROLE' | 'GROUP' | 'LEAD' | 'REPORTER' | 'ASSIGNEE' | 'ANY_LOGGED_IN';
  roleId: number | null;
  role?: ProjectRoleItem | null;
  groupId: number | null;
  group?: GroupItem | null;
}

export interface PermissionSchemeItem {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  grants?: PermissionGrantItem[];
}

export interface IssueSecurityLevelItem {
  id: number;
  name: string;
  description: string | null;
  grants?: Array<{
    id: number;
    grantType: string;
    role?: ProjectRoleItem | null;
    group?: GroupItem | null;
  }>;
}

export interface IssueSecuritySchemeItem {
  id: number;
  name: string;
  description: string | null;
  defaultLevelId: number | null;
  levels?: IssueSecurityLevelItem[];
}

export interface ProjectRoleGrouped {
  roleId: number;
  roleName: string;
  description: string | null;
  users: Array<{
    actorId: number;
    user: UserProfile;
  }>;
  groups: Array<{
    actorId: number;
    group: GroupItem;
  }>;
}
