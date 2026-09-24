import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { useBroadcast, type BroadcastSeverity } from '../../context/BroadcastContext';
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
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleMobile } = useSidebar();
  const { broadcast, isDismissed, dismissBroadcast } = useBroadcast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Severity styles for the DevOps broadcast banner stripe
  const severityStripe: Record<
    BroadcastSeverity,
    { bar: string; icon: React.FC<{ className?: string }> }
  > = {
    info: {
      bar: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
      icon: Info,
    },
    warning: {
      bar: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]',
      icon: AlertTriangle,
    },
    critical: {
      bar: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]',
      icon: ShieldAlert,
    },
    success: {
      bar: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]',
      icon: CheckCircle2,
    },
  };

  const currentStyle = severityStripe[broadcast.severity] ?? severityStripe.info;
  const BroadcastIcon = currentStyle.icon;

  const showBanner = broadcast.enabled && broadcast.message && !isDismissed;

  return (
    <header className="sticky top-0 z-20 w-full bg-[var(--md-sys-color-surface)] transition-colors select-none">
      {/* ── Main toolbar row ─────────────────────────────────── */}
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Left: mobile hamburger OR guest logo */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={toggleMobile}
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              title="Open mobile navigation"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-2.5 group transition-transform active:scale-95"
            >
              <div className="w-9 h-9 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5 transition-transform group-hover:rotate-12" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)]">
                  BugTracker
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold">
                  v3
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Center spacer — expands to push right section to the end */}
        <div className="flex-1" />

        {/* Right: theme toggle + user chip */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Authenticated user chip */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 h-11 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-all cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] active:scale-95 shadow-xs"
                  aria-label="User account menu"
                >
                  <Avatar
                    name={user.fullName || user.email}
                    avatarUrl={user.avatarUrl}
                    size="sm"
                  />
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors max-w-[120px] truncate">
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                    {user.systemRole === 'ADMIN' && (
                      <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] leading-none">
                        Admin
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)] transition-all group-hover:translate-y-0.5 shrink-0" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Profile summary card */}
                <div className="p-3 bg-[var(--md-sys-color-surface-container-low)] rounded-xl mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={user.fullName || user.email}
                      avatarUrl={user.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                        {user.fullName || 'User'}
                      </p>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between text-[10px]">
                    <span className="font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-mono">
                      {user.systemRole}
                    </span>
                    {user.twoFactorEnabled ? (
                      <span className="font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]">
                        2FA Active
                      </span>
                    ) : (
                      <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-70">
                        2FA Off
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu items */}
                <div className="space-y-0.5 text-xs font-medium">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  {user.systemRole === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-[var(--md-sys-color-warning)]" />
                        <span>Admin Center</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </div>

                <DropdownMenuSeparator className="my-1 bg-[var(--md-sys-color-outline-variant)]/30" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] cursor-pointer transition-colors"
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

      {/* ── DevOps Broadcast Banner — full-width stripe below toolbar ─── */}
      {showBanner && (
        <div
          className={`w-full flex items-center gap-3 px-4 sm:px-6 py-2 text-xs font-semibold transition-all ${currentStyle.bar} ${
            broadcast.severity === 'critical' ? 'animate-pulse' : ''
          }`}
          role="status"
          aria-live="polite"
        >
          <BroadcastIcon className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{broadcast.message}</span>
          <button
            type="button"
            onClick={dismissBroadcast}
            className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0"
            title="Dismiss announcement"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};
