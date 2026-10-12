# Frontend Wireframes & UI Layout Specifications

This document provides high-fidelity UI wireframe specifications, layout hierarchies, component trees, and token mappings for BugTracker. It is designed to be directly referenced in university laboratory reports (e.g. Frontend UI/UX, Wireframes & Interaction Design) and used as a blueprint for Figma reproductions.

---

## 1. Global Design System Tokens & Foundations

The frontend follows the **Material Design 3 Expressive** standard with a custom dual-theme CSS token hierarchy defined in `src/index.css`.

| Design Element | Token / Specification | Usage in UI |
| :--- | :--- | :--- |
| **Primary Hue** | `var(--md-sys-color-primary)` (`#3B82F6` / `#60A5FA`) | Buttons, focused tabs, active drag rings, primary CTA |
| **Surface Base** | `var(--md-sys-color-surface)` | Page background canvas |
| **Surface Container** | `var(--md-sys-color-surface-container)` | Cards, dialog backings, drawer surfaces |
| **Surface High** | `var(--md-sys-color-surface-container-high)` | Table header backings, hover item highlights |
| **Outline Variant** | `var(--md-sys-color-outline-variant)` | Borders, divider lines, muted strokes |
| **Typography** | Inter, Roboto, sans-serif | 11px (Micro), 13px (Body), 15px (Section), 20px (Heading) |
| **Border Radii** | `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-full` (9999px) | M3 Expressive pill buttons, card curves, tag chips |

---

## 2. Global Application Shell Wireframe

All authenticated views render within the persistent global application shell (`SuperSidebar` + `WorkspaceHeader` + Dynamic Main Viewport).

```
+----------------------------------------------------------------------------------------------------+
|  [Logo] BugTracker   [Project Switcher: PROJ v]  | [Search Input Ctrl+K]  [QuickAdd +] [Bell (3)] [User v]|
+-------------------+--------------------------------------------------------------------------------+
| [Side Nav]        | [Breadcrumbs: Workspace > Projects > NETOPS > Kanban Board]                   |
|                   |--------------------------------------------------------------------------------|
| - Home / Dashboard|                                                                                |
| - Projects        |                                                                                |
| - My Issues       |                             PAGE CONTENT VIEWPORT                              |
| - Backlog / Agile |                     (Flat Board / Swimlanes / Table / Form)                    |
| - Time Tracking   |                                                                                |
| - Search (JQL)    |                                                                                |
|                   |                                                                                |
| --- Admin ---     |                                                                                |
| - Users & Teams   |                                                                                |
| - RBAC & Schemes  |                                                                                |
| - Security Audit  |                                                                                |
| - System Banners  |                                                                                |
+-------------------+--------------------------------------------------------------------------------+
| (Collapse Sidebar)| Status: Real-time Connected (WebSocket)                         v0.0.1 (prod)  |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Screen Specifications & Wireframe Blueprints

### Screen 1: Authentication & Onboarding (Login & Register)
- **Route**: `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Purpose**: Authenticate user credentials, enforce password policy, execute Turnstile verification, and support OAuth2 federation (GitHub/Google).

#### Layout Structure
```
+-------------------------------------------------------------------------+
|                               [Center Card]                             |
|                           [Logo] BugTracker                             |
|                     Sign in to your development space                   |
|                                                                         |
|   [ Continue with GitHub ]           [ Continue with Google ]           |
|   ------------------------------ OR ---------------------------------   |
|   Email Address:      [ user@company.com                           ]   |
|   Password:           [ ****************                        (eye) ]   |
|                                                                         |
|   [Dev QuickFill: Auto-fill Administrator (DEV mode only)]             |
|                                                                         |
|   [ Cloudflare Turnstile CAPTCHA (Managed Non-Interactive Widget) ]     |
|                                                                         |
|   [               Sign In (Primary Filled Button)                 ]     |
|                                                                         |
|   [Forgot password?]                           [Create an account]      |
+-------------------------------------------------------------------------+
```

---

### Screen 2: User Home / Personal Dashboard
- **Route**: `/`
- **Purpose**: Unified command center displaying recently visited issues, tickets assigned to current user, quick metrics, and team activity feeds.

#### Layout Structure
```
+------------------------------------------------------------------------------------+
| Welcome back, Alex Chen!                          [+ Create Issue] [Open Backlog] |
| Engineering Lead - CORE Platform Team                                              |
+------------------------------------+-----------------------------------------------+
| [My Assigned Issues (5)]           | [Recent Projects & Workspaces]                |
| - CORE-102: Migrate Redis Cluster  | - CORE (Core Platform Services)       [94%]   |
| - NET-44: Turnstile Rate Limiter   | - UI (Web Frontend & Design System)   [88%]   |
| - MON-12: Prometheus Metrics Expose| - MONOPS (Telemetry & Alerting)       [76%]   |
+------------------------------------+-----------------------------------------------+
| [Worklog Summary (This Week: 34h)] | [System Announcements]                        |
| Mon: 7.5h | Tue: 8.0h | Wed: 6.5h  | Scheduled maintenance: Sunday 02:00 UTC       |
+------------------------------------+-----------------------------------------------+
```

