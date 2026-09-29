import React from 'react';
import { Clock, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const SessionExpiredModal: React.FC = () => {
  const sessionExpiredOpen = useAuthStore((state) => state.sessionExpiredOpen);
  const setSessionExpiredOpen = useAuthStore((state) => state.setSessionExpiredOpen);

  if (!sessionExpiredOpen) {
    return null;
  }

  const handleSignInAgain = () => {
    setSessionExpiredOpen(false);
    window.location.href = '/login';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-[28px] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 id="session-expired-title" className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
            Session Expired
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            Your 8-hour working session has expired or could not be renewed automatically.
            Please sign in again to continue your work.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSignInAgain}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold text-xs shadow-xs hover:opacity-90 active:scale-98 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
