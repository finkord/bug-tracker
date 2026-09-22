import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShieldCheck, Copy, Check, X, Loader2, KeyRound } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TwoFactorModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSecret();
    }
  }, [isOpen]);

  const loadSecret = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.generate2fa();
      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeDataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.enable2fa(code);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid confirmation code');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in-50">
      <div className="relative w-full max-w-md p-6 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Enable Two-Factor Auth</h3>
            <p className="text-xs text-slate-400">SDSecurity Task 5 (RFC 6238 TOTP)</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-sm text-slate-400">Generating cryptographic TOTP secret...</span>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {error}
              </div>
            )}

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10">
              {qrCodeUrl && (
                <div className="p-3 bg-white rounded-2xl shadow-md">
                  <img src={qrCodeUrl} alt="2FA TOTP QR Code" className="w-48 h-48 block" />
                </div>
              )}
              <p className="text-xs text-center text-slate-400 mt-3 max-w-xs">
                Scan with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>Authy</strong>.
              </p>
            </div>

            {/* Manual Secret Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Manual Key (if camera unavailable):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={secret}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl m3-input text-indigo-300 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                  title="Copy secret key"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Code Verification Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter 6-Digit Passcode from App:
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 rounded-xl m3-input font-bold text-white placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-full text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Activate 2FA</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
