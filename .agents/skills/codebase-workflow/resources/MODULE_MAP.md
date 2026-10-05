# BugTracker — Module Map (Agent Reference Card)

> **Purpose:** This file is the single source of truth for file locations in the BugTracker
> codebase. Read this instead of traversing the directory tree. Always prefer paths listed
> here over exploratory `list_dir` calls.
>
> **Maintenance:** Update this file whenever a new module, service, entity, or major
> frontend directory is added.

---

## Backend Root (`backend/src/`)

| File                  | Purpose                                                      |
|-----------------------|--------------------------------------------------------------|
| `main.ts`             | App bootstrap, Swagger, CORS, global ValidationPipe, Helmet  |
| `app.module.ts`       | Root module — imports all feature modules                    |
| `app.controller.ts`   | Health check endpoint                                        |

---

## Backend Modules (`backend/src/modules/<module>/`)

### `auth` — Authentication & Security (SDSecurity Lab 6)

| File                                           | Purpose                                             |
|------------------------------------------------|-----------------------------------------------------|
| `auth.module.ts`                               | Module definition, Passport JWT/Local setup         |
| `auth.controller.ts`                           | All auth HTTP endpoints                             |
| `auth.service.ts`                              | Core auth orchestration                             |
| `services/local-auth.service.ts`               | Login, registration, activation, brute-force logic  |
| `services/oauth.service.ts`                    | Google/GitHub OAuth2 user linking                   |
| `services/oauth-code-store.service.ts`         | Temporary OAuth code storage (Redis)                |
| `services/password-reset.service.ts`           | Forgot/reset password flow                          |
| `services/token-session.service.ts`            | JWT access + refresh token issuance / revocation    |
| `services/two-factor-auth.service.ts`          | TOTP 2FA enable/disable/verify                      |
| `strategies/jwt.strategy.ts`                   | Passport JWT strategy (httpOnly cookie extraction)  |
| `strategies/google.strategy.ts`                | Passport Google OAuth2 strategy                     |
| `strategies/github.strategy.ts`                | Passport GitHub OAuth2 strategy                     |

### `users` — User Profiles & Administration

| File                                 | Purpose                                  |
|--------------------------------------|------------------------------------------|
| `users.module.ts`                    | Module definition                        |
| `users.controller.ts`                | Profile, preferences, admin user mgmt    |
| `users.service.ts`                   | User CRUD, role assignment               |
| `entities/user.entity.ts`            | TypeORM User entity (main auth table)    |
| `entities/saved-filter.entity.ts`    | User-saved advanced search filters       |

### `projects` — Project Workspaces & Taxonomies

| File                                           | Purpose                                            |
|------------------------------------------------|----------------------------------------------------|
| `projects.module.ts`                           | Module definition                                  |
| `projects.controller.ts`                       | Project CRUD, quick filters, components, versions  |
| `projects.service.ts`                          | Project business logic                             |
| `entities/project.entity.ts`                   | TypeORM Project entity                             |
| `entities/quick-filter.entity.ts`              | Configurable board quick filters (JQL criteria)    |
| `entities/project-component.entity.ts`         | Project components and component leads             |
| `entities/project-version.entity.ts`           | Project release versions and milestones            |

### `issues` — Bug/Issue FSM Lifecycle & Hierarchy

| File                                           | Purpose                                            |
|------------------------------------------------|----------------------------------------------------|
| `issues.module.ts`                             | Module definition                                  |
| `issues.controller.ts`                         | Issue CRUD, bulk actions, subtasks, FSM endpoints  |
| `issues.service.ts`                            | Issue domain logic & orchestration                 |
| `services/issue-core.service.ts`               | Core lifecycle, subtasks hierarchy, bulk updates   |
| `services/issue-comments.service.ts`           | Comment threads, @mention regex parsing            |
| `services/issue-worklogs.service.ts`           | Atomic effort logging, SQL statistics              |
| `services/jql-parser.service.ts`               | JQL AST parsing, syntax validation, query build    |
| `dto/validate-jql.dto.ts`                      | DTOs for server-side JQL syntax validation         |
| `dto/workflow-transition.dto.ts`               | DTOs for issue state machine transitions query     |
| `dto/reorder-issue.dto.ts`                     | DTOs for card rank positioning on board columns    |
| `entities/issue.entity.ts`                     | TypeORM Issue entity (FSM, order rank, parentId)   |
| `entities/issue-history.entity.ts`             | Audit change history on field updates              |
| `entities/comment.entity.ts`                   | Issue comments                                     |
| `entities/attachment.entity.ts`                | File attachments (SeaweedFS S3 references)         |
| `entities/worklog.entity.ts`                   | Time tracking worklogs                             |
| `entities/issue-link.entity.ts`                | Issue-to-issue links (blocks/duplicates/etc)       |

