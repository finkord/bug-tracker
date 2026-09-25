import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--md-sys-color-surface-container-low)] border-t border-[var(--md-sys-color-outline-variant)]/15 transition-colors duration-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Identity & Summary */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)]">
                BugTracker
              </span>
            </Link>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              High-performance developer issue tracking platform with zero-trust security and agile workflows.
            </p>
          </div>

          {/* Product Capabilities */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] mb-3">
              Product
            </h3>
            <ul className="space-y-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <li>
                <Link to="/login" className="hover:text-[var(--md-sys-color-primary)] transition-colors">
                  Agile Kanban Board
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[var(--md-sys-color-primary)] transition-colors">
                  Backlog & Sprints
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[var(--md-sys-color-primary)] transition-colors">
                  Effort & Time Tracking
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[var(--md-sys-color-primary)] transition-colors">
                  Zero-Trust 2FA & Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Developer Tools */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] mb-3">
              Developer Tools
            </h3>
            <ul className="space-y-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <li>
                <a
                  href="http://localhost:3000/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--md-sys-color-primary)] transition-colors inline-flex items-center gap-1"
                >
                  <span>Swagger OpenAPI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8025"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--md-sys-color-primary)] transition-colors inline-flex items-center gap-1"
                >
                  <span>Local Mailpit Inbox</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-[11px] opacity-75">NestJS & PostgreSQL Architecture</span>
              </li>
            </ul>
          </div>

          {/* Account Access */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] mb-3">
              Account
            </h3>
            <ul className="space-y-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <li>
                <Link to="/login" className="hover:text-[var(--md-sys-color-primary)] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[var(--md-sys-color-primary)] transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-[var(--md-sys-color-primary)] transition-colors">
                  Forgot Password
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & System Status */}
        <div className="pt-6 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <p>© {new Date().getFullYear()} BugTracker Platform. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-success)] animate-pulse" />
            <span className="font-medium text-[11px]">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
