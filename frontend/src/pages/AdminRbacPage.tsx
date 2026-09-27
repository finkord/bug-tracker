import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  KeyRound,
  FileCheck2,
  Lock,
  Plus,
  Search,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  GroupItem,
  ProjectRoleItem,
  PermissionSchemeItem,
  IssueSecuritySchemeItem,
  UserProfile,
} from '../api/client';
import { Avatar } from '../components/common/Avatar';
import { Badge, Button } from '../components/ui';

type RbacTab = 'groups' | 'roles' | 'permissions' | 'security';

export const AdminRbacPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RbacTab>('groups');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [roles, setRoles] = useState<ProjectRoleItem[]>([]);
  const [permissionSchemes, setPermissionSchemes] = useState<PermissionSchemeItem[]>([]);
  const [securitySchemes, setSecuritySchemes] = useState<IssueSecuritySchemeItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Search & Filter
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<number | ''>('');

  const loadData = async () => {
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

      if (groupsData.length > 0 && !selectedGroup) {
        setSelectedGroup(groupsData[0]);
      } else if (selectedGroup) {
        const updated = groupsData.find((g) => g.id === selectedGroup.id);
        setSelectedGroup(updated || groupsData[0] || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const created = await api.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || undefined,
      });
      setSuccessMsg(`Group "${created.name}" created successfully.`);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateGroup(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    }
  };

  const handleAddUserToGroup = async () => {
    if (!selectedGroup || !selectedUserIdToAdd) return;
    try {
      await api.addUserToGroup(selectedGroup.id, Number(selectedUserIdToAdd));
      setSuccessMsg('User added to group.');
      setSelectedUserIdToAdd('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add user to group');
    }
  };

  const handleRemoveUserFromGroup = async (userId: number) => {
    if (!selectedGroup) return;
    try {
      await api.removeUserFromGroup(selectedGroup.id, userId);
      setSuccessMsg('User removed from group.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(groupSearch.toLowerCase())),
  );

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
          <button onClick={() => setError(null)} className="text-xs font-bold hover:underline">
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
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-[var(--md-sys-color-outline-variant)]/30 gap-8">
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-colors relative ${
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
          className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-colors relative ${
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
          className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-colors relative ${
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
          className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-colors relative ${
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

      {/* TAB 1: GLOBAL GROUPS */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Group List Sidebar */}
          <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Directory Groups
              </h2>
              <Button
                variant="filled"
                size="sm"
                onClick={() => setShowCreateGroup(!showCreateGroup)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                New Group
              </Button>
            </div>

            {/* Create Group Form */}
            {showCreateGroup && (
              <form onSubmit={handleCreateGroup} className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3 animate-in fade-in">
                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Create Global Group</p>
                <input
                  type="text"
                  required
                  placeholder="Group Name (e.g. backend-engineers)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="filled" size="sm">
                    Create
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateGroup(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--md-sys-color-outline)]" />
              <input
                type="text"
                placeholder="Search groups..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filteredGroups.map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp)}
                  className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                    selectedGroup?.id === grp.id
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs font-semibold'
                      : 'hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate">{grp.name}</span>
                      {grp.isSystem && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)] font-bold">
                          SYSTEM
                        </span>
                      )}
                    </div>
                    {grp.description && (
                      <p className="text-[10px] opacity-75 truncate mt-0.5">{grp.description}</p>
                    )}
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] font-mono font-bold shrink-0">
                    {grp.userGroups?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Group Details & Members List */}
          <div className="lg:col-span-2 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-6 shadow-xs">
            {selectedGroup ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-[var(--md-sys-color-on-surface)]">
                        {selectedGroup.name}
                      </h2>
                      {selectedGroup.isSystem && (
                        <Badge variant="primary" size="sm">System Group</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                      {selectedGroup.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Add user to group */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedUserIdToAdd}
                      onChange={(e) => setSelectedUserIdToAdd(e.target.value ? Number(e.target.value) : '')}
                      className="px-3 py-1.5 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                    >
                      <option value="">Select engineer to add...</option>
                      {allUsers
                        .filter((u) => !selectedGroup.userGroups?.some((ug) => ug.userId === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.email})
                          </option>
                        ))}
                    </select>
                    <Button
                      variant="filled"
                      size="sm"
                      onClick={handleAddUserToGroup}
                      disabled={!selectedUserIdToAdd}
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Member Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                    Group Members ({selectedGroup.userGroups?.length || 0})
                  </h3>

                  {selectedGroup.userGroups && selectedGroup.userGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedGroup.userGroups.map((ug) => (
                        <div
                          key={ug.id}
                          className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              name={ug.user?.fullName || 'User'}
                              avatarUrl={ug.user?.avatarUrl}
                              role={ug.user?.systemRole}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                                {ug.user?.fullName || `User #${ug.userId}`}
                              </p>
                              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                                {ug.user?.email}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveUserFromGroup(ug.userId)}
                            className="p-1.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 rounded-xl transition-colors cursor-pointer"
                            title="Remove from group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      No members in this group yet. Select an engineer above to add them.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Select a group to manage its members.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROJECT ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Globally Defined Project Roles
              </h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Project Roles provide the abstraction layer between Permission Schemes and individual team members.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-2xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center font-bold text-xs">
                    {role.name[0]}
                  </div>
                  {role.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)]">
                      DEFAULT ROLE
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">{role.name}</h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
                    {role.description || 'Standard project role definition.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSION SCHEMES */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {permissionSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-6 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
                      {scheme.name}
                    </h2>
                    {scheme.isDefault && (
                      <Badge variant="primary" size="sm">DEFAULT SCHEME</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                    {scheme.description}
                  </p>
                </div>
              </div>

              {/* Matrix of grants */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  Granted Operations Matrix ({scheme.grants?.length || 0} Grants)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {scheme.grants?.map((grant) => (
                    <div
                      key={grant.id}
                      className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                          {grant.permission}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)]">
                          {grant.grantType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        <KeyRound className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                        <span className="font-semibold">
                          {grant.grantType === 'ROLE'
                            ? `Project Role: ${grant.role?.name || `Role #${grant.roleId}`}`
                            : grant.grantType === 'GROUP'
                            ? `Directory Group: ${grant.group?.name || `Group #${grant.groupId}`}`
                            : grant.grantType === 'LEAD'
                            ? 'Project Lead (Dynamic)'
                            : grant.grantType === 'REPORTER'
                            ? 'Issue Reporter (Dynamic)'
                            : grant.grantType === 'ASSIGNEE'
                            ? 'Issue Assignee (Dynamic)'
                            : 'All Authenticated Users'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ISSUE SECURITY SCHEMES */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {securitySchemes.map((secScheme) => (
            <div
              key={secScheme.id}
              className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-6 shadow-xs"
            >
              <div>
                <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
                  {secScheme.name}
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  {secScheme.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {secScheme.levels?.map((lvl) => (
                  <div
                    key={lvl.id}
                    className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                        <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                          {lvl.name}
                        </h3>
                      </div>
                      {secScheme.defaultLevelId === lvl.id && (
                        <Badge variant="primary" size="sm">DEFAULT LEVEL</Badge>
                      )}
                    </div>

                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                      {lvl.description}
                    </p>

                    <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/20 space-y-1.5">
                      <span className="text-[10px] font-bold text-[var(--md-sys-color-outline)] uppercase">
                        Authorized Actors
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {lvl.grants?.map((g, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-medium border border-[var(--md-sys-color-outline-variant)]/30"
                          >
                            {g.grantType === 'ROLE'
                              ? `Role: ${g.role?.name}`
                              : g.grantType === 'GROUP'
                              ? `Group: ${g.group?.name}`
                              : g.grantType}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
