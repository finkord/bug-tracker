import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../ui';
import {
  Shield,
  ArrowRight,
  Kanban,
  Clock,
  Lock,
} from 'lucide-react';

export const GuestHeroSection: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-4xl mx-auto px-4 py-12 space-y-10 animate-in fade-in duration-300 text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-xs font-bold text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)]/40 shadow-2xs">
        <Shield className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
        <span>Unified Bug Tracking & Enterprise Security Platform</span>
      </div>

      {/* Hero Title */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--md-sys-color-on-surface)] leading-tight">
          Developer Issues with <br />
          <span className="text-[var(--md-sys-color-primary)]">Enterprise Security</span>
        </h1>
        <p className="text-sm sm:text-base text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          High-performance issue tracking built for modern engineering teams. Powered by NestJS, React 19, Material 3 Expressive aesthetics, and zero-trust authentication.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
        <Link to="/register" className="w-full sm:w-auto flex-1">
          <Button
            type="button"
            variant="filled"
            size="lg"
            className="w-full shadow-xs"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </Link>
        <Link to="/login" className="w-full sm:w-auto flex-1">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
          >
            Sign In
          </Button>
        </Link>
      </div>

      {/* Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4 text-left">
        <Card variant="outlined" padding="md" rounded="xl" className="space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <Kanban className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          </div>
          <h2 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
            Agile Kanban Boards
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            5-column FSM workflow, drag-and-drop cards, and live triage.
          </p>
        </Card>

        <Card variant="outlined" padding="md" rounded="xl" className="space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[var(--md-sys-color-secondary)]" />
          </div>
          <h2 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
            Zero-Trust Security
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            Argon2id hashing, RFC 6238 2FA TOTP, Turnstile bot defense.
          </p>
        </Card>

        <Card variant="outlined" padding="md" rounded="xl" className="space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center">
            <Clock className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" />
          </div>
          <h2 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
            Effort & Time Tracking
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            Log developer hours, track sprint progress, and inspect team velocity.
          </p>
        </Card>
      </div>
    </div>
  );
};