---

### Screen 3: Kanban Board & Agile Workflow
- **Route**: `/projects/:projectId/board`
- **Purpose**: Visual task board with drag-and-drop transitions (`@dnd-kit`), WIP limits, swimlanes (Assignee / Epic / Subtasks), and real-time Socket.IO synchronization.

#### Layout Structure
```
+------------------------------------------------------------------------------------------------------+
| [Board: CORE Sprint 24]  [View: Flat Board v]  [Swimlane: None v]  [Filter: Assigned to me]  [Settings] |
| Quick Filters: [My Issues] [Critical Only] [Backend] [Frontend]            Search: [Filter tickets...] |
+------------------+-------------------+-------------------+--------------------+------------------+
| TO DO (4)        | IN PROGRESS (3/5) | IN REVIEW (2/3)   | RESOLVED (8)       | CLOSED (15)      |
| WIP Limit: --    | WIP Limit: 5      | WIP Limit: 3      | WIP Limit: --      | WIP Limit: --    |
+------------------+-------------------+-------------------+--------------------+------------------+
| [CORE-110] (High)| [CORE-105] (Crit) | [CORE-101] (Med)  | [CORE-98] (Low)    | [CORE-90] (Done) |
| Fix race in JWT  | SeaweedFS S3 API  | Add Avatar Picker | Socket.IO Redis Ad.| Initial Schema   |
| Assignee: Elena  | Assignee: Alex    | Assignee: Dmytro  | Assignee: Ivan     | Closed 2d ago    |
| [Backend] [Bug]  | [Storage] [Task]  | [UI] [Feature]    | [Infra] [Task]     | [DB]             |
|                  |                   |                   |                    |                  |
| [CORE-112] (Med) | [CORE-108] (Med)  |                   |                    |                  |
| Refactor Mailpit | TOTP 2FA Lockout  |                   |                    |                  |
+------------------+-------------------+-------------------+--------------------+------------------+
| (+ Add Ticket)   | (+ Add Ticket)    | (+ Add Ticket)    | (+ Add Ticket)     | (+ Add Ticket)   |
+------------------+-------------------+-------------------+--------------------+------------------+
```

---

### Screen 4: Agile Backlog & Sprint Planning
- **Route**: `/projects/:projectId/backlog`
- **Purpose**: Manage active and upcoming sprints, drag backlog tickets into sprint scopes, estimate story points, and trigger sprint completion modal.

#### Layout Structure
```
+------------------------------------------------------------------------------------------------------+
| Backlog & Sprint Scope                     [+ Create Sprint] [+ Create Issue] [Sprint Analytics]   |
+------------------------------------------------------------------------------------------------------+
| > SPRINT 24 (ACTIVE) - 8 Issues (24 pts) - Ends in 4 days                    [Complete Sprint Button] |
|   Goal: Finalize security audit logging and production SeaweedFS cluster                             |
|   - [::] [CORE-105] SeaweedFS S3 upload integration        (Crit) (8 pts) [Alex C.]   [IN PROGRESS] |
|   - [::] [CORE-108] Distributed 2FA lockout rate limiter   (High) (5 pts) [Elena R.]  [IN PROGRESS] |
|   - [::] [CORE-101] M3 Expressive Avatar Picker UI         (Med)  (3 pts) [Dmytro S.] [IN REVIEW]   |
+------------------------------------------------------------------------------------------------------+
| v SPRINT 25 (PLANNED) - 5 Issues (16 pts) - Starts Oct 19                    [Start Sprint Button]    |
|   Goal: Webhook integrations and VCS commit links                                                    |
|   - [::] [CORE-115] GitHub webhook HMAC-SHA256 signature   (High) (5 pts) [Unassigned][OPEN]        |
|   - [::] [CORE-116] GitLab pipeline status synchronizer    (Med)  (3 pts) [Unassigned][OPEN]        |
+------------------------------------------------------------------------------------------------------+
| v BACKLOG - 14 Issues (Unassigned to sprints)                                                       |
|   - [::] [CORE-120] Database query index optimization      (High) (8 pts)             [OPEN]        |
|   - [::] [CORE-121] Add dark theme contrast verification   (Low)  (2 pts)             [OPEN]        |
+------------------------------------------------------------------------------------------------------+
```

---

### Screen 5: Issue Detail & Activity Stream
- **Route**: `/projects/:projectId/issues/:issueId` (and modal overlay)
- **Purpose**: Full issue inspection, inline field editing (Title, Description, Status, Priority, Assignee), attachments, time worklog tracker, and VCS pull requests.

