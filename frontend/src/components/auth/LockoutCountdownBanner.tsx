import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LockoutCountdownBannerProps {
  initialSeconds: number;
  onTimerExpired: () => void;
}

/**
 * Material 3 Warning Banner displaying real-time countdown for brute-force lockouts.
 */
export const LockoutCountdownBanner: React.FC<LockoutCountdownBannerProps> = ({
  initialSeconds,
  onTimerExpired,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);

  useEffect(() => {
    setRemainingSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onTimerExpired();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimerExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, onTimerExpired]);

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (remainingSeconds <= 0) return null;

  return (
    <div
      role="alert"
      className="mb-4 p-4 rounded-[20px] bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] space-y-1.5 animate-in slide-in-from-top-2 border border-[var(--md-sys-color-warning)]/20 shadow-xs"
    >
      <div className="flex items-center gap-2 font-bold text-sm">
        <Clock className="w-4 h-4 animate-pulse" />
        <span>Account Temporarily Locked</span>
      </div>
      <p className="text-xs opacity-90 leading-relaxed">
        Consecutive failed login attempts detected. Protection lockout active:
      </p>
      <div className="text-2xl font-mono font-bold text-center py-1">
        {formatLockoutTime(remainingSeconds)}
      </div>
    </div>
  );
};
