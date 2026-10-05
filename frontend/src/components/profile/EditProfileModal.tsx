import React, { useState } from 'react';
import { useAuth } from '../../store';
import { api, usersApi } from '../../api/client';
import { User, Briefcase } from 'lucide-react';
import { FormModal, AvatarPicker } from '../ui';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Material 3 Modal for updating profile details (Full Name, Job Title, Avatar) with native SeaweedFS storage.
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

      // 2. Upload Avatar File to SeaweedFS if selected
      if (selectedFile) {
        await usersApi.uploadAvatar(selectedFile);
      } else if (isAvatarRemoved) {
        // Clear avatar if user explicitly removed it
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
      title="Edit Profile Info"
      description="Update your display name, coworker role title, and avatar"
      size="md"
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Save Changes"
      submittingLabel="Saving..."
      submitDisabled={!fullName.trim()}
    >
      <div>
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-3 w-4 h-4 text-[var(--md-sys-color-outline)]" />
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
          Coworker Job Title / Specialization
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-[var(--md-sys-color-outline)]" />
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Principal Frontend Architect, Senior DevOps, etc."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
          />
        </div>
      </div>

      <AvatarPicker
        name={fullName || user.fullName}
        initialAvatarUrl={user.avatarUrl}
        allowPresets={false}
        onChange={(val) => {
          if (val.mode === 'upload' && val.file) {
            setSelectedFile(val.file);
            setIsAvatarRemoved(false);
          } else if (val.mode === 'default' && !val.previewUrl) {
            setSelectedFile(null);
            setIsAvatarRemoved(true);
          }
        }}
        onError={setError}
      />
    </FormModal>
  );
};
