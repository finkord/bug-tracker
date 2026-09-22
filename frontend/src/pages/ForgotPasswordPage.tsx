import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Mail, KeyRound, CheckCircle2, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.forgotPassword(email);
      setSent(true);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 rounded-[28px] m3-card shadow-lg space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Forgot Password</h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Request a cryptographic recovery link</p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-5 rounded-[22px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-center space-y-2 border border-transparent">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[var(--md-sys-color-success)]" />
              <h3 className="text-base font-bold">Reset Link Dispatched</h3>
              <p className="text-xs leading-relaxed opacity-90">
                If an account matches <strong>{email}</strong>, a 15-minute reset token has been dispatched.
              </p>
            </div>

            <div className="p-4 rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs space-y-2.5">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                Inspect in Local Mailpit Inbox:
              </span>
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full m3-btn-tonal text-xs font-semibold"
              >
                <span>Open Mailpit (port 8025)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {resetToken && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Instant reset shortcut:</span>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="w-full py-3 rounded-full m3-btn-filled text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Reset Password Directly</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link to="/login" className="text-xs text-[var(--md-sys-color-primary)] font-medium hover:underline">
                Return to Sign In
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

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Enter your registered email address below. We'll send you a secure, single-use link valid for 15 minutes.
            </p>

            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="v.fufalko@example.com"
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
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-[var(--md-sys-color-primary)] font-medium hover:underline">
                Remember your password? Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
