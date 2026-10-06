import React, { useState } from 'react';
import { useAuth } from '../../store';
import { api } from '../../api/client';
import { Card, Badge, Button } from '../ui/index.js';
import { SetPasswordModal } from './SetPasswordModal';
import {
  Lock,
  Mail,
  KeyRound,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const ProfileSecurityCard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const handleRequestPasswordReset = async () => {
    setSendingResetEmail(true);
    setFeedbackMsg(null);
    try {
      const res = await api.forgotPassword(user.email);
      setFeedbackMsg({
        type: 'success',
        text: res.message || `Password reset link sent to ${user.email}. Check your inbox to proceed.`,
      });
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email';
      setFeedbackMsg({ type: 'error', text: message });
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handlePasswordSetSuccess = async () => {
    await refreshUser();
    setFeedbackMsg({
      type: 'success',
      text: 'Password successfully created. You can now sign in using your email and password.',
    });
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  return (
    <>
      <Card className="p-6 h-full flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          {/* 1. Header with Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Account Password
                </h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Argon2id cryptographic credential hashing & recovery
                </p>
              </div>
            </div>

            <Badge variant={user.hasPassword ? 'success' : 'warning'} size="sm" dot>
              {user.hasPassword ? 'Password Set' : 'OAuth Only'}
            </Badge>
          </div>

          {/* 2. Body Description */}
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            {user.hasPassword
              ? 'Your account password is encrypted with Argon2id. For security, password updates require generating a verification link sent to your registered email.'
              : `Your account is authenticated via ${user.oauthProvider || 'OAuth'}. Set a master password to enable direct email and password sign-in.`}
          </p>

          {/* Inline Feedback Banner */}
          {feedbackMsg && (
            <div
              className={`p-3 text-xs rounded-2xl font-medium flex items-center gap-2 animate-in fade-in ${
                feedbackMsg.type === 'success'
                  ? 'bg-[var(--md-sys-color-success-container)] border border-[var(--md-sys-color-success)]/20 text-[var(--md-sys-color-on-success-container)]'
                  : 'bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/20 text-[var(--md-sys-color-on-error-container)]'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Technical Security Specification Chips */}
          <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                Algorithm:
              </span>
              <span className="font-mono text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                Argon2id (OWASP 19 MiB, 2 passes)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/10">
              <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                Recovery Channel:
              </span>
              <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] truncate max-w-[200px]">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Action Footer */}
        <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Status: <strong className="text-[var(--md-sys-color-on-surface)]">{user.hasPassword ? 'Protected' : 'OAuth Sign-in'}</strong>
          </span>

          {user.hasPassword ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={sendingResetEmail}
              onClick={handleRequestPasswordReset}
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              title="Generate a secure password reset link sent to your email"
            >
              Send Reset Email
            </Button>
          ) : (
            <Button
              type="button"
              variant="filled"
              size="sm"
              onClick={() => setModalOpen(true)}
              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
            >
              Set Password
            </Button>
          )}
        </div>
      </Card>

      {!user.hasPassword && (
        <SetPasswordModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handlePasswordSetSuccess}
          userEmail={user.email}
        />
      )}
    </>
  );
};

export default ProfileSecurityCard;
