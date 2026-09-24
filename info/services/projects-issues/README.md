# Projects & Issues Service (`software/backend/src/modules/projects` & `issues`)

This document details the core domain services for managing software engineering workspaces, issues, comments, sprints, and workflow lifecycles.

---

## 1. Domain Entities & Schema

### 1.1. `Project` Entity
- `id`: Unique integer identifier.
- `key`: Mnemonic uppercase identifier (e.g. `CORE`, `UI`, `AUTH`) with unique constraint.
- `name`: Full project title.
- `description`: Detailed technical scope.
- `leadId`: User ID referencing the project manager or technical lead.

### 1.2. `Issue` Entity
- `id`: Unique integer identifier.
- `projectId`: References parent `Project` (cascade on delete).
- `issueNum`: Sequential project-scoped counter (e.g. `1`, `2`, `3`). Unique composite index on `(projectId, issueNum)`.
- `title`: Short summary (up to 255 chars).
- `description`: Markdown-compatible defect description or specification.
- `issueType`: `BUG`, `TASK`, `FEATURE`, `IMPROVEMENT`.
- `status`: `OPEN`, `IN_PROGRESS`, `REVIEW`, `RESOLVED`, `CLOSED`.
- `priority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `severity`: `TRIVIAL`, `MINOR`, `MAJOR`, `BLOCKER`.
- `estimatedHours`: Planned effort estimation.
- `loggedHours`: Aggregated effort spent by developers.
- `sprint`: Sprint designation (e.g. `Sprint 1`, or `null` for backlog).
- `reporterId`: References reporting user.
- `assigneeId`: References assigned developer or `null`.

### 1.3. `Comment` Entity
- `id`: Unique integer identifier.
- `issueId`: References target `Issue` (cascade on delete).
- `authorId`: References commenting user.
- `text`: Discussion text.
- `createdAt`: Timestamp.

---

## 2. REST API Endpoints

| Method | Endpoint | Description | Role Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/projects` | List all projects with issue counts | Authenticated |
| `POST` | `/api/v1/projects` | Create a new project workspace | Authenticated |
| `GET` | `/api/v1/projects/:id` | Get project details | Authenticated |
| `DELETE` | `/api/v1/projects/:id` | Delete project workspace | `ADMIN` only |
| `GET` | `/api/v1/issues` | Multi-criteria issue search (projectId, status, sprint, priority, search) | Authenticated |
| `POST` | `/api/v1/issues` | Create a new issue (sequential issueNum) | All registered users |
| `GET` | `/api/v1/issues/:id` | Get issue details with comments and worklogs | Authenticated |
| `PATCH` | `/api/v1/issues/:id/status` | Transition issue status (FSM) | Authenticated |
| `PATCH` | `/api/v1/issues/:id/assign-me` | Self-assign issue to authenticated developer | Authenticated |
| `PATCH` | `/api/v1/issues/:id/sprint` | Move issue between active sprint and backlog | Authenticated |
| `PATCH` | `/api/v1/issues/:id` | Update issue metadata | Authenticated |
| `DELETE` | `/api/v1/issues/:id` | Delete issue | Authenticated |
| `POST` | `/api/v1/issues/:id/comments` | Add comment to issue discussion | Authenticated |