#### Layout Structure
```
+----------------------------------------------------------------------------------------------------+
| [Back to Board]  CORE-105: SeaweedFS S3 upload integration             [Actions v] [Watch] [Share] |
+----------------------------------------------------------+-----------------------------------------+
| [MAIN CONTENT]                                           | [SIDEBAR METRICS]                       |
| Status: [IN PROGRESS v]  Resolution: [Unresolved]        | Project:      Core Platform (CORE)      |
|                                                          | Issue Type:   [Task v]                  |
| Description:                                             | Priority:     [CRITICAL v]              |
| Direct file upload handling via SeaweedFS master assign  | Assignee:     [Alex Chen (Lead) v]      |
| and chunked storage. Enforce file size validation.       | Reporter:     [Elena Rostova v]         |
|                                                          | Sprint:       [Sprint 24 v]             |
| Attachments (2):                                         | Security:     [Internal Staff Only]     |
| [ s3_diagram.png (240 KB) ]  [ log_trace.txt (14 KB) ]   | Estimated:    8h                        |
|                                                          | Logged Time:  5h 30m                    |
| Activity Stream:                                         | Remaining:    2h 30m                    |
| [Comments (3)]  [History (12)]  [Worklogs (2)]  [VCS (1)]|                                         |
| - Alex Chen: Configured storage proxy endpoints. (2h ago)| VCS Development:                        |
| - Elena Rostova: Verified MIME type whitelist. (1h ago)  | PR #42: feat(storage): S3 upload [OPEN] |
+----------------------------------------------------------+-----------------------------------------+
```

---

### Screen 6: Advanced Search & JQL Query Console
- **Route**: `/search`
- **Purpose**: Server-side issue filtering supporting both Basic Dropdown filters and full Jira Query Language (JQL) syntax with autocomplete, validation, and saved filters.

#### Layout Structure
```
+----------------------------------------------------------------------------------------------------+
| Search Issues                                            [Switch to Basic Filters] [Save Filter +] |
| JQL: [ project = "CORE" AND status = "IN_PROGRESS" AND priority in ("CRITICAL", "HIGH") ORDER BY created DESC ] |
| (Green Check: Valid JQL query syntax)                                                 [Search CTA] |
+----------------------------------------------------------------------------------------------------+
| Saved Filters: [My Open Bugs] [Sprint 24 Blockers] [Unassigned Backend Tasks] [Recent Criticals]   |
+----------------------------------------------------------------------------------------------------+
| RESULTS (3 issues found)                                        Export: [CSV] [JSON] [Print View]  |
| Key       | Title                           | Type    | Priority | Assignee   | Status      | Created|
| CORE-105  | SeaweedFS S3 upload integration | Task    | Critical | Alex Chen  | IN PROGRESS | 2d ago |
| CORE-108  | TOTP 2FA lockout rate limiter   | Feature | High     | Elena R.   | IN PROGRESS | 1d ago |
| CORE-110  | Fix race in JWT refresh session | Bug     | High     | Alex Chen  | OPEN        | 4h ago |
+----------------------------------------------------------------------------------------------------+
```

---

### Screen 7: Administration Suite (RBAC, Users, Security Audit)
- **Route**: `/admin/users`, `/admin/teams`, `/admin/rbac`, `/admin/security-audit`, `/admin/announcements`
- **Purpose**: Enterprise administration, role and permission grants matrix, 2FA enforcement audit, IP login attempt forensics, and global maintenance banners.

#### Layout Structure
```
+----------------------------------------------------------------------------------------------------+
| Administration Control Panel                                                                       |
| Tabs: [Users (48)]  [Teams (5)]  [RBAC Permissions]  [Security Logs]  [Announcements]  [System]    |
+----------------------------------------------------------------------------------------------------+
| Role-Based Access Control (RBAC) Permissions Matrix                                                |
| Project Scheme: [CORE Platform Default Scheme v]                      [+ Create Role] [+ Add Grant]|
|                                                                                                    |
| Permission Key            | Project Admin | Lead Engineer | Team Member | Viewer / Guest           |
| BROWSE_PROJECTS           | [x]           | [x]           | [x]         | [x]                      |
| CREATE_ISSUES             | [x]           | [x]           | [x]         | [ ]                      |
| EDIT_ISSUES               | [x]           | [x]           | [x]         | [ ]                      |
| TRANSITION_ISSUES         | [x]           | [x]           | [x]         | [ ]                      |
| DELETE_ISSUES             | [x]           | [x]           | [ ]         | [ ]                      |
| MANAGE_SPRINTS            | [x]           | [x]           | [ ]         | [ ]                      |
| ADMINISTER_PROJECT        | [x]           | [ ]           | [ ]         | [ ]                      |
+----------------------------------------------------------------------------------------------------+
```
