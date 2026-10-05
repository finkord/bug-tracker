import React, { useState, useRef } from 'react';
import type { TeamItem, UserProfile } from '../../api/client';
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useUploadTeamAvatarMutation,
} from '../../api/queries';
import { Button, Input, FormModal, UserPicker } from '../ui';
import { TeamAvatar } from './TeamAvatar';
import { TEAM_PRESET_ICONS, TEAM_PRESET_COLORS } from './team-presets.js';
import { Upload, Sparkles, X } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  team?: TeamItem | null;
  users: UserProfile[];
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  projectId,
  team,
  users,
}) => {
  const isEditing = Boolean(team);
  const createMutation = useCreateTeamMutation();
  const updateMutation = useUpdateTeamMutation();
  const uploadAvatarMutation = useUploadTeamAvatarMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<number | ''>('');
  const [sprintCapacityHours, setSprintCapacityHours] = useState<number>(160);

  // Avatar customization state
  const [avatarMode, setAvatarMode] = useState<'preset' | 'upload'>('preset');
  const [selectedIcon, setSelectedIcon] = useState('rocket');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevTeamId, setPrevTeamId] = useState<number | undefined | null>(team ? team.id : undefined);
  if (team?.id !== prevTeamId) {
    setPrevTeamId(team ? team.id : undefined);
    if (team) {
      setName(team.name || '');
      setDescription(team.description || '');
      setLeadId(team.leadId ?? '');
      setSprintCapacityHours(Number(team.sprintCapacityHours) || 160);

      if (team.avatarUrl?.startsWith('preset:')) {
        setAvatarMode('preset');
        const parts = team.avatarUrl.split(':');
        if (parts[1]) setSelectedIcon(parts[1]);
        if (parts[2]) setSelectedColor(parts[2]);
        setAvatarPreview(null);
      } else if (team.avatarUrl) {
        setAvatarMode('upload');
        setAvatarPreview(team.avatarUrl);
      } else {
        setAvatarMode('preset');
        setSelectedIcon('rocket');
        setSelectedColor('indigo');
        setAvatarPreview(null);
      }
    } else {
      setName('');
      setDescription('');
      setLeadId('');
      setSprintCapacityHours(160);
      setAvatarMode('preset');
      setSelectedIcon('rocket');
      setSelectedColor('indigo');
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }

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
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const presetUrl = `preset:${selectedIcon}:${selectedColor}`;

      if (isEditing && team) {
        const updated = await updateMutation.mutateAsync({
          id: team.id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            leadId: leadId ? Number(leadId) : null,
            sprintCapacityHours,
            avatarUrl: avatarMode === 'preset' ? presetUrl : (avatarPreview ? team.avatarUrl : null),
          },
        });

        if (avatarMode === 'upload' && avatarFile) {
          await uploadAvatarMutation.mutateAsync({
            teamId: updated.id,
            file: avatarFile,
          });
        }
      } else {
        const created = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          projectId,
          leadId: leadId ? Number(leadId) : undefined,
          sprintCapacityHours,
          avatarUrl: avatarMode === 'preset' ? presetUrl : undefined,
        });

        if (avatarMode === 'upload' && avatarFile) {
          await uploadAvatarMutation.mutateAsync({
            teamId: created.id,
            file: avatarFile,
          });
        }
      }

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Scrum Team' : 'Create Scrum Team'}
      description="Configure team identity, team lead, and sprint capacity."
      size="md"
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={loading}
      submitLabel={isEditing ? 'Save Changes' : 'Create Team'}
      submittingLabel="Saving..."
      submitVariant="filled"
    >

        {/* Visual Identity Section */}
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
              Team Avatar & Identity
            </label>
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-xs">
              <button
                type="button"
                onClick={() => setAvatarMode('preset')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  avatarMode === 'preset'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Presets</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarMode('upload')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  avatarMode === 'upload'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Preview */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <TeamAvatar
                name={name || 'Team'}
                avatarUrl={avatarMode === 'preset' ? `preset:${selectedIcon}:${selectedColor}` : avatarPreview}
                size="lg"
              />
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-medium">
                Preview
              </span>
            </div>

            {/* Customization controls */}
            {avatarMode === 'preset' ? (
              <div className="flex-1 space-y-2.5">
                {/* Icon Grid */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {TEAM_PRESET_ICONS.map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedIcon(id)}
                      title={label}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        selectedIcon === id
                          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                          : 'border-transparent hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>

                {/* Color Palette */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
                  {TEAM_PRESET_COLORS.map(({ id, label, bg }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedColor(id)}
                      title={label}
                      className={`w-5 h-5 rounded-full ${bg} transition cursor-pointer ${
                        selectedColor === id
                          ? 'ring-2 ring-offset-2 ring-[var(--md-sys-color-primary)] scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="w-full text-xs"
                >
                  {avatarFile ? avatarFile.name : 'Select Image File'}
                </Button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-[11px] text-[var(--md-sys-color-error)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear custom avatar</span>
                  </button>
                )}
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  PNG, JPEG, WebP, SVG up to 5MB. Stored in SeaweedFS.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Team Name */}
        <div>
          <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
            Team Name <span className="text-[var(--md-sys-color-error)]">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Core Platform Alpha"
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
            placeholder="Purpose, domain, or focus of this team..."
            rows={2}
            className="w-full p-2.5 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40"
          />
        </div>

        {/* Team Lead & Sprint Capacity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Team Lead / Scrum Master
            </label>
            <UserPicker
              value={leadId ? Number(leadId) : null}
              onChange={(userId) => setLeadId(userId ?? '')}
              users={users}
              placeholder="None / Unassigned"
              showAssignToMe
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">
              Sprint Capacity (Hours)
            </label>
            <Input
              type="number"
              min={0}
              max={10000}
              step={1}
              value={sprintCapacityHours}
              onChange={(e) => setSprintCapacityHours(Number(e.target.value) || 0)}
              className="text-xs font-semibold"
            />
          </div>
        </div>

    </FormModal>
  );
};
