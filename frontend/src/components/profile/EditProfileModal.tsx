import React, { useState, useRef } from 'react';
import { useAuth } from '../../store';
import { api, usersApi } from '../../api/client';
import { X, User, Briefcase, Image, Check, UploadCloud, Trash2 } from 'lucide-react';
import { Button } from '../ui';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
];

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
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPEG, WEBP, GIF, SVG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setCustomAvatarInput('');
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        // Otherwise update avatar URL / preset if changed
        const finalAvatar = customAvatarInput.trim() || avatarUrl;
        if (finalAvatar !== user.avatarUrl) {
          await api.updateAvatar(finalAvatar);
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Edit Profile Info
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Update your display name, coworker role title, and avatar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-2">
              Avatar (Upload File or Choose Preset)
            </label>

            {/* SeaweedFS File Upload Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {filePreview ? (
              <div className="flex items-center justify-between p-3 mb-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-primary)]/40">
                <div className="flex items-center gap-3">
                  <img
                    src={filePreview}
                    alt="Uploaded preview"
                    className="w-12 h-12 rounded-xl object-cover border border-[var(--md-sys-color-outline-variant)]/40"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate max-w-[200px]">
                      {selectedFile?.name}
                    </p>
                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                      {(Number(selectedFile?.size || 0) / 1024).toFixed(1)} KB (SeaweedFS storage)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedFile}
                  className="p-2 rounded-xl text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors"
                  title="Remove uploaded image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 mb-3 rounded-2xl border border-dashed border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer transition-all text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="text-xs font-medium">Upload photo from device (max 5MB)</span>
              </div>
            )}

            <div className="grid grid-cols-6 gap-2 mb-3">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = !selectedFile && avatarUrl === preset && !customAvatarInput;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      handleClearSelectedFile();
                      setAvatarUrl(preset);
                      setCustomAvatarInput('');
                    }}
                    className={`relative w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform active:scale-95 ${
                      isSelected
                        ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 scale-105'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[var(--md-sys-color-primary)]/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-sm font-bold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Image className="absolute left-3.5 top-3 w-4 h-4 text-[var(--md-sys-color-outline)]" />
              <input
                type="url"
                value={customAvatarInput}
                onChange={(e) => {
                  handleClearSelectedFile();
                  setCustomAvatarInput(e.target.value);
                  if (e.target.value) setAvatarUrl(e.target.value);
                }}
                placeholder="Or paste custom image URL (https://...)"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              isLoading={isSubmitting}
              disabled={!fullName.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
