# Projects & Workspaces Module (`ProjectsModule`)

The `ProjectsModule` manages team project spaces, project keys, lead assignments, and permission scheme bindings.

---

## 1. Domain Responsibilities
* **Project Key Uniqueness**: Enforces unique, uppercase prefix keys (e.g. `CORE`, `UI`, `INFRA`) used to namespace all issues (`CORE-101`).
* **Leadership & Ownership**: Every project designates a Lead User responsible for issue assignments and project configuration.
* **Security & Permissions**: Binds projects to a specific `PermissionScheme` and optional `IssueSecurityScheme`.
* **Multi-Tenant Isolation**: Enforces tenant boundary isolation. Non-admin users can only retrieve projects they are explicitly permitted to view via `PermissionEvaluatorService.getAccessibleProjectIds(userId)`.
* **Atomic Workspace Provisioning**: Creating a new project runs in an atomic database transaction. If no scheme is specified, it binds the default permission scheme and automatically enrolls the designated project lead in the `Administrators` project role (`ProjectRoleActor`), instantly synchronizing RBAC caches.

---

## 2. Primary Endpoints (`/api/v1/projects`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | List all projects accessible to caller (enforces multi-tenant isolation) | JWT (`JwtAuthGuard`) |
| `POST` | `/` | Create project space, bind default scheme, and assign lead role (Admin only) | Admin (`Roles('ADMIN')`) |
| `GET` | `/:id` | Get detailed project metadata and configuration | JWT (`JwtAuthGuard`) |
| `PATCH` | `/:id` | Update project name, lead, or permission scheme | Admin / Project Lead |
| `DELETE` | `/:id` | Delete or archive project | Admin (`Roles('ADMIN')`) |

---

## 3. Key Source Files
* Controller: [`projects.controller.ts`](../../backend/src/modules/projects/projects.controller.ts)
* Service: [`projects.service.ts`](../../backend/src/modules/projects/projects.service.ts)
* Entity: [`Project`](../../backend/src/modules/projects/entities/project.entity.ts)
