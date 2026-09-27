import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { TwoFactorModal } from '../auth/TwoFactorModal';
import { Badge, Button } from '../ui';
import { ShieldCheck, Shield, KeyRound } from 'lucide-react';

/**
 * Material 3 Card for managing TOTP Two-Factor Authentication.
 */
export const ProfileTwoFactorCard: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  if (!user) return null;

  const handleDisable2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode || disableCode.length !== 6) return;

    setDisabling(true);
    setTwoFactorError(null);
    try {
      await api.disable2fa(disableCode);
      setShowDisableForm(false);
      setDisableCode('');
      await refreshUser();
    } catch (err: any) {
      setTwoFactorError(err.message || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
    }
  };

  return (
    <>
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                user.twoFactorEnabled
                  ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {user.twoFactorEnabled ? (
                <ShieldCheck className="w-5 h-5 text-[var(--md-sys-color-success)]" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Two-Step Verification
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Authenticator app security
              </p>
            </div>
          </div>

          <Badge variant={user.twoFactorEnabled ? 'success' : 'neutral'} size="sm">
            {user.twoFactorEnabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>

        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          Protect your account with Time-based One-Time Passcodes (TOTP) from Google Authenticator, Authy, or Microsoft Authenticator.
        </p>

        {twoFactorError && (
          <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium">
            {twoFactorError}
          </div>
        )}

        {user.twoFactorEnabled && showDisableForm && (
          <form onSubmit={handleDisable2Fa} className="space-y-3 pt-1">
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Enter 6-digit passcode to confirm deactivation:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-32 text-center tracking-widest font-mono text-sm py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 focus:outline-hidden"
              />
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={disabling}
                disabled={disableCode.length !== 6}
              >
                Confirm Disable
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDisableForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* 2FA Action Footer */}
        <div className="pt-3 border-t border-[var(--md-sys-color-surface-container-high)] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            RFC 6238 Standard
          </span>

          {user.twoFactorEnabled ? (
            !showDisableForm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDisableForm(true)}
              >
                Disable 2FA
              </Button>
            )
          ) : (
            <Button
              type="button"
              variant="filled"
              size="sm"
              onClick={() => setModalOpen(true)}
              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
            >
              Configure & Enable 2FA
            </Button>
          )}
        </div>
      </div>

      <TwoFactorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          refreshUser();
        }}
      />
    </>
  );
};
