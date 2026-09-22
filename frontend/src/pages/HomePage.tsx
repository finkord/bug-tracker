import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Argon2id Password Security',
      tag: 'Cryptography',
      description: 'Strict 8+ character policy with uppercase, numbers, and symbols. Hashed using memory-hard Argon2id.',
      icon: Lock,
      iconBg: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
    },
    {
      title: 'Zero-Trust Bot Verification',
      tag: 'Anti-Automation',
      description: 'Interactive challenge analysis ensuring human enrollment and preventing automated brute-force attacks.',
      icon: ShieldCheck,
      iconBg: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]',
    },
    {
      title: 'Single-Use Email Verification',
      tag: 'Activation',
      description: 'Cryptographic 24-hour verification token dispatched to local Mailpit inbox with one-click verification.',
      icon: CheckCircle,
      iconBg: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]',
    },
    {
      title: 'Brute-Force Lockout & Audit',
      tag: 'Rate Limiting',
      description: '5 consecutive failed attempts trigger a 15-minute temporary lockout. Forensic audit logs of IP, agent, and status.',
      icon: Clock,
      iconBg: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]',
    },
    {
      title: 'Two-Factor TOTP (RFC 6238)',
      tag: 'Two-Step Verification',
      description: 'Google Authenticator, Authy, and Microsoft Authenticator integration with QR code and dynamic challenge tokens.',
      icon: KeyRound,
      iconBg: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
    },
    {
      title: 'Federated OAuth2 & Recovery',
      tag: 'Identity & Tokens',
      description: 'GitHub OAuth2 identity federation and 15-minute cryptographic password recovery tokens with automatic lockout release.',
      icon: Sparkles,
      iconBg: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <Shield className="w-3.5 h-3.5" />
          <span>Unified Issue Tracking & Security Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] leading-tight">
          Issue Tracking with <br />
          <span className="text-[var(--md-sys-color-primary)]">
            Enterprise Security
          </span>
        </h1>

        <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Built with <strong>NestJS</strong>, <strong>React</strong>, and Google Pixel <strong>Material 3 Expressive</strong> styling. Designed for high performance, deep security forensics, and effortless collaboration.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          {user ? (
            <Link
              to="/profile"
              className="px-6 py-3 rounded-full m3-btn-filled text-sm flex items-center gap-2 shadow-sm"
            >
              <span>View Security Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-6 py-3 rounded-full m3-btn-filled text-sm flex items-center gap-2 shadow-sm"
              >
                <span>Create Protected Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-full m3-btn-outline text-sm"
              >
                Sign In
              </Link>
            </>
          )}

          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-full m3-card-high hover:opacity-90 text-[var(--md-sys-color-on-surface)] text-sm font-medium flex items-center gap-2 transition-all border border-[var(--md-sys-color-outline-variant)]"
          >
            <span>Swagger API Docs</span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)]" />
          </a>
        </div>
      </div>

      {/* Feature Grid - Google Pixel Squircle Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="p-6 m3-tile space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${f.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]">
                  {f.tag}
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">{f.title}</h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
