# Frontend Route Map & Page Catalog

This document indexes all lazy-loaded views and nested sub-routes configured in [`App.tsx`](../../frontend/src/App.tsx).

---

## 1. Route Table & Access Controls

### Public & Authentication Routes

| Route Path | Component | Guard Type | Description |
|---|---|---|---|
| `/` | `HomePage` | Public | Landing portal for guest visitors; dashboard overview for authenticated users |
| `/login` | `LoginPage` | `PublicOnlyRoute` | Email and password login, Turnstile captcha, Google/GitHub OAuth links |
| `/register` | `RegisterPage` | `PublicOnlyRoute` | User onboarding, password strength indicator, Turnstile verification |
| `/activate` | `ActivatePage` | Public | Single-use email activation handler |
| `/forgot-password`| `ForgotPasswordPage` | `PublicOnlyRoute` | Request password reset token via email |
| `/reset-password` | `ResetPasswordPage` | `PublicOnlyRoute` | Form to set new password using emailed token |
| `/oauth/callback` | `OAuthCallbackPage` | Public | Handles OAuth redirect, processes tokens, and establishes session |

### Core Workspace & Agile Views

| Route Path | Component | Guard Type | Description |
|---|---|---|---|
| `/dashboard` | `HomePage` | `ProtectedRoute` | Authenticated personal dashboard |
| `/my-issues` | `MyIssuesPage` | `ProtectedRoute` | Personal assigned, reported, and watching issue queues |
| `/projects` | `ProjectsPage` | `ProtectedRoute` | List and search all team project spaces |
| `/projects/:id` / `/projects/:projectId` | `ProjectOverviewPage` | `ProtectedRoute` | Project overview, metrics, and activity summary |
| `/projects/:id/settings` / `/projects/:projectId/settings` | `ProjectSettingsPage` | `ProtectedRoute` | Project configuration, lead assignment, and role memberships |
| `/board` / `/projects/:projectId/board` | `KanbanBoardPage` | `ProtectedRoute` | Kanban board with customizable columns, drag and drop, and swimlanes |
| `/backlog` / `/projects/:projectId/backlog` | `BacklogPage` | `ProtectedRoute` | Agile sprint backlog and sprint planning tool |
| `/issues/:key` | `IssueDetailPage` | `ProtectedRoute` | Issue detail view: worklogs, comments, links, and attachments |
| `/search` | `AdvancedSearchPage` | `ProtectedRoute` | JQL and text search with saved filter support |
| `/time-tracking` | `TimeTrackingPage` | `ProtectedRoute` | Timesheet matrix and personal/team worklog aggregation |
| `/profile` | `ProfilePage` | `ProtectedRoute` | User profile, avatar management, and TOTP 2FA configuration |
| `/users/:userId` | `UserProfileViewPage` | `ProtectedRoute` | Read-only public profile viewer for team members |
| `/preferences` | `PreferencesPage` | `ProtectedRoute` | Theme selector (Dark/Light mode) and layout density controls |

### Administration & System Center (Nested Sub-Routes)

All administration routes are guarded by `AdminRoute` (`user.systemRole === 'ADMIN'`) and rendered inside the nested [`AdminLayout.tsx`](../../frontend/src/pages/admin/AdminLayout.tsx) shell.

| Route Path | Component | Guard Type | Description |
|---|---|---|---|
| `/admin` | `Navigate` | `AdminRoute` | Redirects directly to `/admin/users` |
| `/admin/users` | `AdminUsersPage` | `AdminRoute` | User directory, role assignment, account activation, and 2FA recovery |
| `/admin/teams` | `AdminTeamsPage` | `AdminRoute` | Engineering and Scrum team management, lead assignment, memberships |
| `/admin/rbac` | `AdminRbacPage` | `AdminRoute` | Permission schemes, project roles, and user group management |
| `/admin/security` | `AdminSecurityLogsPage` | `AdminRoute` | Forensic audit log viewer for suspicious logins, lockouts, and IP traces |
| `/admin/projects` | `AdminProjectsPage` | `AdminRoute` | System-wide project governance, category management, deletion safety |
| `/admin/announcements`| `AdminAnnouncementsPage`| `AdminRoute` | Broadcast management with WYSIWYG severity banner preview and live sync |
| `/admin/dashboard` | `Navigate` | `AdminRoute` | Backward-compatibility alias redirecting to `/admin/users` |
| `/admin/security-logs`| `Navigate` | `AdminRoute` | Backward-compatibility alias redirecting to `/admin/security` |

---

## 2. Guard Specifications

* **`PublicOnlyRoute`**: Redirects authenticated users to `/dashboard` if an active session already exists.
* **`ProtectedRoute`**: Verifies authenticated user session via `useAuth()`. Redirects unauthenticated guests to `/login`.
* **`AdminRoute`**: Verifies both an authenticated session AND `user.systemRole === 'ADMIN'`. Redirects unauthorized users to `/`.

---

## 3. Administration Center Architecture

The Administration Center implements a nested sub-route architecture aligned with US enterprise design standards (Linear, GitHub Settings, Jira Cloud Console):

### Navigation & Full-Width Canvas Layout
1. **Primary Global Super-Sidebar**: The primary global navigation on the left links into `/admin/users`.
2. **Horizontal Admin Navigation Tabs**: Rendered across the top of `AdminLayout` directly below the Governance Telemetry Ribbon, providing full-width screen canvas for wide enterprise tables (Users DataTable, Audit Logs, RBAC Schemes):
   - **Users & Identity** (`/admin/users`)
   - **Scrum Teams** (`/admin/teams`)
   - **Access Control & RBAC** (`/admin/rbac`)
   - **Security & Audit Logs** (`/admin/security`)
   - **Projects Governance** (`/admin/projects`)
   - **System Announcements** (`/admin/announcements`)
3. **Responsive Scrollable Rail**: On smaller mobile screens, the horizontal tab rail provides fluid, touch-friendly horizontal scrolling (`overflow-x-auto no-scrollbar`).

### Real-Time Governance Telemetry Ribbon
The top ribbon inside `AdminLayout` continuously displays:
- **WebSocket Live Pulse**: Connection state to the `/events` namespace (`Connected` vs `Reconnecting`).
- **User Directory KPI**: Ratio of active users to total users (`active / total`).
- **2FA Adoption Metric**: Percentage of user accounts secured with TOTP two-factor authentication.

### Sub-Route Lifecycle Isolation
By utilizing React Router `<Outlet />`, each admin section operates with its own lifecycle:
- Mounting and unmounting a specific administrative tool does not interfere with the navigation shell.
- Prevents cross-tab state pollution and avoids synthetic focus loops or microtask queues that could stall route transitions in React 19 Concurrent Mode.

---

## 4. URL Deep-Linking & Modal Single Source of Truth

* **`?issue=KEY-123` Parameter**:
  - The URL query parameter `?issue=KEY-123` serves as the single source of truth for opening issue details across Kanban boards, Backlogs, and Search pages.
  - Managed by [`useIssueModalUrl.ts`](../../frontend/src/hooks/useIssueModalUrl.ts).
  - Both modal dialogs and full-page `/issues/:key` render the unified [`IssueDetailView.tsx`](../../frontend/src/components/issue-detail/IssueDetailView.tsx) component, guaranteeing 100% feature parity between modal and page views.
