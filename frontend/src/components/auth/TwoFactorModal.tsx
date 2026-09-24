import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShieldCheck, Copy, Check, KeyRound } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Two-Step Verification
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Protect your account with an authenticator app
            </p>
          </div>
        </div>
      }
      size="md"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
            Generating secure TOTP key...
          </span>
        </div>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/20 font-medium">
              {error}
            </div>
          )}

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
            {qrCodeUrl && (
              <div className="p-2.5 bg-white rounded-xl shadow-xs">
                <img src={qrCodeUrl} alt="2FA TOTP QR Code" className="w-40 h-40 block" />
              </div>
            )}
            <p className="text-xs text-center text-[var(--md-sys-color-on-surface-variant)] mt-2.5 max-w-xs font-medium">
              Scan with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>Authy</strong>.
            </p>
          </div>

          {/* Manual Secret Key */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Manual Key (if camera unavailable):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={secret}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)] select-all font-semibold"
              />
              <Button
                type="button"
                variant="tonal"
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Code Verification Input */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
              Enter 6-digit passcode from app:
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[0.4em] text-xl font-mono py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] font-bold focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              isLoading={submitting}
              disabled={code.length !== 6}
              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
            >
              Activate 2FA
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
