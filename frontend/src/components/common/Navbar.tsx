import React from 'react';
import { useBroadcast, type BroadcastSeverity } from '../../context/BroadcastContext';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';

// Navbar is now exclusively the DevOps broadcast stripe.
// Theme toggle, avatar chip, and mobile menu have moved to Sidebar.
// When no banner is active this renders nothing — zero height, no overlap.
export const Navbar: React.FC = () => {
  const { broadcast, isDismissed, dismissBroadcast } = useBroadcast();

  const severityStripe: Record<
    BroadcastSeverity,
    { bar: string; icon: React.FC<{ className?: string }> }
  > = {
    info: {
      bar: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
      icon: Info,
    },
    warning: {
      bar: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]',
      icon: AlertTriangle,
    },
    critical: {
      bar: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]',
      icon: ShieldAlert,
    },
    success: {
      bar: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]',
      icon: CheckCircle2,
    },
  };

  const showBanner = broadcast.enabled && !!broadcast.message && !isDismissed;
  if (!showBanner) return null;

  const { bar, icon: BroadcastIcon } = severityStripe[broadcast.severity] ?? severityStripe.info;

  return (
    <div
      className={`sticky top-0 z-20 w-full flex items-center gap-3 px-4 sm:px-6 py-2 text-xs font-semibold select-none ${bar} ${
        broadcast.severity === 'critical' ? 'animate-pulse' : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <BroadcastIcon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{broadcast.message}</span>
      <button
        type="button"
        onClick={dismissBroadcast}
        className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0"
        title="Dismiss announcement"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
