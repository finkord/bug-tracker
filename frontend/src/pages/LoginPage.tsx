import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Login2FaChallenge, type AuthTokens } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  KeyRound,
  ArrowRight,
  Sparkles,
  Loader2,
  Clock,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Task 4: Brute-Force Lockout Countdown Timer
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Task 5: 2FA Challenge State
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<Login2FaChallenge | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

  // Lockout Countdown Effect
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });

      // Check if 2FA is required (Task 5)
      if ('require2fa' in res && res.require2fa) {
        setTwoFactorChallenge(res);
        return;
      }

      // Standard login success (Task 1)
      login(res as AuthTokens);
      navigate('/profile');
    } catch (err: any) {
      const msg: string = err.message || 'Authentication failed';
      setError(msg);

      // Detect brute-force lockout message (Task 4)
      const match = msg.match(/in (\d+) seconds/i);
      if (match && match[1]) {
        setLockoutSeconds(parseInt(match[1], 10));
      } else if (msg.includes('temporarily locked for 15 minutes')) {
        setLockoutSeconds(900);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorChallenge || twoFactorCode.length !== 6) return;

    setTwoFactorSubmitting(true);
    setError(null);

    try {
      const tokens = await api.verify2fa({
        tempToken: twoFactorChallenge.tempToken,
        code: twoFactorCode,
      });
      login(tokens);
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Invalid two-factor code');
    } finally {
      setTwoFactorSubmitting(false);
    }
  };

  const handleMockOAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokens = await api.mockOAuthLogin({
        provider: 'GITHUB',
        oauthId: 'gh-demo-' + Math.floor(Math.random() * 10000),
        email: 'github.developer@example.com',
        fullName: 'GitHub Verified Developer',
      });
      login(tokens);
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Mock OAuth login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-md p-8 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

        {/* Dynamic Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {twoFactorChallenge ? <KeyRound className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {twoFactorChallenge ? 'Two-Factor Challenge' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400">
              {twoFactorChallenge
                ? 'SDSecurity Task 5 (RFC 6238 TOTP)'
                : 'Sign in to access secure issue tracking'}
            </p>
          </div>
        </div>

        {/* Brute-Force Lockout Active Alert (Task 4) */}
        {lockoutSeconds !== null && lockoutSeconds > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 space-y-1.5 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Account Temporarily Locked (Task 4)</span>
            </div>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              5 consecutive failed login attempts detected. Protection lockout active:
            </p>
            <div className="text-2xl font-mono font-bold text-amber-400 text-center py-1">
              {formatLockoutTime(lockoutSeconds)}
            </div>
          </div>
        )}

        {/* General Error Alert */}
        {error && (
          <div className="mb-4 p-3 text-xs rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {twoFactorChallenge ? (
          /* ================= TWO-FACTOR TOTP CHALLENGE SCREEN (TASK 5) ================= */
          <form onSubmit={handleTwoFactorVerify} className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
              <p className="font-semibold text-white">Password successfully verified!</p>
              <p className="text-slate-300">{twoFactorChallenge.message}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                6-Digit Passcode from Google Authenticator / Authy:
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] text-3xl font-mono py-3 rounded-2xl m3-input font-bold text-white placeholder:text-slate-600"
                autoFocus
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={twoFactorSubmitting || twoFactorCode.length !== 6}
                className="w-full py-3 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                {twoFactorSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify Passcode & Enter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorChallenge(null);
                  setTwoFactorCode('');
                  setError(null);
                }}
                className="w-full py-2.5 rounded-full text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Back to Password Login
              </button>
            </div>
          </form>
        ) : (
          /* ================= STANDARD LOGIN SCREEN (TASKS 1, 4, 6) ================= */
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {/* Email Field */}
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
                  placeholder="v.fufalko@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl m3-input text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (lockoutSeconds !== null && lockoutSeconds > 0)}
              className="w-full mt-2 py-3 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Federated Identity Divider (Task 6) */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#161c28] text-slate-500 font-medium">
                  Or continue with (Task 6)
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="/api/v1/auth/github"
                className="py-2.5 px-3 rounded-full m3-surface-container hover:bg-slate-700/60 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub OAuth</span>
              </a>

              <button
                type="button"
                onClick={handleMockOAuth}
                className="py-2.5 px-3 rounded-full bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/50 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                title="Simulate instant OAuth login for demo & testing"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Mock OAuth</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center pt-3 text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
                Create one now
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
