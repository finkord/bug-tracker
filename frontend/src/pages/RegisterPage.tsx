import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { CaptchaWidget } from '../components/auth/CaptchaWidget';
import { Shield, Mail, Lock, User, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    activationToken?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError('Please complete the bot security verification (SDSecurity Task 2)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.register({
        fullName,
        email,
        password,
        captchaToken,
      });
      setSuccessData(res);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-md p-8 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
            <p className="text-xs text-slate-400">Secure Enrollment & Policy Enforcement</p>
          </div>
        </div>

        {successData ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-200">Registration Complete!</h3>
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                {successData.message}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-400" />
                Testing Environment (Mailpit):
              </span>
              <p className="text-slate-400">
                Open your local Mailpit web inbox to inspect the activation email:
              </p>
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40 font-medium transition-all"
              >
                <span>Open Mailpit Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {successData.activationToken && (
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500">Quick-Activation Shortcut:</span>
                <Link
                  to={`/activate?token=${encodeURIComponent(successData.activationToken)}`}
                  className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  <span>Activate Account Directly</span>
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

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Vasyl Fufalko"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl m3-input text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl m3-input text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password with Real-Time Policy Meter */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl m3-input text-sm text-white placeholder:text-slate-600"
                />
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Bot Protection Widget */}
            <div className="pt-1">
              <CaptchaWidget onVerify={(token) => setCaptchaToken(token)} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Create Protected Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Sign in redirect */}
            <div className="text-center pt-2 text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
                Sign in here
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
