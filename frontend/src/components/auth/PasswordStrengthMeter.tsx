import React from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  password: string;
}

export const PasswordStrengthMeter: React.FC<Props> = ({ password }) => {
  const criteria = [
    { label: '8+ Characters', met: password.length >= 8 },
    { label: 'Uppercase Letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase Letter', met: /[a-z]/.test(password) },
    { label: 'Number (0-9)', met: /\d/.test(password) },
    {
      label: 'Special Symbol',
      met: /[@$!%*?&^#()_+={}\[\]:;"'<>,.\/\\|~-]/.test(password),
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
    <div className="space-y-2 mt-2">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-[var(--md-sys-color-on-surface-variant)]">Security requirements:</span>
        <span
          className={`font-semibold ${
            score === 5
              ? 'text-[var(--md-sys-color-success)]'
              : score >= 3
              ? 'text-[var(--md-sys-color-warning)]'
              : 'text-[var(--md-sys-color-error)]'
          }`}
        >
          {getLabel()}
        </span>
      </div>

      <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${getColor()}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>

      {/* Criteria checklist chips */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] transition-all duration-200 ${
              item.met
                ? 'bg-[var(--md-sys-color-success-container)] border-transparent text-[var(--md-sys-color-on-success-container)] font-medium shadow-xs scale-[1.02]'
                : 'bg-[var(--md-sys-color-surface-container-high)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-outline)]'
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-success)] shrink-0 animate-in zoom-in-75" />
            ) : (
              <X className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
