# Role-Based Access Control (RBAC) Architecture

This service provides customizable access control for BugTracker, supporting multi-tenant project roles, global directory groups, reusable permission schemes, and row-level issue security schemes.

---

## 1. Architectural Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Global Entities                        │
 │  ┌───────────────────────┐       ┌───────────────────────┐  │
 │  │        Users          │◄─────►│    Directory Groups   │  │
 │  │  (System Role: ADMIN) │       │ (e.g. administrators) │  │
 │  └───────────────────────┘       └───────────────────────┘  │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Assigned via
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                Project-Specific Role Actors                 │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │ Global Roles: Administrator, Developer, Member, Viewer│  │
 │  │ Project Actor: (Project X, Role Y) -> User OR Group   │  │
 │  └───────────────────────────────────────────────────────┘  │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Evaluated against
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     Permission Schemes                      │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │ Blueprints (e.g. Default Software Scheme)             │  │
 │  │ Grants: (Permission, GrantType, Role/Group/Lead/...)  │  │
 │  │ 25+ Granular Permissions (BROWSE, EDIT, LOG_WORK...)  │  │
 │  └───────────────────────────────────────────────────────┘  │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Attached to
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                    Project & Issue Level                    │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │ Project: permissionSchemeId, securitySchemeId         │  │
 │  │ Issue: securityLevelId (Internal, Confidential, etc.) │  │
 │  └───────────────────────────────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Entities & Data Model

### 1. Global Directory Groups (`Group`, `UserGroup`)
- **Table**: `groups`, `user_groups`
- **Purpose**: Directory collections of users (e.g., `administrators`, `all-users`, `core-platform`, `ui-engineers`, `devops-sre`, `security-ops`).
- Allows assigning entire engineering squads to project roles in a single operation.

### 2. Project Roles (`ProjectRole`, `ProjectRoleActor`)
- **Table**: `project_roles`, `project_role_actors`
- **Purpose**: Globally defined roles with per-project actor assignments.
  - **Standard Roles**: `Administrator`, `Developer`, `Member`, `Viewer`.
  - **ProjectRoleActor**: Maps an actor (`USER` or `GROUP`) to a specific `roleId` within a given `projectId`.

### 3. Permission Schemes (`PermissionScheme`, `PermissionGrant`)
- **Table**: `permission_schemes`, `permission_grants`
- **Purpose**: Reusable blueprints defining what roles, groups, or dynamic users can perform specific operations.
- **Grant Types**:
  - `ROLE`: Explicit Project Role (e.g., `Developer`).
  - `GROUP`: Global Directory Group (e.g., `security-ops`).
  - `LEAD`: Project Lead of the specific project.
  - `REPORTER`: Author / Creator of the ticket.
  - `ASSIGNEE`: Currently assigned engineer.
  - `ANY_LOGGED_IN`: Any authenticated user.

- **Supported Permissions (`ProjectPermission`)**:
  - **Project**: `BROWSE_PROJECTS`, `ADMINISTER_PROJECTS`, `VIEW_ROADMAP`
  - **Issue**: `CREATE_ISSUES`, `EDIT_ISSUES`, `ASSIGN_ISSUES`, `ASSIGNABLE_USER`, `DELETE_ISSUES`, `MOVE_ISSUES`, `CLOSE_ISSUES`, `TRANSITION_ISSUES`
  - **Comments & Worklogs**: `ADD_COMMENTS`, `EDIT_ALL_COMMENTS`, `EDIT_OWN_COMMENTS`, `DELETE_ALL_COMMENTS`, `DELETE_OWN_COMMENTS`, `LOG_WORK`, `EDIT_OWN_WORKLOGS`, `EDIT_ALL_WORKLOGS`, `DELETE_OWN_WORKLOGS`, `DELETE_ALL_WORKLOGS`
  - **Attachments**: `CREATE_ATTACHMENTS`, `DELETE_ALL_ATTACHMENTS`, `DELETE_OWN_ATTACHMENTS`

