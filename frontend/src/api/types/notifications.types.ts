export type NotificationType =
  | 'MENTIONED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'PRIORITY_CHANGED'
  | 'SPRINT_ASSIGNED';

export interface NotificationItem {
  id: number;
  userId: number;
  actorId: number | null;
  actor: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  issueId: number | null;
  issue?: {
    id: number;
    issueNum: number;
    title: string;
    project?: {
      id: number;
      key: string;
      name: string;
    };
  } | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  snoozedUntil: string | null;
  createdAt: string;
}

export interface PaginatedNotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
