import React, { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { UserProfile, ProjectComponentItem } from '../../api/client';
import {
  useProjectComponentsQuery,
  useCreateProjectComponentMutation,
  useUpdateProjectComponentMutation,
  useDeleteProjectComponentMutation,
} from '../../api/queries';
import { Button, Input, Textarea, Modal, ConfirmDialog, UserPicker, DataTable } from '../ui';
import { UserIdentity } from '../common/UserIdentity';
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  FolderTree,
} from 'lucide-react';

interface ProjectComponentsTabProps {
  projectId: number;
  allUsers: UserProfile[];
}

export const ProjectComponentsTab: React.FC<ProjectComponentsTabProps> = ({
  projectId,
  allUsers,
}) => {
  const { data: components = [], isLoading } = useProjectComponentsQuery(projectId);
  const createMutation = useCreateProjectComponentMutation();
  const updateMutation = useUpdateProjectComponentMutation();
  const deleteMutation = useDeleteProjectComponentMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ProjectComponentItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<{ id: number; name: string } | null>(null);

  const handleOpenCreate = () => {
    setEditingComponent(null);
    setName('');
    setDescription('');
    setLeadId('');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (comp: ProjectComponentItem) => {
    setEditingComponent(comp);
    setName(comp.name);
    setDescription(comp.description || '');
    setLeadId(comp.leadId ?? '');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Component name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingComponent) {
        await updateMutation.mutateAsync({
          projectId,
          componentId: editingComponent.id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            leadId: leadId ? Number(leadId) : null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          projectId,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            leadId: leadId ? Number(leadId) : undefined,
          },
        });
      }

      setModalOpen(false);
      setEditingComponent(null);
      setName('');
      setDescription('');
      setLeadId('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save component');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (componentId: number, compName: string) => {
    setComponentToDelete({ id: componentId, name: compName });
  };

  const confirmDelete = async () => {
    if (!componentToDelete) return;
    try {
      await deleteMutation.mutateAsync({ projectId, componentId: componentToDelete.id });
      setComponentToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete component');
    }
  };

  const columns = useMemo<ColumnDef<ProjectComponentItem>[]>(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      id: 'description',
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-[var(--md-sys-color-on-surface-variant)] text-xs">
          {row.original.description || <span className="italic opacity-60">No description</span>}
        </span>
      ),
    },
    {
      id: 'lead',
      header: 'Component Lead',
      cell: ({ row }) =>
        row.original.lead ? (
          <UserIdentity
            userId={row.original.lead.id}
            user={row.original.lead}
            name={row.original.lead.fullName || 'Lead'}
            avatarUrl={row.original.lead.avatarUrl}
            email={row.original.lead.email}
            size="xs"
            showName
          />
        ) : (
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/70 italic">
            Unassigned
          </span>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-start gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
            title="Edit component"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => handleDelete(row.original.id, row.original.name)}
            className="p-1.5 text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30"
            title="Delete component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div>
          <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
            Project Components
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Subsections and modules used to categorize issues, features, and bug reports (e.g. Backend, UI, Auth).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Add Component
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={components}
        getRowId={(comp) => String(comp.id)}
        isLoading={isLoading}
        loadingMessage="Loading components..."
        emptyTitle="No components configured"
        emptyDescription="Create components to group issues by architectural subsystem or area of responsibility."
      />

      {/* Add / Edit Component Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingComponent ? 'Edit Project Component' : 'Add Project Component'}
        description={
          editingComponent
            ? `Update subsystem details and component lead for "${editingComponent.name}".`
            : 'Define a new subsystem module for issue categorization.'
        }
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Component Name <span className="text-[var(--md-sys-color-error)]">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Authentication, Billing, Search Engine"
              required
              className="text-xs font-semibold"
            />
          </div>

          <div>
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose or technical domain of this component..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Component Lead
            </label>
            <UserPicker
              value={leadId ? Number(leadId) : null}
              onChange={(userId) => setLeadId(userId ?? '')}
              users={allUsers}
              placeholder="None / Unassigned"
              showAssignToMe
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? 'Saving...' : editingComponent ? 'Save Changes' : 'Create Component'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!componentToDelete}
        onClose={() => setComponentToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Component"
        description={`Are you sure you want to delete component "${componentToDelete?.name}"? Issues linked to this component will have component unassigned.`}
        confirmLabel="Delete Component"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
