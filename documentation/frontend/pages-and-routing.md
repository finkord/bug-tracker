# Frontend Route Map & Page Catalog (19 Views)

This document indexes all 19 lazy-loaded views configured in [`App.tsx`](../../frontend/src/App.tsx).

---

## 1. Route Table & Access Controls

| Route Path | Component | Guard Type | Description |
|---|---|---|---|
| `/` | `HomePage` | Public | Landing portal for guest visitors; dashboard overview for authenticated users |
| `/login` | `LoginPage` | `PublicOnlyRoute` | Email + password login, Turnstile captcha, Google/GitHub OAuth links |
| `/register` | `RegisterPage` | `PublicOnlyRoute` | User onboarding, password strength indicator, Turnstile verification |
| `/activate` | `ActivatePage` | Public | Single-use email activation handler |
| `/forgot-password`| `ForgotPasswordPage` | `PublicOnlyRoute` | Request password reset token via email |
| `/reset-password` | `ResetPasswordPage` | `PublicOnlyRoute` | Form to set new password using emailed token |
| `/oauth/callback` | `OAuthCallbackPage` | Public | Handles OAuth redirect, processes tokens, and establishes session |
| `/dashboard` | `HomePage` | `ProtectedRoute` | Authenticated personal dashboard |
| `/projects` | `ProjectsPage` | `ProtectedRoute` | List and search all team project spaces |
| `/projects/:id/settings` | `ProjectSettingsPage` | `ProtectedRoute` | Project details, lead, and team role memberships |
| `/board` | `KanbanBoardPage` | `ProtectedRoute` | Global or default project Kanban board |
| `/projects/:projectId/board` | `KanbanBoardPage` | `ProtectedRoute` | Project-specific Kanban board with columns & swimlanes |
| `/backlog` | `BacklogPage` | `ProtectedRoute` | Agile sprint backlog and sprint planning tool |
| `/projects/:projectId/backlog` | `BacklogPage` | `ProtectedRoute` | Project sprint planning and issue backlog |
| `/issues/:key` | `IssueDetailPage` | `ProtectedRoute` | Detailed issue view: worklogs, comments, links, attachments |
| `/search` | `AdvancedSearchPage` | `ProtectedRoute` | JQL/Text search with saved filter support |
| `/time-tracking` | `TimeTrackingPage` | `ProtectedRoute` | Timesheet matrix and personal/team worklog aggregation |
| `/profile` | `ProfilePage` | `ProtectedRoute` | User profile, avatar management, and TOTP 2FA configuration |
| `/preferences` | `PreferencesPage` | `ProtectedRoute` | Theme selector (Dark/Light mode) and layout density controls |
| `/admin` | `AdminDashboardPage` | `AdminRoute` | System health overview, user management, and tenant metrics |
| `/admin/dashboard`| `AdminDashboardPage` | `AdminRoute` | Primary administrative dashboard tab |
| `/admin/rbac` | `AdminRbacPage` | `AdminRoute` | Manage permission schemes, project roles, and user groups |
| `/admin/security-logs` | `AdminSecurityAuditPage` | `AdminRoute` | Forensic audit log viewer for suspicious logins and lockouts |

---

## 2. Guard Specifications

* **`PublicOnlyRoute`**: Redirects authenticated users to `/dashboard` if an active session already exists.
* **`ProtectedRoute`**: Verifies authenticated user via `useAuth()`. Redirects unauthenticated guests to `/login`.
* **`AdminRoute`**: Verifies both authenticated session AND `user.systemRole === 'ADMIN'`. Redirects unauthorized users.
