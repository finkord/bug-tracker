import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBroadcast, type BroadcastSeverity } from '../../context/BroadcastContext';
import { useSidebar } from '../../context/SidebarContext';
import { Avatar } from './Avatar';
import { IssueModal } from '../kanban/IssueModal';
import { Modal, Button } from '../ui';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
  Menu,
  User,
  Edit3,
  Sliders,
  LogOut,
  ChevronDown,
  Search,
  Plus,
  Sun,
  Moon,
  Maximize2,
  Shield,
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
  const { theme, toggleTheme } = useTheme();
  const { broadcast, isDismissed, dismissBroadcast } = useBroadcast();
  const { toggleMobile } = useSidebar();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const severityStripe: Record<
    BroadcastSeverity,
    { bar: string; icon: React.FC<{ className?: string }>; title: string }
  > = {
    info: {
      bar: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
      icon: Info,
      title: 'Information / Release Announcement',
    },
    warning: {
      bar: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]',
      icon: AlertTriangle,
      title: 'Scheduled Maintenance / Warning',
    },
    critical: {
      bar: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]',
      icon: ShieldAlert,
      title: 'Critical Incident Notice',
    },
    success: {
      bar: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]',
      icon: CheckCircle2,
      title: 'System Operational / Resolved',
    },
  };

  // Announcement banner is exclusively shown for authenticated logged-in users
  const showBanner = Boolean(user) && broadcast.enabled && !!broadcast.message && !isDismissed;
  const { bar, icon: BroadcastIcon, title: severityTitle } = severityStripe[broadcast.severity] ?? severityStripe.info;

  return (
    <>
      <header
        className={`sticky top-0 z-30 w-full h-16 flex items-center pr-4 sm:pr-6 gap-3 transition-colors duration-200 backdrop-blur-md border-b border-[var(--md-sys-color-outline-variant)]/15 pt-1 ${
          showBanner
            ? `${bar} shadow-xs`
            : 'bg-[var(--md-sys-color-surface-container-low)]/90'
        } ${user ? 'pl-0' : 'pl-4 sm:pl-6'}`}
      >
        {/* Left side: Brand Logo (icon centered in 72px rail slot + text) + Mobile Hamburger */}
        {user ? (
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center group" title="BugTracker">
              <div className="w-[72px] shrink-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs transition-all duration-150 group-hover:brightness-115">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <span className="font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)] leading-none hidden sm:inline-block pr-3">
                BugTracker
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleMobile}
              className="md:hidden p-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0 transition-colors"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0" title="BugTracker">
              <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs transition-all duration-150 group-hover:brightness-115">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)] leading-none hidden sm:inline-block">
                BugTracker
              </span>
            </Link>
          </div>
        )}

        {/* DevOps Banner Content with Marquee Slide & Click-to-Read Popup */}
        {showBanner ? (
          <div
            className={`flex-1 flex items-center gap-2 text-xs font-semibold select-none min-w-0 overflow-hidden ${broadcast.severity === 'critical' ? 'animate-pulse' : ''
              }`}
            role="status"
            aria-live="polite"
          >
            <BroadcastIcon className="w-4 h-4 shrink-0" />

            {/* Sliding text in continuous cycle with hover-pause + click to popup */}
            <div
              onClick={() => setIsBannerModalOpen(true)}
              className="flex-1 overflow-hidden relative flex items-center cursor-pointer group py-1"
              title="Click to view full announcement details"
            >
              <div className="animate-banner-marquee flex items-center gap-16 group-hover:[animation-play-state:paused]">
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{broadcast.message}</span>
                <span className="text-xs sm:text-sm font-medium opacity-90 whitespace-nowrap">{broadcast.message}</span>
              </div>
            </div>

            {/* Read / Expand Popup Icon Button */}
            <button
              type="button"
              onClick={() => setIsBannerModalOpen(true)}
              className="p-1.5 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0"
              title="Read full announcement in popup"
              aria-label="Read full announcement in popup"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Dismiss Announcement Button */}
            <button
              type="button"
              onClick={dismissBroadcast}
              className="p-1.5 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer shrink-0"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 min-w-0" />
        )}

        {/* Right side controls: Authenticated Workspace Tools VS Guest Navigation */}
        {user ? (
          <div className="shrink-0 flex items-center gap-2.5">
            {/* GitLab-style Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or go to..."
                className="w-32 sm:w-52 md:w-60 h-9 pl-9 pr-8 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
              />
              <kbd className="hidden sm:inline-flex items-center justify-center absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-lowest)] rounded border border-[var(--md-sys-color-outline-variant)]/40 pointer-events-none">
                /
              </kbd>
            </form>

            {/* Create Ticket / New Issue Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              title="Create new issue / ticket"
              aria-label="Create new issue / ticket"
              className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-115 active:scale-95 flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* User Avatar Trigger Button (Containerless, standalone circular avatar) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="User account menu"
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] active:scale-95 transition-all shrink-0 cursor-pointer hover:opacity-90 shadow-xs"
                >
                  <Avatar name={user.fullName || user.email} avatarUrl={user.avatarUrl} size="md" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                side="bottom"
                className="w-64 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-[var(--md-sys-color-outline-variant)]/20"
              >
                {/* Profile summary banner */}
                <div className="px-3 py-2.5 bg-[var(--md-sys-color-surface-container-low)] rounded-xl mb-1.5">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                    {user.fullName || 'User'}
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">{user.email}</p>
                </div>

                {/* Action Buttons: Profile, Edit Profile, Preferences, Theme */}
                <div className="space-y-0.5 text-xs font-medium">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile?edit=true"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      <span>Edit Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      to="/preferences"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      <span>Preferences</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={toggleTheme}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-500" />
                      )}
                      <span>Theme</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)]">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </DropdownMenuItem>
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
        ) : (
          <div className="shrink-0 flex items-center gap-2">
            {/* Guest Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Sign In Link */}
            <Link
              to="/login"
              className="h-9 px-3.5 rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all flex items-center justify-center active:scale-95"
            >
              Sign In
            </Link>

            {/* Create Account Link */}
            <Link
              to="/register"
              className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-115 active:scale-95 transition-all flex items-center justify-center shadow-xs"
            >
              Create Account
            </Link>
          </div>
        )}
      </header>

      {/* Global Create Issue Modal */}
      {isCreateModalOpen && (
        <IssueModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onIssueSaved={(savedIssue) => {
            setIsCreateModalOpen(false);
            navigate(`/issues/${savedIssue.key || savedIssue.id}`);
          }}
        />
      )}

      {/* Announcement Details Popup Modal */}
      {isBannerModalOpen && showBanner && (
        <Modal
          isOpen={isBannerModalOpen}
          onClose={() => setIsBannerModalOpen(false)}
          title={
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
                <BroadcastIcon className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                DevOps Announcement Details
              </span>
            </div>
          }
          footer={
            <div className="w-full flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dismissBroadcast();
                  setIsBannerModalOpen(false);
                }}
                className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)]"
              >
                Dismiss Announcement
              </Button>
              <Button
                variant="filled"
                size="sm"
                onClick={() => setIsBannerModalOpen(false)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5">
            {/* Severity Header Badge Card */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center shrink-0">
                  <BroadcastIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                    {severityTitle}
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                    Author: {broadcast.author || 'DevOps Team'} • {new Date(broadcast.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] shrink-0">
                {broadcast.severity}
              </span>
            </div>

            {/* Full Message Body with bulletproof word wrapping */}
            <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] font-medium border border-[var(--md-sys-color-outline-variant)]/30 max-h-[45vh] overflow-y-auto">
              {broadcast.message}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