### `sprints` — Sprint, Backlog & Capacity Management

| File                                           | Purpose                                            |
|------------------------------------------------|----------------------------------------------------|
| `sprints.module.ts`                            | Module definition                                  |
| `sprints.controller.ts`                        | Sprint CRUD, start, complete/rollover, burndown    |
| `sprints.service.ts`                           | Sprint lifecycle, capacity & burndown calculation  |
| `entities/sprint.entity.ts`                    | TypeORM Sprint entity (teamId scoped)              |
| `entities/sprint-snapshot.entity.ts`           | Daily burndown snapshots of remaining work         |

### `teams` — Scrum Engineering Teams

| File                                           | Purpose                                            |
|------------------------------------------------|----------------------------------------------------|
| `teams.module.ts`                              | Module definition                                  |
| `teams.controller.ts`                          | Team CRUD, member rosters, capacity endpoints      |
| `teams.service.ts`                             | Team management & sprint capacity calculations     |
| `entities/team.entity.ts`                      | TypeORM Team entity                                |
| `entities/team-member.entity.ts`               | Team member with Scrum roles & weekly capacity     |

### `webhooks` — Project Outbound Webhooks

| File                                           | Purpose                                            |
|------------------------------------------------|----------------------------------------------------|
| `webhooks.module.ts`                           | Module definition                                  |
| `webhooks.controller.ts`                       | Webhook registration & delivery logs               |
| `webhooks.service.ts`                          | Event dispatching to external HTTP listeners       |
| `entities/project-webhook.entity.ts`           | Outbound webhook configurations                    |

### `rbac` — Role-Based Access Control

| File                                                  | Purpose                                        |
|-------------------------------------------------------|------------------------------------------------|
| `rbac.module.ts`                                      | Module definition                              |
| `rbac.controller.ts`                                  | Permission scheme / role assignment endpoints  |
| `entities/permission-scheme.entity.ts`               | Permission scheme (project-level)              |
| `entities/permission-grant.entity.ts`                | Individual permission grants                   |
| `entities/project-role.entity.ts`                    | Named project role (e.g. Developer, QA)        |
| `entities/project-role-actor.entity.ts`              | User/group assigned to a project role          |
| `entities/group.entity.ts`                           | User group entity                              |
| `entities/user-group.entity.ts`                      | User↔Group join table                          |
| `entities/issue-security-scheme.entity.ts`           | Issue visibility security scheme               |
| `entities/issue-security-level.entity.ts`            | Security level within a scheme                 |
| `entities/issue-security-grant.entity.ts`            | Grant (user/role/group) per security level     |

### `admin` — Admin Dashboard & Seeding

| File                      | Purpose                                        |
|---------------------------|------------------------------------------------|
| `admin.module.ts`         | Module definition                              |
| `seed.controller.ts`      | Database seeding endpoint (dev only)           |
| `seed.service.ts`         | Realistic dataset seeding logic                |

### `security-audit` — Brute-Force & Audit Logs

| File                                                  | Purpose                                  |
|-------------------------------------------------------|------------------------------------------|
| `security-audit.module.ts`                            | Module definition                        |
| `security-audit.controller.ts`                        | Admin audit log endpoints                |
| `security-audit.service.ts`                           | Audit log writes and queries             |
| `entities/login-audit-log.entity.ts`                 | TypeORM entity for login attempt records |

### `captcha` — Cloudflare Turnstile

| File                    | Purpose                                      |
|-------------------------|----------------------------------------------|
| `captcha.module.ts`     | Module definition                            |
| `captcha.service.ts`    | Turnstile server-side token verification     |

### `events` — WebSocket Real-Time Gateway

| File                              | Purpose                                                      |
|-----------------------------------|--------------------------------------------------------------|
| `events.module.ts`                | Module definition — Socket.IO gateway setup                  |
| `events.gateway.ts`               | Gateway implementation, JWT auth handshake, room isolation   |
| `events.gateway.spec.ts`          | Unit test suite for gateway rooms & auth                     |
| `adapters/redis-io.adapter.ts`    | Distributed Redis adapter for multi-instance horizontal sync |

### `notifications` — In-App Notification Center & Triage

| File                                           | Purpose                                                    |
|------------------------------------------------|------------------------------------------------------------|
| `notifications.module.ts`                      | Module definition, TypeOrmModule registration              |
| `notifications.controller.ts`                  | Unread queries, pagination, batch mark-read, snooze        |
| `notifications.service.ts`                     | Notification persistence & real-time socket dispatch       |
| `notifications.service.spec.ts`                | Unit test suite for notification flows                     |
| `entities/notification.entity.ts`              | TypeORM Notification entity (composite indexed)            |
| `dto/notifications.dto.ts`                     | DTOs for create, query, mark-read, and snooze              |

