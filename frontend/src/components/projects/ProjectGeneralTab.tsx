import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectItem, UserProfile } from '../../api/client';
import {
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUploadProjectAvatarMutation,
} from '../../api/queries';
import {
  Card,
  Button,
  Input,
  Textarea,
  Modal,
  Badge,
  UserPicker,
  AvatarPicker,
  type AvatarPickerValue,
} from '../ui';
import {
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface ProjectGeneralTabProps {
  project: ProjectItem;
  allUsers: UserProfile[];
}

export const ProjectGeneralTab: React.FC<ProjectGeneralTabProps> = ({
  project,
  allUsers,
}) => {
  const navigate = useNavigate();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();
  const uploadAvatarMutation = useUploadProjectAvatarMutation();

  const [name, setName] = useState(project.name || '');
  const [description, setDescription] = useState(project.description || '');
  const [leadId, setLeadId] = useState<number>(project.leadId || 0);

  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [avatarValue, setAvatarValue] = useState<AvatarPickerValue | null>(null);

  // Danger zone deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationKey, setDeleteConfirmationKey] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setName(project.name || '');
    setDescription(project.description || '');
    setLeadId(project.leadId || 0);
  }, [project.id, project.name, project.description, project.leadId]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(project.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let finalAvatarUrl: string | null = null;
      if (avatarValue?.mode === 'preset') {
        finalAvatarUrl = avatarValue.presetUrl || null;
      } else if (avatarValue?.mode === 'upload') {
        finalAvatarUrl = avatarValue.file ? null : (avatarValue.previewUrl || null);
      } else if (avatarValue?.mode === 'default') {
        finalAvatarUrl = null;
      }

      await updateMutation.mutateAsync({
        id: project.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          leadId: leadId || undefined,
          avatarUrl: finalAvatarUrl,
        },
      });

      if (avatarValue?.mode === 'upload' && avatarValue.file) {
        await uploadAvatarMutation.mutateAsync({
          projectId: project.id,
          file: avatarValue.file,
        });
      }

      setSuccess('Project settings and branding saved successfully.');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update project settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationKey.trim().toUpperCase() !== project.key.toUpperCase()) {
      setDeleteError(`Please type "${project.key}" exactly to confirm.`);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(project.id);
      setIsDeleteModalOpen(false);
      navigate('/projects');
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete project');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
          General Project Settings
        </h2>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          Configure project name, workspace key, logo identity, lead ownership, and domain description.
        </p>
      </div>

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

      {success && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-success-container,rgba(16,185,129,0.15))] text-[var(--md-sys-color-on-success-container,rgb(16,185,129))] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success,rgb(16,185,129))]" />
            <span>{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Visual Identity & Key */}
        <Card
          variant="outlined"
          padding="lg"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-5"
        >
          <div>
            <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
              Workspace Identity & Branding
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Customize the logo avatar badge and inspect the immutable project key prefix.
            </p>
          </div>

          <AvatarPicker
            name={name || project.name}
            entityKey={project.key}
            initialAvatarUrl={project.avatarUrl}
            onChange={setAvatarValue}
            onError={setError}
          />

          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/20">
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1.5">
              Project Workspace Key
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/60 font-mono font-black text-sm text-[var(--md-sys-color-primary)] select-all tracking-wider">
                {project.key}
              </div>
              <Button
                type="button"
                variant="outlined"
                size="xs"
                onClick={handleCopyKey}
                leftIcon={copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                title="Copy Project Key"
              >
                {copiedKey ? 'Copied' : 'Copy Key'}
              </Button>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Permanent ticket prefix (e.g. {project.key}-101). Cannot be altered post-creation.
              </span>
            </div>
          </div>
        </Card>

        {/* Card 2: Details */}
        <Card
          variant="outlined"
          padding="lg"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-4"
        >
          <div>
            <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
              General Information
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Set the user-facing project title and domain objective.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Project Name <span className="text-[var(--md-sys-color-error)]">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core Platform Engine"
              required
              className="text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scope, architecture, or roadmap of this project workspace..."
              rows={3}
            />
          </div>
        </Card>

        {/* Card 3: Governance & Leadership */}
        <Card
          variant="outlined"
          padding="lg"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-4"
        >
          <div>
            <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
              Leadership & Ownership
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Assign the project lead responsible for issue triage, defaults, and administrative authority.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Project Lead
            </label>
            <UserPicker
              value={leadId || null}
              onChange={(userId) => setLeadId(userId || 0)}
              users={allUsers}
              fallbackUser={project.lead}
              placeholder="Select project lead..."
              allowUnassigned={false}
              showAssignToMe
              className="w-full"
            />
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
              The project lead receives triage notifications for unassigned tickets and has default project oversight.
            </p>
          </div>
        </Card>

        {/* Submit Actions Strip */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {loading ? 'Saving Changes...' : 'Save General Settings'}
          </Button>
        </div>
      </form>

      {/* Danger Zone: Delete Project Card */}
      <Card
        variant="outlined"
        padding="lg"
        rounded="2xl"
        className="border-[var(--md-sys-color-error)]/30 bg-[var(--md-sys-color-error-container)]/10 space-y-4"
      >
        <div className="flex items-center gap-2.5 text-[var(--md-sys-color-error)]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider">
              Danger Zone: Delete Workspace
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface)] mt-0.5">
              Permanently destroys this project workspace, including all tickets, boards, releases, components, and sprint histories. This action cannot be reversed.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--md-sys-color-error)]/20 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDeleteConfirmationKey('');
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="border-[var(--md-sys-color-error)] text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/40"
          >
            Delete Project Workspace
          </Button>
        </div>
      </Card>

      {/* Typed Confirmation Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete Project Workspace"
        description="This action cannot be undone. All linked tasks, sprints, and boards will be deleted."
        size="md"
      >
        <form onSubmit={handleConfirmDelete} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-error-container)]/30 border border-[var(--md-sys-color-error)]/30 text-xs text-[var(--md-sys-color-on-surface)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--md-sys-color-error)] font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Irreversible Action</span>
            </div>
            <p>
              You are about to delete workspace <Badge variant="neutral" size="sm" className="font-mono">{project.key}</Badge> ({project.name}).
            </p>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Type the project key <span className="font-mono text-[var(--md-sys-color-error)]">{project.key}</span> to confirm:
            </label>
            <Input
              value={deleteConfirmationKey}
              onChange={(e) => setDeleteConfirmationKey(e.target.value)}
              placeholder={project.key}
              autoFocus
              className="text-xs font-mono font-bold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={
                isDeleting ||
                deleteConfirmationKey.trim().toUpperCase() !== project.key.toUpperCase()
              }
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Project Workspace'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
