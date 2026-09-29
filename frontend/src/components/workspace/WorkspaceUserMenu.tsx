import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Sliders, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/Dropdown';
import { Avatar } from '../common/Avatar';
import type { UserProfile } from '../../api/client';

interface WorkspaceUserMenuProps {
  user: UserProfile;
  onLogout: () => void | Promise<void>;
}

/**
 * User avatar profile menu with role indicators, settings links, and logout.
 */
export const WorkspaceUserMenu: React.FC<WorkspaceUserMenuProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout();
    navigate('/');
  };

  const displayName = user.fullName || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-7 h-7 rounded-full flex items-center justify-center p-0 ring-2 ring-transparent hover:ring-[var(--md-sys-color-primary)] transition-all cursor-pointer select-none shrink-0 outline-none focus:outline-none focus-visible:ring-[var(--md-sys-color-primary)]"
          title={`${displayName} (Profile)`}
          aria-label="User profile and settings menu"
        >
          <Avatar
            name={displayName}
            avatarUrl={user.avatarUrl}
            size="sm"
            role={user.systemRole}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-56 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] shadow-xl z-50 border border-[var(--md-sys-color-outline-variant)]/20 text-xs animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-2.5 py-2">
          <p className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">
            {displayName}
          </p>
          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
            {user.email}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] uppercase tracking-wider">
              {user.systemRole || 'MEMBER'}
            </span>
            {user.isAdmin && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] uppercase tracking-wider">
                ADMIN
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
          <span>Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate('/preferences')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
          <span>Preferences</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
