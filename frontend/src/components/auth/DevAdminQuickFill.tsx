import React, { useState } from 'react';
import { Zap, Check } from 'lucide-react';

interface DevAdminQuickFillProps {
  onFill: (email: string, pass: string) => void;
  disabled?: boolean;
}

/**
 * Developer quick-fill utility structured identically to form input fields.
 * Automatically stripped from production bundles.
 */
export const DevAdminQuickFill: React.FC<DevAdminQuickFillProps> = ({
  onFill,
  disabled = false,
}) => {
  const [justFilled, setJustFilled] = useState(false);

  if (!import.meta.env.DEV) {
    return null;
  }

  const adminEmail = import.meta.env.VITE_INITIAL_ADMIN_EMAIL || 'admin@bugtracker.local';
  const adminPassword = import.meta.env.VITE_INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';

  const handleFill = () => {
    onFill(adminEmail, adminPassword);
    setJustFilled(true);
    setTimeout(() => setJustFilled(false), 1800);
  };

  return (
    <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 flex items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center shrink-0 shadow-2xs">
          <Zap className="w-4 h-4 fill-[var(--md-sys-color-primary)]/20" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] leading-tight">
            Quick Fill
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-normal truncate">
            Auto-fill demo administrator credentials
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Auto-fill administrator credentials"
        disabled={disabled}
        onClick={handleFill}
        className={`shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer ${
          justFilled
            ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
            : 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-110'
        }`}
      >
        {justFilled ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Filled</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Auto-Fill</span>
          </>
        )}
      </button>
    </div>
  );
};
