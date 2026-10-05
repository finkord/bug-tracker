import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectItem, UserProfile } from '../../api/client';
import {
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUploadProjectAvatarMutation,
} from '../../api/queries';
import { Button, Input, UserPicker, AvatarPicker, type AvatarPickerValue } from '../ui';
import {
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
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

  const [prevProjectId, setPrevProjectId] = useState<number | undefined>(project.id);
  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id);
    setName(project.name || '');
    setDescription(project.description || '');
    setLeadId(project.leadId || 0);
  }

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

      setSuccess('Project details and logo updated successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    const confirmation = window.prompt(
      `To permanently delete this project workspace, type its key "${project.key}":`,
    );

    if (confirmation === project.key) {
      try {
        await deleteMutation.mutateAsync(project.id);
        navigate('/projects');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete project');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
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
        <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-[var(--md-sys-color-success-container,rgba(16,185,129,0.15))] text-[var(--md-sys-color-on-success-container,rgb(16,185,129))] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Logo & Identity Section */}
        <AvatarPicker
          name={name || project.name}
          entityKey={project.key}
          initialAvatarUrl={project.avatarUrl}
          onChange={setAvatarValue}
          onError={setError}
        />

        {/* Project Key (Read-only) */}
        <div>
          <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
            Project Key
          </label>
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 font-mono font-black text-sm text-[var(--md-sys-color-primary)] select-all">
              {project.key}
            </div>
            <button
              type="button"
              onClick={handleCopyKey}
              className="p-2 rounded-xl border border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] transition cursor-pointer"
              title="Copy Project Key"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] ml-2">
              Prefix used for issue keys (e.g. {project.key}-101). Key cannot be changed once created.
            </span>
          </div>
        </div>

        {/* Project Name */}
        <div>
          <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
            Project Name <span className="text-[var(--md-sys-color-error)]">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mobile Bug Tracker"
            required
            className="text-xs font-semibold"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the scope and objective of this project workspace..."
            rows={3}
            className="w-full p-2.5 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40"
          />
        </div>

        {/* Project Lead */}
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
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
            The project lead receives notifications for unassigned issues and has administrative control.
          </p>
        </div>

        {/* Save Changes Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={loading}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            {loading ? 'Saving Changes...' : 'Save General Settings'}
          </Button>
        </div>
      </form>

      {/* Danger Zone: Delete Project */}
      <div className="pt-8 border-t border-[var(--md-sys-color-error)]/20 mt-8">
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-error-container)]/20 border border-[var(--md-sys-color-error)]/30 space-y-3">
          <div className="flex items-center gap-2 text-[var(--md-sys-color-error)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider">
              Danger Zone: Delete Project
            </h3>
          </div>
          <p className="text-xs text-[var(--md-sys-color-on-surface)]">
            Permanently deletes this project, its backlog, sprints, issues, and configuration. This action cannot be undone.
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleDeleteProject}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="border-[var(--md-sys-color-error)] text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/40"
          >
            Delete Project Workspace
          </Button>
        </div>
      </div>
    </div>
  );
};
