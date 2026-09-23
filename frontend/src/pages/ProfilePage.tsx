import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { TwoFactorModal } from '../components/auth/TwoFactorModal';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Mail,
  Send,
  ExternalLink,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Password management state
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

  const handleDisable2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode || disableCode.length !== 6) return;

    setDisabling(true);
    setTwoFactorError(null);
    try {
      await api.disable2fa(disableCode);
      setShowDisableForm(false);
      setDisableCode('');
      await refreshUser();
    } catch (err: any) {
      setTwoFactorError(err.message || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
    }
  };

  // SDSecurity Lab 6 Task 7: Password change via 15-minute email reset token
  const handleRequestPasswordReset = async () => {
    setSendingResetEmail(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await api.forgotPassword(user.email);
      setPasswordSuccess(res.message || 'Password reset link sent to your email.');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to send password reset email');
    } finally {
      setSendingResetEmail(false);
    }
  };

  // Onboarding initial password setup for OAuth accounts
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
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to set password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Profile Overview Card - Google Pixel Header */}
      <div className="p-8 rounded-[28px] m3-card shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[22px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center text-2xl font-bold font-heading shadow-sm">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
                  {user.fullName}
                </h1>
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded-full uppercase ${
                    user.systemRole === 'ADMIN'
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  {user.systemRole}
                </span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-1.5">
              <span>Account ID:</span>
              <strong className="text-[var(--md-sys-color-on-surface)] font-mono">#{user.id}</strong>
            </span>

            <span
              className={`px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 font-medium ${
                user.isActivated
                  ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border-transparent'
                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]'
              }`}
            >
              {user.isActivated ? (
                <CheckCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>{user.isActivated ? 'Activated' : 'Pending Activation'}</span>
            </span>

            <span className="px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]">
              Auth: <strong className="text-[var(--md-sys-color-primary)]">{user.oauthProvider || 'LOCAL'}</strong>
            </span>

            <span
              className={`px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 font-medium ${
                user.hasPassword
                  ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border-transparent'
                  : 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] border-transparent'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{user.hasPassword ? 'Password Set' : 'OAuth Only'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Security Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Account Password Card (Lab 6 Task 7: Password Change via Email) */}
        <div className="p-6 rounded-[24px] m3-card flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-[16px] flex items-center justify-center ${
                    user.hasPassword
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                      : 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-warning)]'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Account Password
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Argon2id cryptographic credential
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                  user.hasPassword
                    ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                    : 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]'
                }`}
              >
                {user.hasPassword ? 'Configured' : 'Not Set (OAuth)'}
              </span>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              {user.hasPassword
                ? 'Your account is secured with Argon2id cryptographic hashing. To prevent session hijacking, password changes require email verification via a 15-minute single-use token.'
                : `Your account was created via ${
                    user.oauthProvider || 'OAuth'
                  }. Add a password to unlock traditional email and password login alongside OAuth.`}
            </p>

            {passwordSuccess && (
              <div className="p-3.5 text-xs rounded-[16px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] font-medium space-y-2 animate-in fade-in">
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
              <div className="p-3 text-xs rounded-[14px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
                <span>{passwordError}</span>
              </div>
            )}

            {!user.hasPassword && showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 m3-input text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-2.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)]"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={newPassword} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 m3-input text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-2.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)]"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={passwordSubmitting || !newPassword || newPassword !== confirmPassword}
                    className="flex-1 py-2.5 m3-btn-filled text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {passwordSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Save Password</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordError(null);
                    }}
                    className="px-4 py-2.5 rounded-full m3-btn-outline text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card Action Footer */}
          <div className="pt-4 mt-4 border-t border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between gap-3">
            {user.hasPassword ? (
              <>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--md-sys-color-on-surface-variant)] min-w-0">
                  <Mail className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>

                <button
                  type="button"
                  onClick={handleRequestPasswordReset}
                  disabled={sendingResetEmail}
                  className="shrink-0 px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-full m3-btn-outline hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-primary)] transition-all disabled:opacity-50"
                >
                  {sendingResetEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </>
            ) : !showPasswordForm ? (
              <>
                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Enable password login
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(true);
                    setPasswordSuccess(null);
                    setPasswordError(null);
                  }}
                  className="shrink-0 px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-full m3-btn-filled transition-all shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Set Password</span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Two-Factor Authentication Control Card */}
        <div className="p-6 rounded-[24px] m3-card flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-[16px] flex items-center justify-center ${
                    user.twoFactorEnabled
                      ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                      : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  {user.twoFactorEnabled ? (
                    <ShieldCheck className="w-5 h-5 text-[var(--md-sys-color-success)]" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Two-Step Verification
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Authenticator app security
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                  user.twoFactorEnabled
                    ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {user.twoFactorEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Protect your account with Time-based One-Time Passcodes (TOTP) from Google Authenticator, Authy, or Microsoft Authenticator.
            </p>

            {twoFactorError && (
              <div className="p-3 text-xs rounded-[14px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium">
                {twoFactorError}
              </div>
            )}

            {user.twoFactorEnabled && showDisableForm && (
              <form onSubmit={handleDisable2Fa} className="space-y-3 pt-2">
                <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Enter 6-digit passcode to confirm deactivation:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-32 text-center tracking-widest font-mono text-sm py-2 m3-input"
                  />
                  <button
                    type="submit"
                    disabled={disabling || disableCode.length !== 6}
                    className="px-4 py-2 rounded-full bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] text-xs font-semibold disabled:opacity-50 transition-all"
                  >
                    {disabling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Disable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisableForm(false)}
                    className="px-3.5 py-2 rounded-full m3-btn-outline text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 mt-4 border-t border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between gap-3">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              RFC 6238 Standard
            </span>

            {user.twoFactorEnabled ? (
              !showDisableForm && (
                <button
                  type="button"
                  onClick={() => setShowDisableForm(true)}
                  className="shrink-0 px-4 py-2 rounded-full m3-btn-outline text-xs font-semibold"
                >
                  Disable 2FA
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="shrink-0 px-4 py-2 rounded-full m3-btn-filled text-xs font-semibold flex items-center gap-2 shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Configure & Enable 2FA</span>
              </button>
            )}
          </div>
        </div>

        {/* Administrator Controls or User Status Card */}
        {user.systemRole === 'ADMIN' ? (
          <div className="p-6 rounded-[24px] m3-card space-y-4 shadow-sm md:col-span-2">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[16px] bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-warning)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Security Controls
                </h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Forensics & access management
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Review live forensic audit trails, inspect client IP addresses and user agents, and manage account security states.
            </p>

            <div className="pt-2">
              <Link
                to="/admin/dashboard"
                className="w-full py-2.5 rounded-full m3-btn-filled text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Open Admin Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-[24px] m3-card space-y-3 shadow-sm md:col-span-2">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[16px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Account Security
                </h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Active Protection
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Your account is protected by Argon2id cryptographic hashing, session token controls, and automated rate-limiting protections.
            </p>
          </div>
        )}
      </div>

      {/* 2FA Setup Modal */}
      <TwoFactorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          refreshUser();
        }}
      />
    </div>
  );
};
