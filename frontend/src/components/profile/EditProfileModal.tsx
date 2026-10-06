import React, { useState } from 'react';
import { useAuth } from '../../store';
import { api, usersApi } from '../../api/client';
import { User, Briefcase } from 'lucide-react';
import { FormModal, AvatarPicker, Input } from '../ui/index.js';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Material 3 Modal for updating profile details (Full Name, Job Title, Avatar)
 * Supports both native image uploads and unified shape/color presets.
 */
export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Update Profile Info (Full Name & Job Title)
      await api.updateProfile({
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim(),
      });

      // 2. Upload or update Avatar
      if (selectedFile) {
        await usersApi.uploadAvatar(selectedFile);
      } else if (selectedPreset) {
        await api.updateAvatar(selectedPreset);
      } else if (isAvatarRemoved) {
        await api.updateAvatar('');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your display name, coworker role title, and avatar icon or photo"
      size="md"
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Save Changes"
      submittingLabel="Saving..."
      submitDisabled={!fullName.trim()}
    >
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          Full Name
        </label>
        <Input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          leftIcon={<User className="w-4 h-4 text-[var(--md-sys-color-outline)]" />}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          Coworker Job Title / Specialization
        </label>
        <Input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Principal Frontend Architect, Senior DevOps, etc."
          leftIcon={<Briefcase className="w-4 h-4 text-[var(--md-sys-color-outline)]" />}
        />
      </div>

      <div className="space-y-1 pt-1">
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          Avatar (Photo or Color Preset)
        </label>
        <AvatarPicker
          name={fullName || user.fullName}
          initialAvatarUrl={user.avatarUrl}
          allowPresets={true}
          onChange={(val) => {
            if (val.mode === 'upload' && val.file) {
              setSelectedFile(val.file);
              setSelectedPreset(null);
              setIsAvatarRemoved(false);
            } else if (val.mode === 'preset' && val.presetUrl) {
              setSelectedFile(null);
              setSelectedPreset(val.presetUrl);
              setIsAvatarRemoved(false);
            } else if (val.mode === 'default' && !val.previewUrl) {
              setSelectedFile(null);
              setSelectedPreset(null);
              setIsAvatarRemoved(true);
            }
          }}
          onError={setError}
        />
      </div>
    </FormModal>
  );
};

export default EditProfileModal;
