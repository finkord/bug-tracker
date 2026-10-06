import { request } from '../http.js';
import type {
  GroupItem,
  ProjectRoleItem,
  PermissionSchemeItem,
  PermissionGrantItem,
  IssueSecuritySchemeItem,
  IssueSecurityLevelItem,
  IssueSecurityGrantItem,
  ProjectRoleGrouped,
  UserGroupMemberItem,
  ProjectRoleActorItem,
} from '../types/rbac.types.js';
import type { ProjectItem } from '../types/projects.types.js';

export const rbacApi = {
  getGroups: () => request<GroupItem[]>('/rbac/groups'),

  createGroup: (payload: { name: string; description?: string }) =>
    request<GroupItem>('/rbac/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addUserToGroup: (groupId: number, userId: number) =>
    request<UserGroupMemberItem>(`/rbac/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  removeUserFromGroup: (groupId: number, userId: number) =>
    request<{ success: boolean; message: string }>(`/rbac/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),

  deleteGroup: (groupId: number) =>
    request<{ success: boolean; message: string }>(`/rbac/groups/${groupId}`, {
      method: 'DELETE',
    }),

  getProjectRoles: () => request<ProjectRoleItem[]>('/rbac/roles'),

  createProjectRole: (payload: { name: string; description?: string; isDefault?: boolean }) =>
    request<ProjectRoleItem>('/rbac/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProjectRole: (
    roleId: number,
    payload: { name?: string; description?: string; isDefault?: boolean },
  ) =>
    request<ProjectRoleItem>(`/rbac/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProjectRole: (roleId: number) =>
    request<{ success: boolean; message: string }>(`/rbac/roles/${roleId}`, {
      method: 'DELETE',
    }),

  getPermissionSchemes: () => request<PermissionSchemeItem[]>('/rbac/permission-schemes'),

  getPermissionScheme: (id: number) => request<PermissionSchemeItem>(`/rbac/permission-schemes/${id}`),

  createPermissionScheme: (payload: { name: string; description?: string }) =>
    request<PermissionSchemeItem>('/rbac/permission-schemes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deletePermissionScheme: (schemeId: number) =>
    request<{ success: boolean; message: string }>(`/rbac/permission-schemes/${schemeId}`, {
      method: 'DELETE',
    }),

  addPermissionGrant: (
    schemeId: number,
    payload: {
      permission: string;
      grantType: string;
      roleId?: number;
      groupId?: number;
    },
  ) =>
    request<PermissionGrantItem>(`/rbac/permission-schemes/${schemeId}/grants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  removePermissionGrant: (schemeId: number, grantId: number) =>
    request<{ success: boolean; message: string }>(`/rbac/permission-schemes/${schemeId}/grants/${grantId}`, {
      method: 'DELETE',
    }),

  getSecuritySchemes: () => request<IssueSecuritySchemeItem[]>('/rbac/security-schemes'),

  createSecurityScheme: (payload: { name: string; description?: string }) =>
    request<IssueSecuritySchemeItem>('/rbac/security-schemes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteSecurityScheme: (schemeId: number) =>
    request<{ success: boolean; message: string }>(`/rbac/security-schemes/${schemeId}`, {
      method: 'DELETE',
    }),

  addSecurityLevel: (schemeId: number, payload: { name: string; description?: string }) =>
    request<IssueSecurityLevelItem>(`/rbac/security-schemes/${schemeId}/levels`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteSecurityLevel: (schemeId: number, levelId: number) =>
    request<{ success: boolean; message: string }>(`/rbac/security-schemes/${schemeId}/levels/${levelId}`, {
      method: 'DELETE',
    }),

  setDefaultSecurityLevel: (schemeId: number, defaultLevelId: number | null) =>
    request<IssueSecuritySchemeItem>(`/rbac/security-schemes/${schemeId}/default-level`, {
      method: 'PUT',
      body: JSON.stringify({ defaultLevelId }),
    }),

  addSecurityGrant: (
    schemeId: number,
    levelId: number,
    payload: { grantType: string; roleId?: number; groupId?: number },
  ) =>
    request<IssueSecurityGrantItem>(`/rbac/security-schemes/${schemeId}/levels/${levelId}/grants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteSecurityGrant: (grantId: number) =>
    request<{ success: boolean; message: string }>(`/rbac/security-schemes/levels/grants/${grantId}`, {
      method: 'DELETE',
    }),

  getProjectPeople: (projectId: number) =>
    request<ProjectRoleGrouped[]>(`/projects/${projectId}/rbac/people`),

  addActorToProjectRole: (
    projectId: number,
    roleId: number,
    payload: { actorType: 'USER' | 'GROUP'; userId?: number; groupId?: number },
  ) =>
    request<ProjectRoleActorItem>(`/projects/${projectId}/rbac/roles/${roleId}/actors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  removeActorFromProjectRole: (projectId: number, roleId: number, actorId: number) =>
    request<{ success: boolean; message: string }>(`/projects/${projectId}/rbac/roles/${roleId}/actors/${actorId}`, {
      method: 'DELETE',
    }),

  getMyProjectPermissions: (projectId: number) =>
    request<Record<string, boolean>>(`/projects/${projectId}/rbac/permissions/me`),

  assignPermissionSchemeToProject: (projectId: number, schemeId: number) =>
    request<ProjectItem>(`/projects/${projectId}/rbac/permission-scheme`, {
      method: 'PUT',
      body: JSON.stringify({ schemeId }),
    }),
};
