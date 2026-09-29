import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
  Maximize2,
} from 'lucide-react';
import { useBroadcast, type BroadcastSeverity } from '../../store';
import { Modal, Button } from '../ui';

const severityStripe: Record<
  BroadcastSeverity,
  { bar: string; icon: React.FC<{ className?: string }>; title: string }
> = {
  info: {
    bar: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
    icon: Info,
    title: 'Information / Release Announcement',
  },
  warning: {
    bar: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]',
    icon: AlertTriangle,
    title: 'Scheduled Maintenance / Warning',
  },
  critical: {
    bar: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]',
    icon: ShieldAlert,
    title: 'Critical Incident Notice',
  },
  success: {
    bar: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]',
    icon: CheckCircle2,
    title: 'System Operational / Resolved',
  },
};

/**
 * DevOps broadcast announcement banner with animated marquee and details modal.
 */
export const WorkspaceBroadcastBanner: React.FC = () => {
  const { broadcast, isDismissed, dismissBroadcast } = useBroadcast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showBanner = broadcast.enabled && Boolean(broadcast.message) && !isDismissed;
  if (!showBanner) return null;

  const { bar, icon: BroadcastIcon, title: severityTitle } =
    severityStripe[broadcast.severity] ?? severityStripe.info;

  return (
    <>
      <div
        className={`flex-1 flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-xl min-w-0 overflow-hidden select-none ${bar} ${
          broadcast.severity === 'critical' ? 'animate-pulse' : ''
        }`}
        role="status"
        aria-live="polite"
      >
        <BroadcastIcon className="w-3.5 h-3.5 shrink-0" />

        <div
          onClick={() => setIsModalOpen(true)}
          className="flex-1 overflow-hidden relative flex items-center cursor-pointer group py-0.5"
          title="Click to view full announcement details"
        >
          <div className="animate-banner-marquee flex items-center gap-16 group-hover:[animation-play-state:paused]">
            <span className="text-xs font-medium whitespace-nowrap">{broadcast.message}</span>
            <span className="text-xs font-medium opacity-90 whitespace-nowrap">{broadcast.message}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0"
          title="Read full announcement in popup"
          aria-label="Read full announcement in popup"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={dismissBroadcast}
          className="p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0"
          title="Dismiss announcement"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Full announcement modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={severityTitle}
        size="md"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${bar} shrink-0`}>
              <BroadcastIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                System Broadcast
              </h4>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed whitespace-pre-wrap">
                {broadcast.message}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="tonal" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
