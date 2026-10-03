import React, { useState } from 'react';
import type { UserProfile } from '../../api/client';
import {
  useProjectComponentsQuery,
  useCreateProjectComponentMutation,
  useDeleteProjectComponentMutation,
} from '../../api/queries';
import { Button, Input, Modal, ConfirmDialog, UserPicker } from '../ui';
import { Avatar } from '../common/Avatar';
import {
  Layers,
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

      {/* Table / List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 animate-pulse"
            />
          ))}
        </div>
      ) : components.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]">
            <Layers className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              No components configured
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Create components to group issues by architectural subsystem or area of responsibility.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Component
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container-low)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold select-none">
                <th className="py-2.5 px-4 w-44">Name</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 w-48">Component Lead</th>
                <th className="py-2.5 px-3 w-16 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20">
              {components.map((comp) => (
                <tr key={comp.id} className="hover:bg-[var(--md-sys-color-surface-container)]/40 transition">
                  <td className="py-3 px-4 font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span>{comp.name}</span>
                  </td>
                  <td className="py-3 px-4 text-[var(--md-sys-color-on-surface-variant)]">
                    {comp.description || <span className="italic opacity-60">No description</span>}
                  </td>
                  <td className="py-3 px-4">
                    {comp.lead ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          name={comp.lead.fullName || 'Lead'}
                          avatarUrl={comp.lead.avatarUrl}
                          size="xs"
                        />
                        <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                          {comp.lead.fullName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/70 italic">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(comp.id, comp.name)}
                      className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition cursor-pointer"
                      title="Delete component"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
