import React, { useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  onVerify: (token: string) => void;
  onReset?: () => void;
}

export const CaptchaWidget: React.FC<Props> = ({ onVerify, onReset }) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');

  const handleClick = () => {
    if (status === 'verified') return;

    setStatus('verifying');
    // Simulate brief bot analysis verification
    setTimeout(() => {
      setStatus('verified');
      onVerify('valid-captcha-token');
    }, 700);
  };

  const handleReset = () => {
    setStatus('idle');
    if (onReset) onReset();
  };

  return (
    <div className="w-full p-3.5 rounded-[20px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-between shadow-sm transition-colors">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={status === 'verifying'}
          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
            status === 'verified'
              ? 'bg-[var(--md-sys-color-success)] border-transparent text-[var(--md-sys-color-on-primary)] shadow-sm'
              : status === 'verifying'
              ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]'
              : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] active:scale-95'
          }`}
          title="Click to verify you are human"
        >
          {status === 'verified' && <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in-50" />}
          {status === 'verifying' && <Loader2 className="w-4 h-4 animate-spin text-[var(--md-sys-color-primary)]" />}
        </button>

        <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
          {status === 'verified' ? (
            <span className="text-[var(--md-sys-color-success)] font-semibold flex items-center gap-1.5">
              Verification Successful
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] hover:underline ml-2"
              >
                (Reset)
              </button>
            </span>
          ) : status === 'verifying' ? (
            <span className="text-[var(--md-sys-color-primary)]">Verifying security challenge...</span>
          ) : (
            <span>I'm not a robot</span>
          )}
        </span>
      </div>

      <div className="flex flex-col items-end text-[var(--md-sys-color-outline)] text-[10px] pl-3 border-l border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-1 text-[var(--md-sys-color-on-surface-variant)] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          <span>Security Check</span>
        </div>
        <span>Privacy Protected</span>
      </div>
    </div>
  );
};
