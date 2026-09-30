import React, { useState } from 'react';
import type { ProjectRoleItem } from '../../../api/client';
import { useCreateProjectRoleMutation } from '../../../api/queries';
import { Button, Card, Badge, Modal, Input } from '../../ui';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProjectRolesTabProps {
  readonly roles: ProjectRoleItem[];
}

export const ProjectRolesTab: React.FC<ProjectRolesTabProps> = ({ roles }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const createRoleMutation = useCreateProjectRoleMutation();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMsg(null);
    try {
      await createRoleMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isDefault,
      });
      setSuccessMsg(`Project Role "${name.trim()}" created successfully.`);
      setName('');
      setDescription('');
      setIsDefault(false);
      setCreateModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create project role');
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-xs flex items-center justify-between">
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

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
            Globally Defined Project Roles
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Project Roles define functional capabilities mapped to individual users or groups within workspace projects.
          </p>
        </div>

        <Button
          variant="filled"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Project Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card
            key={role.id}
            variant="filled"
            padding="md"
            rounded="3xl"
            className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-3 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center font-bold text-xs shadow-xs">
                  {role.name[0]}
                </div>
                {role.isDefault && (
                  <Badge variant="primary" size="sm">
                    DEFAULT ROLE
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
                  {role.name}
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
                  {role.description || 'Standard project role definition.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              <span>Role ID #{role.id}</span>
              <span className="font-mono text-[10px] text-[var(--md-sys-color-outline)]">
                {role.isDefault ? 'Auto-assigned' : 'Assigned per project'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Project Role Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Project Role"
          description="Define a new role available for assignment in all project workspaces"
          size="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Role Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Quality Assurance Lead"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Responsibilities, scope, and duties of this role..."
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--md-sys-color-on-surface)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] w-4 h-4"
                />
                Mark as default project role for new workspaces
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={createRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={createRoleMutation.isPending || !name.trim()}
                isLoading={createRoleMutation.isPending}
              >
                Create Role
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
