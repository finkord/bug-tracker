import React, { useState } from 'react';
import { useNavigate, useInRouterContext } from 'react-router-dom';
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

interface UserProfilePopoverInternalProps extends UserProfilePopoverProps {
  onNavigate: (path: string) => void;
}

const UserProfilePopoverContent: React.FC<UserProfilePopoverInternalProps> = ({
  user: initialUser,
  userId: explicitUserId,
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  className,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const targetId = explicitUserId || initialUser?.id;
  const queryResult =
    typeof useUserDetailQuery === 'function'
      ? useUserDetailQuery(isOpen && targetId ? targetId : undefined)
      : undefined;
  const fetchedUser = queryResult?.data;

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
    onNavigate(`/search?assigneeId=${targetId}`);
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onNavigate(`/users/${targetId}`);
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
              className="border-2 border-[var(--md-sys-color-surface)] shadow-sm shrink-0"
            />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate">
                  {activeUser.fullName}
                </h4>
                {activeUser.systemRole === 'ADMIN' && (
                  <Badge variant="primary" size="sm" className="h-4.5 px-1.5 text-[9px]">
                    Admin
                  </Badge>
                )}
              </div>

              {activeUser.jobTitle ? (
                <div className="flex items-center gap-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  <Briefcase className="w-3 h-3 shrink-0 text-[var(--md-sys-color-primary)]" />
                  <span className="truncate">{activeUser.jobTitle}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-[var(--md-sys-color-outline)] mt-0.5">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>Team Contributor</span>
                </div>
              )}
            </div>
          </div>

          {/* Meta Details List */}
          <div className="space-y-2 py-2.5 my-2.5 border-y border-[var(--md-sys-color-outline-variant)]/30 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {activeUser.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-[var(--md-sys-color-outline)]" />
                <a
                  href={`mailto:${activeUser.email}`}
                  className="truncate hover:text-[var(--md-sys-color-primary)] hover:underline font-mono text-[11px]"
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

const RoutedProfilePopover: React.FC<UserProfilePopoverProps> = (props) => {
  const navigate = useNavigate();
  return <UserProfilePopoverContent {...props} onNavigate={navigate} />;
};

const UnroutedProfilePopover: React.FC<UserProfilePopoverProps> = (props) => {
  const fallbackNavigate = (path: string) => {
    window.location.href = path;
  };
  return <UserProfilePopoverContent {...props} onNavigate={fallbackNavigate} />;
};

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = (props) => {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <RoutedProfilePopover {...props} />;
  }
  return <UnroutedProfilePopover {...props} />;
};
