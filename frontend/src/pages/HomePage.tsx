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
      task: 'SDSecurity Task 1',
      description: 'Strict 8+ char policy with uppercase, numbers, and symbols. Hashed using memory-hard Argon2id.',
      icon: Lock,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Bot Verification (CAPTCHA)',
      task: 'SDSecurity Task 2',
      description: 'Zero-trust registration pipeline with bot analysis and test bypass verification.',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Email Account Activation',
      task: 'SDSecurity Task 3',
      description: 'Single-use 24h cryptographic token delivered to local Mailpit inbox with one-click verification.',
      icon: CheckCircle,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Brute-Force Lockout & Audit',
      task: 'SDSecurity Task 4',
      description: '5 consecutive failed attempts trigger a 15-minute lockout. Forensic logging of IP, agent, and status.',
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Two-Factor TOTP (RFC 6238)',
      task: 'SDSecurity Task 5',
      description: 'Google Authenticator / Authy integration with Base64 QR code and dynamic challenge tokens.',
      icon: KeyRound,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'OAuth2 & Password Reset',
      task: 'SDSecurity Tasks 6 & 7',
      description: 'GitHub OAuth2 identity federation and 15-minute cryptographic password recovery tokens.',
      icon: Sparkles,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>PPofSE Lab 6–7 & SDSecurity Lab 6 Enterprise Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading text-white">
          Enterprise Security & <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
            Issue Tracking System
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          High-performance modular monolith built with <strong>NestJS 12</strong>, <strong>React 19 (Vite)</strong>, and <strong>Tailwind CSS</strong> with Material 3 expressive styling. Fully implements all 7 cybersecurity access controls.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {user ? (
            <Link
              to="/profile"
              className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <span>View Security Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <span>Create Protected Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all active:scale-95"
              >
                Sign In
              </Link>
            </>
          )}

          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-sm font-medium flex items-center gap-2 transition-all"
          >
            <span>Interactive Swagger API</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="p-6 rounded-3xl m3-surface text-slate-200 border border-slate-700/80 shadow-xl space-y-3 hover:border-slate-600 transition-all hover:translate-y-[-2px]"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {f.task}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
