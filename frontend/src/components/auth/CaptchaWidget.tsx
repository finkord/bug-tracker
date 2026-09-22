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
    <div className="w-full p-3 rounded-2xl border border-slate-700/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shadow-inner">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={status === 'verifying'}
          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
            status === 'verified'
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
              : status === 'verifying'
              ? 'bg-indigo-950 border-indigo-600 text-indigo-400'
              : 'border-slate-500 bg-slate-800 hover:border-indigo-400 hover:bg-slate-700/80 active:scale-95'
          }`}
          title="Click to verify you are human"
        >
          {status === 'verified' && <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in-50" />}
          {status === 'verifying' && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
        </button>

        <span className="text-sm font-medium text-slate-300">
          {status === 'verified' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              Verification Successful
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-slate-400 hover:text-white underline ml-2"
              >
                (Reset)
              </button>
            </span>
          ) : status === 'verifying' ? (
            <span className="text-indigo-300">Analyzing browser fingerprint...</span>
          ) : (
            <span>I am not a robot (SDSecurity Task 2)</span>
          )}
        </span>
      </div>

      <div className="flex flex-col items-end text-slate-500 text-[10px] pl-2 border-l border-slate-800">
        <div className="flex items-center gap-1 text-slate-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Turnstile</span>
        </div>
        <span>Security Check</span>
      </div>
    </div>
  );
};
