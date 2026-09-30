import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { projectKeys } from './useProjectsQuery';
import { userKeys } from './useUsersQuery';

export const rbacKeys = {
  all: ['rbac'] as const,
  groups: () => [...rbacKeys.all, 'groups'] as const,
  roles: () => [...rbacKeys.all, 'roles'] as const,
  permissionSchemes: () => [...rbacKeys.all, 'permission-schemes'] as const,
  permissionScheme: (id: number) => [...rbacKeys.permissionSchemes(), id] as const,
  securitySchemes: () => [...rbacKeys.all, 'security-schemes'] as const,
};

export function useGroupsQuery() {
  return useQuery({
    queryKey: rbacKeys.groups(),
    queryFn: () => api.getGroups(),
  });
}

export function useProjectRolesQuery() {
  return useQuery({
    queryKey: rbacKeys.roles(),
    queryFn: () => api.getProjectRoles(),
  });
}

export function usePermissionSchemesQuery() {
  return useQuery({
    queryKey: rbacKeys.permissionSchemes(),
    queryFn: () => api.getPermissionSchemes(),
  });
}

export function usePermissionSchemeQuery(id?: number) {
  return useQuery({
    queryKey: rbacKeys.permissionScheme(id!),
    queryFn: () => api.getPermissionScheme(id!),
    enabled: typeof id === 'number' && !isNaN(id),
  });
}

export function useSecuritySchemesQuery() {
  return useQuery({
    queryKey: rbacKeys.securitySchemes(),
    queryFn: () => api.getSecuritySchemes(),
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => api.createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.groups() });
    },
  });
}

export function useAddUserToGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      api.addUserToGroup(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.groups() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useRemoveUserFromGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      api.removeUserFromGroup(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.groups() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useCreateProjectRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string; isDefault?: boolean }) =>
      api.createProjectRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
    },
  });
}

export function useCreatePermissionSchemeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      api.createPermissionScheme(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissionSchemes() });
    },
  });
}

export function useAddPermissionGrantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      schemeId,
      payload,
    }: {
      schemeId: number;
      payload: {
        permission: string;
        grantType: string;
        roleId?: number;
        groupId?: number;
      };
    }) => api.addPermissionGrant(schemeId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissionScheme(vars.schemeId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissionSchemes() });
    },
  });
}

export function useRemovePermissionGrantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ schemeId, grantId }: { schemeId: number; grantId: number }) =>
      api.removePermissionGrant(schemeId, grantId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissionScheme(vars.schemeId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissionSchemes() });
    },
  });
}

export function useAddActorToProjectRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      roleId,
      payload,
    }: {
      projectId: number;
      roleId: number;
      payload: { actorType: 'USER' | 'GROUP'; userId?: number; groupId?: number };
    }) => api.addActorToProjectRole(projectId, roleId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.people(vars.projectId) });
    },
  });
}

export function useRemoveActorFromProjectRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      roleId,
      actorId,
    }: {
      projectId: number;
      roleId: number;
      actorId: number;
    }) => api.removeActorFromProjectRole(projectId, roleId, actorId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.people(vars.projectId) });
    },
  });
}

export function useAssignPermissionSchemeToProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, schemeId }: { projectId: number; schemeId: number }) =>
      api.assignPermissionSchemeToProject(projectId, schemeId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.projectId) });
    },
  });
}
