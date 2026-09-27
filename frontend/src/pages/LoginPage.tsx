import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Login2FaChallenge, type AuthTokens } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, ShieldAlert } from 'lucide-react';
import { LockoutCountdownBanner } from '../components/auth/LockoutCountdownBanner';
import { TwoFactorChallengeForm } from '../components/auth/TwoFactorChallengeForm';
import { PasswordLoginForm } from '../components/auth/PasswordLoginForm';

/**
 * LoginPage orchestrates primary password authentication, 2FA TOTP verification,
 * and account lockout protection using Material 3 design tokens.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Brute-Force Lockout Countdown Timer (seconds)
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // 2FA Challenge State
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<Login2FaChallenge | null>(null);
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

  const handlePasswordLogin = async (credentials: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({
        email: credentials.email,
        password: credentials.password,
      });

      // Handle 2FA Challenge requirement
      if ('require2fa' in res && res.require2fa) {
        setTwoFactorChallenge(res);
        return;
      }

      // Standard login success
      login(res as AuthTokens);
      navigate('/');
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

  const handleTwoFactorVerify = async (code: string) => {
    if (!twoFactorChallenge) return;

    setTwoFactorSubmitting(true);
    setError(null);

    try {
      const tokens = await api.verify2fa({
        tempToken: twoFactorChallenge.tempToken,
        code,
      });
      login(tokens);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid two-factor code');
    } finally {
      setTwoFactorSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8 relative">
      <div className="w-full max-w-md relative">
        {/* Soft Ambient Backdrop Glow for Material 3 Depth & Visual Hierarchy */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-[var(--md-sys-color-primary)]/15 via-[var(--md-sys-color-tertiary)]/10 to-[var(--md-sys-color-primary)]/15 rounded-[32px] blur-xl opacity-60 -z-10 pointer-events-none" />

        <div className="w-full p-8 m3-card shadow-xl relative overflow-hidden">
          {/* Dynamic Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-xs">
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
            <LockoutCountdownBanner
              initialSeconds={lockoutSeconds}
              onTimerExpired={() => {
                setLockoutSeconds(null);
                setError(null);
              }}
            />
          )}

          {/* General Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3.5 text-xs rounded-[16px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-start gap-2 border border-[var(--md-sys-color-error)]/20 font-medium animate-in fade-in-50"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 2FA Challenge vs Password Login Form */}
          {twoFactorChallenge ? (
            <TwoFactorChallengeForm
              challenge={twoFactorChallenge}
              isSubmitting={twoFactorSubmitting}
              onVerify={handleTwoFactorVerify}
              onCancel={() => {
                setTwoFactorChallenge(null);
                setError(null);
              }}
            />
          ) : (
            <PasswordLoginForm
              isLoading={loading}
              isLocked={Boolean(lockoutSeconds && lockoutSeconds > 0)}
              onSubmit={handlePasswordLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
};
