# Sprints & Agile Planning Module (`SprintsModule`)

The `SprintsModule` drives agile iterations, sprint planning, lifecycle state transitions, and backlog issue allocations.

---

## 1. Sprint Lifecycle

Sprints follow strict state transitions:
```
[ PLANNED ] ──► [ ACTIVE ] ──► [ COMPLETED ]
```
* **Planned**: Items are pulled from the backlog into the sprint during planning.
* **Active**: Only one active sprint per project is permitted concurrently; issues appear on the live Kanban board.
* **Completed**: Closes the sprint; unfinished issues can be rolled over to the backlog or next sprint.

---

## 2. Primary Endpoints (`/api/v1/sprints`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/?projectId=...` | List all sprints for a specific project | JWT (`JwtAuthGuard`) |
| `POST` | `/` | Create a new sprint in planned status | JWT (`JwtAuthGuard`) |
| `GET` | `/:id` | Retrieve sprint details and associated issues | JWT (`JwtAuthGuard`) |
| `PATCH` | `/:id` | Update sprint name, goal, dates, or status | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/start` | Transition sprint from `PLANNED` to `ACTIVE` | Project Lead / Admin |
| `POST` | `/:id/complete` | Complete active sprint and handle roll-over | Project Lead / Admin |

---

## 3. Key Source Files
* Controller: [`sprints.controller.ts`](../../backend/src/modules/sprints/sprints.controller.ts)
* Service: [`sprints.service.ts`](../../backend/src/modules/sprints/sprints.service.ts)
* Entity: [`Sprint`](../../backend/src/modules/sprints/entities/sprint.entity.ts)
