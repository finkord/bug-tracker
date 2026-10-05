import React, { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { UserProfile, ProjectComponentItem } from '../../api/client';
import {
  useProjectComponentsQuery,
  useCreateProjectComponentMutation,
  useDeleteProjectComponentMutation,
} from '../../api/queries';
import { Button, Input, Modal, ConfirmDialog, UserPicker, DataTable } from '../ui';
import { Avatar } from '../common/Avatar';
import {
  Plus,
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
  const deleteMutation = useDeleteProjectComponentMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<{ id: number; name: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Component name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          leadId: leadId ? Number(leadId) : undefined,
        },
        payload: {
          name: name.trim(),
          description: description.trim() || undefined,
          leadId: leadId ? Number(leadId) : undefined,
        },
      });

      setName('');
      setDescription('');
      setLeadId('');
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create component');
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
        <span className="text-[var(--md-sys-color-on-surface-variant)]">
          {row.original.description || <span className="italic opacity-60">No description</span>}
        </span>
      ),
    },
    {
      id: 'lead',
      header: 'Component Lead',
      cell: ({ row }) =>
        row.original.lead ? (
          <div className="flex items-center gap-1.5">
            <Avatar
              name={row.original.lead.fullName || 'Lead'}
              avatarUrl={row.original.lead.avatarUrl}
              size="xs"
            />
            <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
              {row.original.lead.fullName}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/70 italic">
            Unassigned
          </span>
        ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleDelete(row.original.id, row.original.name)}
            className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition cursor-pointer"
            title="Delete component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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
          onClick={() => setModalOpen(true)}
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

      {/* Add Component Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Project Component"
        description="Define a new subsystem module for issue categorization."
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
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
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose or technical domain of this component..."
              rows={2}
              className="w-full p-2.5 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40"
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
              {loading ? 'Creating...' : 'Create Component'}
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
