# Users & Profile Management Module (`UsersModule`)

The `UsersModule` manages user identities, profile settings, avatar storage, and user-specific saved filters.

---

## 1. Domain Responsibilities
* **User Accounts & Lifecycle**: Registration defaults to `SystemRole.USER`, administrative search, activation, blocking, unblocking, and deletion.
* **Profiles & Coworker Titles**: Full name, avatar URL, and `jobTitle` string attribute capturing engineering specializations (decoupled from authorization).
* **Root Administrator Immutability**:
  * Prevents demotion of root administrator accounts (`403 Forbidden`).
  * Prevents blocking of root administrator accounts (`403 Forbidden`).
  * Prevents deletion of root administrator accounts (`403 Forbidden`).
* **Saved Search Filters**: Storing and executing user-defined JQL/filter queries for rapid issue retrieval on the Kanban and Search pages.

---

## 2. Primary Endpoints (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/me` | Retrieve profile of the currently authenticated user | JWT (`JwtAuthGuard`) |
| `PATCH` | `/me/profile` | Update personal profile details (full name, job title) | JWT (`JwtAuthGuard`) |
| `PATCH` | `/me/avatar` | Update current user avatar URL or preset | JWT (`JwtAuthGuard`) |
| `GET` | `/me/filters` | List all saved search filters for the current user | JWT (`JwtAuthGuard`) |
| `POST` | `/me/filters` | Save a new custom search filter | JWT (`JwtAuthGuard`) |
| `DELETE` | `/me/filters/:id` | Delete an existing saved filter | JWT (`JwtAuthGuard`) |
| `GET` | `/assignees` | List active users eligible for issue assignment | JWT (`JwtAuthGuard`) |
| `GET` | `/` | Paginated search of all users with role/status filters | Admin (`Roles('ADMIN')`) |
| `GET` | `/stats` | Aggregated user metrics and role breakdown (`ADMIN`/`USER`) | Admin (`Roles('ADMIN')`) |
| `PATCH` | `/:id/role` | Update user system role (`ADMIN`/`USER`) and job title (protects root admin) | Admin (`Roles('ADMIN')`) |
| `PATCH` | `/:id/block` | Block user account (protects root admin) | Admin (`Roles('ADMIN')`) |
| `PATCH` | `/:id/unblock` | Unblock user account | Admin (`Roles('ADMIN')`) |
| `PATCH` | `/:id/activate` | Manually activate user account | Admin (`Roles('ADMIN')`) |
| `PATCH` | `/:id/reset-2fa` | Reset user 2FA configuration | Admin (`Roles('ADMIN')`) |
| `DELETE` | `/:id` | Delete user account (protects root admin) | Admin (`Roles('ADMIN')`) |

---

## 3. Key Source Files
* Controller: [`users.controller.ts`](../../backend/src/modules/users/users.controller.ts)
* Service: [`users.service.ts`](../../backend/src/modules/users/users.service.ts)
* Unit Tests: [`users.service.spec.ts`](../../backend/src/modules/users/users.service.spec.ts)
* Entities:
  * [`User`](../../backend/src/modules/users/entities/user.entity.ts)
  * [`SavedFilter`](../../backend/src/modules/users/entities/saved-filter.entity.ts)
