# Backend API Endpoints Catalog & Architectural Matrix

This document provides a comprehensive catalogue of all REST API endpoints, security guards, WebSocket gateways, and background jobs in the BugTracker backend. It is designed to be directly referenced in university laboratory reports (e.g. Backend Architecture, API Design, Security Controls).

---

## 1. Architectural Overview & Boundary Security

| Attribute | Specification |
| :--- | :--- |
| **Framework** | NestJS 12 (Express Engine, Strict TypeScript) |
| **Protocol** | HTTP/1.1 & HTTP/2 REST (`/api/v1`), WebSocket Socket.IO (`/events`) |
| **Authentication** | Dual-token JWT (15-min Access Token, 7-day Refresh Token, httpOnly cookies + Bearer header) |
| **Password Hashing** | Argon2id (`memoryCost: 65536`, `timeCost: 3`, `parallelism: 4`) with constant-time dummy verification against timing attacks |
| **Rate Limiting** | Redis-backed sliding window rate limiter (5 failed attempts trigger 15-min lockout) |
| **Storage Engine** | SeaweedFS distributed master & volume daemon (S3 API compatibility) |
| **Cache & Real-time** | Redis 7 (IO-Redis client with distributed Pub/Sub adapter) |

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Identity (`/api/v1/auth`)

| Method | Endpoint | Guards | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | None | Registers account with password policy check & Cloudflare Turnstile token validation |
| `POST` | `/auth/login` | None | Authenticates credentials, executes constant-time hash check, triggers 2FA challenge if active |
| `POST` | `/auth/2fa/verify` | None | Verifies 6-digit TOTP token against 5-minute challenge JWT and issues full session tokens |
| `POST` | `/auth/2fa/generate` | `JwtAuthGuard` | Generates new base32 TOTP secret and data URL QR code |
| `POST` | `/auth/2fa/enable` | `JwtAuthGuard` | Confirms code and activates 2FA on the account |
| `POST` | `/auth/2fa/disable` | `JwtAuthGuard` | Disables 2FA after TOTP confirmation |
| `POST` | `/auth/refresh` | None | Validates refresh token and rotates token pair (revokes if tokenVersion is stale) |
| `POST` | `/auth/logout` | `JwtAuthGuard` | Clears authentication cookies and evicts Redis session cache |
| `POST` | `/auth/forgot-password`| None | Dispatches 15-minute cryptographically signed reset token via Mailpit SMTP |
| `POST` | `/auth/reset-password` | None | Sets new Argon2id password and resets lockout status |
| `GET` | `/auth/github` | `AuthGuard('github')` | Initiates federated GitHub OAuth2 login flow |
| `GET` | `/auth/github/callback`| `AuthGuard('github')` | Handles GitHub authorization code and redirects to frontend with exchange code |
| `GET` | `/auth/google` | `AuthGuard('google')` | Initiates federated Google OAuth2 login flow |
| `GET` | `/auth/google/callback`| `AuthGuard('google')` | Handles Google authorization code and redirects with exchange code |
| `POST` | `/auth/oauth/exchange` | None | Exchanges short-lived one-time code for final JWT tokens |

---

### 2.2 Users & Profiles (`/api/v1/users`)

| Method | Endpoint | Guards | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | `JwtAuthGuard` | Returns authenticated user profile, permissions, and group memberships |
| `PATCH`| `/users/me` | `JwtAuthGuard` | Updates user full name, job title, and avatar |
| `GET` | `/users` | `JwtAuthGuard` | Returns paginated list of active users with query search |
| `GET` | `/users/:id` | `JwtAuthGuard` | Retrieves specific user profile and public activity metrics |

---

### 2.3 Projects & Team Workspaces (`/api/v1/projects`)

