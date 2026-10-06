import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { Card, Input, Button } from '../components/ui';
import { Lock, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../store';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const { user } = useAuth();

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveToken = token || tokenFromUrl;
    if (!effectiveToken) {
      setError('Password reset token is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.resetPassword({ token: effectiveToken, newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8 animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-[var(--md-sys-color-primary)]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Set New Password
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Update your account credentials
            </p>
          </div>
        </div>

        {success ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 text-center pt-2">
            <div className="w-16 h-16 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9 text-[var(--md-sys-color-success)]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Password Updated</h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-xs mx-auto">
                Your password has been successfully updated with Argon2id hashing.
              </p>
            </div>

            <div className="pt-2">
              <Link to={user ? '/profile' : '/login'} className="block w-full">
                <Button variant="filled" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {user ? 'Return to Profile' : 'Sign In with New Password'}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/20 font-medium">
                {error}
              </div>
            )}

            {/* Token field (only show manual input if not in URL) */}
            {!tokenFromUrl && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Reset Token (from email)
                </label>
                <Input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste 32-byte token from email"
                  leftIcon={<KeyRound className="w-4 h-4" />}
                />
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                New Password
              </label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                autoFocus
              />
              {newPassword && <PasswordStrengthMeter password={newPassword} />}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                Confirm New Password
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="filled"
              size="md"
              className="w-full mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Save New Password
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
