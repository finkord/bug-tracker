import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Check,
  Clock,
  CheckCheck,
  MessageSquare,
  ArrowRight,
  UserCheck,
  UserMinus,
  Tag,
  Flame,
  Zap,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { notificationsApi } from '../../api/modules/notifications.api.js';
import { realtimeSocket } from '../../api/socket.js';
import type { NotificationItem, NotificationType } from '../../api/types/notifications.types.js';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContextClass();
  }
  return sharedAudioCtx;
}

// Unlock Web Audio context on the first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { once: false });
  window.addEventListener('keydown', unlockAudio, { once: false });
}

/**
 * Synthesizes a two-tone alert chime via Web Audio API without external audio asset downloads.
 * Tone 1: 587.33 Hz (D5) for 90ms
 * Tone 2: 880.00 Hz (A5) for 160ms with exponential gain decay
 */
export function playNotificationChime(): void {
  try {
    const isSoundEnabled = localStorage.getItem('bugtracker_sound_alerts_enabled');
    if (isSoundEnabled === 'false') return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const executeTones = () => {
      const now = ctx.currentTime;

      // Tone 1: 587.33 Hz (D5) for 90ms
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Tone 2: 880.00 Hz (A5) for 160ms starting at now + 0.09
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.09);
      gain2.gain.setValueAtTime(0.2, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.25);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(executeTones).catch(() => {});
    } else {
      executeTones();
    }
  } catch {
    // Graceful fallback if AudioContext is blocked or unsupported
  }
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('bugtracker_sound_alerts_enabled') !== 'false';
  });
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const previousUnreadCountRef = useRef<number | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const triggerRingingAlert = () => {
    setIsRinging(true);
    playNotificationChime();
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    ringTimeoutRef.current = setTimeout(() => {
      setIsRinging(false);
    }, 1200);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('bugtracker_sound_alerts_enabled', String(next));
      if (next) {
        triggerRingingAlert();
      }
      return next;
    });
  };

  // 1. Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const unreadCount = countData?.unreadCount ?? countData?.count ?? 0;

  // Detect unread count increases from background polling and trigger audio/visual alert
  useEffect(() => {
    const rawCount = countData?.unreadCount ?? countData?.count;
    if (rawCount !== undefined) {
      if (
        previousUnreadCountRef.current !== null &&
        rawCount > previousUnreadCountRef.current
      ) {
        triggerRingingAlert();
      }
      previousUnreadCountRef.current = rawCount;
    }
  }, [countData]);

  // 2. Fetch notifications list
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list', filter],
    queryFn: () => notificationsApi.getNotifications({ unreadOnly: filter === 'unread', limit: 40 }),
    enabled: isOpen,
  });

  const notifications = notificationsData?.items ?? [];

  // 3. Realtime socket listener with audio chime and ringing animation
  useEffect(() => {
    const unsubscribe = realtimeSocket.onNotificationNew(() => {
      // Optimistically increment unread count immediately so the icon and badge update instantly
      queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => {
        const current = old?.unreadCount ?? old?.count ?? 0;
        return { count: current + 1, unreadCount: current + 1 };
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      triggerRingingAlert();
    });
    return () => {
      unsubscribe();
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  }, [queryClient]);

  // 4. Mutations
  const markReadMutation = useMutation({
    mutationFn: (ids?: number[]) => notificationsApi.markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.snoozeNotification(id, 24),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 5. Global 'I' shortcut to toggle inbox (when not typing in inputs)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if ((e.key === 'i' || e.key === 'I') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 6. Keyboard triage navigation when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const handleTriageKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (notifications.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, notifications.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'e' || e.key === 'E') {
        // Triage: Mark highlighted as read
        e.preventDefault();
        const current = notifications[focusedIndex];
        if (current && !current.isRead) {
          markReadMutation.mutate([current.id]);
        }
      } else if (e.key === 's' || e.key === 'S') {
        // Triage: Snooze highlighted
        e.preventDefault();
        const current = notifications[focusedIndex];
        if (current) {
          snoozeMutation.mutate(current.id);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const current = notifications[focusedIndex];
        if (current && current.issueId) {
          handleItemClick(current);
        }
      }
    };

    window.addEventListener('keydown', handleTriageKeyDown);
    return () => window.removeEventListener('keydown', handleTriageKeyDown);
  }, [isOpen, notifications, focusedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate([item.id]);
    }
    setIsOpen(false);
    if (item.issueId) {
      navigate(`/issues/${item.issueId}`);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ASSIGNED':
        return <UserCheck className="w-4 h-4 text-[var(--md-sys-color-primary)]" />;
      case 'UNASSIGNED':
        return <UserMinus className="w-4 h-4 text-[var(--md-sys-color-outline)]" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" />;
      case 'STATUS_CHANGED':
        return <ArrowRight className="w-4 h-4 text-[var(--md-sys-color-secondary)]" />;
      case 'PRIORITY_CHANGED':
        return <Flame className="w-4 h-4 text-[var(--md-sys-color-error)]" />;
      case 'SPRINT_ASSIGNED':
        return <Zap className="w-4 h-4 text-[var(--md-sys-color-primary)]" />;
      case 'MENTIONED':
      default:
        return <Tag className="w-4 h-4 text-[var(--md-sys-color-primary)]" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  const hasUnread = unreadCount > 0 || isRinging;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all border ${
          hasUnread
            ? 'border-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/30 shadow-2xs'
            : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
        }`}
        title={
          unreadCount > 0
            ? `Inbox: ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'} (Press I to toggle)`
            : 'Inbox (Press I to toggle)'
        }
        aria-label="Notifications Inbox"
      >
        {hasUnread ? (
          <BellRing
            className={`w-4 h-4 text-[var(--md-sys-color-primary)] ${
              isRinging ? 'animate-bell-ring' : ''
            }`}
          />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {hasUnread && (
          <>
            {/* Unread indicator red dot */}
            <span
              className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[var(--md-sys-color-error)] ring-2 ring-[var(--md-sys-color-surface)] animate-ping"
              aria-hidden="true"
            />
            {/* Badge counter */}
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] text-[10px] font-bold flex items-center justify-center border-2 border-[var(--md-sys-color-surface)] shadow-xs animate-in zoom-in-75 duration-200">
              {unreadCount > 99 ? '99+' : (unreadCount || 1)}
            </span>
          </>
        )}
      </button>

      {/* Triage Inbox Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
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
              {/* Sound alert toggle button */}
              <button
                type="button"
                onClick={toggleSound}
                className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                  soundEnabled
                    ? 'text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-highest)]'
                    : 'text-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-highest)]'
                }`}
                title={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
                aria-label={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

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

          {/* Filter Pills and Triage Hints */}
          <div className="px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)]/10 flex items-center justify-between text-xs bg-[var(--md-sys-color-surface-container-low)]">
            <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container)] p-0.5 rounded-lg border border-[var(--md-sys-color-outline-variant)]/20">
              <button
                type="button"
                onClick={() => {
                  setFilter('unread');
                  setFocusedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setFocusedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                All
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--md-sys-color-outline)] font-mono">
              <span><kbd className="px-1 rounded bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30">E</kbd> read</span>
              <span><kbd className="px-1 rounded bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30">S</kbd> snooze</span>
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
              notifications.map((item, idx) => {
                const isFocused = idx === focusedIndex;
                const isItemUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`group relative p-3 flex items-start gap-2.5 cursor-pointer transition-colors ${
                      isItemUnread ? 'border-l-3 border-l-[var(--md-sys-color-primary)]' : ''
                    } ${
                      isFocused
                        ? 'bg-[var(--md-sys-color-surface-container-highest)]'
                        : isItemUnread
                          ? 'bg-[var(--md-sys-color-primary-container)]/10 hover:bg-[var(--md-sys-color-primary-container)]/20'
                          : 'hover:bg-[var(--md-sys-color-surface-container-high)]/60'
                    }`}
                  >
                    {/* Icon or Avatar */}
                    <div
                      className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                        isItemUnread
                          ? 'bg-[var(--md-sys-color-primary-container)]/40 border-[var(--md-sys-color-primary)]/40 text-[var(--md-sys-color-primary)] shadow-2xs'
                          : 'bg-[var(--md-sys-color-surface-container-highest)] border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {getNotificationIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-xs truncate ${
                              isItemUnread
                                ? 'font-bold text-[var(--md-sys-color-on-surface)]'
                                : 'text-[var(--md-sys-color-on-surface-variant)]'
                            }`}
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

                    {/* Action buttons (hover / focus) */}
                    <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isItemUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate([item.id]);
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
                          title="Mark as read (E)"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          snoozeMutation.mutate(item.id);
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-tertiary)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
                        title="Snooze 24 hours (S)"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
