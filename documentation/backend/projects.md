# Projects & Workspaces Module (`ProjectsModule`)

The `ProjectsModule` manages team project spaces, project keys, lead assignments, permission scheme bindings, board quick filters, project components, release versions, and webhooks.

---

## 1. Domain Responsibilities

* **Project Key Uniqueness**: Enforces unique, uppercase prefix keys (e.g. `CORE`, `UI`, `INFRA`) used to namespace all issues (`CORE-101`).
* **Leadership & Ownership**: Every project designates a Lead User responsible for issue assignments and project configuration.
* **Security & Permissions**: Binds projects to a specific `PermissionScheme` and optional `IssueSecurityScheme`.
* **Multi-Tenant Isolation**: Enforces tenant boundary isolation. Non-admin users can only retrieve projects they are explicitly permitted to view via `PermissionEvaluatorService.getAccessibleProjectIds(userId)`.
* **Atomic Workspace Provisioning**: Creating a new project runs in an atomic database transaction. If no scheme is specified, it binds the default Agile Collaborative Scheme and automatically enrolls the creator in `Administrators` and the `all-users` system group in `Developers` (`ProjectRoleActor`), instantly synchronizing RBAC caches and eliminating permission deadlocks.
* **Configurable Board Quick Filters**: Enables Tech Leads and Project Administrators to configure custom JQL filter pills per project board (e.g., `Only My Issues`, `Unassigned`, `High Priority`, `Security Bugs`) with drag-and-drop position sorting.
* **Project Components & Auto-Assignment**: Provides architectural taxonomy (e.g., `Frontend`, `API`, `Database`, `Auth`). Each component can specify a dedicated Component Lead; assigning an issue to that component auto-routes the default assignee to the component lead.
* **Project Versions & Releases**: Manages release lifecycles (`UNRELEASED`, `RELEASED`, `ARCHIVED`), scheduled release dates, release notes, and version-scoped backlog filtering.
* **Project Webhooks**: Dispatches outbound HTTP webhooks on issue, sprint, and comment events to external CI/CD pipelines, chat systems, or monitoring tools.

---

## 2. Primary Endpoints (`/api/v1/projects`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | List all projects accessible to caller (enforces multi-tenant isolation) | JWT (`JwtAuthGuard`) |
| `POST` | `/` | Create project space, bind default scheme, and assign lead/admin roles | Admin (`Roles('ADMIN')`) |
| `GET` | `/:id` | Get detailed project metadata and configuration | JWT (`JwtAuthGuard`) |
| `PATCH` | `/:id` | Update project name, lead, or permission scheme | Admin / Project Lead |
| `DELETE` | `/:id` | Delete or archive project | Admin (`Roles('ADMIN')`) |
| `GET` | `/:id/quick-filters` | Retrieve configured board quick filters ordered by position | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/quick-filters` | Create a new board quick filter with custom JQL query | Project Lead / Admin |
| `PATCH` | `/:id/quick-filters/:filterId` | Update name, JQL criteria, or position of a quick filter | Project Lead / Admin |
| `DELETE` | `/:id/quick-filters/:filterId` | Delete a board quick filter | Project Lead / Admin |
| `GET` | `/:id/components` | Retrieve all components and assigned leads for a project | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/components` | Create a new component with optional lead user | Project Lead / Admin |
| `PATCH` | `/:id/components/:componentId`| Update component name, description, or lead | Project Lead / Admin |
| `DELETE` | `/:id/components/:componentId`| Delete component (issues unlinked cleanly) | Project Lead / Admin |
| `GET` | `/:id/versions` | List project versions and release statuses | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/versions` | Create a new project version | Project Lead / Admin |
| `PATCH` | `/:id/versions/:versionId` | Update version release state, release date, or notes | Project Lead / Admin |
| `DELETE` | `/:id/versions/:versionId` | Delete version | Project Lead / Admin |
| `GET` | `/:id/webhooks` | List configured project webhooks | Project Lead / Admin |
| `POST` | `/:id/webhooks` | Register an outbound webhook | Project Lead / Admin |
| `DELETE` | `/:id/webhooks/:webhookId` | Remove a webhook | Project Lead / Admin |

---

## 3. Key Source Files

* Controller: [`projects.controller.ts`](../../backend/src/modules/projects/projects.controller.ts)
* Service: [`projects.service.ts`](../../backend/src/modules/projects/projects.service.ts)
* Entities:
  * [`Project`](../../backend/src/modules/projects/entities/project.entity.ts)
  * [`ProjectQuickFilter`](../../backend/src/modules/projects/entities/quick-filter.entity.ts)
  * [`ProjectComponent`](../../backend/src/modules/projects/entities/project-component.entity.ts)
  * [`ProjectVersion`](../../backend/src/modules/projects/entities/project-version.entity.ts)
  * [`ProjectWebhook`](../../backend/src/modules/webhooks/entities/project-webhook.entity.ts)
