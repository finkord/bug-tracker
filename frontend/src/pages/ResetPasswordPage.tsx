import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { Lock, KeyRound, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-md p-8 rounded-[28px] m3-card shadow-lg space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Set New Password</h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Update your account credentials</p>
          </div>
        </div>

        {success ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 text-center">
            <div className="w-16 h-16 rounded-[22px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 text-[var(--md-sys-color-success)]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Password Updated!</h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-xs mx-auto">
                Your password has been successfully updated with Argon2id hashing, and any active account lockout has been cleared.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-3.5 rounded-full m3-btn-filled text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 text-xs rounded-[16px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/20 font-medium">
                {error}
              </div>
            )}

            {/* Token field */}
            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                Reset Token (from email)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="32-byte cryptographic token"
                  className="w-full pl-10 pr-4 py-3 m3-input text-xs font-mono text-[var(--md-sys-color-primary)]"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 m3-input text-sm"
                />
              </div>
              <PasswordStrengthMeter password={newPassword} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 m3-input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 m3-btn-filled text-sm shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
