import React, { useState, useMemo } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';
import { Avatar } from '../common/Avatar';
import { UserProfilePopover } from '../common/UserProfilePopover.js';
import { Search, Check, UserPlus, UserX, ChevronDown, User } from 'lucide-react';

export interface UserPickerUser {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  email?: string;
  systemRole?: string;
}

export interface UserPickerProps {
  value: number | null | undefined;
  onChange: (userId: number | null, user: UserPickerUser | null) => void;
  users: UserPickerUser[];
  fallbackUser?: UserPickerUser | null;
  currentUser?: UserPickerUser | null;
  currentUserId?: number;
  placeholder?: string;
  showAssignToMe?: boolean;
  allowUnassigned?: boolean;
  showProfileOnAvatar?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  variant?: 'standard' | 'ghost' | 'chip';
  className?: string;
  triggerClassName?: string;
}

export const UserPicker: React.FC<UserPickerProps> = ({
  value,
  onChange,
  users,
  fallbackUser,
  currentUser: currentUserProp,
  currentUserId,
  placeholder = 'Unassigned',
  showAssignToMe = true,
  allowUnassigned = true,
  showProfileOnAvatar = true,
  disabled = false,
  size = 'md',
  variant = 'standard',
  className,
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const effectiveCurrentUserId = currentUserProp?.id || currentUserId;

  const resolvedCurrentUser = useMemo(() => {
    if (currentUserProp) return currentUserProp;
    if (!effectiveCurrentUserId) return null;
    return users.find((u) => u.id === effectiveCurrentUserId) || null;
  }, [currentUserProp, effectiveCurrentUserId, users]);

  const allUsers = useMemo(() => {
    if (resolvedCurrentUser && !users.some((u) => u.id === resolvedCurrentUser.id)) {
      return [resolvedCurrentUser, ...users];
    }
    return users;
  }, [resolvedCurrentUser, users]);

  const selectedUser = useMemo(() => {
    if (!value) return null;
    const found = allUsers.find((u) => u.id === value);
    if (found) return found;
    if (fallbackUser && fallbackUser.id === value) return fallbackUser;
    return null;
  }, [value, allUsers, fallbackUser]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;
    const q = searchQuery.toLowerCase().trim();
    return allUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.systemRole && u.systemRole.toLowerCase().includes(q)),
    );
  }, [allUsers, searchQuery]);

  const handleSelectUser = (user: UserPickerUser | null) => {
    onChange(user ? user.id : null, user);
    setOpen(false);
    setSearchQuery('');
  };

  const isCurrentAssigned = Boolean(effectiveCurrentUserId && value === effectiveCurrentUserId);

  const sizeClasses = {
    sm: 'h-7 text-xs px-2 gap-1.5',
    md: 'h-8 text-xs px-2.5 gap-2',
  };

  const avatarSize = size === 'sm' ? 'xs' : 'xs';

  const triggerVariants = {
    standard:
      'bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 hover:border-[var(--md-sys-color-primary)]/50 rounded-xl',
    ghost:
      'bg-transparent hover:bg-[var(--md-sys-color-surface-container-highest)]/50 border border-transparent rounded-lg',
    chip:
      'bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-primary)]/50 rounded-full',
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-between text-left select-none transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]',
            sizeClasses[size],
            triggerVariants[variant],
            disabled && 'opacity-60 cursor-not-allowed',
            triggerClassName,
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-1.5">
            {selectedUser ? (
              <>
                {showProfileOnAvatar ? (
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 inline-flex"
                    title={`View profile for ${selectedUser.fullName}`}
                  >
                    <UserProfilePopover user={selectedUser}>
                      <span className="cursor-pointer inline-flex hover:opacity-80 transition-opacity">
                        <Avatar
                          name={selectedUser.fullName}
                          avatarUrl={selectedUser.avatarUrl}
                          size={avatarSize}
                          showTooltip={false}
                          className="w-4 h-4 text-[9px] shrink-0"
                        />
                      </span>
                    </UserProfilePopover>
                  </span>
                ) : (
                  <Avatar
                    name={selectedUser.fullName}
                    avatarUrl={selectedUser.avatarUrl}
                    size={avatarSize}
                    showTooltip={false}
                    className="w-4 h-4 text-[9px] shrink-0"
                  />
                )}
                <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                  {selectedUser.fullName}
                </span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center text-[var(--md-sys-color-outline)] shrink-0">
                  <User className="w-2.5 h-2.5" />
                </div>
                <span className="text-[var(--md-sys-color-on-surface-variant)] italic truncate">
                  {placeholder}
                </span>
              </>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] shrink-0" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-64 overflow-hidden rounded-xl p-2 shadow-2xl',
            'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]',
            'border border-[var(--md-sys-color-outline-variant)]',
            'animate-in fade-in-50 zoom-in-95 duration-100',
          )}
        >
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className={cn(
                'w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg',
                'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]',
                'border border-[var(--md-sys-color-outline-variant)]/60 placeholder:text-[var(--md-sys-color-outline)]',
                'focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)]',
              )}
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {/* Assign To Me Option */}
            {showAssignToMe && resolvedCurrentUser && !isCurrentAssigned && (
              <button
                type="button"
                onClick={() => handleSelectUser(resolvedCurrentUser)}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left',
                  'hover:bg-[var(--md-sys-color-primary-container)]/30 text-[var(--md-sys-color-primary)] font-medium',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserPlus className="w-4 h-4 shrink-0 text-[var(--md-sys-color-primary)]" />
                  <span className="truncate">Assign to me</span>
                </div>
              </button>
            )}

            {/* Unassigned Option */}
            {allowUnassigned && (
              <button
                type="button"
                onClick={() => handleSelectUser(null)}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left',
                  'hover:bg-[var(--md-sys-color-surface-container-highest)]',
                  !value && 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] font-bold',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserX className="w-4 h-4 shrink-0 text-[var(--md-sys-color-outline)]" />
                  <span className="text-[var(--md-sys-color-on-surface-variant)] italic truncate">
                    Unassigned
                  </span>
                </div>
                {!value && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />}
              </button>
            )}

            {/* Divider */}
            {(showAssignToMe || allowUnassigned) && (
              <div className="h-px my-1 bg-[var(--md-sys-color-outline-variant)]/40" />
            )}

            {/* Filtered Users List */}
            {filteredUsers.length === 0 ? (
              <div className="py-4 text-center text-xs text-[var(--md-sys-color-outline)]">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = value === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left',
                      'hover:bg-[var(--md-sys-color-surface-container-highest)]',
                      isSelected && 'bg-[var(--md-sys-color-surface-container-highest)] font-bold text-[var(--md-sys-color-primary)]',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <Avatar
                        name={user.fullName}
                        avatarUrl={user.avatarUrl}
                        size="xs"
                        showTooltip={false}
                        className="w-5 h-5 text-[9px] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[var(--md-sys-color-on-surface)]">
                          {user.fullName}
                          {resolvedCurrentUser && user.id === resolvedCurrentUser.id && (
                            <span className="ml-1 text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-normal">
                              (You)
                            </span>
                          )}
                        </div>
                        {user.email && (
                          <div className="text-[10px] text-[var(--md-sys-color-outline)] truncate font-normal">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
