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
import {
  Card,
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  UserPicker,
  Modal,
} from '../ui';
import { UserIdentity } from '../common/UserIdentity';
import {
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileCheck2,
  Users,
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

  // Assign member modal state
  const [assignModalRole, setAssignModalRole] = useState<{ id: number; name: string } | null>(null);
  const [actorType, setActorType] = useState<'USER' | 'GROUP'>('USER');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleOpenAssignModal = (roleId: number, roleName: string) => {
    setAssignModalRole({ id: roleId, name: roleName });
    setActorType('USER');
    setSelectedUserId('');
    setSelectedGroupId('');
    setError(null);
  };

  const handleAddActor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalRole) return;
    if (actorType === 'USER' && !selectedUserId) {
      setError('Please choose an engineer to assign');
      return;
    }
    if (actorType === 'GROUP' && !selectedGroupId) {
      setError('Please choose a directory group to assign');
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      await addActorMutation.mutateAsync({
        projectId,
        roleId: assignModalRole.id,
        payload: {
          actorType,
          userId: actorType === 'USER' ? Number(selectedUserId) : undefined,
          groupId: actorType === 'GROUP' ? Number(selectedGroupId) : undefined,
        },
      });

      setSuccessMsg(`Assigned to ${assignModalRole.name} successfully.`);
      setAssignModalRole(null);
      setSelectedUserId('');
      setSelectedGroupId('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign actor to role');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveActor = async (roleId: number, actorId: number) => {
    try {
      await removeActorMutation.mutateAsync({ projectId, roleId, actorId });
      setSuccessMsg('Member assignment removed.');
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
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-success-container,rgba(16,185,129,0.15))] text-[var(--md-sys-color-on-success-container,rgb(16,185,129))] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success,rgb(16,185,129))]" />
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

      {/* Permission Scheme Selector Banner */}
      <Card
        variant="outlined"
        padding="md"
        rounded="2xl"
        className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
              Active Permission Scheme
            </h3>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Enforces authorization rules (Browse Project, Create Issue, Edit, Transition) across project roles.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-72 shrink-0">
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
      </Card>

      {/* Project Roles & Members Cards */}
      <div className="space-y-4">
        {peopleLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          people.map((roleGroup) => (
            <Card
              key={roleGroup.roleId}
              variant="outlined"
              padding="lg"
              rounded="2xl"
              className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-4 shadow-xs"
            >
              {/* Role Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
                        {roleGroup.roleName}
                      </h3>
                      <Badge variant="neutral" size="sm">
                        {roleGroup.users.length} Users, {roleGroup.groups.length} Groups
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      {roleGroup.description}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleOpenAssignModal(roleGroup.roleId, roleGroup.roleName)}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Assign Member
                </Button>
              </div>

              {/* Members Content */}
              <div className="space-y-3">
                {/* Directory Groups */}
                {roleGroup.groups.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      Directory Groups
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {roleGroup.groups.map((ga) => (
                        <div
                          key={ga.actorId}
                          className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30 flex items-center gap-2 text-xs"
                        >
                          <Shield className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                          <span className="font-bold text-[var(--md-sys-color-on-surface)]">
                            {ga.group.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRemoveActor(roleGroup.roleId, ga.actorId)}
                            className="p-1 h-auto text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)]"
                            title="Remove group assignment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Engineers */}
                {roleGroup.users.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      Individual Engineers
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {roleGroup.users.map((ua) => (
                        <div
                          key={ua.actorId}
                          className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <UserIdentity
                              userId={ua.user?.id || ua.actorId}
                              user={ua.user}
                              name={ua.user?.fullName || `User #${ua.actorId}`}
                              avatarUrl={ua.user?.avatarUrl}
                              email={ua.user?.email}
                              size="xs"
                              showName
                              showEmail
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRemoveActor(roleGroup.roleId, ua.actorId)}
                            className="p-1 h-auto text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 shrink-0"
                            title="Remove user assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {roleGroup.users.length === 0 && roleGroup.groups.length === 0 && (
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                    No members assigned to this role yet. Click "Assign Member" above to add engineers or groups.
                  </p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Assign Member Modal */}
      <Modal
        isOpen={Boolean(assignModalRole)}
        onClose={() => setAssignModalRole(null)}
        title={`Assign Member to ${assignModalRole?.name || 'Role'}`}
        description="Select an individual engineer or a directory group to grant this project role."
        size="md"
      >
        <form onSubmit={handleAddActor} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actor Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1.5">
              Assignment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={actorType === 'USER' ? 'primary' : 'outlined'}
                size="sm"
                onClick={() => setActorType('USER')}
                leftIcon={<Users className="w-3.5 h-3.5" />}
                className="justify-center"
              >
                Individual Engineer
              </Button>
              <Button
                type="button"
                variant={actorType === 'GROUP' ? 'primary' : 'outlined'}
                size="sm"
                onClick={() => setActorType('GROUP')}
                leftIcon={<Shield className="w-3.5 h-3.5" />}
                className="justify-center"
              >
                Directory Group
              </Button>
            </div>
          </div>

          {/* Selector */}
          {actorType === 'USER' ? (
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
                Select Engineer <span className="text-[var(--md-sys-color-error)]">*</span>
              </label>
              <UserPicker
                users={allUsers}
                value={selectedUserId ? Number(selectedUserId) : null}
                onChange={(userId) => setSelectedUserId(userId ?? '')}
                placeholder="Choose engineer..."
                showAssignToMe
                className="w-full"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
                Select Directory Group <span className="text-[var(--md-sys-color-error)]">*</span>
              </label>
              <Select
                value={selectedGroupId ? String(selectedGroupId) : ''}
                onValueChange={(val) => setSelectedGroupId(val ? Number(val) : '')}
              >
                <SelectTrigger size="sm" className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                  <SelectValue placeholder="Choose directory group..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {allGroups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      <span>{g.name} ({g.description || 'Group'})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAssignModalRole(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isAssigning}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              {isAssigning ? 'Assigning...' : 'Assign to Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
