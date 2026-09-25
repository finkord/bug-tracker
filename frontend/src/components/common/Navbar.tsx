import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBroadcast, type BroadcastSeverity } from '../../context/BroadcastContext';
import { useSidebar } from '../../context/SidebarContext';
import { Avatar } from './Avatar';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
  Menu,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/Dropdown';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { broadcast, isDismissed, dismissBroadcast } = useBroadcast();
  const { toggleMobile } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

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

  const showBanner = broadcast.enabled && !!broadcast.message && !isDismissed;
  const { bar, icon: BroadcastIcon } = severityStripe[broadcast.severity] ?? severityStripe.info;

  return (
    <header
      className={`sticky top-0 z-30 w-full h-16 flex items-center px-4 sm:px-6 gap-3 transition-colors duration-200 backdrop-blur-md border-b border-[var(--md-sys-color-outline-variant)]/15 pt-1 ${
        showBanner
          ? `${bar} shadow-xs`
          : 'bg-[var(--md-sys-color-surface-container-low)]/80'
      }`}
    >
      {/* Mobile Hamburger toggle (visible only on mobile) */}
      <button
        type="button"
        onClick={toggleMobile}
        className="md:hidden p-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0 transition-colors"
        aria-label="Open sidebar navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* DevOps Banner Content — consumes all horizontal space except sidebar & avatar chip */}
      {showBanner ? (
        <div
          className={`flex-1 flex items-center gap-2.5 text-xs font-semibold select-none min-w-0 ${
            broadcast.severity === 'critical' ? 'animate-pulse' : ''
          }`}
          role="status"
          aria-live="polite"
        >
          <BroadcastIcon className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate text-xs sm:text-sm font-medium">
            {broadcast.message}
          </span>
          <button
            type="button"
            onClick={dismissBroadcast}
            className="p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0"
            title="Dismiss announcement"
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex-1 min-w-0" />
      )}

      {/* User Profile Avatar in Header Right Corner */}
      <div className="shrink-0 ml-auto flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="User account menu"
              className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] active:scale-[0.98] ${
                showBanner
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs hover:bg-[var(--md-sys-color-surface-container-high)]'
                  : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <Avatar name={user.fullName || user.email} avatarUrl={user.avatarUrl} size="sm" />
              <div className="hidden sm:flex flex-col text-left leading-tight min-w-0 max-w-[150px]">
                <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                  {user.fullName || user.email.split('@')[0]}
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                  {user.systemRole}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="bottom"
            className="w-64 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Profile summary */}
            <div className="p-3 bg-[var(--md-sys-color-surface-container-low)] rounded-xl mb-1.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={user.fullName || user.email} avatarUrl={user.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                    {user.fullName || 'User'}
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">{user.email}</p>
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
                  <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-70">2FA Off</span>
                )}
              </div>
            </div>

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
      </div>
    </header>
  );
};
