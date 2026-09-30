# Real-Time WebSocket Gateway (`EventsModule`)

The `EventsModule` provides enterprise-grade, distributed WebSocket real-time capabilities via Socket.IO, enabling live Kanban board updates, agile sprint synchronization, and secure collaborative issue viewing.

---

## 1. Gateway Architecture & Clustering
* **Namespace**: `/events`
* **CORS Policy**: Strictly locked to `process.env.FRONTEND_URL || 'http://localhost:5173'` with `credentials: true`.
* **Transport**: WebSocket preferred, HTTP long-polling fallback.
* **Distributed Pub/Sub Broker**: Scaled horizontally across multiple Node.js instances using `@socket.io/redis-adapter` and `ioredis` ([`RedisIoAdapter`](../../backend/src/modules/events/adapters/redis-io.adapter.ts)).

---

## 2. Handshake Security & Authentication
Anonymous connections are strictly rejected. Connection authentication in `handleConnection`:
1. Extracts JWT access token from:
   - `client.handshake.auth.token` (Bearer format or raw token)
   - `client.handshake.headers.authorization`
   - Cookie `accessToken`
2. Validates token signature with `JwtService`.
3. Blocks pending 2FA challenge tokens (`payload.is2faPending`).
4. Verifies active session via fast Redis session cache (`user:session:${sub}`) with fallback to database.
5. Verifies `isBlocked`, `isActivated`, and `tokenVersion` to prevent revoked sessions from connecting.
6. Attaches validated user context to `client.data.user`.

---

## 3. Room Subscriptions & RBAC Authorization

### Project Room (`join:project`)
- Payload: `{ projectId: number }`
- **Security Check**: Enforces `PermissionEvaluatorService.hasPermission({ userId, projectId, permission: ProjectPermission.BROWSE_PROJECTS })`.
- Unauthenticated or unauthorized sockets are immediately rejected.
- Room name: `project_${projectId}`.

### Issue Room (`join:issue`)
- Payload: `{ issueId: number, user?: EventUserPresence }`
- **Security Check**: Enforces project-level and row-level issue security access checks (`issue.securityLevelId`).
- Broadcasts `presence:viewing` to collaborators inside room `issue_${issueId}`.

---

## 4. Broadcast Events & Zero Global Leaks
Every broadcast is strictly scoped to isolated project and issue rooms. Global emissions (`server.emit(...)`) are strictly prohibited to prevent data leaks.

* `issue:created`: Emitted to `project_${projectId}`. If `securityLevelId` is set, sockets in the room are filtered so only authorized users receive the payload.
* `issue:updated`: Emitted to `project_${projectId}` and `issue_${issueId}` with row-level security filtering.
* `issue:deleted`: Emitted to `project_${projectId}` and `issue_${issueId}`.
* `worklog:created`: Emitted to `issue_${issueId}` and `project_${projectId}`.
* `comment:created`: Emitted to `issue_${issueId}`.
* `attachment:uploaded`: Emitted to `issue_${issueId}`.

---

## 5. Key Source Files
* Gateway: [`events.gateway.ts`](../../backend/src/modules/events/events.gateway.ts)
* Unit Tests: [`events.gateway.spec.ts`](../../backend/src/modules/events/events.gateway.spec.ts)
* Redis Adapter: [`redis-io.adapter.ts`](../../backend/src/modules/events/adapters/redis-io.adapter.ts)
* Module: [`events.module.ts`](../../backend/src/modules/events/events.module.ts)
