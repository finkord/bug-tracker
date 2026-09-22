import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { TwoFactorModal } from '../components/auth/TwoFactorModal';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleDisable2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode || disableCode.length !== 6) return;

    setDisabling(true);
    setError(null);
    try {
      await api.disable2fa(disableCode);
      setShowDisableForm(false);
      setDisableCode('');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
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
                <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">{user.fullName}</h1>
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
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{user.email}</p>
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
                  : 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] border-transparent'
              }`}
            >
              {user.isActivated ? <CheckCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{user.isActivated ? 'Activated' : 'Pending Activation'}</span>
            </span>

            <span className="px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]">
              Auth: <strong className="text-[var(--md-sys-color-primary)]">{user.oauthProvider || 'LOCAL'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Security Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Two-Factor Authentication Control Card */}
        <div className="p-6 rounded-[24px] m3-card space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-[16px] flex items-center justify-center ${
                  user.twoFactorEnabled
                    ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {user.twoFactorEnabled ? <ShieldCheck className="w-5 h-5 text-[var(--md-sys-color-success)]" /> : <Shield className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">Two-Step Verification</h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Authenticator app security</p>
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

          {error && (
            <div className="p-3 text-xs rounded-[14px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium">
              {error}
            </div>
          )}

          {user.twoFactorEnabled ? (
            showDisableForm ? (
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
            ) : (
              <button
                type="button"
                onClick={() => setShowDisableForm(true)}
                className="w-full py-2.5 m3-btn-outline text-xs font-semibold"
              >
                Disable Two-Step Verification
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full py-2.5 m3-btn-filled text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span>Configure & Enable 2FA</span>
            </button>
          )}
        </div>

        {/* Administrator Controls or User Status Card */}
        {user.systemRole === 'ADMIN' ? (
          <div className="p-6 rounded-[24px] m3-card space-y-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[16px] bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-warning)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">Security Controls</h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Forensics & access management</p>
              </div>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Review live forensic audit trails, inspect client IP addresses and user agents, and manage account security states.
            </p>

            <div className="pt-2">
              <Link
                to="/admin/security-logs"
                className="w-full py-2.5 rounded-full m3-btn-filled text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Open Security Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-[24px] m3-card space-y-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[16px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">Account Security</h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Active Protection</p>
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
