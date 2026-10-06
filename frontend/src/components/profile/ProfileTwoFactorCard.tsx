import React, { useState } from 'react';
import { useAuth } from '../../store';
import { api } from '../../api/client';
import { TwoFactorModal } from '../auth/TwoFactorModal';
import { Card, Badge, Button, Input } from '../ui/index.js';
import { ShieldCheck, Shield, KeyRound, AlertCircle, Smartphone } from 'lucide-react';

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to disable 2FA';
      setTwoFactorError(message);
    } finally {
      setDisabling(false);
    }
  };

  return (
    <>
      <Card className="p-6 h-full flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          {/* 1. Header with Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  user.twoFactorEnabled
                    ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                    : 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                }`}
              >
                {user.twoFactorEnabled ? (
                  <ShieldCheck className="w-5 h-5 text-[var(--md-sys-color-success)]" />
                ) : (
                  <Shield className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Two-Step Verification (2FA)
                </h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  RFC 6238 TOTP authenticator app verification
                </p>
              </div>
            </div>

            <Badge variant={user.twoFactorEnabled ? 'success' : 'neutral'} size="sm" dot>
              {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          {/* 2. Body Description */}
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            Enhance your account security with Time-based One-Time Passcodes (TOTP) from Google Authenticator, Microsoft Authenticator, or 1Password.
          </p>

          {twoFactorError && (
            <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/20 text-[var(--md-sys-color-on-error-container)] font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
              <span>{twoFactorError}</span>
            </div>
          )}

          {/* Technical Security Specification Chips */}
          <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                Standard:
              </span>
              <span className="font-mono text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                RFC 6238 TOTP (SHA-1, 30s)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/10">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                App Compatibility:
              </span>
              <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Google, Authy, Apple, 1Pass
              </span>
            </div>
          </div>

          {user.twoFactorEnabled && showDisableForm && (
            <form onSubmit={handleDisable2Fa} className="space-y-3 pt-1 animate-in fade-in">
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Enter 6-digit TOTP code to confirm deactivation:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-36">
                  <Input
                    type="text"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center tracking-widest font-mono text-sm"
                    autoFocus
                  />
                </div>
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
        </div>

        {/* 3. Action Footer */}
        <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)]/15 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Status: <strong className="text-[var(--md-sys-color-on-surface)]">{user.twoFactorEnabled ? 'Protected' : 'Not Configured'}</strong>
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
      </Card>

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

export default ProfileTwoFactorCard;