---

## Backend Common (`backend/src/common/`)

| Path                                              | Purpose                                              |
|---------------------------------------------------|------------------------------------------------------|
| `decorators/current-user.decorator.ts`            | Extracts authenticated user from JWT payload         |
| `decorators/public.decorator.ts`                  | Marks route as public (skips JwtAuthGuard)           |
| `decorators/roles.decorator.ts`                   | Attaches required roles metadata to route            |
| `guards/jwt-auth.guard.ts`                        | Global JWT authentication guard                      |
| `guards/roles.guard.ts`                           | System-level role enforcement                        |
| `filters/all-exceptions.filter.ts`                | Global HTTP exception filter (structured JSON errors)|

---

## Frontend (`frontend/src/`)

### Pages (`pages/`)

| File                        | Route / Purpose                               |
|-----------------------------|-----------------------------------------------|
| `LoginPage.tsx`             | `/login` — Auth login form                    |
| `RegisterPage.tsx`          | `/register` — Registration + CAPTCHA          |
| `ActivatePage.tsx`          | `/activate` — Email activation token handler  |
| `ForgotPasswordPage.tsx`    | `/forgot-password` — Request reset link       |
| `ResetPasswordPage.tsx`     | `/reset-password` — Set new password          |
| `OAuthCallbackPage.tsx`     | `/auth/callback` — OAuth redirect handler     |
| `HomePage.tsx`              | `/` — Dashboard / workspace home              |
| `ProjectsPage.tsx`          | `/projects` — Project list                    |
| `KanbanBoardPage.tsx`       | `/projects/:id/board` — Kanban drag-and-drop  |
| `BacklogPage.tsx`           | `/projects/:id/backlog` — Sprint backlog      |
| `IssueDetailPage.tsx`       | `/issues/:id` — Issue detail + worklogs       |
| `TimeTrackingPage.tsx`      | `/time` — Time tracking calendar/timesheet    |
| `AdvancedSearchPage.tsx`    | `/search` — Saved filters + JQL-style search  |
| `ProfilePage.tsx`           | `/profile` — User profile + 2FA toggle        |
| `PreferencesPage.tsx`       | `/preferences` — Appearance, notifications    |
| `ProjectSettingsPage.tsx`   | `/projects/:id/settings` — Project config     |
| `AdminDashboardPage.tsx`    | `/admin` — Admin overview                     |
| `AdminRbacPage.tsx`         | `/admin/rbac` — Role and permission management|
| `AdminSecurityAuditPage.tsx`| `/admin/security` — Audit logs viewer         |

### API Layer (`api/`)

| Path                               | Purpose                                               |
|------------------------------------|-------------------------------------------------------|
| `client.ts`                        | Axios instance with interceptors (cookie auth)        |
| `http.ts`                          | HTTP helpers: `request` and unified `uploadFile<T>`   |
| `queryClient.ts`                   | TanStack Query client configuration                   |
| `socket.ts`                        | Socket.IO client instance                             |
| `modules/auth.api.ts`              | Auth API calls (login, register, 2FA, OAuth, etc.)    |
| `modules/issues.api.ts`            | Issues CRUD, FSM transitions, card reorder API calls  |
| `modules/notifications.api.ts`     | Notifications inbox, mark-read, snooze API calls      |
| `modules/projects.api.ts`          | Projects CRUD                                         |
| `modules/rbac.api.ts`              | RBAC permission / role management                     |
| `modules/sprints.api.ts`           | Sprint management API                                 |
| `modules/users.api.ts`             | User profile + admin user management                  |
| `modules/worklogs.api.ts`          | Worklog / time tracking API                           |
| `queries/useIssuesQuery.ts`        | TanStack Query hooks & `issueQueries` factories       |
| `queries/useProjectsQuery.ts`      | TanStack Query hooks & `projectQueries` factories     |
| `queries/useRbacQuery.ts`          | TanStack Query hooks & `rbacQueries` factories        |
| `queries/useSprintsQuery.ts`       | TanStack Query hooks & `sprintQueries` factories      |
| `queries/useTeamsQuery.ts`         | TanStack Query hooks & `teamQueries` factories        |
| `queries/useUsersQuery.ts`         | TanStack Query hooks & `userQueries` factories        |
| `queries/useWebhooksQuery.ts`      | TanStack Query hooks & `webhookQueries` factories     |
| `queries/useWorklogsQuery.ts`      | TanStack Query hooks & `worklogQueries` factories     |
| `types/api.generated.ts`           | Generated TypeScript schemas via openapi-typescript   |
| `types/index.ts`                   | Common API type helpers (ApiSchema, ApiOperations)    |
| `types/auth.types.ts`              | TypeScript types for auth API responses               |
| `types/issues.types.ts`            | TypeScript types for issues                           |
| `types/notifications.types.ts`     | TypeScript types for notifications                    |
| `types/projects.types.ts`          | TypeScript types for projects                         |
| `types/rbac.types.ts`              | TypeScript types for RBAC                             |
| `types/sprints.types.ts`           | TypeScript types for sprints                          |
| `types/worklogs.types.ts`          | TypeScript types for worklogs                         |

