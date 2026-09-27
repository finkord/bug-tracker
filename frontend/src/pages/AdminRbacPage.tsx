import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  Building2,
  FileCheck2,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  GroupItem,
  ProjectRoleItem,
  PermissionSchemeItem,
  IssueSecuritySchemeItem,
  UserProfile,
} from '../api/client';
import { Badge } from '../components/ui';
import { GroupsManagerTab } from '../components/admin/rbac/GroupsManagerTab';
import { ProjectRolesTab } from '../components/admin/rbac/ProjectRolesTab';
import { PermissionSchemesTab } from '../components/admin/rbac/PermissionSchemesTab';
import { IssueSecuritySchemesTab } from '../components/admin/rbac/IssueSecuritySchemesTab';

type RbacTab = 'groups' | 'roles' | 'permissions' | 'security';

export const AdminRbacPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RbacTab>('groups');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [roles, setRoles] = useState<ProjectRoleItem[]>([]);
  const [permissionSchemes, setPermissionSchemes] = useState<PermissionSchemeItem[]>([]);
  const [securitySchemes, setSecuritySchemes] = useState<IssueSecuritySchemeItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsData, rolesData, schemesData, secData, usersData] = await Promise.all([
        api.getGroups(),
        api.getProjectRoles(),
        api.getPermissionSchemes(),
        api.getSecuritySchemes(),
        api.getUsers ? api.getUsers() : Promise.resolve({ items: [] }),
      ]);

      setGroups(groupsData);
      setRoles(rolesData);
      setPermissionSchemes(schemesData);
      setSecuritySchemes(secData);
      const userList = (usersData as any)?.items || (Array.isArray(usersData) ? usersData : []);
      setAllUsers(userList);

      setSelectedGroup((prev) => {
        if (!prev) return groupsData[0] || null;
        return groupsData.find((g) => g.id === prev.id) || groupsData[0] || null;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGroup = async (name: string, description?: string) => {
    try {
      const created = await api.createGroup({ name, description });
      setSuccessMsg(`Group "${created.name}" created successfully.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    }
  };

  const handleAddUserToGroup = async (groupId: number, userId: number) => {
    try {
      await api.addUserToGroup(groupId, userId);
      setSuccessMsg('User added to group.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add user to group');
    }
  };

  const handleRemoveUserFromGroup = async (groupId: number, userId: number) => {
    try {
      await api.removeUserFromGroup(groupId, userId);
      setSuccessMsg('User removed from group.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
              Access Control & Permissions (RBAC)
            </h1>
          </div>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-3xl leading-relaxed">
            Manage directory groups, project roles, reusable permission schemes, and row-level issue security levels.
          </p>
        </div>

        {/* Action badge */}
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[var(--md-sys-color-primary)]" />}
          <Badge variant="neutral" size="md">
            <Users className="w-3.5 h-3.5 mr-1 text-[var(--md-sys-color-primary)]" />
            {groups.length} Directory Groups
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-[var(--md-sys-color-outline-variant)]/30 gap-8">
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-colors relative cursor-pointer ${
            activeTab === 'groups'
              ? 'text-[var(--md-sys-color-primary)]'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Global Groups ({groups.length})</span>
          {activeTab === 'groups' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--md-sys-color-primary)] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-colors relative cursor-pointer ${
            activeTab === 'roles'
              ? 'text-[var(--md-sys-color-primary)]'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Project Roles ({roles.length})</span>
          {activeTab === 'roles' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--md-sys-color-primary)] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-colors relative cursor-pointer ${
            activeTab === 'permissions'
              ? 'text-[var(--md-sys-color-primary)]'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Permission Schemes ({permissionSchemes.length})</span>
          {activeTab === 'permissions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--md-sys-color-primary)] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-colors relative cursor-pointer ${
            activeTab === 'security'
              ? 'text-[var(--md-sys-color-primary)]'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Issue Security Schemes ({securitySchemes.length})</span>
          {activeTab === 'security' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--md-sys-color-primary)] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'groups' && (
        <GroupsManagerTab
          groups={groups}
          allUsers={allUsers}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          onCreateGroup={handleCreateGroup}
          onAddUserToGroup={handleAddUserToGroup}
          onRemoveUserFromGroup={handleRemoveUserFromGroup}
        />
      )}

      {activeTab === 'roles' && <ProjectRolesTab roles={roles} />}

      {activeTab === 'permissions' && (
        <PermissionSchemesTab permissionSchemes={permissionSchemes} />
      )}

      {activeTab === 'security' && (
        <IssueSecuritySchemesTab securitySchemes={securitySchemes} />
      )}
    </div>
  );
};
