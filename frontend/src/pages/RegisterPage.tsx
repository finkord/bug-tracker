import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { CaptchaWidget, type CaptchaWidgetHandle } from '../components/auth/CaptchaWidget';
import {
  Shield,
  Mail,
  Lock,
  User,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<CaptchaWidgetHandle>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError('Please complete the bot security verification challenge');
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
      // Single-use token lifecycle: reset widget on failure so user can re-verify
      captchaRef.current?.reset();
      setCaptchaToken('');
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
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Create Account</h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Join BugTracker with protected enrollment</p>
            </div>
          </div>

          {successData ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95">
              <div className="p-5 rounded-[22px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-center space-y-2 border border-transparent shadow-xs">
                <CheckCircle2 className="w-10 h-10 mx-auto text-[var(--md-sys-color-success)]" />
                <h3 className="text-lg font-bold">Registration Complete!</h3>
                <p className="text-xs leading-relaxed opacity-90">
                  {successData.message}
                </p>
              </div>

              {import.meta.env.DEV ? (
                <div className="p-4 rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs space-y-2.5">
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    Testing Environment (Mailpit):
                  </span>
                  <p className="text-[var(--md-sys-color-on-surface-variant)]">
                    Inspect the single-use activation email in your local inbox:
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
                    Activation Email Dispatched
                  </span>
                  <p className="text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                    Please check your inbox and click the single-use activation link to verify your email address.
                  </p>
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

              {/* Full Name */}
              <div>
                <label htmlFor="register-fullname" className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                  Full Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                  <input
                    id="register-fullname"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Volodymyr Fufalko"
                    className="w-full pl-10 pr-4 py-3 m3-input text-sm"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="register-email" className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="v.fufalko@example.com"
                    className="w-full pl-10 pr-4 py-3 m3-input text-sm"
                  />
                </div>
              </div>

              {/* Password with Real-Time Policy Meter & Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="register-password" className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                    Password
                  </label>
                  {capsLockActive && (
                    <span className="flex items-center gap-1 text-[11px] text-[var(--md-sys-color-warning)] font-medium animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Caps Lock is ON</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 m3-input text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-3.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] transition-colors p-0.5 rounded-full"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              {/* Bot Protection Widget */}
              <div className="pt-1">
                <CaptchaWidget
                  ref={captchaRef}
                  action="signup"
                  onVerify={(token) => setCaptchaToken(token)}
                  onReset={() => setCaptchaToken('')}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 m3-btn-filled text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
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
                    Or sign up with
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="/api/v1/auth/github"
                  className="py-2.5 px-3 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </a>

                <a
                  href="/api/v1/auth/google"
                  className="py-2.5 px-3 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </a>
              </div>

              {/* Sign in redirect */}
              <div className="text-center pt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--md-sys-color-primary)] font-semibold hover:underline">
                  Sign in here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
