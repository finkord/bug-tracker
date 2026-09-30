# Role-Based Access Control Module (`RbacModule`)

The `RbacModule` implements enterprise-grade, dual-layer access control inspired by Jira's permission architecture.

---

## 1. Onboarding & RBAC Assignment Workflow

### Rendered Workflow Diagram
![Onboarding RBAC Workflow](../architecture/diagrams/onboarding_rbac_workflow.png)

<details>
<summary><b>Click to expand Mermaid Source Code</b></summary>

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Employee / New User
    participant Frontend as React 19 Frontend
    participant Gateway as NestJS API Gateway
    participant Kanban as Security/Admins Board
    actor Admin as Admin / Security Lead
    participant DB as PostgreSQL 15

    Employee->>Frontend: Creates ticket "Onboarding: Access to CORE Team"
    Frontend->>Gateway: POST /api/v1/issues (email, targetTeam, requirements)
    Gateway->>DB: INSERT Issue (queue = Admins/Security)
    Gateway-->>Kanban: WebSocket Broadcast (New ticket in Backlog)
    Admin->>Kanban: Assigns ticket to self, moves to "In Progress"
    Admin->>Frontend: Navigates to Admin Center -> User Management
    Admin->>Gateway: GET /api/v1/admin/users?query=employee@example.com
    Admin->>Gateway: PATCH /api/v1/admin/users/:id/roles (Assigns CORE-Dev Role & Group)
    Gateway->>DB: INSERT UserGroup / ProjectRoleActor
    Gateway-->>Frontend: 200 OK (Roles updated)
    Admin->>Kanban: Transitions ticket to "Pending Reporter"
    Employee->>Frontend: Verifies access, leaves confirmation comment
    Admin->>Kanban: Transitions ticket to "Resolved / Done"
```
</details>

---

## 2. Dual-Layer Authorization Architecture

```
Layer 1: Global System Roles (User.systemRole)
         ├── ADMIN  (Full platform & tenant authority, immutable root)
         └── USER   (Standard authenticated user)

Layer 2: Project-Scoped Roles (ProjectRoleActor)
         ├── Project Administrator
         ├── Lead Developer
         └── Member / Contributor
```

* **Global System Role**: Pure binary flag (`ADMIN` vs `USER`). All professional disciplines and team job functions (such as Frontend Engineer, QA Lead, DevOps Architect) are decoupled from system authorization and maintained in `User.jobTitle`.
* **Root Administrator Immutability Guarantees**:
  * The designated root administrator account (holding `User.isRoot === true` or matching `INITIAL_ADMIN_EMAIL`) cannot be demoted to `USER` (`403 Forbidden`).
  * The root administrator account cannot be blocked via administrative user controls (`403 Forbidden`).
  * The root administrator account cannot be deleted (`403 Forbidden`).
  * The root administrator account cannot be removed from the `administrators` directory group (`403 Forbidden`).
  * Non-root administrators (promoted accounts holding `SystemRole.ADMIN`) display the `Admin` role, and may be demoted back to `USER`, blocked, or deleted by authorized administrators.

### Permission Schemes & Grants
* **PermissionScheme**: Defines reusable permission sets assigned to projects.
* **PermissionGrant**: Maps a granular action (`CREATE_ISSUES`, `EDIT_ISSUES`, `ASSIGN_ISSUES`, `DELETE_ISSUES`, `CLOSE_ISSUES`, `ADMINISTER_PROJECTS`, `BROWSE_PROJECTS`) to:
  * A Project Role (e.g. `Developer`),
  * A User Group (e.g. `Engineering-CORE`),
  * The Project Lead, or
  * The Current Assignee.

### Issue Security Schemes
* Protects high-confidentiality issues (e.g. zero-day security reports, internal HR tickets).
* Issues assigned an `IssueSecurityLevel` are hidden from users unless they match an `IssueSecurityGrant`.

---

## 3. Primary Endpoints (`/api/v1/rbac`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/schemes` | List all permission schemes | Admin (`Roles('ADMIN')`) |
| `POST` | `/schemes` | Create a new permission scheme | Admin (`Roles('ADMIN')`) |
| `GET` | `/groups` | List all user groups | JWT (`JwtAuthGuard`) |
| `POST` | `/groups` | Create an organizational group | Admin (`Roles('ADMIN')`) |
| `POST` | `/groups/:id/members` | Add a user to a group | Admin (`Roles('ADMIN')`) |
| `DELETE` | `/groups/:id/members/:userId`| Remove a user from a group (protects root admins) | Admin (`Roles('ADMIN')`) |
| `GET` | `/roles` | List all available project roles | JWT (`JwtAuthGuard`) |
| `GET` | `/projects/:id/rbac/people` | Retrieve project members and their assigned roles | `ProjectPermission.BROWSE_PROJECTS` |
| `POST` | `/projects/:id/rbac/roles/:roleId/actors` | Assign user or group to project role | `ProjectPermission.ADMINISTER_PROJECTS` |
| `DELETE` | `/projects/:id/rbac/roles/:roleId/actors` | Remove user or group from project role | `ProjectPermission.ADMINISTER_PROJECTS` |

---

## 4. Key Source Files
* Controller: [`rbac.controller.ts`](../../backend/src/modules/rbac/rbac.controller.ts)
* Service: [`rbac.service.ts`](../../backend/src/modules/rbac/rbac.service.ts)
* Permission Evaluator: [`permission-evaluator.service.ts`](../../backend/src/modules/rbac/services/permission-evaluator.service.ts)
* Project Permission Guard: [`project-permission.guard.ts`](../../backend/src/modules/rbac/guards/project-permission.guard.ts)
* Entities: [`backend/src/modules/rbac/entities/`](../../backend/src/modules/rbac/entities)