| Method | Endpoint | Guards | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects` | `JwtAuthGuard` | Returns list of accessible projects for current user |
| `POST` | `/projects` | `JwtAuthGuard` | Creates new project workspace with unique 2-10 character key |
| `GET` | `/projects/:id` | `JwtAuthGuard` | Returns project details, components, versions, and lead info |
| `PATCH`| `/projects/:id` | `JwtAuthGuard` | Updates project metadata, description, category, or project lead |
| `DELETE`| `/projects/:id`| `JwtAuthGuard` | Archives/removes project workspace (requires Project Admin) |
| `GET` | `/projects/:id/components` | `JwtAuthGuard` | Lists subsystems/components linked to the project |
| `POST` | `/projects/:id/components` | `JwtAuthGuard` | Adds a new project component |
| `GET` | `/projects/:id/versions` | `JwtAuthGuard` | Lists releases/versions for the project |
| `POST` | `/projects/:id/versions` | `JwtAuthGuard` | Creates a new project release version |

---

### 2.4 Issues & JQL Engine (`/api/v1/issues`)

| Method | Endpoint | Guards | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/issues` | `JwtAuthGuard` | Paginated search supporting Basic filters and JQL query expression parsing |
| `POST` | `/issues` | `JwtAuthGuard` | Creates a new issue (generates sequential key e.g. `CORE-105`) and broadcasts to project room |
| `GET` | `/issues/:id` | `JwtAuthGuard` | Retrieves issue details, history, links, attachments, and subtasks |
| `PATCH`| `/issues/:id` | `JwtAuthGuard` | Updates issue fields and records audit history entries |
| `DELETE`| `/issues/:id`| `JwtAuthGuard` | Deletes issue and cleans up links/attachments |
| `PATCH`| `/issues/:id/status` | `JwtAuthGuard` | Validates target status against FSM workflow transition graph |
| `POST` | `/issues/:id/worklog` | `JwtAuthGuard` | Logs spent hours, adjusts remaining estimate, and emits real-time event |
| `POST` | `/issues/:id/attachments` | `JwtAuthGuard` | Multipart upload streaming directly to SeaweedFS storage |
| `POST` | `/issues/:id/comments` | `JwtAuthGuard` | Adds issue comment with user mentions |
| `POST` | `/issues/bulk-update` | `JwtAuthGuard` | Executes atomic batch status/assignee updates |

---

### 2.5 Sprints & Agile Planning (`/api/v1/sprints`)

| Method | Endpoint | Guards | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/sprints/project/:projectId` | `JwtAuthGuard` | Retrieves sprints for project (Active, Future, Closed) |
| `POST` | `/sprints` | `JwtAuthGuard` | Creates a new sprint with goal, start date, and end date |
| `PATCH`| `/sprints/:id` | `JwtAuthGuard` | Updates sprint definition or status (Start Sprint) |
| `POST` | `/sprints/:id/complete` | `JwtAuthGuard` | Closes active sprint and migrates uncompleted issues to next sprint or backlog |

---

### 2.6 RBAC & Security Schemes (`/api/v1/rbac`)

| Method | Endpoint | Guards | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/rbac/permissions` | `JwtAuthGuard` | Returns master dictionary of available project permissions |
| `GET` | `/rbac/roles` | `JwtAuthGuard` | Lists custom and system roles |
| `GET` | `/rbac/schemes` | `JwtAuthGuard` | Lists project permission schemes |
| `POST` | `/rbac/schemes/:id/grants` | `JwtAuthGuard` | Assigns permission grants to roles or user groups |
| `GET` | `/rbac/check/:projectId` | `JwtAuthGuard` | Returns effective resolved permissions for the current user in target project |

---

### 2.7 Real-time WebSocket Gateway (`/events`)

| Event Type | Direction | Payload | Room Isolation |
| :--- | :--- | :--- | :--- |
| `join:project` | Client -> Server | `{ projectId: number }` | Validates `BROWSE_PROJECTS` before joining `project_:id` |
| `leave:project`| Client -> Server | `{ projectId: number }` | Leaves `project_:id` |
| `join:issue` | Client -> Server | `{ issueId: number }` | Joins `issue_:id` and announces presence |
| `leave:issue` | Client -> Server | `{ issueId: number }` | Leaves `issue_:id` |
| `issue:created`| Server -> Client | `BroadcastIssuePayload` | Emitted strictly to `project_:id` |
| `issue:updated`| Server -> Client | `BroadcastIssuePayload` | Emitted to `project_:id` and `issue_:id` |
| `issue:deleted`| Server -> Client | `{ issueId, projectId }`| Emitted to `project_:id` and `issue_:id` |
| `worklog:created`| Server -> Client | `{ issueId, worklog }` | Emitted to `issue_:id` |
| `system:banner_updated`| Server -> Client | `BannerPayload` | Global system alert |
