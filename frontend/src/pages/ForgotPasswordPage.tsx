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
      <div className="w-full max-w-md p-8 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Forgot Password</h2>
            <p className="text-xs text-slate-400">SDSecurity Task 7 (Cryptographic Reset Token)</p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-200">Reset Link Dispatched</h3>
              <p className="text-xs text-emerald-300/80 leading-relaxed">
                If an account matches <strong>{email}</strong>, a 15-minute reset token has been sent to Mailpit.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-400" />
                Inspect in Local Mailpit Inbox:
              </span>
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40 font-medium transition-all"
              >
                <span>Open Mailpit (port 8025)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {resetToken && (
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500">Quick-Reset Shortcut:</span>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="w-full py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                >
                  <span>Reset Password Directly</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {error}
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your registered email address below. We'll send you a secure, single-use link valid for 15 minutes.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="v.fufalko@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl m3-input text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
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
              <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
                Remember your password? Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
