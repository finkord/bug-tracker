import { request } from '../http.js';
import type {
  PaginatedNotificationsResponse,
  NotificationItem,
} from '../types/notifications.types.js';

export const notificationsApi = {
  getNotifications: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly !== undefined) {
      searchParams.set('unreadOnly', String(params.unreadOnly));
    }
    if (params?.page) {
      searchParams.set('page', String(params.page));
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit));
    }
    const query = searchParams.toString();
    return request<PaginatedNotificationsResponse>(`/notifications${query ? `?${query}` : ''}`);
  },

  getUnreadCount: () =>
    request<{ unreadCount: number }>('/notifications/unread-count'),

  markAsRead: (notificationIds?: number[]) =>
    request<{ success: boolean; affected: number }>('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds: notificationIds || [] }),
    }),

  snoozeNotification: (id: number, untilHours: number = 24) =>
    request<NotificationItem>(`/notifications/${id}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ untilHours }),
    }),
};
