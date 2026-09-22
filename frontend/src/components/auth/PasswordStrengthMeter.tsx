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
    if (score <= 2) return 'bg-rose-500';
    if (score <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
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
        <span className="text-slate-400">Security Policy (SDSecurity Task 1):</span>
        <span
          className={`font-semibold ${
            score === 5
              ? 'text-emerald-400'
              : score >= 3
              ? 'text-amber-400'
              : 'text-rose-400'
          }`}
        >
          {getLabel()}
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${getColor()}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>

      {/* Criteria checklist chips */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
              item.met
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
            }`}
          >
            {item.met ? (
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-600 shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
