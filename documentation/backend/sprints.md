# Sprints & Agile Planning Module (`SprintsModule`)

The `SprintsModule` drives agile iterations, sprint planning, lifecycle state transitions, team capacity allocation, and accurate historical burndown analytics.

---

## 1. Sprint Lifecycle & Governance

Sprints follow strict state transitions:
```
[ PLANNED ] ──► [ ACTIVE ] ──► [ COMPLETED ]
```
* **Planned**: Issues are prioritized and allocated from the backlog during sprint planning sessions.
* **Active**: Sprints active on the Kanban board. Supports team-scoped sprints (`teamId`), enabling multiple distinct Scrum engineering teams to run concurrent active sprints within the same project workspace.
* **Completed**: Concludes the sprint. Triggers a completion summary and enables seamless issue rollover to a subsequent planned sprint (`transferSprintId`) or returning incomplete tickets to the backlog.

---

## 2. Burndown Integrity & Daily Snapshots

To guarantee accurate metrics without client-side simulation or full-table iterations:
* **`SprintSnapshot` Entity (`sprint_snapshots`)**: Captures daily immutable snapshots of sprint progress:
  * `snapshotDate`: Date of snapshot (`YYYY-MM-DD`).
  * `plannedStoryPoints`: Baseline story points at sprint start.
  * `remainingStoryPoints`: Uncompleted story points as of snapshot date.
  * `remainingHours`: Uncompleted estimated hours remaining.
  * `completedStoryPoints`: Resolved story points.
* **Burndown Endpoint (`GET /api/v1/sprints/:id/burndown`)**: Returns historical data points paired with the calculated ideal guideline from sprint `startDate` to `endDate`, accurately visualizing mid-sprint scope changes and real team velocity.

---

## 3. Team Scoping & Live Capacity Tracking

* **Team Association (`teamId`)**: Sprints can be bound to a specific delivery team (`Team` entity) or scoped at the project level.
* **Capacity Tracking (`GET /api/v1/sprints/:id/capacity`)**:
  * Computes total sprint capacity based on team member weekly hours and sprint duration.
  * Computes assigned workload per engineer and highlights over-allocated team members.
  * Provides real-time capacity meters in the sprint backlog header.

---

## 4. Primary Endpoints (`/api/v1/sprints`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/?projectId=...` | List all sprints for a specific project (with optional `status` filter) | JWT (`JwtAuthGuard`) |
| `POST` | `/` | Create a new sprint in planned status with optional team assignment | JWT (`JwtAuthGuard`) |
| `GET` | `/:id` | Retrieve sprint metadata, issues, and aggregated point totals | JWT (`JwtAuthGuard`) |
| `PATCH` | `/:id` | Update sprint name, goal, dates, team, or capacity hours | JWT (`JwtAuthGuard`) |
| `DELETE` | `/:id` | Delete sprint (relational issues cleanly revert to backlog) | Project Lead / Admin |
| `POST` | `/:id/start` | Transition sprint from `PLANNED` to `ACTIVE` (validates date ranges) | Project Lead / Admin |
| `POST` | `/:id/complete` | Complete active sprint with issue rollover (`transferSprintId` or backlog) | Project Lead / Admin |
| `GET` | `/:id/burndown` | Retrieve daily historical burndown data points and ideal guide line | JWT (`JwtAuthGuard`) |
| `GET` | `/:id/capacity` | Calculate team sprint capacity, engineer allocations, and load ratios | JWT (`JwtAuthGuard`) |

---

## 5. Key Source Files

* Controller: [`sprints.controller.ts`](../../backend/src/modules/sprints/sprints.controller.ts)
* Service: [`sprints.service.ts`](../../backend/src/modules/sprints/sprints.service.ts)
* Entities:
  * [`Sprint`](../../backend/src/modules/sprints/entities/sprint.entity.ts)
  * [`SprintSnapshot`](../../backend/src/modules/sprints/entities/sprint-snapshot.entity.ts)
