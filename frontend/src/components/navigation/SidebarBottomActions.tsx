import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Laptop,
  User,
  Sliders,
  LogOut,
  Shield,
  ChevronsUpDown,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/Dropdown';
import { Avatar } from '../common/Avatar';
import { useTheme, useAuth, type Theme } from '../../store';
import { api } from '../../api/client';

interface SidebarBottomActionsProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Bottom action utilities for the Super-Sidebar (User Profile dock and Theme toggle).
 * Implements Linear-style bottom dock with high-density M3 tokens and 3-state theme switching.
 */
export const SidebarBottomActions: React.FC<SidebarBottomActionsProps> = ({
  collapsed = false,
  onNavigate,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  // Close dropdown whenever sidebar collapse state changes (e.g. flyout dismisses or hotkey toggles)
  React.useEffect(() => {
    if (isProfileOpen) {
      setIsProfileOpen(false);
      onOpenChange?.(false);
    }
  }, [collapsed]);

  const handleProfileOpenChange = (open: boolean) => {
    setIsProfileOpen(open);
    onOpenChange?.(open);
  };

  const handleSelectTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    if (user) {
      api.updatePreferences({ theme: newTheme }).catch(() => {
        // Non-blocking preference sync
      });
    }
  };

  const handleToggleTheme = () => {
    let nextTheme: Theme = 'light';
    if (theme === 'system') nextTheme = 'light';
    else if (theme === 'light') nextTheme = 'dark';
    else nextTheme = 'system';

    toggleTheme();
    if (user) {
      api.updatePreferences({ theme: nextTheme }).catch(() => {
        // Non-blocking preference sync
      });
    }
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    onOpenChange?.(false);
    await logout();
    navigate('/');
    onNavigate?.();
  };

  const displayName = user?.fullName || user?.email || 'Account';
  const isUserAdmin =
    user?.isAdmin ||
    user?.systemRole === 'ADMIN' ||
    user?.groups?.some((g: string) => ['administrators', 'admin', 'admins'].includes(g.toLowerCase()));

  const userProfileMenu = user ? (
    <DropdownMenu open={isProfileOpen} onOpenChange={handleProfileOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`w-full flex items-center rounded-lg transition-colors cursor-pointer select-none text-left ${collapsed
              ? 'h-9 w-9 mx-auto justify-center hover:bg-[var(--md-sys-color-surface-container-high)]'
              : 'h-10 px-2.5 gap-2.5 hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
            }`}
          aria-label="User settings and account menu"
        >
          {collapsed ? (
            <Avatar
              name={displayName}
              avatarUrl={user.avatarUrl}
              size="compact"
              role={user.systemRole}
            />
          ) : (
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              <Avatar
                name={displayName}
                avatarUrl={user.avatarUrl}
                size="compact"
                role={user.systemRole}
              />
            </div>
          )}
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-tight text-[var(--md-sys-color-on-surface)]">
                  {displayName}
                </p>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate leading-tight mt-0.5">
                  {user.systemRole || 'MEMBER'}
                </p>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={collapsed ? 'start' : 'center'}
        side={collapsed ? 'right' : 'top'}
        sideOffset={8}
        className="w-56 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] shadow-2xl border border-[var(--md-sys-color-outline-variant)]/30 text-xs animate-in fade-in zoom-in-95 duration-150 z-50"
      >
        <div className="px-2 py-1.5">
          <p className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">
            {displayName}
          </p>
          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
            {user.email}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            setIsProfileOpen(false);
            onOpenChange?.(false);
            navigate('/profile');
            onNavigate?.();
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
          <span>Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            setIsProfileOpen(false);
            onOpenChange?.(false);
            navigate('/preferences');
            onNavigate?.();
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
          <span>Preferences</span>
        </DropdownMenuItem>

        {isUserAdmin && (
          <DropdownMenuItem
            onClick={() => {
              setIsProfileOpen(false);
              onOpenChange?.(false);
              navigate('/admin/users');
              onNavigate?.();
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/20"
          >
            <Shield className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Admin Console</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <div className={`shrink-0 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-col gap-1 ${collapsed ? 'p-1.5' : 'px-2 py-2'
      }`}>
      {/* Theme Toggle Utility (3-State Switching: System, Light, Dark) */}
      <div className="flex items-center w-full">
        {collapsed ? (
          <Tooltip
            content={
              theme === 'system'
                ? 'Theme: System (Auto) — Switch to Light'
                : theme === 'light'
                  ? 'Theme: Light — Switch to Dark'
                  : 'Theme: Dark — Switch to System'
            }
            side="right"
          >
            <button
              type="button"
              onClick={handleToggleTheme}
              className="w-9 h-9 mx-auto rounded-lg flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
              aria-label={`Toggle theme (currently ${theme})`}
            >
              {theme === 'system' ? (
                <Laptop className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              ) : (
                <Sun className="w-4 h-4 text-[var(--md-sys-color-warning)]" />
              )}
            </button>
          </Tooltip>
        ) : (
          <div
            role="group"
            aria-label="Theme selection"
            className="w-full h-[34px] p-0.5 grid grid-cols-3 gap-0.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 text-xs select-none"
          >
            <button
              type="button"
              onClick={() => handleSelectTheme('system')}
              className={`flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] font-semibold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
              }`}
              title="System (Auto) theme"
              aria-label="System theme"
            >
              <Laptop className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium leading-none truncate">Auto</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-warning)] font-semibold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
              }`}
              title="Light theme"
              aria-label="Light mode"
            >
              <Sun className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium leading-none truncate">Light</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] font-semibold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
              }`}
              title="Dark theme"
              aria-label="Dark mode"
            >
              <Moon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium leading-none truncate">Dark</span>
            </button>
          </div>
        )}
      </div>

      {/* User Profile Card */}
      {userProfileMenu && (
        <div className="pt-0.5">
          {collapsed ? (
            <Tooltip content={displayName} side="right">
              {userProfileMenu}
            </Tooltip>
          ) : (
            userProfileMenu
          )}
        </div>
      )}
    </div>
  );
};