### 4. Issue Security Schemes (`IssueSecurityScheme`, `IssueSecurityLevel`, `IssueSecurityGrant`)
- **Table**: `issue_security_schemes`, `issue_security_levels`, `issue_security_grants`
- **Purpose**: Row-level ticket isolation.
- **Security Levels**:
  - `Internal Engineering Only`: Accessible to project developers and members.
  - `Confidential / Security Vulnerability`: Restricted strictly to Project Leads, Assignees, and Security team.

---

## 3. Authorization Engine

### PermissionEvaluatorService
Located in `backend/src/modules/rbac/services/permission-evaluator.service.ts`:
```ts
async hasPermission(
  userId: number,
  projectId: number,
  permission: ProjectPermission,
  context?: { issue?: Issue; comment?: Comment; worklog?: Worklog }
): Promise<boolean>
```

#### Evaluation Pipeline:
1. **Global Admin Bypass**: If user has `systemRole === 'ADMIN'`, immediately return `true`.
2. **Project Scheme Resolution**: Fetch project's attached `permissionSchemeId` (or fall back to system default).
3. **User Group & Role Expansion**: Resolve all groups the user belongs to, plus all Project Roles assigned to the user directly or via group membership.
4. **Grant Matching**: Verify if any `PermissionGrant` matches:
   - `ROLE` match against user's active project roles.
   - `GROUP` match against user's directory groups.
   - `LEAD` match (`project.leadId === userId`).
   - `REPORTER` match (`issue.reporterId === userId`).
   - `ASSIGNEE` match (`issue.assigneeId === userId`).
   - `ANY_LOGGED_IN`.
5. **Issue Security Filter**: If an issue has `securityLevelId`, confirm the user satisfies the issue security grants before returning the issue in search, kanban, or details.

### Guards & Decorators
- `@RequireProjectPermission(ProjectPermission.EDIT_ISSUES)`
- `ProjectPermissionGuard`: Intercepts requests, extracts `projectId` from params/body/issue lookup, and enforces evaluation.

---

## 4. API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/rbac/groups` | List all directory groups with member counts |
| `POST` | `/api/v1/rbac/groups` | Create directory group |
| `POST` | `/api/v1/rbac/groups/:id/members` | Add user to directory group |
| `DELETE` | `/api/v1/rbac/groups/:id/members/:userId` | Remove user from directory group |
| `GET` | `/api/v1/rbac/roles` | List global project roles |
| `POST` | `/api/v1/rbac/roles` | Create new project role |
| `GET` | `/api/v1/rbac/permission-schemes` | List permission schemes with grant rules |
| `GET` | `/api/v1/rbac/permission-schemes/:id` | Get scheme details |
| `POST` | `/api/v1/rbac/permission-schemes/:id/grants` | Add grant rule |
| `DELETE` | `/api/v1/rbac/permission-schemes/:id/grants/:grantId` | Delete grant rule |
| `GET` | `/api/v1/rbac/security-schemes` | List issue security schemes and levels |
| `GET` | `/api/v1/projects/:id/rbac/people` | Get project role actors grouped by role |
| `POST` | `/api/v1/projects/:id/rbac/roles/:roleId/actors` | Assign user or group to project role |
| `DELETE` | `/api/v1/projects/:id/rbac/roles/:roleId/actors/:actorId` | Remove actor from project role |
| `GET` | `/api/v1/projects/:id/rbac/permissions/me` | Get current user's effective permissions for project |
| `PUT` | `/api/v1/projects/:id/rbac/permission-scheme` | Switch active permission scheme for project |

---

## 5. Frontend Interfaces

1. **Admin RBAC Portal (`/admin/rbac`)**:
   - Tabbed Material 3 interface: *Global Directory Groups*, *Project Roles*, *Permission Schemes*, *Issue Security Schemes*.
   - Live modal group member assignment and instant grant rule inspections.

2. **Project People & Permissions (`/projects/:id/settings`)**:
   - Accessible via Project Settings.
   - Live permission scheme switcher.
   - Role-grouped actor cards with instant User/Group assignment dropdowns and removal actions.
   - Active permissions indicator badge.
