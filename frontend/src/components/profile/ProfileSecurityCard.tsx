import React, { useState } from 'react';
import { useAuth } from '../../store';
import { api } from '../../api/client';
import { PasswordStrengthMeter } from '../auth/PasswordStrengthMeter';
import { Badge, Button } from '../ui';
import {
  Lock,
  Mail,
  Send,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

/**
 * Material 3 Card for Argon2id password configuration, updates, and recovery links.
 */
export const ProfileSecurityCard: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  const handleRequestPasswordReset = async () => {
    setSendingResetEmail(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await api.forgotPassword(user.email);
      setPasswordSuccess(res.message || 'Password reset link sent to your email.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email';
      setPasswordError(message);
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setPasswordSubmitting(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await api.setPassword({
        newPassword,
      });
      setPasswordSuccess(res.message);
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set password';
      setPasswordError(message);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              user.hasPassword
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                : 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-warning)]'
            }`}
          >
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              Account Password
            </h3>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Argon2id cryptographic credential
            </p>
          </div>
        </div>

        <Badge variant={user.hasPassword ? 'success' : 'warning'} size="sm">
          {user.hasPassword ? 'Configured' : 'Not Set'}
        </Badge>
      </div>

      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
        {user.hasPassword
          ? 'Your account is secured with Argon2id cryptographic hashing. Password changes require email verification via a 15-minute single-use token.'
          : `Your account was created via ${user.oauthProvider || 'OAuth'}. Add a password to unlock traditional email and password login alongside OAuth.`}
      </p>

      {passwordSuccess && (
        <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] font-medium space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)] mt-0.5" />
            <span>{passwordSuccess}</span>
          </div>
          {user.hasPassword && (
            <div className="pt-1 pl-6">
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-semibold text-[11px] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open Mailpit Inbox (8025)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {passwordError && (
        <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
          <span>{passwordError}</span>
        </div>
      )}

      {!user.hasPassword && showPasswordForm && (
        <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Initial Password
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 pr-10 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-2.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrengthMeter password={newPassword} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPw ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 pr-10 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-2.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              variant="filled"
              size="sm"
              isLoading={passwordSubmitting}
              disabled={!newPassword || newPassword !== confirmPassword}
            >
              Save Password
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPasswordForm(false);
                setPasswordError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Password Card Action Footer */}
      <div className="pt-3 border-t border-[var(--md-sys-color-surface-container-high)] flex items-center justify-between gap-3">
        {user.hasPassword ? (
          <>
            <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
              <Mail className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRequestPasswordReset}
              isLoading={sendingResetEmail}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send Reset Link
            </Button>
          </>
        ) : !showPasswordForm ? (
          <>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Enable password login
            </span>
            <Button
              type="button"
              variant="filled"
              size="sm"
              onClick={() => {
                setShowPasswordForm(true);
                setPasswordSuccess(null);
                setPasswordError(null);
              }}
              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
            >
              Set Password
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};
