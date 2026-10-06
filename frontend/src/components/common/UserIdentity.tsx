import React from 'react';
import { Avatar } from './Avatar';
import { UserProfilePopover, type UserPopoverData } from './UserProfilePopover';
import { useUserDetailQuery } from '../../api/queries/index';
import { cn } from '../../utils/cn';

export interface UserIdentityProps {
  user?: (Partial<UserPopoverData> & { name?: string }) | null;
  userId?: number | null;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  showEmail?: boolean;
  showAvatar?: boolean;
  clickable?: boolean;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  nameClassName?: string;
}

export const UserIdentity: React.FC<UserIdentityProps> = ({
  user,
  userId: explicitUserId,
  name: explicitName,
  email: explicitEmail,
  avatarUrl: explicitAvatarUrl,
  jobTitle: explicitJobTitle,
  size = 'sm',
  showName = false,
  showEmail = false,
  showAvatar = true,
  clickable = true,
  align = 'start',
  side = 'bottom',
  className,
  nameClassName,
}) => {
  const targetId = explicitUserId || user?.id;
  const fullName = explicitName || user?.fullName || user?.name || 'Unassigned';
  const email = explicitEmail || user?.email;
  const baseAvatarUrl = explicitAvatarUrl !== undefined ? explicitAvatarUrl : user?.avatarUrl;
  const jobTitle = explicitJobTitle || user?.jobTitle;

  const userDetailQuery = useUserDetailQuery(!baseAvatarUrl && targetId ? targetId : undefined);
  const avatarUrl = baseAvatarUrl || userDetailQuery?.data?.avatarUrl || null;

  const popoverUser: UserPopoverData | null = targetId
    ? {
        id: targetId,
        fullName,
        email,
        avatarUrl,
        jobTitle,
        systemRole: user?.systemRole,
      }
    : null;

  const content = (
    <div
      className={cn(
        'inline-flex items-center gap-2 group/user-identity',
        clickable && targetId && 'cursor-pointer',
        className,
      )}
    >
      {showAvatar && (
        <Avatar
          name={fullName}
          avatarUrl={avatarUrl}
          size={size}
          className={cn(
            clickable &&
              targetId &&
              'transition-transform group-hover/user-identity:scale-105 group-hover/user-identity:ring-2 group-hover/user-identity:ring-[var(--md-sys-color-primary)]/50',
          )}
        />
      )}

      {(showName || showEmail) && (
        <div className="flex flex-col min-w-0 leading-tight">
          {showName && (
            <span
              className={cn(
                'text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate',
                clickable &&
                  targetId &&
                  'group-hover/user-identity:text-[var(--md-sys-color-primary)] group-hover/user-identity:underline',
                nameClassName,
              )}
            >
              {fullName}
            </span>
          )}
          {showEmail && email && (
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate font-mono">
              {email}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (clickable && targetId && popoverUser) {
    return (
      <UserProfilePopover
        user={popoverUser}
        userId={targetId}
        align={align}
        side={side}
      >
        {content}
      </UserProfilePopover>
    );
  }

  return content;
};
