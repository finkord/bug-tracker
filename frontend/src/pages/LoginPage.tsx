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

  // Brute-Force Lockout Countdown Timer
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // 2FA Challenge State
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

      // Check if 2FA is required
      if ('require2fa' in res && res.require2fa) {
        setTwoFactorChallenge(res);
        return;
      }

      // Standard login success
      login(res as AuthTokens);
      navigate('/profile');
    } catch (err: any) {
      const msg: string = err.message || 'Authentication failed';
      setError(msg);

      // Detect brute-force lockout message
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
      <div className="w-full max-w-md p-8 m3-card shadow-lg relative overflow-hidden">
        {/* Dynamic Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            {twoFactorChallenge ? <KeyRound className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
              {twoFactorChallenge ? 'Two-Step Verification' : 'Welcome to BugTracker'}
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {twoFactorChallenge
                ? 'Enter the security code from your authenticator'
                : 'Sign in to access your dashboard'}
            </p>
          </div>
        </div>

        {/* Brute-Force Lockout Active Alert */}
        {lockoutSeconds !== null && lockoutSeconds > 0 && (
          <div className="mb-4 p-4 rounded-[20px] bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] space-y-1.5 animate-in slide-in-from-top-2 border border-[var(--md-sys-color-warning)]/20">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Account Temporarily Locked</span>
            </div>
            <p className="text-xs opacity-90 leading-relaxed">
              Consecutive failed login attempts detected. Protection lockout active:
            </p>
            <div className="text-2xl font-mono font-bold text-center py-1">
              {formatLockoutTime(lockoutSeconds)}
            </div>
          </div>
        )}

        {/* General Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 text-xs rounded-[16px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-start gap-2 border border-[var(--md-sys-color-error)]/20 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {twoFactorChallenge ? (
          /* ================= TWO-FACTOR TOTP CHALLENGE SCREEN ================= */
          <form onSubmit={handleTwoFactorVerify} className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-4 rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] text-xs text-[var(--md-sys-color-on-surface)] space-y-1 border border-[var(--md-sys-color-outline-variant)]">
              <p className="font-semibold text-[var(--md-sys-color-primary)]">Password verified</p>
              <p className="text-[var(--md-sys-color-on-surface-variant)]">{twoFactorChallenge.message}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                6-digit passcode from Google Authenticator / Authy:
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] text-3xl font-mono py-3.5 m3-input font-bold"
                autoFocus
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={twoFactorSubmitting || twoFactorCode.length !== 6}
                className="w-full py-3.5 m3-btn-filled text-sm shadow-sm flex items-center justify-center gap-2"
              >
                {twoFactorSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
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
                className="w-full py-2.5 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
              >
                Back to Password Login
              </button>
            </div>
          </form>
        ) : (
          /* ================= STANDARD LOGIN SCREEN ================= */
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                Email Address
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

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--md-sys-color-primary)] font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 m3-input text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (lockoutSeconds !== null && lockoutSeconds > 0)}
              className="w-full mt-2 py-3.5 m3-btn-filled text-sm shadow-sm flex items-center justify-center gap-2"
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

            {/* Federated Identity Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--md-sys-color-outline-variant)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-outline)] font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="/api/v1/auth/github"
                className="py-2.5 px-3 rounded-full m3-btn-tonal text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub OAuth</span>
              </a>

              <button
                type="button"
                onClick={handleMockOAuth}
                className="py-2.5 px-3 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                title="Simulate instant OAuth login for demo & testing"
              >
                <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>Mock OAuth</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center pt-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[var(--md-sys-color-primary)] font-semibold hover:underline">
                Create one now
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
