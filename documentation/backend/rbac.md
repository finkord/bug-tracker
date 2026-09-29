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
         ├── ADMIN  (Full platform & tenant authority)
         └── USER   (Standard authenticated user)

Layer 2: Project-Scoped Roles (ProjectRoleActor)
         ├── Project Administrator
         ├── Lead Developer
         └── Member / Contributor
```

### Permission Schemes & Grants
* **PermissionScheme**: Defines reusable permission sets assigned to projects.
* **PermissionGrant**: Maps a granular action (`CREATE_ISSUES`, `EDIT_ISSUES`, `ASSIGN_ISSUES`, `DELETE_ISSUES`, `CLOSE_ISSUES`) to:
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
| `DELETE` | `/groups/:id/members/:userId`| Remove a user from a group | Admin (`Roles('ADMIN')`) |
| `GET` | `/roles` | List all available project roles | JWT (`JwtAuthGuard`) |

---

## 4. Key Source Files
* Controller: [`rbac.controller.ts`](../../backend/src/modules/rbac/rbac.controller.ts)
* Service: [`rbac.service.ts`](../../backend/src/modules/rbac/rbac.service.ts)
* Entities: [`backend/src/modules/rbac/entities/`](../../backend/src/modules/rbac/entities)
