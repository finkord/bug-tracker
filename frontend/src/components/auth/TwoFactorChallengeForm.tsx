import React, { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import type { Login2FaChallenge } from '../../api/client';

interface TwoFactorChallengeFormProps {
  challenge: Login2FaChallenge;
  isSubmitting: boolean;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Material 3 TOTP Challenge Form for two-step authentication verification.
 */
export const TwoFactorChallengeForm: React.FC<TwoFactorChallengeFormProps> = ({
  challenge,
  isSubmitting,
  onVerify,
  onCancel,
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6 && !isSubmitting) {
      await onVerify(code);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in zoom-in-95">
      <div className="p-4 rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] text-xs text-[var(--md-sys-color-on-surface)] space-y-1 border border-[var(--md-sys-color-outline-variant)]">
        <p className="font-semibold text-[var(--md-sys-color-primary)]">Password verified</p>
        <p className="text-[var(--md-sys-color-on-surface-variant)]">{challenge.message}</p>
      </div>

      <div>
        <label
          htmlFor="totp-code"
          className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5"
        >
          6-digit passcode from Google Authenticator / Authy:
        </label>
        <input
          id="totp-code"
          type="text"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full text-center tracking-[0.5em] text-3xl font-mono py-3.5 m3-input font-bold"
          autoFocus
        />
      </div>

      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || code.length !== 6}
          className="w-full py-3.5 m3-btn-filled text-sm shadow-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
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
          onClick={onCancel}
          className="w-full py-2.5 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
        >
          Back to Password Login
        </button>
      </div>
    </form>
  );
};
