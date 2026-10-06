import React, { useState, useEffect } from 'react';
import type { TeamItem, UserProfile } from '../../api/client';
import {
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useUploadTeamAvatarMutation,
} from '../../api/queries';
import { Input, Textarea, FormModal, UserPicker, AvatarPicker, type AvatarPickerValue } from '../ui';

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

  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [leadId, setLeadId] = useState<number | ''>(team?.leadId ?? '');
  const [sprintCapacityHours, setSprintCapacityHours] = useState<number>(
    Number(team?.sprintCapacityHours) || 160,
  );
  const [avatarValue, setAvatarValue] = useState<AvatarPickerValue | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setDescription(team.description || '');
      setLeadId(team.leadId ?? '');
      setSprintCapacityHours(Number(team.sprintCapacityHours) || 160);
    } else {
      setName('');
      setDescription('');
      setLeadId('');
      setSprintCapacityHours(160);
    }
    setError(null);
  }, [team, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const avatarUrl =
        avatarValue?.mode === 'preset'
          ? avatarValue.presetUrl
          : avatarValue?.mode === 'upload' && avatarValue.file
            ? null
            : avatarValue?.previewUrl || null;

      if (isEditing && team) {
        const updated = await updateMutation.mutateAsync({
          id: team.id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            leadId: leadId ? Number(leadId) : null,
            sprintCapacityHours,
            avatarUrl: avatarUrl || undefined,
          },
        });

        if (avatarValue?.mode === 'upload' && avatarValue.file) {
          await uploadAvatarMutation.mutateAsync({
            teamId: updated.id,
            file: avatarValue.file,
          });
        }
      } else {
        const created = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          projectId,
          leadId: leadId ? Number(leadId) : undefined,
          sprintCapacityHours,
          avatarUrl: avatarUrl || undefined,
        });

        if (avatarValue?.mode === 'upload' && avatarValue.file) {
          await uploadAvatarMutation.mutateAsync({
            teamId: created.id,
            file: avatarValue.file,
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
      {/* Team Visual Identity */}
      <AvatarPicker
        name={name || 'Team'}
        initialAvatarUrl={team?.avatarUrl}
        onChange={setAvatarValue}
        onError={setError}
      />

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
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Purpose, domain, or focus of this team..."
          rows={2}
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
