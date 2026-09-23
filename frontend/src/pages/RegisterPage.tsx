import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { CaptchaWidget, type CaptchaWidgetHandle } from '../components/auth/CaptchaWidget';
import { Shield, Mail, Lock, User, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-md p-8 m3-card shadow-lg relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Create Account</h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Join BugTracker with protected enrollment</p>
          </div>
        </div>

        {successData ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-5 rounded-[22px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-center space-y-2 border border-transparent">
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
              <div className="p-3.5 text-xs rounded-[16px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/20 font-medium">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                Full Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Volodymyr Fufalko"
                  className="w-full pl-10 pr-4 py-3 m3-input text-sm"
                />
              </div>
            </div>

            {/* Email Address */}
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

            {/* Password with Real-Time Policy Meter */}
            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                Password
              </label>
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
              className="w-full mt-3 py-3.5 m3-btn-filled text-sm shadow-sm flex items-center justify-center gap-2"
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
  );
};
