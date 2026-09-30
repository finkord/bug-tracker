import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { CaptchaWidget, type CaptchaWidgetHandle } from '../components/auth/CaptchaWidget';
import { OAuthLoginButtons } from '../components/auth/OAuthLoginButtons';
import {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
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
          <div className="mb-6">
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight leading-tight">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
              Start tracking issues and collaborating with your team
            </p>
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
                    placeholder="Jane Doe"
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
                    placeholder="you@example.com"
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
                className="w-full mt-2 py-3.5 m3-btn-filled text-sm font-semibold shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-50"
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

              {/* Federated Identity OAuth */}
              <OAuthLoginButtons prompt="Or sign up with" />

              {/* Sign in redirect */}
              <div className="text-center pt-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
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