### State Management (`store/`)

| File                      | Purpose                                               |
|---------------------------|-------------------------------------------------------|
| `useAuthStore.ts`         | Zustand store — authenticated user, 2FA state         |
| `useSidebarStore.ts`      | Zustand store — sidebar collapsed/expanded state      |
| `useThemeStore.ts`        | Zustand store — light/dark theme preference           |
| `useBroadcastStore.ts`    | Zustand store — real-time WebSocket broadcast state   |

### Component Directories (`components/`)

| Directory          | Purpose                                                  |
|--------------------|----------------------------------------------------------|
| `ui/`              | Atomic M3 primitives: DataTable, FormModal, EntityAvatar, AvatarPicker, Button, Badge, Input, Modal, etc. |
| `navigation/`      | SuperSidebar, SidebarNavList, SidebarMobileDrawer, etc.  |
| `auth/`            | Login form, Register form, 2FA modal components          |
| `notifications/`   | NotificationBell, notification dropdown popover, audio alert |
| `kanban/`          | Kanban board columns, DraggableKanbanCard (@dnd-kit), boards |
| `kanban/analytics/`| Modular sprint charts: Burndown, CFD, CycleTime, Velocity, Summary |
| `agile/`           | Sprint backlog, sprint planning, ActiveSprintBoard       |
| `issue-detail/`    | Unified IssueDetailView, comment threads, worklog form   |
| `admin/`           | Admin dashboard widgets, user management tables (DataTable)|
| `profile/`         | Profile card, EditProfileModal (AvatarPicker), 2FA wizard |
| `time/`            | Time tracking calendar, MyWorklogsTable (DataTable)       |
| `search/`          | Advanced search filters, SearchResultsTable (DataTable)  |
| `workspace/`       | Project cards, QuickSearchModal (cmdk headless menu)     |
| `home/`            | Dashboard home widgets                                   |
| `common/`          | ProtectedRoute, ErrorBoundary, Loading skeletons         |
| `public/`          | Public-facing wrappers (unauthenticated layout)          |

### Other Frontend Directories

| Path          | Purpose                                                         |
|---------------|-----------------------------------------------------------------|
| `hooks/`      | Custom React hooks (e.g., `useIssueModalUrl`, `useAuth`, `useWebSocket`) |
| `schemas/`    | Zod validation schemas for form inputs                          |
| `types/`      | Global TypeScript type declarations                             |
| `utils/`      | Pure utilities: `date.ts`, `files.ts`, `workflowTransitions.ts` |
| `assets/`     | Static assets (SVG icons, images)                               |
| `test/`       | Frontend test utilities and mocks                               |

---

## Documentation (`documentation/`)

| Path                                     | Purpose                                               |
|------------------------------------------|-------------------------------------------------------|
| `documentation/INDEX.md`                 | Central router for coding agents & fast lookup        |
| `documentation/AGENTS.md`                | Agent rules & Doc-as-Code hygiene protocol            |
| `documentation/architecture/`            | Modular monolith architecture, ERD & diagram renders  |
| `documentation/backend/`                 | 11 Active backend module specifications               |
| `documentation/backend/auth.md`          | Auth service deep technical specification             |
| `documentation/backend/events.md`        | WebSocket real-time gateway & personal notifications  |
| `documentation/backend/notifications.md` | In-app alerts, unread counts & real-time delivery     |
| `documentation/backend/seeding.md`       | Database seeding & multi-team dataset docs            |
| `documentation/frontend/`                | React 19 architecture, 19 views, M3 design system     |
| `documentation/operations/commands.md`   | CLI command cheatsheet (Docker, dev, DB, prod)        |
| `documentation/backlog/product_ideas.md` | Feature ideas backlog from developer notes            |

---

## Key Cross-Cutting Concerns

| Concern                  | Location                                                    |
|--------------------------|-------------------------------------------------------------|
| Global exception handling| `backend/src/common/filters/all-exceptions.filter.ts`       |
| JWT auth guard           | `backend/src/common/guards/jwt-auth.guard.ts`               |
| Design tokens (M3)       | `frontend/src/index.css` (all `--md-sys-color-*` variables) |
| App routing              | `frontend/src/App.tsx`                                      |
| App module imports        | `backend/src/app.module.ts`                                 |
| Docker infrastructure    | `docker-compose.yml` (PostgreSQL, Redis, Mailpit, SeaweedFS)|
