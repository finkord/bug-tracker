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

### `projects` — Project Workspaces

| File                                    | Purpose                                   |
|-----------------------------------------|-------------------------------------------|
| `projects.module.ts`                    | Module definition                         |
| `projects.controller.ts`               | Project CRUD endpoints                   |
| `projects.service.ts`                  | Project business logic                   |
| `entities/project.entity.ts`           | TypeORM Project entity                   |

### `issues` — Bug/Issue FSM Lifecycle

| File                                      | Purpose                                       |
|-------------------------------------------|-----------------------------------------------|
| `issues.module.ts`                        | Module definition                             |
| `issues.controller.ts`                    | Issue CRUD + FSM transition endpoints         |
| `issues.service.ts`                       | Issue domain logic, status transitions        |
| `entities/issue.entity.ts`               | TypeORM Issue entity (status FSM)            |
| `entities/comment.entity.ts`             | Issue comments                               |
| `entities/attachment.entity.ts`          | File attachments (SeaweedFS references)      |
| `entities/worklog.entity.ts`             | Time tracking worklogs                       |
| `entities/issue-link.entity.ts`          | Issue-to-issue links (blocks/duplicates/etc) |

### `sprints` — Sprint & Backlog Management

| File                                    | Purpose                                   |
|-----------------------------------------|-------------------------------------------|
| `sprints.module.ts`                     | Module definition                         |
| `sprints.controller.ts`                | Sprint CRUD + issue assignment endpoints  |
| `sprints.service.ts`                   | Sprint business logic                     |
| `entities/sprint.entity.ts`            | TypeORM Sprint entity                     |

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

| File                  | Purpose                                              |
|-----------------------|------------------------------------------------------|
| `events.module.ts`    | Module definition — Socket.IO gateway for Kanban     |

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
| `http.ts`                          | Generic HTTP helpers                                  |
| `queryClient.ts`                   | TanStack Query client configuration                   |
| `socket.ts`                        | Socket.IO client instance                             |
| `modules/auth.api.ts`              | Auth API calls (login, register, 2FA, OAuth, etc.)    |
| `modules/issues.api.ts`            | Issues CRUD + FSM transition calls                    |
| `modules/projects.api.ts`          | Projects CRUD                                         |
| `modules/rbac.api.ts`              | RBAC permission / role management                     |
| `modules/sprints.api.ts`           | Sprint management API                                 |
| `modules/users.api.ts`             | User profile + admin user management                  |
| `modules/worklogs.api.ts`          | Worklog / time tracking API                           |
| `queries/useIssuesQuery.ts`        | TanStack Query hooks for issues                       |
| `queries/useProjectsQuery.ts`      | TanStack Query hooks for projects                     |
| `queries/useRbacQuery.ts`          | TanStack Query hooks for RBAC                         |
| `queries/useSprintsQuery.ts`       | TanStack Query hooks for sprints                      |
| `queries/useUsersQuery.ts`         | TanStack Query hooks for users                        |
| `queries/useWorklogsQuery.ts`      | TanStack Query hooks for worklogs                     |
| `types/auth.types.ts`              | TypeScript types for auth API responses               |
| `types/issues.types.ts`            | TypeScript types for issues                           |
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
| `ui/`              | Atomic M3 primitives: Button, Badge, Input, Modal, etc.  |
| `navigation/`      | SuperSidebar, SidebarNavList, SidebarMobileDrawer, etc.  |
| `auth/`            | Login form, Register form, 2FA modal components          |
| `kanban/`          | Kanban board columns, drag-and-drop card components      |
| `agile/`           | Sprint backlog, sprint planning components               |
| `issue-detail/`    | Issue detail panel, comment thread, worklog form         |
| `admin/`           | Admin dashboard widgets, user management tables          |
| `profile/`         | Profile card, 2FA setup wizard components               |
| `time/`            | Time tracking calendar, timesheet grid                   |
| `search/`          | Advanced search filters, saved filter management         |
| `workspace/`       | Project cards, workspace overview widgets                |
| `home/`            | Dashboard home widgets                                   |
| `common/`          | ProtectedRoute, ErrorBoundary, Loading skeletons         |
| `public/`          | Public-facing wrappers (unauthenticated layout)          |

### Other Frontend Directories

| Path          | Purpose                                                         |
|---------------|-----------------------------------------------------------------|
| `hooks/`      | Custom React hooks (e.g., `useAuth`, `useWebSocket`)            |
| `schemas/`    | Zod validation schemas for form inputs                          |
| `types/`      | Global TypeScript type declarations                             |
| `utils/`      | Pure utility functions (date formatting, string helpers, etc.)  |
| `assets/`     | Static assets (SVG icons, images)                               |
| `test/`       | Frontend test utilities and mocks                               |

---

## Documentation (`documentation/`)

| Path                                     | Purpose                                               |
|------------------------------------------|-------------------------------------------------------|
| `documentation/INDEX.md`                 | Central router for coding agents & fast lookup        |
| `documentation/AGENTS.md`                | Agent rules & Doc-as-Code hygiene protocol            |
| `documentation/architecture/`            | Modular monolith architecture, ERD & diagram renders  |
| `documentation/backend/`                 | 10 Active backend module specifications               |
| `documentation/backend/auth.md`          | Auth service deep technical specification             |
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
