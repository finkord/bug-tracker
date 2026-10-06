import React, { useState, useEffect } from 'react';
import {
  useSystemBannerQuery,
  useUpdateSystemBannerMutation,
} from '../../api/queries/useSystemBannerQuery.js';
import type { BroadcastSeverity } from '../../store/useBroadcastStore.js';
import { Card, Button, Badge, Input } from '../../components/ui/index.js';
import { cn } from '../../utils/cn.js';
import {
  Radio,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  Send,
  Loader2,
  Clock,
  User,
  Eye,
} from 'lucide-react';

export const AdminAnnouncementsPage: React.FC = () => {
  const { data: banner } = useSystemBannerQuery();
  const updateMutation = useUpdateSystemBannerMutation();

  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<BroadcastSeverity>('info');
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (banner) {
      setEnabled(banner.enabled);
      setMessage(banner.message);
      setSeverity(banner.severity);
    }
  }, [banner]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await updateMutation.mutateAsync({
        enabled,
        message: message.trim(),
        severity,
      });
      setSuccessFeedback('Broadcast successfully pushed across all active sessions in real time');
      setTimeout(() => setSuccessFeedback(null), 4000);
    } catch {
      // Error handled by query/mutation state
    }
  };

  const getSeverityBadgeClass = (s: BroadcastSeverity) => {
    switch (s) {
      case 'warning':
        return 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] border-[var(--md-sys-color-warning)]/40';
      case 'critical':
        return 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border-[var(--md-sys-color-error)]/40';
      case 'success':
        return 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border-[var(--md-sys-color-success)]/40';
      case 'info':
      default:
        return 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/40';
    }
  };

  const renderSeverityIcon = (s: BroadcastSeverity) => {
    switch (s) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 shrink-0" />;
      case 'critical':
        return <AlertOctagon className="w-4 h-4 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/20">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            System Announcements & Maintenance Broadcast
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-mono">
              <Radio className="w-2.5 h-2.5 text-[var(--md-sys-color-primary)] animate-pulse" />
              Live WebSocket Gateway
            </span>
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Broadcast emergency advisories, scheduled downtime, and system maintenance alerts to all connected users globally.
          </p>
        </div>

        {/* Active Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={enabled ? 'primary' : 'neutral'} size="sm">
            {enabled ? 'Broadcast Active' : 'Broadcast Offline'}
          </Badge>
        </div>
      </div>

      {/* Success Notification */}
      {successFeedback && (
        <div className="flex items-center gap-2 p-3 bg-[var(--md-sys-color-success-container)] border border-[var(--md-sys-color-success)]/30 rounded-2xl text-xs font-semibold text-[var(--md-sys-color-on-success-container)] animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-[var(--md-sys-color-success)] shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* ── Live WYSIWYG Preview Card ──────────────────────────────── */}
      <Card
        variant="filled"
        padding="md"
        rounded="2xl"
        className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            <Eye className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Live Broadcast Banner Preview</span>
          </div>
          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Renders at top of all client windows when active
          </span>
        </div>

        {/* The Live Rendered Banner Strip */}
        <div
          className={cn(
            'flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold shadow-xs transition-all duration-200',
            getSeverityBadgeClass(severity),
            !enabled && 'opacity-50 grayscale border-dashed',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {renderSeverityIcon(severity)}
            <span className="truncate">
              {message.trim() || 'No broadcast message configured (banner is currently empty)'}
            </span>
          </div>
          <Badge variant="neutral" size="sm" className="shrink-0 uppercase text-[9px]">
            {enabled ? severity : 'Disabled'}
          </Badge>
        </div>
      </Card>

      {/* ── Announcement Configuration Form ────────────────────────── */}
      <Card
        variant="outlined"
        padding="lg"
        rounded="2xl"
        className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40"
      >
        <form onSubmit={handleBroadcast} className="space-y-5">
          {/* Active Broadcast Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20">
            <div>
              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                Broadcast Activation State
              </p>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                When enabled, the announcement immediately appears on all open browser sessions.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[var(--md-sys-color-surface-container-highest)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--md-sys-color-primary)]" />
            </label>
          </div>

          {/* Severity Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-2">
              Announcement Severity Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'info', label: 'Informational', icon: Info, color: 'text-[var(--md-sys-color-primary)]' },
                  { id: 'warning', label: 'Operational Warning', icon: AlertTriangle, color: 'text-[var(--md-sys-color-warning)]' },
                  { id: 'critical', label: 'Emergency / Outage', icon: AlertOctagon, color: 'text-[var(--md-sys-color-error)]' },
                  { id: 'success', label: 'Resolved / Normal', icon: CheckCircle, color: 'text-[var(--md-sys-color-success)]' },
                ] as const
              ).map((sev) => {
                const isSelected = severity === sev.id;
                const SevIcon = sev.icon;
                return (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => setSeverity(sev.id)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all select-none cursor-pointer',
                      isSelected
                        ? 'bg-[var(--md-sys-color-surface-container-high)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] shadow-xs'
                        : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]',
                    )}
                  >
                    <SevIcon className={cn('w-3.5 h-3.5 shrink-0', sev.color)} />
                    <span className="truncate">{sev.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1.5">
              Announcement Message
            </label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Scheduled database maintenance at 22:00 UTC. The system will remain online in read-only mode."
              required
              className="text-xs"
            />
            <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
              Supports plain text notices, links, and operational maintenance schedules.
            </p>
          </div>

          {/* Metadata Footer */}
          {banner?.updatedAt && (
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--md-sys-color-on-surface-variant)] pt-2 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Last broadcast: {new Date(banner.updatedAt).toLocaleString()}
              </span>
              {banner.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Broadcast author: {banner.author}
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="filled"
              disabled={updateMutation.isPending || !message.trim()}
              className="gap-2 text-xs font-bold px-5"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing Broadcast...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Real-Time Broadcast</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminAnnouncementsPage;
