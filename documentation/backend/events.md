# Real-Time WebSocket Gateway (`EventsModule`)

The `EventsModule` provides WebSocket real-time capabilities via Socket.IO, enabling live Kanban board updates and collaborative issue viewing.

---

## 1. Gateway Architecture
* **Namespace**: `/events`
* **Transport**: WebSocket / HTTP Long-Polling fallback
* **Pub/Sub Broker**: Redis 7 adapter backing Socket.IO rooms

---

## 2. Supported WebSocket Events

### Rooms & Subscriptions
* `join:project` (`{ projectId }`): Joins room `project_{projectId}` for project-wide Kanban card transitions and sprint updates.
* `leave:project` (`{ projectId }`): Leaves the project room.
* `join:issue` (`{ issueId, user }`): Joins room `issue_{issueId}` and broadcasts `presence:viewing` to notify other users viewing the same ticket.
* `leave:issue` (`{ issueId }`): Leaves the issue room.

### Server Broadcasts
* `issue:updated`: Dispatched to `project_{projectId}` when an issue status, priority, or assignee changes.
* `issue:commented`: Dispatched to `issue_{issueId}` when a new comment is posted.
* `presence:viewing`: Notifies collaborators currently inspecting the active ticket.

---

## 3. Key Source Files
* Gateway: [`events.gateway.ts`](../../backend/src/modules/events/events.gateway.ts)
* Module: [`events.module.ts`](../../backend/src/modules/events/events.module.ts)
