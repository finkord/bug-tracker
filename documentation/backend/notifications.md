# In-App Notifications & Triage (`NotificationsModule`)

The `NotificationsModule` provides an enterprise-grade notification and triage subsystem. It manages asynchronous notifications, real-time alerting via WebSockets, snooze functionality, and unread counters optimized for high concurrency.

---

## 1. Architectural Overview

The notification subsystem operates with a dual-delivery model:
1. **Persistent State**: Notifications are stored in PostgreSQL with composite indexing to support rapid pagination and unread counts for 10,000+ users without full-table scans.
2. **Instant Push**: Upon creation, the service emits real-time events (`notification:received` and `notification:new`) directly to the recipient's personal WebSocket room (`user_${userId}`) via `EventsGateway`.

---

## 2. Notification Entity Schema

The `Notification` entity (`backend/src/modules/notifications/entities/notification.entity.ts`) models in-app alerts:

| Field | Type | Description |
|---|---|---|
| `id` | `number` (Primary Key) | Auto-incrementing notification identifier |
| `userId` | `number` (Foreign Key -> User) | Target recipient receiving the notification |
| `actorId` | `number \| null` (Foreign Key -> User) | User whose action triggered the notification (nullable for system events) |
| `issueId` | `number \| null` (Foreign Key -> Issue) | Associated ticket identifier |
| `type` | `NotificationType` enum | Event type categorization |
| `title` | `string` (max 255) | Concise summary title |
| `message` | `text` | Detailed contextual description |
| `isRead` | `boolean` | Read/unread state (defaults to `false`) |
| `snoozedUntil` | `Date \| null` (timestamptz) | Timestamp until which notification is suppressed from unread count |
| `createdAt` | `Date` (timestamptz) | Automatic creation timestamp |

### Database Indexes for High Scale

To ensure zero full-table scans at scale:
* `@Index(['userId', 'isRead'])`: Accelerates unread queries and badge counts.
* `@Index(['userId', 'createdAt'])`: Accelerates ordered pagination for user inbox views.
* `@Index(['issueId'])`: Optimizes cascade lookups and issue-level notification queries.

---

## 3. Supported Notification Types

Defined by the `NotificationType` enum:

* `MENTIONED`: User was tagged with `@username` in an issue comment.
* `ASSIGNED`: User was assigned to an issue.
* `UNASSIGNED`: User was unassigned from an issue.
* `STATUS_CHANGED`: An issue assigned to or reported by the user transitioned status.
* `COMMENT_ADDED`: A new comment was posted on an issue where the user is reporter or assignee.
* `PRIORITY_CHANGED`: An issue assigned to the user was escalated to `HIGH` or `CRITICAL`.
* `SPRINT_ASSIGNED`: An issue assigned to the user was attached to an active sprint.

---

## 4. REST API Endpoints

All endpoints are protected by `JwtAuthGuard` and operate within the caller's user context.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications` | Returns paginated notifications with optional `unreadOnly=true` filter and active snooze suppression |
| `GET` | `/notifications/unread-count` | Returns `{ count: number }` for badge display without loading full records |
| `POST` | `/notifications/mark-read` | Marks notifications as read. Accepts `{ ids?: number[] }` (omitting `ids` marks all user notifications read) |
| `POST` | `/notifications/:id/snooze` | Snoozes a notification until a specified ISO date-time (`{ snoozeUntil: string }`) |

---

## 5. Event Trigger Integration Points

Notification generation is embedded into core domain services:

1. **`IssueCoreService.update()`**:
   * Detects assignee changes (`ASSIGNED` to new assignee, `UNASSIGNED` to previous assignee).
   * Detects status transitions (`STATUS_CHANGED` to both assignee and reporter).
   * Detects priority escalations to `HIGH` or `CRITICAL` (`PRIORITY_CHANGED` to assignee).
   * Detects assignment to active sprints (`SPRINT_ASSIGNED` to assignee).
2. **`IssueCommentsService.create()`**:
   * Parses `@username` tokens using regular expressions, maps them to user IDs, and generates `MENTIONED` alerts.
   * Generates `COMMENT_ADDED` alerts for the issue reporter and assignee (excluding the comment author).

---

## 6. Key Source Files

* Service: [`notifications.service.ts`](../../backend/src/modules/notifications/notifications.service.ts)
* Controller: [`notifications.controller.ts`](../../backend/src/modules/notifications/notifications.controller.ts)
* Entity: [`notification.entity.ts`](../../backend/src/modules/notifications/entities/notification.entity.ts)
* DTOs: [`notifications.dto.ts`](../../backend/src/modules/notifications/dto/notifications.dto.ts)
* Unit Tests: [`notifications.service.spec.ts`](../../backend/src/modules/notifications/notifications.service.spec.ts)
