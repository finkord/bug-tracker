import React, { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ProjectRoleItem } from '../../../api/client';
import {
  useCreateProjectRoleMutation,
  useUpdateProjectRoleMutation,
  useDeleteProjectRoleMutation,
} from '../../../api/queries';
import {
  Button,
  Badge,
  Modal,
  Input,
  Textarea,
  ConfirmDialog,
  DataTable,
  SearchInput,
} from '../../ui';
import { Plus, CheckCircle2, AlertCircle, Edit2, Trash2 } from 'lucide-react';

interface ProjectRolesTabProps {
  readonly roles: ProjectRoleItem[];
}

export const ProjectRolesTab: React.FC<ProjectRolesTabProps> = ({ roles }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Edit role state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<ProjectRoleItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);

  // Delete role state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<ProjectRoleItem | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const createRoleMutation = useCreateProjectRoleMutation();
  const updateRoleMutation = useUpdateProjectRoleMutation();
  const deleteRoleMutation = useDeleteProjectRoleMutation();

  const isBaselineRole = (roleName: string) =>
    ['administrator', 'member', 'viewer'].includes(roleName.toLowerCase().trim());

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

  const handleOpenEditRole = (role: ProjectRoleItem) => {
    setRoleToEdit(role);
    setEditName(role.name);
    setEditDescription(role.description || '');
    setEditIsDefault(Boolean(role.isDefault));
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleToEdit || !editName.trim()) return;

    setErrorMsg(null);
    try {
      await updateRoleMutation.mutateAsync({
        roleId: roleToEdit.id,
        payload: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          isDefault: editIsDefault,
        },
      });
      setSuccessMsg(`Project Role "${editName.trim()}" updated successfully.`);
      setEditModalOpen(false);
      setRoleToEdit(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update project role');
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setErrorMsg(null);
    try {
      await deleteRoleMutation.mutateAsync(roleToDelete.id);
      setSuccessMsg(`Project Role "${roleToDelete.name}" deleted successfully.`);
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete project role');
    }
  };

  const filteredRoles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term)),
    );
  }, [roles, searchTerm]);

  const columns = useMemo<ColumnDef<ProjectRoleItem>[]>(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Role Identity',
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
              {role.name}
            </span>
            {role.isDefault && (
              <Badge variant="primary" size="sm" className="text-[9px] px-1.5 py-0">
                DEFAULT
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'description',
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const desc = row.original.description;
        return (
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">
            {desc || 'Standard project role definition.'}
          </span>
        );
      },
    },
    {
      id: 'scope',
      header: 'Scope',
      cell: ({ row }) => {
        const isBaseline = isBaselineRole(row.original.name);
        return (
          <Badge variant={isBaseline ? 'neutral' : 'secondary'} size="sm">
            {isBaseline ? 'System Baseline' : 'Custom Role'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const role = row.original;
        const isBaseline = isBaselineRole(role.name);
        return (
          <div className="flex items-center justify-start gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditRole(role)}
              className="h-7 px-2 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
              title="Edit Role"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
            {!isBaseline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRoleToDelete(role);
                  setDeleteConfirmOpen(true);
                }}
                className="h-7 w-7 p-0 text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]"
                title="Delete Role"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], []);

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

      {/* Filter toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Filter roles by name or description..."
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
          />
        </div>
      </div>

      {/* Unified Project Roles Table */}
      <DataTable
        columns={columns}
        data={filteredRoles}
        getRowId={(r) => String(r.id)}
        emptyTitle="No project roles found"
        emptyDescription="No roles match your search filter."
      />

      {/* Create Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Project Role"
          description="Define a new reusable role across workspace projects"
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
                placeholder="e.g. Security Auditor, Tech Lead"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe duties, responsibilities, and permissions for this role..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefaultRole"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
              />
              <label
                htmlFor="isDefaultRole"
                className="text-xs text-[var(--md-sys-color-on-surface)] cursor-pointer select-none"
              >
                Mark as default role assigned during project initialization
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

      {/* Edit Modal */}
      {editModalOpen && roleToEdit && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Role: ${roleToEdit.name}`}
          description="Update role title, permissions description, or default assignment"
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Role Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Role Name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Description
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description of role privileges..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsDefaultRole"
                checked={editIsDefault}
                onChange={(e) => setEditIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
              />
              <label
                htmlFor="editIsDefaultRole"
                className="text-xs text-[var(--md-sys-color-on-surface)] cursor-pointer select-none"
              >
                Mark as default role assigned during project initialization
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                disabled={updateRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={updateRoleMutation.isPending || !editName.trim()}
                isLoading={updateRoleMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && roleToDelete && (
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteRole}
          title={`Delete Project Role "${roleToDelete.name}"?`}
          description="Are you sure you want to permanently delete this project role? Users currently assigned to this role in projects may lose associated permissions."
          confirmLabel="Delete Role"
          cancelLabel="Keep Role"
          variant="danger"
          isLoading={deleteRoleMutation.isPending}
        />
      )}
    </div>
  );
};
