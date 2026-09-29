# Administration & System Health Module (`AdminModule`)

The `AdminModule` provides administrative controls, platform health diagnostics, user management, and global system configuration.

---

## 1. Domain Responsibilities
* **User Management**: Administrative search, role assignment (`systemRole`), and account lock reset.
* **System Health Diagnostics**: Evaluates database connectivity, Redis connection, and S3 SeaweedFS status.
* **Security & Usage Metrics**: Aggregates tenant user metrics and 2FA adoption rates.

---

## 2. Primary Endpoints (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | System health check (PostgreSQL, Redis, Storage) | Admin (`Roles('ADMIN')`) |
| `GET` | `/users` | Paginated search of all users across the system | Admin (`Roles('ADMIN')`) |
| `PATCH` | `/users/:id/role` | Update user global system role (`ADMIN` / `USER`) | Admin (`Roles('ADMIN')`) |
| `POST` | `/users/:id/unlock` | Clear account lockout and reset failed attempts | Admin (`Roles('ADMIN')`) |
| `GET` | `/stats` | Aggregated user and ticket analytics | Admin (`Roles('ADMIN')`) |

---

## 3. Key Source Files
* Controller: [`admin.controller.ts`](../../backend/src/modules/admin/admin.controller.ts)
* Service: [`admin.service.ts`](../../backend/src/modules/admin/admin.service.ts)
