import React, { useState } from 'react';
import type { ProjectVersionItem } from '../../api/client';
import {
  useProjectVersionsQuery,
  useCreateProjectVersionMutation,
  useUpdateProjectVersionMutation,
  useReleaseProjectVersionMutation,
  useDeleteProjectVersionMutation,
} from '../../api/queries';
import { Button, Input, Modal, Badge, ConfirmDialog } from '../ui';
import {
  Tag,
  Plus,
  Trash2,
  Archive,
  AlertCircle,
  Rocket,
} from 'lucide-react';

interface ProjectVersionsTabProps {
  projectId: number;
}

export const ProjectVersionsTab: React.FC<ProjectVersionsTabProps> = ({ projectId }) => {
  const { data: versions = [], isLoading } = useProjectVersionsQuery(projectId);
  const createMutation = useCreateProjectVersionMutation();
  const updateMutation = useUpdateProjectVersionMutation();
  const releaseMutation = useReleaseProjectVersionMutation();
  const deleteMutation = useDeleteProjectVersionMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<ProjectVersionItem | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Version name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createMutation.mutateAsync({
        projectId,
        payload: {
          name: name.trim(),
          description: description.trim() || undefined,
          startDate: startDate || undefined,
          releaseDate: releaseDate || undefined,
        },
      });

      setName('');
      setDescription('');
      setStartDate('');
      setReleaseDate('');
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create release version');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (version: ProjectVersionItem) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await releaseMutation.mutateAsync({
        projectId,
        versionId: version.id,
        payload: { releaseDate: today },
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to release version');
    }
  };

  const handleArchive = async (version: ProjectVersionItem) => {
    const nextStatus = version.status === 'ARCHIVED' ? 'UNRELEASED' : 'ARCHIVED';
    try {
      await updateMutation.mutateAsync({
        projectId,
        versionId: version.id,
        payload: { status: nextStatus },
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update version status');
    }
  };

  const handleDelete = (version: ProjectVersionItem) => {
    setVersionToDelete(version);
  };

  const confirmDelete = async () => {
    if (!versionToDelete) return;
    try {
      await deleteMutation.mutateAsync({ projectId, versionId: versionToDelete.id });
      setVersionToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete version');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RELEASED':
        return (
          <Badge variant="success" className="text-[10px] rounded-full px-2 py-0.5">
            Released
          </Badge>
        );
      case 'ARCHIVED':
        return (
          <Badge variant="neutral" className="text-[10px] rounded-full px-2 py-0.5">
            Archived
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="text-[10px] rounded-full px-2 py-0.5">
            Unreleased
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div>
          <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
            Releases & Versions
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Track software milestones, changelogs, scheduled deployments, and release build artifacts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          New Version
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 animate-pulse"
            />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]">
            <Tag className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              No versions created yet
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Create release milestones (e.g. v1.0.0, 2026.Q4) to bundle issues and target deployment dates.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create First Version
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container-low)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold select-none">
                <th className="py-2.5 px-4 w-40">Version</th>
                <th className="py-2.5 px-3 w-28">Status</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 w-44">Timeline</th>
                <th className="py-2.5 px-3 text-right w-44"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20">
              {versions.map((ver) => (
                <tr key={ver.id} className="hover:bg-[var(--md-sys-color-surface-container)]/40 transition">
                  {/* Name */}
                  <td className="py-3 px-4 font-mono font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span>{ver.name}</span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">{getStatusBadge(ver.status)}</td>

                  {/* Description */}
                  <td className="py-3 px-4 text-[var(--md-sys-color-on-surface-variant)]">
                    {ver.description || <span className="italic opacity-60">No description</span>}
                  </td>

                  {/* Dates */}
                  <td className="py-3 px-4 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {ver.startDate && <div>Start: {ver.startDate}</div>}
                    {ver.releaseDate && (
                      <div className="font-semibold text-[var(--md-sys-color-on-surface)]">
                        Release: {ver.releaseDate}
                      </div>
                    )}
                    {!ver.startDate && !ver.releaseDate && (
                      <span className="italic opacity-60">No dates set</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {ver.status !== 'RELEASED' && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleRelease(ver)}
                          leftIcon={<Rocket className="w-3 h-3 text-[var(--md-sys-color-success)]" />}
                          title="Mark this version as released"
                        >
                          Release
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleArchive(ver)}
                        className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                        title={ver.status === 'ARCHIVED' ? 'Unarchive' : 'Archive version'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(ver)}
                        className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition cursor-pointer"
                        title="Delete version"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Version Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Release Version"
        description="Define a new release build target or deployment milestone."
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
              Version Name <span className="text-[var(--md-sys-color-error)]">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 1.0.0, 2.4-beta, 2026.1"
              required
              className="text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Description / Changelog Highlights
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of features and fixes targeted for this release..."
              rows={2}
              className="w-full p-2.5 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
                Target Release Date
              </label>
              <Input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? 'Creating...' : 'Create Version'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!versionToDelete}
        onClose={() => setVersionToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Version"
        description={`Are you sure you want to delete version "${versionToDelete?.name}"? Issues assigned to this version will have it unlinked.`}
        confirmLabel="Delete Version"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
