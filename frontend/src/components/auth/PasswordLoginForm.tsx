import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { OAuthLoginButtons } from './OAuthLoginButtons';
import { DemoAccountsPicker } from './DemoAccountsPicker';

interface PasswordLoginFormProps {
  isLoading: boolean;
  isLocked: boolean;
  onSubmit: (credentials: { email: string; password: string; rememberMe: boolean }) => Promise<void>;
}

/**
 * Material 3 Password Authentication Form with Caps-Lock detection and show/hide toggle.
 */
export const PasswordLoginForm: React.FC<PasswordLoginFormProps> = ({
  isLoading,
  isLocked,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && !isLocked) {
      await onSubmit({ email, password, rememberMe });
    }
  };

  const handleSelectAccount = (selectedEmail: string, selectedPass: string) => {
    setEmail(selectedEmail);
    setPassword(selectedPass);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      <div>
        <label
          htmlFor="login-email"
          className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5"
        >
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--md-sys-color-outline)]" />
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="volodymyr@bugtracker.local"
            className="w-full pl-10 pr-4 py-3 m3-input text-sm"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]"
          >
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
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
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
      </div>

      {/* Remember Me & Forgot Password Row */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--md-sys-color-on-surface-variant)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)]/30"
          />
          <span>Remember me</span>
        </label>
        <Link
          to="/forgot-password"
          className="text-xs text-[var(--md-sys-color-primary)] font-medium hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isLocked}
        className="w-full mt-2 py-3.5 m3-btn-filled text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* OAuth Federation */}
      <OAuthLoginButtons />

      {/* Register Link */}
      <div className="text-center pt-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-[var(--md-sys-color-primary)] font-semibold hover:underline"
        >
          Create one now
        </Link>
      </div>

      {/* Quick Account Fill for dev/testing */}
      <DemoAccountsPicker
        onSelectAccount={handleSelectAccount}
        disabled={isLoading || isLocked}
      />
    </form>
  );
};
