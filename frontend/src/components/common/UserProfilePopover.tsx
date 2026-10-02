import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Avatar } from './Avatar.js';
import { Badge, Button } from '../ui/index.js';
import { useUserDetailQuery } from '../../api/queries/index.js';
import { Mail, Calendar, ExternalLink, ListFilter, Briefcase, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export interface UserPopoverData {
  id: number;
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  systemRole?: string | null;
  jobTitle?: string | null;
  createdAt?: string;
}

export interface UserProfilePopoverProps {
  user?: UserPopoverData | null;
  userId?: number | null;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  className?: string;
}

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  user: initialUser,
  userId: explicitUserId,
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const targetId = explicitUserId || initialUser?.id;
  const { data: fetchedUser } = useUserDetailQuery(isOpen && targetId ? targetId : undefined);

  // Combine initial user data with live-queried user details
  const activeUser = {
    id: targetId || 0,
    fullName: fetchedUser?.fullName || initialUser?.fullName || 'User',
    email: fetchedUser?.email || initialUser?.email,
    avatarUrl: fetchedUser?.avatarUrl !== undefined ? fetchedUser?.avatarUrl : initialUser?.avatarUrl,
    systemRole: fetchedUser?.systemRole || initialUser?.systemRole,
    jobTitle: fetchedUser?.jobTitle || initialUser?.jobTitle,
    createdAt: fetchedUser?.createdAt || initialUser?.createdAt,
  };

  if (!targetId) {
    return <>{children}</>;
  }

  const handleViewIssues = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    navigate(`/search?assigneeId=${targetId}`);
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    navigate(`/users/${targetId}`);
  };

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger
        asChild
        onClick={(e) => e.stopPropagation()}
        className={cn('inline-flex items-center cursor-pointer focus:outline-hidden', className)}
      >
        <span>{children}</span>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          side={side}
          sideOffset={sideOffset}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'z-50 w-72 rounded-2xl p-4 shadow-xl border select-none',
            'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]',
            'border-[var(--md-sys-color-outline-variant)]/60',
            'animate-in fade-in-50 zoom-in-95 duration-150 focus:outline-hidden',
          )}
        >
          {/* Header Card Profile Summary */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <Avatar
              name={activeUser.fullName}
              avatarUrl={activeUser.avatarUrl}
              size="lg"
              className="w-12 h-12 shrink-0 ring-2 ring-[var(--md-sys-color-surface)]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate leading-tight">
                  {activeUser.fullName}
                </h4>
                {activeUser.systemRole === 'ADMIN' && (
                  <Badge variant="primary" size="sm" className="text-[9px] px-1.5 py-0 uppercase">
                    Admin
                  </Badge>
                )}
              </div>

              {activeUser.jobTitle ? (
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-0.5 truncate">
                  <Briefcase className="w-3 h-3 shrink-0 text-[var(--md-sys-color-primary)]" />
                  <span>{activeUser.jobTitle}</span>
                </p>
              ) : (
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-0.5 truncate">
                  <ShieldCheck className="w-3 h-3 shrink-0 text-[var(--md-sys-color-outline)]" />
                  <span>{activeUser.systemRole === 'ADMIN' ? 'Administrator' : 'Team Member'}</span>
                </p>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)] p-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)]/40 mb-3.5">
            {activeUser.email && (
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-primary)]" />
                <a
                  href={`mailto:${activeUser.email}`}
                  className="hover:underline text-[var(--md-sys-color-on-surface)] truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeUser.email}
                </a>
              </div>
            )}
            {activeUser.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-outline)]" />
                <span>
                  Member since{' '}
                  {new Date(activeUser.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleViewIssues}
              className="flex-1 text-xs gap-1.5 h-8 font-medium justify-center rounded-xl"
            >
              <ListFilter className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Issues</span>
            </Button>

            <Button
              type="button"
              variant="filled"
              size="sm"
              onClick={handleViewProfile}
              className="flex-1 text-xs gap-1.5 h-8 font-medium justify-center rounded-xl"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
