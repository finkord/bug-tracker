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
      {/* Profile Overview Card */}
      <div className="p-8 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-2xl font-bold font-heading shadow-lg shadow-indigo-600/20">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">{user.fullName}</h1>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    user.systemRole === 'ADMIN'
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {user.systemRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 flex items-center gap-1.5">
              <span>Account ID:</span>
              <strong className="text-white font-mono">#{user.id}</strong>
            </span>

            <span
              className={`px-3 py-1 rounded-full border flex items-center gap-1.5 font-medium ${
                user.isActivated
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-700/50 text-amber-300'
              }`}
            >
              {user.isActivated ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{user.isActivated ? 'Activated' : 'Pending Activation'}</span>
            </span>

            <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400">
              Provider: <strong className="text-indigo-300">{user.oauthProvider}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Security Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task 5: Two-Factor Authentication Control Card */}
        <div className="p-6 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  user.twoFactorEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {user.twoFactorEnabled ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Two-Factor Authentication</h3>
                <p className="text-[11px] text-slate-400">SDSecurity Task 5 (RFC 6238 TOTP)</p>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                user.twoFactorEnabled
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}
            >
              {user.twoFactorEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Protect your account with Time-based One-Time Passcodes (TOTP) from Google Authenticator, Authy, or Microsoft Authenticator.
          </p>

          {error && (
            <div className="p-3 text-xs rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          {user.twoFactorEnabled ? (
            showDisableForm ? (
              <form onSubmit={handleDisable2Fa} className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Enter 6-digit code to confirm deactivation:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-32 text-center tracking-widest font-mono text-sm py-2 rounded-xl m3-input text-white"
                  />
                  <button
                    type="submit"
                    disabled={disabling || disableCode.length !== 6}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                  >
                    {disabling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Disable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisableForm(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowDisableForm(true)}
                className="w-full py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Disable Two-Factor Auth
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>Configure & Enable 2FA</span>
            </button>
          )}
        </div>

        {/* Task 4: Administrator Controls & Security Forensics Card */}
        {user.systemRole === 'ADMIN' ? (
          <div className="p-6 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Administrator Security Controls</h3>
                <p className="text-[11px] text-slate-400">SDSecurity Task 4 (Forensics & RBAC)</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Review live forensic audit trails (`login_audit_logs`), inspect IP addresses, and manage account lockout suspensions.
            </p>

            <div className="pt-2">
              <Link
                to="/admin/security-logs"
                className="w-full py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-600/20 active:scale-95"
              >
                <span>Open Security Audit Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Account Status</h3>
                <p className="text-[11px] text-slate-400">Standard User Access</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your account is active and protected by Argon2id cryptographic hashing and brute-force mitigation limits.
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
