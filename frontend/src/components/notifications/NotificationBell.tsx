import React, { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  ArrowRight,
  UserCheck,
  UserMinus,
  Tag,
  Flame,
  Zap,
  X,
} from 'lucide-react';
import { notificationsApi } from '../../api/modules/notifications.api.js';
import { realtimeSocket } from '../../api/socket.js';
import type { NotificationItem, NotificationType } from '../../api/types/notifications.types.js';
import { EntityAvatar } from '../ui/EntityAvatar.js';
import { cn } from '../../utils/cn.js';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'ASSIGNED':
      return <UserCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />;
    case 'UNASSIGNED':
      return <UserMinus className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)]" />;
    case 'COMMENT_ADDED':
      return <MessageSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />;
    case 'STATUS_CHANGED':
      return <ArrowRight className="w-3.5 h-3.5 text-[var(--md-sys-color-secondary)]" />;
    case 'PRIORITY_CHANGED':
      return <Flame className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />;
    case 'SPRINT_ASSIGNED':
      return <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />;
    case 'MENTIONED':
    default:
      return <Tag className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />;
  }
};

const formatTimestamp = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
};

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const unreadCount = countData?.unreadCount ?? countData?.count ?? 0;

  // 2. Fetch notifications list when drawer is opened
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list', filter],
    queryFn: () => notificationsApi.getNotifications({ unreadOnly: filter === 'unread', limit: 40 }),
    enabled: isOpen,
  });

  const notifications = notificationsData?.items ?? [];

  // 3. Realtime socket listener for incoming notifications
  useEffect(() => {
    const unsubscribe = realtimeSocket.onNotificationNew(() => {
      queryClient.setQueryData(['notifications', 'unread-count'], (old: { unreadCount?: number; count?: number } | undefined) => {
        const current = old?.unreadCount ?? old?.count ?? 0;
        return { count: current + 1, unreadCount: current + 1 };
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  // 4. Mutations
  const markReadMutation = useMutation({
    mutationFn: (ids?: number[]) => notificationsApi.markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate([item.id]);
    }
    setIsOpen(false);
    if (item.issue?.project?.key && item.issue.issueNum) {
      navigate(`/issues/${item.issue.project.key}-${item.issue.issueNum}`);
    } else if (item.issueId) {
      navigate(`/issues/${item.issueId}`);
    }
  };


  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'relative w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all border',
            unreadCount > 0
              ? 'border-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/30 shadow-2xs'
              : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]',
          )}
          title={
            unreadCount > 0
              ? `Inbox: ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}`
              : 'Inbox'
          }
          aria-label="Notifications Inbox"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] text-[10px] font-bold flex items-center justify-center border-2 border-[var(--md-sys-color-surface)] shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-84 sm:w-96 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150 focus:outline-hidden"
        >
          {/* Header */}
          <div className="p-3 border-b border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[var(--md-sys-color-on-surface)]">
                Inbox
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markReadMutation.mutate(undefined)}
                  className="px-2 py-1 text-xs font-medium rounded-md text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close inbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)]/10 flex items-center justify-between text-xs bg-[var(--md-sys-color-surface-container-low)]">
            <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container)] p-0.5 rounded-lg border border-[var(--md-sys-color-outline-variant)]/20">
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer',
                  filter === 'unread'
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]',
                )}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer',
                  filter === 'all'
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]',
                )}
              >
                All
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 divide-y divide-[var(--md-sys-color-outline-variant)]/10">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-[var(--md-sys-color-outline)]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)]">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                  All caught up!
                </p>
                <p className="text-xs text-[var(--md-sys-color-outline)] mt-1">
                  {filter === 'unread' ? 'No unread notifications in your inbox' : 'No notifications found'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isItemUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'group relative p-3 flex items-start gap-2.5 cursor-pointer transition-colors',
                      isItemUnread ? 'border-l-3 border-l-[var(--md-sys-color-primary)]' : '',
                      isItemUnread
                        ? 'bg-[var(--md-sys-color-primary-container)]/10 hover:bg-[var(--md-sys-color-primary-container)]/20'
                        : 'hover:bg-[var(--md-sys-color-surface-container-high)]/60',
                    )}
                  >
                    {/* Actor Avatar with Action Icon overlay */}
                    <div className="relative shrink-0 mt-0.5">
                      {item.actor ? (
                        <EntityAvatar
                          name={item.actor.fullName}
                          avatarUrl={item.actor.avatarUrl}
                          size="xs"
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center border',
                            isItemUnread
                              ? 'bg-[var(--md-sys-color-primary-container)]/40 border-[var(--md-sys-color-primary)]/40 text-[var(--md-sys-color-primary)]'
                              : 'bg-[var(--md-sys-color-surface-container-highest)] border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface-variant)]',
                          )}
                        >
                          {getNotificationIcon(item.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              'text-xs truncate',
                              isItemUnread
                                ? 'font-bold text-[var(--md-sys-color-on-surface)]'
                                : 'text-[var(--md-sys-color-on-surface-variant)]',
                            )}
                          >
                            {item.title}
                          </span>
                          {isItemUnread && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] uppercase tracking-wider shrink-0 leading-none">
                              New
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] shrink-0 text-[var(--md-sys-color-outline)]">
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 mt-0.5 break-words">
                        {item.message}
                      </p>
                    </div>

                    {/* Quick action button (mark read) on hover */}
                    {isItemUnread && (
                      <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate([item.id]);
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
