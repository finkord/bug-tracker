import React from 'react';
import { UserCheck, Shield, Briefcase, Code } from 'lucide-react';

interface DemoAccountsPickerProps {
  onSelectAccount: (email: string, password: string) => void;
  disabled?: boolean;
}

interface DemoUser {
  label: string;
  role: string;
  email: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_USERS: DemoUser[] = [
  {
    label: 'Volodymyr (Admin)',
    role: 'Admin',
    email: 'volodymyr@bugtracker.local',
    icon: Shield,
  },
  {
    label: 'Alex (PM)',
    role: 'Project Manager',
    email: 'alex.mercer@bugtracker.local',
    icon: Briefcase,
  },
  {
    label: 'Sonya (Dev)',
    role: 'Developer',
    email: 'sonya@bugtracker.local',
    icon: Code,
  },
];

/**
 * Material 3 Quick Account Fill Picker for development & testing.
 */
export const DemoAccountsPicker: React.FC<DemoAccountsPickerProps> = ({
  onSelectAccount,
  disabled = false,
}) => {
  return (
    <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/60">
      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
        <UserCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        <span>Quick Test Accounts (Password: Password123!)</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {DEMO_USERS.map((user) => {
          const Icon = user.icon;
          return (
            <button
              key={user.email}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAccount(user.email, 'Password123!')}
              className="px-2 py-1.5 rounded-[12px] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-[11px] font-medium flex items-center justify-center gap-1 border border-[var(--md-sys-color-outline-variant)]/50 transition-colors active:scale-95 disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="truncate">{user.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
