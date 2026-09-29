# Users & Profile Management Module (`UsersModule`)

The `UsersModule` manages user identities, profile settings, avatar storage, and user-specific saved filters.

---

## 1. Domain Responsibilities
* **User Accounts**: Creation, updates, queries, and soft-delete/deactivation.
* **Profiles & Preferences**: Full name, avatar URL, UI preferences (theme mode, curved sidebar density).
* **Saved Search Filters**: Storing and executing user-defined JQL/filter queries for rapid issue retrieval on the Kanban and Search pages.

---

## 2. Primary Endpoints (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/me` | Retrieve profile of the currently authenticated user | JWT (`JwtAuthGuard`) |
| `PATCH` | `/me` | Update personal profile details (name, avatar, theme) | JWT (`JwtAuthGuard`) |
| `GET` | `/filters` | List all saved search filters for the current user | JWT (`JwtAuthGuard`) |
| `POST` | `/filters` | Save a new custom search filter | JWT (`JwtAuthGuard`) |
| `DELETE` | `/filters/:id` | Delete an existing saved filter | JWT (`JwtAuthGuard`) |

---

## 3. Key Source Files
* Controller: [`users.controller.ts`](../../backend/src/modules/users/users.controller.ts)
* Service: [`users.service.ts`](../../backend/src/modules/users/users.service.ts)
* Entities:
  * [`User`](../../backend/src/modules/users/entities/user.entity.ts)
  * [`SavedFilter`](../../backend/src/modules/users/entities/saved-filter.entity.ts)
