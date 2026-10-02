import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
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
import { useTheme, useAuth } from '../../store';

interface SidebarBottomActionsProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Bottom action utilities for the Super-Sidebar (User Profile dock and Theme toggle).
 * Implements Linear-style bottom dock with high-density M3 tokens.
 */
export const SidebarBottomActions: React.FC<SidebarBottomActionsProps> = ({
  collapsed = false,
  onNavigate,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
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
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`w-full flex items-center rounded-lg transition-colors cursor-pointer select-none text-left ${
            collapsed
              ? 'h-9 w-9 mx-auto justify-center hover:bg-[var(--md-sys-color-surface-container-high)]'
              : 'h-10 px-2 gap-2.5 hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
          }`}
          aria-label="User settings and account menu"
        >
          <Avatar
            name={displayName}
            avatarUrl={user.avatarUrl}
            size="sm"
            role={user.systemRole}
          />
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
              navigate('/admin');
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
    <div className={`shrink-0 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-col gap-1 ${
      collapsed ? 'p-1.5' : 'px-2 py-2'
    }`}>
      {/* Theme Toggle Utility */}
      <div className="flex items-center w-full">
        {collapsed ? (
          <Tooltip content={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'} side="right">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 mx-auto rounded-lg flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--md-sys-color-warning)]" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              )}
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full h-8 px-2 flex items-center gap-2 rounded-lg text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-[var(--md-sys-color-warning)]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            )}
            <span className="truncate">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
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


