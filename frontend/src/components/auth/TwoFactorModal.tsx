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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-[28px] m3-card shadow-2xl transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Set Up Two-Step Verification</h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Protect your account with an authenticator app</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-[var(--md-sys-color-primary)] animate-spin" />
            <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Generating secure TOTP key...</span>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            {error && (
              <div className="p-3.5 text-xs rounded-[16px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/20 font-medium">
                {error}
              </div>
            )}

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-5 rounded-[22px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
              {qrCodeUrl && (
                <div className="p-3 bg-white rounded-[16px] shadow-sm">
                  <img src={qrCodeUrl} alt="2FA TOTP QR Code" className="w-44 h-44 block" />
                </div>
              )}
              <p className="text-xs text-center text-[var(--md-sys-color-on-surface-variant)] mt-3 max-w-xs">
                Scan with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>Authy</strong>.
              </p>
            </div>

            {/* Manual Secret Key */}
            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Manual Key (if camera unavailable):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={secret}
                  className="w-full px-3 py-2 text-xs font-mono rounded-[14px] m3-input text-[var(--md-sys-color-primary)] select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-[14px] m3-btn-tonal text-xs font-medium flex items-center gap-1.5 transition-all"
                  title="Copy secret key"
                >
                  {copied ? <Check className="w-4 h-4 text-[var(--md-sys-color-success)]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Code Verification Input */}
            <div>
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                Enter 6-digit passcode from app:
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 m3-input font-bold"
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 m3-btn-outline text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="flex-1 py-3 m3-btn-filled text-sm shadow-sm flex items-center justify-center gap-2"
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
