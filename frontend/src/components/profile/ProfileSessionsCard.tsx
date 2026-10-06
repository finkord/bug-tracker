import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../store';
import {
  useSessionsQuery,
  useRevokeSessionMutation,
  useRevokeOtherSessionsMutation,
} from '../../api/queries';
import { Badge, Button, ConfirmDialog, Card } from '../ui/index.js';
import {
  Shield,
  Laptop,
  Smartphone,
  Tablet,
  LogOut,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
} from 'lucide-react';

export const ProfileSessionsCard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOthersMutation = useRevokeOtherSessionsMutation();

  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [confirmOthersOpen, setConfirmOthersOpen] = useState(false);
  const [selectedSessionToRevoke, setSelectedSessionToRevoke] = useState<number | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];
  const otherSessions = sessions.filter((s) => s.id !== currentSession?.id && !s.isCurrent);

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  const handleRevokeSingle = async (sessionId: number) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      setNotificationMsg('Session successfully terminated.');
      setTimeout(() => setNotificationMsg(null), 3000);
    } catch {
      setNotificationMsg('Failed to terminate session.');
    } finally {
      setSelectedSessionToRevoke(null);
    }
  };

  const handleRevokeOthers = async () => {
    try {
      await revokeOthersMutation.mutateAsync();
      setNotificationMsg('All other device sessions have been revoked.');
      setTimeout(() => setNotificationMsg(null), 3000);
    } catch {
      setNotificationMsg('Failed to revoke other sessions.');
    } finally {
      setConfirmOthersOpen(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsSigningOutAll(true);
    try {
      await api.logout();
      setNotificationMsg('All sessions revoked. Redirecting to login...');
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 1000);
    } catch {
      await logout();
      navigate('/login');
    } finally {
      setIsSigningOutAll(false);
      setConfirmAllOpen(false);
    }
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              Session Security & Devices
            </h3>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Manage where you are signed in and terminate compromised or unused sessions
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {otherSessions.length > 0 && (
            <Button
              type="button"
              variant="tonal"
              size="sm"
              isLoading={revokeOthersMutation.isPending}
              onClick={() => setConfirmOthersOpen(true)}
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
            >
              Sign Out Other Devices
            </Button>
          )}

          <Button
            type="button"
            variant="danger-tonal"
            size="sm"
            isLoading={isSigningOutAll}
            onClick={() => setConfirmAllOpen(true)}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out All
          </Button>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-success-container)] border border-[var(--md-sys-color-success)]/20 text-[var(--md-sys-color-on-success-container)] font-medium animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Current Active Session Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          <span>CURRENT DEVICE</span>
          {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--md-sys-color-primary)]" />}
        </div>

        {currentSession ? (
          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-primary)]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
                {getDeviceIcon(currentSession.deviceType)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    {currentSession.browser} on {currentSession.os}
                  </p>
                  <Badge variant="success" size="sm" dot>
                    Active Now
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Globe className="w-3 h-3 opacity-60" /> {currentSession.ipAddress}
                  </span>
                  <span>•</span>
                  <span>
                    Started {new Date(currentSession.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <Badge variant="primary" size="sm">
              This Browser
            </Badge>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Loading session status...
          </div>
        )}
      </div>

      {/* Other Active Device Sessions */}
      {otherSessions.length > 0 && (
        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
            OTHER ACTIVE DEVICES ({otherSessions.length})
          </span>

          <div className="space-y-2">
            {otherSessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--md-sys-color-outline-variant)]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center shrink-0">
                    {getDeviceIcon(s.deviceType)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                      {s.browser} on {s.os}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                      <span>{s.ipAddress}</span>
                      <span>•</span>
                      <span className="font-sans">
                        Last seen {new Date(s.lastActiveAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSessionToRevoke(s.id)}
                  isLoading={revokeSessionMutation.isPending && selectedSessionToRevoke === s.id}
                  leftIcon={<XCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={confirmAllOpen}
        onClose={() => setConfirmAllOpen(false)}
        onConfirm={handleRevokeAllSessions}
        title="Sign Out All Devices?"
        description="This will immediately invalidate all session tokens across all devices including this current browser. You will need to sign back in."
        confirmText="Sign Out All Devices"
        confirmVariant="danger"
      />

      <ConfirmDialog
        isOpen={confirmOthersOpen}
        onClose={() => setConfirmOthersOpen(false)}
        onConfirm={handleRevokeOthers}
        title="Revoke Other Sessions?"
        description="This will invalidate all other device sessions and refresh tokens while keeping this browser signed in."
        confirmText="Revoke Other Sessions"
        confirmVariant="danger"
      />

      <ConfirmDialog
        isOpen={selectedSessionToRevoke !== null}
        onClose={() => setSelectedSessionToRevoke(null)}
        onConfirm={() => selectedSessionToRevoke && handleRevokeSingle(selectedSessionToRevoke)}
        title="Revoke Device Session?"
        description="Are you sure you want to terminate this session? The device will be signed out immediately."
        confirmText="Revoke Session"
        confirmVariant="danger"
      />
    </Card>
  );
};

export default ProfileSessionsCard;
