import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectItem, UserProfile } from '../../api/client';
import {
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUploadProjectAvatarMutation,
} from '../../api/queries';
import { Button, Input } from '../ui';
import { Avatar } from '../common/Avatar';
import { ProjectAvatar } from './ProjectAvatar';
import { TEAM_PRESET_ICONS, TEAM_PRESET_COLORS } from '../teams/team-presets';
import {
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Upload,
  Sparkles,
  Image as ImageIcon,
  RotateCcw,
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

  // Avatar / Logo State
  const [avatarMode, setAvatarMode] = useState<'preset' | 'upload'>(() => {
    if (project.avatarUrl?.startsWith('preset:')) return 'preset';
    if (project.avatarUrl) return 'upload';
    return 'preset';
  });

  const [selectedIcon, setSelectedIcon] = useState<string>(() => {
    if (project.avatarUrl?.startsWith('preset:')) {
      const parts = project.avatarUrl.split(':');
      return parts[1] || 'layers';
    }
    return 'layers';
  });

  const [selectedColor, setSelectedColor] = useState<string>(() => {
    if (project.avatarUrl?.startsWith('preset:')) {
      const parts = project.avatarUrl.split(':');
      return parts[2] || 'indigo';
    }
    return 'indigo';
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => {
    if (project.avatarUrl && !project.avatarUrl.startsWith('preset:')) {
      return project.avatarUrl;
    }
    return null;
  });
  const [isDefaultAvatar, setIsDefaultAvatar] = useState<boolean>(!project.avatarUrl);

  const [prevId, setPrevId] = useState(project.id);
  if (project.id !== prevId) {
    setPrevId(project.id);
    setName(project.name || '');
    setDescription(project.description || '');
    setLeadId(project.leadId || 0);
    if (project.avatarUrl?.startsWith('preset:')) {
      setAvatarMode('preset');
      const parts = project.avatarUrl.split(':');
      setSelectedIcon(parts[1] || 'layers');
      setSelectedColor(parts[2] || 'indigo');
      setAvatarPreview(null);
      setIsDefaultAvatar(false);
    } else if (project.avatarUrl) {
      setAvatarMode('upload');
      setAvatarPreview(project.avatarUrl);
      setIsDefaultAvatar(false);
    } else {
      setAvatarMode('preset');
      setSelectedIcon('layers');
      setSelectedColor('indigo');
      setAvatarPreview(null);
      setIsDefaultAvatar(true);
    }
    setAvatarFile(null);
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(project.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPEG, WebP, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must not exceed 5MB');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setIsDefaultAvatar(false);
    setError(null);
  };

  const handleSelectPresetIcon = (iconId: string) => {
    setSelectedIcon(iconId);
    setIsDefaultAvatar(false);
  };

  const handleSelectPresetColor = (colorId: string) => {
    setSelectedColor(colorId);
    setIsDefaultAvatar(false);
  };

  const handleResetToDefault = () => {
    setIsDefaultAvatar(true);
    setAvatarFile(null);
    setAvatarPreview(null);
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
      if (!isDefaultAvatar) {
        if (avatarMode === 'preset') {
          finalAvatarUrl = `preset:${selectedIcon}:${selectedColor}`;
        } else if (avatarMode === 'upload' && avatarPreview && !avatarFile) {
          finalAvatarUrl = avatarPreview;
        }
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

      if (!isDefaultAvatar && avatarMode === 'upload' && avatarFile) {
        await uploadAvatarMutation.mutateAsync({
          projectId: project.id,
          file: avatarFile,
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

  const activeAvatarUrl = isDefaultAvatar
    ? null
    : avatarMode === 'preset'
    ? `preset:${selectedIcon}:${selectedColor}`
    : avatarPreview;

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
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Project Logo & Identity
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Displayed in the sidebar, boards, breadcrumbs, and issue headers.
              </p>
            </div>
            {!isDefaultAvatar && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleResetToDefault}
                leftIcon={<RotateCcw className="w-3 h-3" />}
                className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] text-xs"
              >
                Reset to Default
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
            {/* Live Logo Preview */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ProjectAvatar
                name={name || project.name}
                projectKey={project.key}
                avatarUrl={activeAvatarUrl}
                size="xl"
              />
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Live Preview
              </span>
            </div>

            {/* Mode Selector & Customization */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center gap-2 border-b border-[var(--md-sys-color-outline-variant)]/30 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMode('preset');
                    setIsDefaultAvatar(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    avatarMode === 'preset'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Geometric Preset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMode('upload');
                    setIsDefaultAvatar(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    avatarMode === 'upload'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Custom Image
                </button>
              </div>

              {avatarMode === 'preset' && (
                <div className="space-y-3">
                  {/* Icon Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                      Select Icon
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {TEAM_PRESET_ICONS.map((preset) => {
                        const Icon = preset.Icon;
                        const isSelected = selectedIcon === preset.id && !isDefaultAvatar;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPresetIcon(preset.id)}
                            title={preset.label}
                            className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs scale-105'
                                : 'border-[var(--md-sys-color-outline-variant)]/30 hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                      Select Accent Color
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {TEAM_PRESET_COLORS.map((c) => {
                        const isSelected = selectedColor === c.id && !isDefaultAvatar;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectPresetColor(c.id)}
                            title={c.label}
                            className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${c.bg} ${
                              isSelected
                                ? 'ring-2 ring-offset-2 ring-[var(--md-sys-color-primary)] scale-110'
                                : 'opacity-80 hover:opacity-100 hover:scale-105'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {avatarMode === 'upload' && (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[var(--md-sys-color-outline-variant)]/60 hover:border-[var(--md-sys-color-primary)] rounded-2xl bg-[var(--md-sys-color-surface-container)]/40 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-[var(--md-sys-color-primary)] mb-1.5" />
                    <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                      {avatarFile ? avatarFile.name : 'Click to select or drop project logo image'}
                    </span>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      PNG, JPG, WebP or SVG up to 5MB (saved to SeaweedFS object storage)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

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
          <div className="flex items-center gap-3">
            <select
              value={leadId}
              onChange={(e) => setLeadId(Number(e.target.value))}
              className="flex-1 p-2 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 cursor-pointer"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
            {project.lead && (
              <div className="flex items-center gap-2 shrink-0">
                <Avatar
                  name={project.lead.fullName || 'Lead'}
                  avatarUrl={project.lead.avatarUrl}
                  size="sm"
                />
              </div>
            )}
          </div>
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
