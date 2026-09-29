import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building2,
  FileCheck2,
} from 'lucide-react';
import {
  useProjectDetailQuery,
  useProjectPeopleQuery,
  useUsersQuery,
  useGroupsQuery,
  usePermissionSchemesQuery,
  useMyProjectPermissionsQuery,
  useAddActorToProjectRoleMutation,
  useRemoveActorFromProjectRoleMutation,
  useAssignPermissionSchemeToProjectMutation,
} from '../api/queries';
import { Avatar } from '../components/common/Avatar';
import { Badge, Button } from '../components/ui';

export const ProjectSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : 0;

  // TanStack Query Hooks for project server state
  const { data: project = null, isLoading: projectLoading } = useProjectDetailQuery(projectId);
  const { data: people = [], isLoading: peopleLoading } = useProjectPeopleQuery(projectId);
  const { data: usersData, isLoading: usersLoading } = useUsersQuery({ page: 1, limit: 100 });
  const allUsers = usersData?.items || [];
  const { data: allGroups = [], isLoading: groupsLoading } = useGroupsQuery();
  const { data: permissionSchemes = [], isLoading: schemesLoading } = usePermissionSchemesQuery();
  const { data: myPermissions = {}, isLoading: permsLoading } = useMyProjectPermissionsQuery(projectId);

  const addActorMutation = useAddActorToProjectRoleMutation();
  const removeActorMutation = useRemoveActorFromProjectRoleMutation();
  const assignSchemeMutation = useAssignPermissionSchemeToProjectMutation();

  const loading = projectLoading || peopleLoading || usersLoading || groupsLoading || schemesLoading || permsLoading;

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add actor modal/form state
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [actorType, setActorType] = useState<'USER' | 'GROUP'>('USER');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');

  const handleAddActor = async (roleId: number) => {
    if (actorType === 'USER' && !selectedUserId) return;
    if (actorType === 'GROUP' && !selectedGroupId) return;

    try {
      await addActorMutation.mutateAsync({
        projectId,
        roleId,
        payload: {
          actorType,
          userId: actorType === 'USER' ? Number(selectedUserId) : undefined,
          groupId: actorType === 'GROUP' ? Number(selectedGroupId) : undefined,
        },
      });

      setSuccessMsg('Member assigned to role successfully.');
      setSelectedRoleId(null);
      setSelectedUserId('');
      setSelectedGroupId('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign actor to role');
    }
  };

  const handleRemoveActor = async (roleId: number, actorId: number) => {
    try {
      await removeActorMutation.mutateAsync({ projectId, roleId, actorId });
      setSuccessMsg('Member removed from role.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleSchemeChange = async (schemeId: number) => {
    try {
      await assignSchemeMutation.mutateAsync({ projectId, schemeId });
      setSuccessMsg('Project permission scheme updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update permission scheme');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
        Loading project access settings...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-[var(--md-sys-color-error)]">
        Project not found.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Back button & Header */}
      <div className="space-y-3 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-6">
        <Link
          to={`/projects/${projectId}/board`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Kanban Board</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center font-black text-base shadow-xs">
              {project.key}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                {project.name} — People & Permissions
              </h1>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Manage project role memberships, assign engineers, and configure permission schemes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="md">
              <Shield className="w-3.5 h-3.5 mr-1" />
              {Object.values(myPermissions).filter(Boolean).length} Active Permissions
            </Badge>
            <Badge variant="primary" size="md">
              Lead: {project.lead?.fullName || `User #${project.leadId}`}
            </Badge>
          </div>
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

      {/* Permission Scheme Selector Banner */}
      <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
              Active Permission Scheme
            </h2>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Controls granular operations (Browse, Create, Edit, Log Work, Transition) for this project.
            </p>
          </div>
        </div>

        <select
          value={project.permissionSchemeId || ''}
          onChange={(e) => handleSchemeChange(Number(e.target.value))}
          className="px-3.5 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] font-medium focus:outline-hidden cursor-pointer"
        >
          {permissionSchemes.map((scheme) => (
            <option key={scheme.id} value={scheme.id}>
              {scheme.name} {scheme.isDefault ? '(Default)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Project Roles & Members Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Project Roles & Members
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Assign engineers and directory groups to specific project roles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {people.map((roleGroup) => (
            <div
              key={roleGroup.roleId}
              className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
                        {roleGroup.roleName}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] font-mono font-bold">
                        {roleGroup.users.length} Users, {roleGroup.groups.length} Groups
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      {roleGroup.description}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRoleId(selectedRoleId === roleGroup.roleId ? null : roleGroup.roleId)}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Assign Member
                </Button>
              </div>

              {/* Add Member Form for this role */}
              {selectedRoleId === roleGroup.roleId && (
                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3 animate-in fade-in">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    Assign User or Group to <span className="text-[var(--md-sys-color-primary)]">{roleGroup.roleName}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30 text-xs">
                      <button
                        type="button"
                        onClick={() => setActorType('USER')}
                        className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          actorType === 'USER'
                            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                            : 'text-[var(--md-sys-color-on-surface-variant)]'
                        }`}
                      >
                        Individual Engineer
                      </button>
                      <button
                        type="button"
                        onClick={() => setActorType('GROUP')}
                        className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          actorType === 'GROUP'
                            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                            : 'text-[var(--md-sys-color-on-surface-variant)]'
                        }`}
                      >
                        Directory Group
                      </button>
                    </div>

                    {actorType === 'USER' ? (
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                        className="px-3 py-1.5 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] focus:outline-hidden cursor-pointer"
                      >
                        <option value="">Select engineer...</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : '')}
                        className="px-3 py-1.5 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] focus:outline-hidden cursor-pointer"
                      >
                        <option value="">Select directory group...</option>
                        {allGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.description || 'Group'})
                          </option>
                        ))}
                      </select>
                    )}

                    <Button
                      variant="filled"
                      size="sm"
                      onClick={() => handleAddActor(roleGroup.roleId)}
                    >
                      Save Assignment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRoleId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Members Chips / Grid */}
              <div className="space-y-3">
                {/* Groups assigned */}
                {roleGroup.groups.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-outline)] uppercase">
                      Directory Groups
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {roleGroup.groups.map((ga) => (
                        <div
                          key={ga.actorId}
                          className="px-3 py-1.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 flex items-center gap-2 text-xs"
                        >
                          <Shield className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                          <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                            {ga.group.name}
                          </span>
                          <button
                            onClick={() => handleRemoveActor(roleGroup.roleId, ga.actorId)}
                            className="text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] cursor-pointer"
                            title="Remove group assignment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual users */}
                {roleGroup.users.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-outline)] uppercase">
                      Individual Engineers
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {roleGroup.users.map((ua) => (
                        <div
                          key={ua.actorId}
                          className="p-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              name={ua.user.fullName}
                              avatarUrl={ua.user.avatarUrl}
                              role={ua.user.systemRole}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                                {ua.user.fullName}
                              </p>
                              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                                {ua.user.email}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveActor(roleGroup.roleId, ua.actorId)}
                            className="p-1 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 rounded-xl transition-colors cursor-pointer"
                            title="Remove user assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {roleGroup.users.length === 0 && roleGroup.groups.length === 0 && (
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                    No members assigned to this role yet. Click "Assign Member" above.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
