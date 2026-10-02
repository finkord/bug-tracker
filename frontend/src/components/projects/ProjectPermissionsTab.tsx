import React, { useState } from 'react';
import type { ProjectItem, UserProfile } from '../../api/client';
import {
  useProjectPeopleQuery,
  useGroupsQuery,
  usePermissionSchemesQuery,
  useAddActorToProjectRoleMutation,
  useRemoveActorFromProjectRoleMutation,
  useAssignPermissionSchemeToProjectMutation,
} from '../../api/queries';
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui';
import { Avatar } from '../common/Avatar';
import {
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileCheck2,
} from 'lucide-react';

interface ProjectPermissionsTabProps {
  projectId: number;
  project: ProjectItem;
  allUsers: UserProfile[];
}

export const ProjectPermissionsTab: React.FC<ProjectPermissionsTabProps> = ({
  projectId,
  project,
  allUsers,
}) => {
  const { data: people = [], isLoading: peopleLoading } = useProjectPeopleQuery(projectId);
  const { data: allGroups = [] } = useGroupsQuery();
  const { data: permissionSchemes = [] } = usePermissionSchemesQuery();

  const addActorMutation = useAddActorToProjectRoleMutation();
  const removeActorMutation = useRemoveActorFromProjectRoleMutation();
  const assignSchemeMutation = useAssignPermissionSchemeToProjectMutation();

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
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign actor to role');
    }
  };

  const handleRemoveActor = async (roleId: number, actorId: number) => {
    try {
      await removeActorMutation.mutateAsync({ projectId, roleId, actorId });
      setSuccessMsg('Member removed from role.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleSchemeChange = async (schemeId: number) => {
    try {
      await assignSchemeMutation.mutateAsync({ projectId, schemeId });
      setSuccessMsg('Project permission scheme updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update permission scheme');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
          People, Roles & Permission Scheme
        </h2>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          Map engineers and directory groups to project roles (Administrators, Developers, Viewers) and select authorization policies.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between">
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
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-success-container,rgba(16,185,129,0.15))] text-[var(--md-sys-color-on-success-container,rgb(16,185,129))] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success,rgb(16,185,129))]" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Permission Scheme Selector Banner */}
      <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center shrink-0">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
              Active Permission Scheme
            </h3>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Controls operations (Browse, Create, Edit, Log Work, Transition) for this project.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={project.permissionSchemeId ? String(project.permissionSchemeId) : ''}
            onValueChange={(val) => val && handleSchemeChange(Number(val))}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
              <SelectValue placeholder="Select permission scheme..." />
            </SelectTrigger>
            <SelectContent>
              {permissionSchemes.map((scheme) => (
                <SelectItem key={scheme.id} value={String(scheme.id)}>
                  {scheme.name} {scheme.isDefault ? '(Default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Roles & Members Table */}
      <div className="space-y-4">
        {peopleLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          people.map((roleGroup) => (
            <div
              key={roleGroup.roleId}
              className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-3">
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
                  size="xs"
                  onClick={() => setSelectedRoleId(selectedRoleId === roleGroup.roleId ? null : roleGroup.roleId)}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Assign Member
                </Button>
              </div>

              {/* Add Member Form for this role */}
              {selectedRoleId === roleGroup.roleId && (
                <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3">
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
                      <div className="w-56 sm:w-64">
                        <Select
                          value={selectedUserId ? String(selectedUserId) : ''}
                          onValueChange={(val) => setSelectedUserId(val ? Number(val) : '')}
                        >
                          <SelectTrigger size="sm" className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                            <SelectValue placeholder="Select engineer..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {allUsers.map((u) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                <span className="truncate">{u.fullName} ({u.email})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="w-56 sm:w-64">
                        <Select
                          value={selectedGroupId ? String(selectedGroupId) : ''}
                          onValueChange={(val) => setSelectedGroupId(val ? Number(val) : '')}
                        >
                          <SelectTrigger size="sm" className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                            <SelectValue placeholder="Select directory group..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {allGroups.map((g) => (
                              <SelectItem key={g.id} value={String(g.id)}>
                                <span className="truncate">{g.name} ({g.description || 'Group'})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleAddActor(roleGroup.roleId)}
                    >
                      Save Assignment
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
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
                              name={ua.user?.fullName || 'User'}
                              avatarUrl={ua.user?.avatarUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                                {ua.user?.fullName || 'Assigned User'}
                              </p>
                              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                                {ua.user?.email || ''}
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
          ))
        )}
      </div>
    </div>
  );
};
