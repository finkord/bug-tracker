import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { Avatar } from './Avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/Dropdown';
import {
  Shield,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldAlert,
  Menu,
  Clock,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Megaphone,
  Edit2,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export type HeaderMessageColor = 'blue' | 'amber' | 'rose' | 'emerald' | 'purple';

interface HeaderMessageConfig {
  text: string;
  color: HeaderMessageColor;
  enabled: boolean;
}

const DEFAULT_HEADER_CONFIG: HeaderMessageConfig = {
  text: '🚀 Sprint 1 Active — Submit daily worklogs and review board',
  color: 'blue',
  enabled: true,
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar, toggleMobile } = useSidebar();
  const navigate = useNavigate();

  // Header Announcement Banner State
  const [headerConfig, setHeaderConfig] = useState<HeaderMessageConfig>(() => {
    try {
      const saved = localStorage.getItem('bt_header_message_config');
      return saved ? JSON.parse(saved) : DEFAULT_HEADER_CONFIG;
    } catch {
      return DEFAULT_HEADER_CONFIG;
    }
  });

  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [draftText, setDraftText] = useState(headerConfig.text);
  const [draftColor, setDraftColor] = useState<HeaderMessageColor>(headerConfig.color);
  const [draftEnabled, setDraftEnabled] = useState(headerConfig.enabled);

  // Save announcement settings
  const handleSaveHeaderConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const nextConfig: HeaderMessageConfig = {
      text: draftText.trim(),
      color: draftColor,
      enabled: draftEnabled,
    };
    setHeaderConfig(nextConfig);
    localStorage.setItem('bt_header_message_config', JSON.stringify(nextConfig));
    setIsEditingMessage(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Color classes map for header banner
  const colorStyles: Record<HeaderMessageColor, { badge: string; icon: any }> = {
    blue: {
      badge: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/20',
      icon: Info,
    },
    amber: {
      badge: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] border border-[var(--md-sys-color-warning)]/20',
      icon: AlertTriangle,
    },
    rose: {
      badge: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/20',
      icon: ShieldAlert,
    },
    emerald: {
      badge: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border border-[var(--md-sys-color-success)]/20',
      icon: CheckCircle2,
    },
    purple: {
      badge: 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border border-[var(--md-sys-color-tertiary)]/20',
      icon: Megaphone,
    },
  };

  const CurrentIcon = colorStyles[headerConfig.color]?.icon || Info;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[var(--md-sys-color-surface)]/95 border-b border-[var(--md-sys-color-outline-variant)] transition-colors select-none">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Section: Sidebar Toggle + Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <>
              {/* Desktop Sidebar Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Toggle navigation sidebar"
                aria-label="Toggle navigation sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Mobile Drawer Toggle Button */}
              <button
                type="button"
                onClick={toggleMobile}
                className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Open mobile navigation"
                aria-label="Open mobile navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
          >
            <div className="w-9 h-9 rounded-[14px] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 transition-transform group-hover:rotate-12" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)]">
                BugTracker
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold">
                v2.0
              </span>
            </div>
          </Link>
        </div>

        {/* Center Section: Customizable Important Message Banner */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-2xl px-2">
          {user && (
            <div className="group relative flex items-center">
              {headerConfig.enabled && headerConfig.text ? (
                <div
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-2xs transition-all ${
                    colorStyles[headerConfig.color]?.badge || colorStyles.blue.badge
                  }`}
                >
                  <CurrentIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-md">{headerConfig.text}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftText(headerConfig.text);
                      setDraftColor(headerConfig.color);
                      setDraftEnabled(headerConfig.enabled);
                      setIsEditingMessage(true);
                    }}
                    className="p-1 rounded-md opacity-40 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    title="Edit custom announcement message"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingMessage(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-dashed border-[var(--md-sys-color-outline-variant)] transition-colors cursor-pointer"
                >
                  <Megaphone className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                  <span>+ Set Header Announcement</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Theme Toggle, Quick Docs, User Profile Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick External Swagger / Docs */}
          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
            title="Swagger Interactive API Documentation"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Authenticated User Menu vs Guest Buttons */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
                  aria-label="User account menu"
                >
                  <Avatar
                    name={user.fullName || user.email}
                    avatarUrl={user.avatarUrl}
                    size="sm"
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] max-w-[110px] truncate leading-tight">
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] font-semibold uppercase leading-tight">
                      {user.systemRole}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 p-2 space-y-1 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-xl z-50"
              >
                {/* User info card */}
                <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] space-y-1 select-none">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                    {user.email}
                  </p>
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-mono">
                      {user.systemRole}
                    </span>
                    {user.twoFactorEnabled && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]">
                        2FA Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Dropdown Links */}
                <div className="pt-1 space-y-0.5 text-xs font-medium">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      <span>Profile & Security</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile?tab=time"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>My Time & Achievements</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      to="/time-tracking"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span>Team Time Tracking</span>
                    </Link>
                  </DropdownMenuItem>

                  {user.systemRole === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span>Admin Center</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </div>

                <DropdownMenuSeparator className="my-1 bg-[var(--md-sys-color-outline-variant)]" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs hover:opacity-90 active:scale-95 transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Custom Header Announcement Modal */}
      {isEditingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[28px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Custom Header Message
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingMessage(false)}
                className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeaderConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                  Announcement Message
                </label>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={2}
                  required
                  placeholder="e.g. 🚀 Release v2.1 scheduled for Friday 18:00 UTC"
                  className="w-full text-xs p-3 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
                />
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                  Banner Color Theme
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['blue', 'amber', 'rose', 'emerald', 'purple'] as HeaderMessageColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDraftColor(c)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold capitalize transition-all cursor-pointer ${
                        colorStyles[c].badge
                      } ${draftColor === c ? 'ring-2 ring-offset-2 ring-primary scale-105' : 'opacity-70 hover:opacity-100'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enable / Disable Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  Show banner in header
                </span>
                <input
                  type="checkbox"
                  checked={draftEnabled}
                  onChange={(e) => setDraftEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsEditingMessage(false)}
                  className="px-4 py-2 rounded-full m3-btn-outline text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full m3-btn-filled text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Save Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
