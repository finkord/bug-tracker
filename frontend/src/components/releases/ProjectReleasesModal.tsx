import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Play,
  FileText,
  Trash2,
  Edit2,
  Copy,
  Check,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  useProjectVersionsQuery,
  useCreateProjectVersionMutation,
  useUpdateProjectVersionMutation,
  useDeleteProjectVersionMutation,
  useReleaseProjectVersionMutation,
} from '../../api/queries';
import { api, type ProjectVersionItem } from '../../api/client';
import { Modal, Button, Input } from '../ui';

interface ProjectReleasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectKey: string;
}

export const ProjectReleasesModal: React.FC<ProjectReleasesModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectKey,
}) => {
  const { data: versions = [], isLoading } = useProjectVersionsQuery(projectId);

  const createVersionMutation = useCreateProjectVersionMutation();
  const updateVersionMutation = useUpdateProjectVersionMutation();
  const deleteVersionMutation = useDeleteProjectVersionMutation();
  const releaseVersionMutation = useReleaseProjectVersionMutation();

  // Create/Edit state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<ProjectVersionItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formReleaseDate, setFormReleaseDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Release action modal state
  const [releasingVersion, setReleasingVersion] = useState<ProjectVersionItem | null>(null);
  const [moveToVersionId, setMoveToVersionId] = useState<string>('');

  // Release notes modal state
  const [notesVersion, setNotesVersion] = useState<ProjectVersionItem | null>(null);
  const [releaseNotesText, setReleaseNotesText] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenCreate = () => {
    setEditingVersion(null);
    setFormName('');
    setFormDescription('');
    setFormStartDate('');
    setFormReleaseDate('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: ProjectVersionItem) => {
    setEditingVersion(v);
    setFormName(v.name);
    setFormDescription(v.description || '');
    setFormStartDate(v.startDate || '');
    setFormReleaseDate(v.releaseDate || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Version name is required');
      return;
    }

    try {
      if (editingVersion) {
        await updateVersionMutation.mutateAsync({
          projectId,
          versionId: editingVersion.id,
          data: {
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            startDate: formStartDate || undefined,
            releaseDate: formReleaseDate || undefined,
          },
        });
      } else {
        await createVersionMutation.mutateAsync({
          projectId,
          data: {
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            startDate: formStartDate || undefined,
            releaseDate: formReleaseDate || undefined,
          },
        });
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save version');
    }
  };

  const handleExecuteRelease = async () => {
    if (!releasingVersion) return;
    try {
      await releaseVersionMutation.mutateAsync({
        projectId,
        versionId: releasingVersion.id,
        data: moveToVersionId ? { moveUnresolvedIssuesToVersionId: Number(moveToVersionId) } : undefined,
      });
      setReleasingVersion(null);
      setMoveToVersionId('');
    } catch (err: unknown) {
      console.error('Release failed:', err);
    }
  };

  const handleFetchReleaseNotes = async (v: ProjectVersionItem) => {
    setNotesVersion(v);
    setNotesLoading(true);
    setCopied(false);
    try {
      const res = await api.getReleaseNotes(projectId, v.id);
      setReleaseNotesText(res.releaseNotes);
    } catch (err: unknown) {
      console.error('Failed to load release notes:', err);
      setReleaseNotesText('Failed to generate release notes.');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleCopyNotes = () => {
    if (releaseNotesText) {
      navigator.clipboard.writeText(releaseNotesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Releases & Versions - ${projectKey}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/20">
            <div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Manage development cycles, software milestones, and automatic release note generation.
              </p>
            </div>
            <Button
              variant="filled"
              size="sm"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Version</span>
            </Button>
          </div>

          {/* Version List */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[var(--md-sys-color-outline)]">
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)]">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                  No versions defined yet
                </p>
                <p className="text-xs text-[var(--md-sys-color-outline)] mt-0.5">
                  Create a version to start assigning issues to releases and tracking progress.
                </p>
              </div>
              <Button variant="tonal" size="sm" onClick={handleOpenCreate}>
                Create First Version
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {versions.map((v) => {
                const isReleased = v.status === 'RELEASED';
                const isArchived = v.status === 'ARCHIVED';

                return (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)]/25 bg-[var(--md-sys-color-surface-container-low)] space-y-3 transition-colors hover:border-[var(--md-sys-color-outline-variant)]/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm text-[var(--md-sys-color-on-surface)]">
                          {v.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            isReleased
                              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                              : isArchived
                                ? 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]'
                                : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                          }`}
                        >
                          {v.status}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {!isReleased && (
                          <Button
                            variant="filled"
                            size="sm"
                            onClick={() => setReleasingVersion(v)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Play className="w-3 h-3" />
                            <span>Release</span>
                          </Button>
                        )}
                        <Button
                          variant="tonal"
                          size="sm"
                          onClick={() => handleFetchReleaseNotes(v)}
                          className="flex items-center gap-1 text-xs"
                          title="Generate Release Notes"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Release Notes</span>
                        </Button>
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5"
                          title="Edit Version"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => deleteVersionMutation.mutate({ projectId, versionId: v.id })}
                          className="p-1.5 text-[var(--md-sys-color-error)]"
                          title="Delete Version"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {v.description && (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        {v.description}
                      </p>
                    )}

                    {/* Progress Bar & Issue Counts */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        <span>
                          {v.completedIssues} of {v.totalIssues} issues completed
                        </span>
                        <span className="font-semibold text-[var(--md-sys-color-primary)]">
                          {v.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--md-sys-color-primary)] transition-all duration-300 rounded-full"
                          style={{ width: `${v.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates Footer */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--md-sys-color-outline)] pt-1">
                      {v.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Start: {new Date(v.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {v.releaseDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Release: {new Date(v.releaseDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Create / Edit Version Modal */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingVersion ? `Edit Version: ${editingVersion.name}` : 'New Release Version'}
          size="md"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Version Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. 1.0.0 or 2026-Q4"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all resize-none"
                rows={3}
                placeholder="Key goals or themes for this release..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Release Date
                </label>
                <Input
                  type="date"
                  value={formReleaseDate}
                  onChange={(e) => setFormReleaseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button type="button" variant="text" size="sm" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                isLoading={createVersionMutation.isPending || updateVersionMutation.isPending}
              >
                {editingVersion ? 'Save Changes' : 'Create Version'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Release Confirmation & Issue Migration Modal */}
      {releasingVersion && (
        <Modal
          isOpen={!!releasingVersion}
          onClose={() => setReleasingVersion(null)}
          title={`Release ${releasingVersion.name}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Releasing this version will mark it as released and stamp today's date.
              Unresolved issues can either remain or be rolled forward to another release.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                Move Unresolved Issues to (optional)
              </label>
              <select
                value={moveToVersionId}
                onChange={(e) => setMoveToVersionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)]"
              >
                <option value="">Leave in this version</option>
                {versions
                  .filter((v) => v.id !== releasingVersion.id && v.status === 'UNRELEASED')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button variant="text" size="sm" onClick={() => setReleasingVersion(null)}>
                Cancel
              </Button>
              <Button
                variant="filled"
                size="sm"
                onClick={handleExecuteRelease}
                isLoading={releaseVersionMutation.isPending}
              >
                Confirm Release
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Release Notes Modal */}
      {notesVersion && (
        <Modal
          isOpen={!!notesVersion}
          onClose={() => setNotesVersion(null)}
          title={`Release Notes: ${notesVersion.name}`}
          size="lg"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Formatted markdown ready to paste into GitHub/GitLab releases or release emails.
              </span>
              <Button
                variant="tonal"
                size="sm"
                onClick={handleCopyNotes}
                disabled={notesLoading || !releaseNotesText}
                className="flex items-center gap-1.5 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
              </Button>
            </div>

            <div className="relative">
              {notesLoading ? (
                <div className="py-16 text-center text-xs text-[var(--md-sys-color-outline)]">
                  Generating release notes...
                </div>
              ) : (
                <textarea
                  readOnly
                  rows={14}
                  value={releaseNotesText || ''}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/30 focus:outline-hidden resize-none select-all"
                />
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="text" size="sm" onClick={() => setNotesVersion(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
