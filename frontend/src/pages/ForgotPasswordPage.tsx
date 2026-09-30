import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Mail, CheckCircle2, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch password reset email';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8 relative">
      <div className="w-full max-w-md relative">
        {/* Soft Ambient Backdrop Glow for Depth & Visual Hierarchy */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-[var(--md-sys-color-primary)]/15 via-[var(--md-sys-color-tertiary)]/10 to-[var(--md-sys-color-primary)]/15 rounded-[32px] blur-xl opacity-60 -z-10 pointer-events-none" />

        <div className="w-full p-8 m3-card shadow-xl relative overflow-hidden">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight leading-tight">
              Reset your password
            </h1>
            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
              Enter your email to receive password reset instructions
            </p>
          </div>

          {sent ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95">
              <div className="p-5 rounded-[22px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-center space-y-2 border border-transparent shadow-xs">
                <CheckCircle2 className="w-10 h-10 mx-auto text-[var(--md-sys-color-success)]" />
                <h3 className="text-lg font-bold">Reset Link Dispatched</h3>
                <p className="text-xs leading-relaxed opacity-90">
                  If an account matches <strong>{email}</strong>, a secure reset link has been dispatched.
                </p>
              </div>

              {import.meta.env.DEV ? (
                <div className="p-4 rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs space-y-2.5">
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    Testing Environment (Mailpit):
                  </span>
                  <p className="text-[var(--md-sys-color-on-surface-variant)]">
                    Inspect the recovery email in your local inbox:
                  </p>
                  <a
                    href="http://localhost:8025"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full m3-btn-tonal text-xs font-semibold"
                  >
                    <span>Open Mailpit Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs space-y-2 text-center">
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center justify-center gap-1.5">
                    <Mail className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    Password Reset Dispatched
                  </span>
                  <p className="text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                    Please check your inbox and follow the secure link to set a new password.
                  </p>
                </div>
              )}

              {resetToken && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-medium">Instant reset shortcut:</span>
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                    className="w-full py-3 rounded-full m3-btn-filled text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
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
                <div className="p-3.5 text-xs rounded-[16px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/20 font-medium animate-in fade-in-50">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 m3-input text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 m3-btn-filled text-sm font-semibold shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-50"
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
    </div>
  );
};
