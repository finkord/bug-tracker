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

export interface IssueSecurityGrantItem {
  id: number;
  securityLevelId?: number;
  grantType: string;
  roleId?: number | null;
  groupId?: number | null;
  role?: ProjectRoleItem | null;
  group?: GroupItem | null;
}

export interface IssueSecurityLevelItem {
  id: number;
  schemeId?: number;
  name: string;
  description: string | null;
  grants?: IssueSecurityGrantItem[];
}

export interface IssueSecuritySchemeItem {
  id: number;
  name: string;
  description: string | null;
  defaultLevelId: number | null;
  isDefault?: boolean;
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

export interface UserGroupMemberItem {
  id: number;
  groupId: number;
  userId: number;
  createdAt?: string;
  user?: UserProfile;
  group?: GroupItem;
}

export interface ProjectRoleActorItem {
  id: number;
  projectId: number;
  roleId: number;
  actorType: 'USER' | 'GROUP';
  userId: number | null;
  groupId: number | null;
  createdAt?: string;
}
