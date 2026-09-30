import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Building2,
  FileCheck2,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  useGroupsQuery,
  useProjectRolesQuery,
  usePermissionSchemesQuery,
  useSecuritySchemesQuery,
  useUsersQuery,
  useCreateGroupMutation,
  useAddUserToGroupMutation,
  useRemoveUserFromGroupMutation,
} from '../../api/queries';
import type { GroupItem } from '../../api/client';
import { Tabs, TabsList, TabsTrigger } from '../ui';
import { GroupsManagerTab } from './rbac/GroupsManagerTab';
import { ProjectRolesTab } from './rbac/ProjectRolesTab';
import { PermissionSchemesTab } from './rbac/PermissionSchemesTab';
import { IssueSecuritySchemesTab } from './rbac/IssueSecuritySchemesTab';

type RbacSubTab = 'groups' | 'roles' | 'permissions' | 'security';

export const AdminRbacTab: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySubTab = searchParams.get('subtab') as RbacSubTab | null;
  const activeSubTab: RbacSubTab =
    querySubTab && ['groups', 'roles', 'permissions', 'security'].includes(querySubTab)
      ? querySubTab
      : 'groups';

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // TanStack Query Hooks for RBAC state
  const { data: groups = [], isLoading: groupsLoading } = useGroupsQuery();
  const { data: roles = [], isLoading: rolesLoading } = useProjectRolesQuery();
  const { data: permissionSchemes = [], isLoading: schemesLoading } = usePermissionSchemesQuery();
  const { data: securitySchemes = [], isLoading: securityLoading } = useSecuritySchemesQuery();
  const { data: usersData, isLoading: usersLoading } = useUsersQuery({ page: 1, limit: 100 });
  const allUsers = usersData?.items || [];

  const createGroupMutation = useCreateGroupMutation();
  const addUserToGroupMutation = useAddUserToGroupMutation();
  const removeUserFromGroupMutation = useRemoveUserFromGroupMutation();

  const loading = groupsLoading || rolesLoading || schemesLoading || securityLoading || usersLoading;

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const selectedGroup: GroupItem | null =
    groups.find((g) => g.id === selectedGroupId) || groups[0] || null;

  const handleSubTabChange = (val: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', 'rbac');
    nextParams.set('subtab', val);
    setSearchParams(nextParams);
  };

  const handleCreateGroup = async (name: string, description?: string) => {
    try {
      const created = await createGroupMutation.mutateAsync({ name, description });
      setSuccessMsg(`Group "${created.name}" created successfully.`);
      setSelectedGroupId(created.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  const handleAddUserToGroup = async (groupId: number, userId: number) => {
    try {
      await addUserToGroupMutation.mutateAsync({ groupId, userId });
      setSuccessMsg('User added to group.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add user to group');
    }
  };

  const handleRemoveUserFromGroup = async (groupId: number, userId: number) => {
    try {
      await removeUserFromGroupMutation.mutateAsync({ groupId, userId });
      setSuccessMsg('User removed from group.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Secondary Sub-Pills Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={activeSubTab} onValueChange={handleSubTabChange}>
          <TabsList
            variant="pills"
            className="bg-[var(--md-sys-color-surface-container-high)]/60 p-1 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/30 flex flex-wrap gap-1"
          >
            <TabsTrigger
              value="groups"
              variant="pills"
              size="sm"
              className="gap-2 text-xs font-bold px-3 py-1.5 rounded-xl"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directory Groups</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[10px] font-mono">
                {groups.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="roles"
              variant="pills"
              size="sm"
              className="gap-2 text-xs font-bold px-3 py-1.5 rounded-xl"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Project Roles</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[10px] font-mono">
                {roles.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="permissions"
              variant="pills"
              size="sm"
              className="gap-2 text-xs font-bold px-3 py-1.5 rounded-xl"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Permission Schemes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[10px] font-mono">
                {permissionSchemes.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="security"
              variant="pills"
              size="sm"
              className="gap-2 text-xs font-bold px-3 py-1.5 rounded-xl"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Issue Security Schemes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[10px] font-mono">
                {securitySchemes.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)] shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--md-sys-color-primary)]" />
            <span className="font-medium">Syncing RBAC state...</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Subtab Content */}
      <div className="w-full">
        {activeSubTab === 'groups' && (
          <GroupsManagerTab
            groups={groups}
            allUsers={allUsers}
            selectedGroup={selectedGroup}
            onSelectGroup={(g) => setSelectedGroupId(g?.id ?? null)}
            onCreateGroup={handleCreateGroup}
            onAddUserToGroup={handleAddUserToGroup}
            onRemoveUserFromGroup={handleRemoveUserFromGroup}
          />
        )}

        {activeSubTab === 'roles' && <ProjectRolesTab roles={roles} />}

        {activeSubTab === 'permissions' && (
          <PermissionSchemesTab permissionSchemes={permissionSchemes} />
        )}

        {activeSubTab === 'security' && (
          <IssueSecuritySchemesTab securitySchemes={securitySchemes} />
        )}
      </div>
    </div>
  );
};
