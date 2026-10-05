import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client.js';
import { projectKeys } from './useProjectsQuery.js';
import { userKeys } from './useUsersQuery.js';

export const rbacQueries = {
  all: ['rbac'] as const,
  groups: () =>
    queryOptions({
      queryKey: [...rbacQueries.all, 'groups'] as const,
      queryFn: () => api.getGroups(),
    }),
  roles: () =>
    queryOptions({
      queryKey: [...rbacQueries.all, 'roles'] as const,
      queryFn: () => api.getProjectRoles(),
    }),
  permissionSchemes: () =>
    queryOptions({
      queryKey: [...rbacQueries.all, 'permission-schemes'] as const,
      queryFn: () => api.getPermissionSchemes(),
    }),
  permissionScheme: (id: number) =>
    queryOptions({
      queryKey: [...rbacQueries.permissionSchemes().queryKey, id] as const,
      queryFn: () => api.getPermissionScheme(id),
      enabled: typeof id === 'number' && !isNaN(id),
    }),
  securitySchemes: () =>
    queryOptions({
      queryKey: [...rbacQueries.all, 'security-schemes'] as const,
      queryFn: () => api.getSecuritySchemes(),
    }),
};

// Aliased for full backwards compatibility
export const rbacKeys = {
  all: rbacQueries.all,
  groups: () => rbacQueries.groups().queryKey,
  roles: () => rbacQueries.roles().queryKey,
  permissionSchemes: () => rbacQueries.permissionSchemes().queryKey,
  permissionScheme: (id: number) => rbacQueries.permissionScheme(id).queryKey,
  securitySchemes: () => rbacQueries.securitySchemes().queryKey,
};

export function useGroupsQuery() {
  return useQuery(rbacQueries.groups());
}

export function useProjectRolesQuery() {
  return useQuery(rbacQueries.roles());
}

export function usePermissionSchemesQuery() {
  return useQuery(rbacQueries.permissionSchemes());
}

export function usePermissionSchemeQuery(id?: number) {
  return useQuery(rbacQueries.permissionScheme(id!));
}

export function useSecuritySchemesQuery() {
  return useQuery(rbacQueries.securitySchemes());
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => api.createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueries.groups().queryKey });
    },
  });
}

export function useAddUserToGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      api.addUserToGroup(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueries.groups().queryKey });
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
      queryClient.invalidateQueries({ queryKey: rbacQueries.groups().queryKey });
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
      queryClient.invalidateQueries({ queryKey: rbacQueries.roles().queryKey });
    },
  });
}

export function useCreatePermissionSchemeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      api.createPermissionScheme(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueries.permissionSchemes().queryKey });
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
      queryClient.invalidateQueries({ queryKey: rbacQueries.permissionScheme(vars.schemeId).queryKey });
      queryClient.invalidateQueries({ queryKey: rbacQueries.permissionSchemes().queryKey });
    },
  });
}

export function useRemovePermissionGrantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ schemeId, grantId }: { schemeId: number; grantId: number }) =>
      api.removePermissionGrant(schemeId, grantId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: rbacQueries.permissionScheme(vars.schemeId).queryKey });
      queryClient.invalidateQueries({ queryKey: rbacQueries.permissionSchemes().queryKey });
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
