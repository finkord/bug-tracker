import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
import { ShieldAlert, ArrowRight } from 'lucide-react';

/**
 * Material 3 Administrator Forensics & Security Center shortcut card.
 */
export const ProfileAdminBanner: React.FC = () => {
  const { user } = useAuth();

  if (user?.systemRole !== 'ADMIN') return null;

  return (
    <div className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-3 md:col-span-2 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-warning)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            Admin Forensics & Access Control
          </h3>
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Review forensic logs, IP telemetry, and user credentials
          </p>
        </div>
      </div>

      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
        As a system administrator, you have permission to manage global users, inspect audit trails, and configure security parameters.
      </p>

      <div>
        <Link to="/admin">
          <Button
            type="button"
            variant="filled"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Open Admin Control Center
          </Button>
        </Link>
      </div>
    </div>
  );
};
