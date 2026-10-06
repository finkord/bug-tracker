import React, { useState } from 'react';
import { api } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PasswordStrengthMeter } from '../auth/PasswordStrengthMeter';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}

export const SetPasswordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.setPassword({
        newPassword,
      });
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set password';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Set Account Password
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Establish a master password for {userEmail}
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/20 font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
            New Password
          </label>
          <Input
            type="password"
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoFocus
          />
          {newPassword && <PasswordStrengthMeter password={newPassword} />}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
            Confirm Password
          </label>
          <Input
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="filled"
            size="sm"
            isLoading={submitting}
            leftIcon={<KeyRound className="w-3.5 h-3.5" />}
          >
            Set Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};
