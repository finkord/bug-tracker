import React from 'react';
import { Check } from 'lucide-react';

interface Props {
  password: string;
}

export const PasswordStrengthMeter: React.FC<Props> = ({ password }) => {
  const criteria = [
    { label: '8+ Characters', met: password.length >= 8, fullWidth: true },
    { label: 'Uppercase Letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase Letter', met: /[a-z]/.test(password) },
    { label: 'Number (0-9)', met: /\d/.test(password) },
    {
      label: 'Special Symbol',
      met: /[@$!%*?&^#()_+={}[\]:;"'<>,./\\|~-]/.test(password),
    },
  ];

  const score = criteria.filter((c) => c.met).length;

  const getColor = () => {
    if (score <= 2) return 'bg-[var(--md-sys-color-error)]';
    if (score <= 4) return 'bg-[var(--md-sys-color-warning)]';
    return 'bg-[var(--md-sys-color-success)]';
  };

  const getLabel = () => {
    if (!password) return 'Password strength';
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Moderate';
    return 'Strong & Compliant';
  };

  return (
    <div className="space-y-2.5 mt-2.5" role="region" aria-label="Password strength and requirements">
      {/* Progress bar header */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-[var(--md-sys-color-on-surface-variant)]">Security requirements:</span>
        <span
          className={`font-semibold transition-colors ${
            score === 5
              ? 'text-[var(--md-sys-color-success)]'
              : score >= 3
              ? 'text-[var(--md-sys-color-warning)]'
              : 'text-[var(--md-sys-color-error)]'
          }`}
          aria-live="polite"
        >
          {getLabel()}
        </span>
      </div>

      {/* Progress Bar (M3 Linear Progress) */}
      <div
        className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label="Password strength score"
      >
        <div
          className={`h-full transition-all duration-300 rounded-full ${getColor()}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>

      {/* Material 3 Expressive Requirement Chips */}
      <div
        className="grid grid-cols-2 gap-1.5 pt-1"
        role="list"
        aria-label="Password requirements checklist"
      >
        {criteria.map((item, idx) => (
          <div
            key={idx}
            role="listitem"
            aria-label={`${item.label}, ${item.met ? 'satisfied' : 'not satisfied'}`}
            className={`${
              item.fullWidth ? 'col-span-2' : 'col-span-1'
            } inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border whitespace-nowrap select-none ${
              item.met
                ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border-[var(--md-sys-color-success)]/30 shadow-2xs'
                : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]/80 border-[var(--md-sys-color-outline-variant)]/40'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                item.met
                  ? 'bg-[var(--md-sys-color-success)] text-[var(--md-sys-color-on-success)]'
                  : 'bg-[var(--md-sys-color-surface-container-highest)] text-transparent'
              }`}
            >
              {item.met ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-[var(--md-sys-color-outline)]" />
              )}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
