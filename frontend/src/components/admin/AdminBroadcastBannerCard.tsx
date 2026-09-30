import React, { useState, useEffect } from 'react';
import { useSystemBannerQuery, useUpdateSystemBannerMutation } from '../../api/queries/useSystemBannerQuery.js';
import type { BroadcastSeverity } from '../../store/useBroadcastStore.js';
import { Card, Button } from '../ui/index.js';
import {
  Megaphone,
  Radio,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  Send,
  Loader2,
} from 'lucide-react';

export const AdminBroadcastBannerCard: React.FC = () => {
  const { data: banner, isLoading } = useSystemBannerQuery();
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
      setSuccessFeedback('Broadcast updated and pushed to all active sessions via WebSockets');
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
    <Card className="p-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container-low)] shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              System Broadcast Announcement
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                <Radio className="w-2.5 h-2.5 text-[var(--md-sys-color-primary)] animate-pulse" />
                Live WebSocket Push
              </span>
            </h3>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Broadcast critical maintenance windows, notices, or operational updates to all connected users
            </p>
          </div>
        </div>

        {/* Enabled Toggle Switch */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
            {enabled ? 'Banner Active' : 'Banner Inactive'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              enabled
                ? 'bg-[var(--md-sys-color-primary)]'
                : 'bg-[var(--md-sys-color-surface-container-highest)]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {successFeedback && (
        <div className="flex items-center gap-2 p-3 bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] rounded-2xl text-xs font-medium">
          <CheckCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
          {successFeedback}
        </div>
      )}

      {updateMutation.isError && (
        <div className="flex items-center gap-2 p-3 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] rounded-2xl text-xs font-medium">
          <AlertOctagon className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
          Failed to push broadcast banner to Redis / WebSockets.
        </div>
      )}

      <form onSubmit={handleBroadcast} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Broadcast Message
            </label>
            <input
              type="text"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Scheduled maintenance in 15 minutes. Save your changes."
              disabled={isLoading || updateMutation.isPending}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Alert Severity Level
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['info', 'warning', 'critical', 'success'] as BroadcastSeverity[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`py-2 px-1 text-[11px] font-bold rounded-xl capitalize transition-all border text-center ${
                    severity === level
                      ? getSeverityBadgeClass(level) + ' ring-2 ring-[var(--md-sys-color-primary)]/30'
                      : 'border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Bar */}
        <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)]/70 border border-[var(--md-sys-color-outline-variant)]/30 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
            Preview of Active Top Banner
          </span>
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border ${getSeverityBadgeClass(
              severity,
            )} ${enabled ? 'opacity-100' : 'opacity-40 line-through'}`}
          >
            {renderSeverityIcon(severity)}
            <span className="flex-1 truncate">{message || 'No broadcast message specified'}</span>
            {!enabled && (
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                (Disabled)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
            {banner?.author && `Last broadcasted by ${banner.author} at ${new Date(banner.updatedAt).toLocaleTimeString()}`}
          </p>

          <Button
            type="submit"
            variant="filled"
            size="sm"
            isLoading={updateMutation.isPending}
            disabled={!message.trim() || updateMutation.isPending}
            className="gap-1.5"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Broadcasting...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Publish Broadcast
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
