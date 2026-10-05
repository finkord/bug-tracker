# Issues & Effort Tracking Module (`IssuesModule`)

The `IssuesModule` is the core work-item engine of BugTracker, handling tickets, Finite State Machine (FSM) transitions, subtask hierarchies, bulk actions, change audit history, issue linking, threaded discussions, worklog time tracking, and SeaweedFS S3 attachments.

---

## 1. Domain Capabilities

### Issue Lifecycles (FSM)
Issues transition across discrete states:
```
[ OPEN ] ──► [ IN_PROGRESS ] ──► [ RESOLVED ] ──► [ CLOSED ]
    ▲               │
    └── Reopened ───┘
```
Supported Issue Types: `BUG`, `TASK`, `STORY`, `EPIC`, `SUBTASK`.  
Supported Priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

### Subsystems Handled

1. **Subtasks & Issue Hierarchy**:
   - Tickets support parent-child relationships via `parentId: number | null`.
   - Subtasks inherit project context and enforce parent boundaries.
   - Parent tickets dynamically calculate child completion progress (e.g. `3/5 subtasks completed`).
   - Supports independent subtask estimates with optional parent rollup.
2. **Bulk Actions & Multi-Select Operations**:
   - High-throughput batch processing endpoint (`POST /api/v1/issues/bulk`) supporting up to 100 tickets simultaneously.
   - Operations: Bulk status transition, bulk reassignment, bulk sprint movement, and bulk deletion.
   - Executed within database transactions with granular permission validation per issue.
3. **Change History & Audit Trail**:
   - Every modification to title, description, status, priority, assignee, estimate, sprint, component, or labels writes an immutable record to `issue_histories` (`IssueHistory` entity).
   - Tracks `fieldName`, `oldValue`, `newValue`, `authorId`, and `createdAt`.
   - Retrieved via `GET /api/v1/issues/:id/history` for chronological Activity audit views.
4. **Server-Side JQL Search & GIN Full-Text Indexing**:
   - Jira-compatible AST parser supporting clauses (`project`, `status`, `priority`, `issueType`, `assignee`, `reporter`, `sprint`, `component`, `labels`, `text`, `key`), dynamic functions (`currentUser()`, `me`, `empty`), and `ORDER BY`.
   - Functional PostgreSQL GIN index `idx_issues_search_vector` on `to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))` providing sub-5ms searches on 50,000+ issues without full-table scans.
   - Enforces tenant project boundary isolation via `PermissionEvaluatorService.getAccessibleProjectIds` and row-level issue security level filtering.
5. **Worklogs & Time Management**:
   - Engineers log hours against an issue with atomic updates inside `dataSource.transaction(...)`.
   - Uses native PostgreSQL atomic arithmetic: `UPDATE issues SET logged_hours = ROUND((COALESCE(logged_hours, 0) + :hours)::numeric, 2) WHERE id = :issueId`.
   - Prevents lost updates and race conditions via PostgreSQL row-level locking on the target issue row.
   - Worklog deletion atomically decrements logged hours: `GREATEST(ROUND((COALESCE(logged_hours, 0) - :hours)::numeric, 2), 0)`.
   - System-wide statistics (`/worklogs/stats`) computed entirely via database-level SQL aggregations (`SUM`, `CASE WHEN`, `GROUP BY`) with zero JavaScript heap array iterations.
   - Team timesheet matrix (`/worklogs/matrix`) bounded to a maximum of 62 days to prevent denial-of-service.
   - Personal worklogs (`/worklogs/me`) enforce server-side pagination with `{ items, total, page, limit, totalPages }`.
6. **Components & Labels Taxonomies**:
   - Issues can be bound to project components (`componentId`) and tagged with multiple labels (`labels`).
   - Selecting a component with a configured lead automatically defaults the assignee if unassigned.
7. **Issue Linking**:
   - Directed relations between issues: `BLOCKS`, `IS_BLOCKED_BY`, `RELATES_TO`, `DUPLICATES`.
8. **Attachments**:
   - Uploaded directly to SeaweedFS distributed S3 object store (`@aws-sdk/client-s3`).
   - Secure download URLs generated on demand.
9. **Comments**:
   - Real-time discussion threads attached to issues.
10. **Real-Time Notification & Mention Triggers**:
    - Status transitions notify the assignee and reporter (`STATUS_CHANGED`).
    - Assignment and unassignment notify affected engineers (`ASSIGNED`, `UNASSIGNED`).
    - Priority escalations to `HIGH` or `CRITICAL` alert the assignee (`PRIORITY_CHANGED`).
    - Moving tickets into active sprints notifies the assignee (`SPRINT_ASSIGNED`).
    - Comment threads trigger notifications for reporter and assignee (`COMMENT_ADDED`), plus parse `@username` tokens to generate instant mention alerts (`MENTIONED`).

---

## 2. Primary Endpoints (`/api/v1/issues`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | Query issues with multi-criteria filters or JQL expression | JWT (`JwtAuthGuard`) |
| `POST` | `/` | Create a new issue in a project (with optional `parentId`, `sprintId`, `componentId`) | JWT (`JwtAuthGuard`) |
| `GET` | `/:id` | Get full issue details (with worklogs, comments, subtasks & sprint) | JWT (`JwtAuthGuard`) |
| `PATCH` | `/:id` | Update issue attributes or transition status | JWT (`JwtAuthGuard`) |
| `PATCH` | `/:id/sprint` | Update relational sprint assignment (`sprintId: number \| null`) | JWT (`JwtAuthGuard`) |
| `DELETE` | `/:id` | Delete an issue (enforces reporter 24h grace or admin rights) | Admin / Lead / Reporter |
| `POST` | `/bulk` | Atomic bulk actions (status, assignee, sprint, delete) | JWT (`JwtAuthGuard`) |
| `GET` | `/:id/subtasks` | Retrieve all child subtasks and completion counts | JWT (`JwtAuthGuard`) |
| `GET` | `/:id/history` | Retrieve chronological audit history of field modifications | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/comments` | Add a comment to an issue | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/worklogs` | Log effort time against an issue (atomic transaction) | JWT + `LOG_WORK` |
| `DELETE` | `/:id/worklogs/:worklogId` | Delete a worklog entry (atomic transaction decrement) | JWT + `LOG_WORK` (Author/Admin) |
| `GET` | `/worklogs/me` | Paginated personal worklogs (`page`, `limit`) | JWT (`JwtAuthGuard`) |
| `GET` | `/worklogs/stats` | High-performance SQL-aggregated time metrics | JWT (`JwtAuthGuard`) |
| `GET` | `/worklogs/matrix` | Team timesheet matrix (clamped to 62 days, supports groupBy=user\|issue) | JWT (`JwtAuthGuard`) |
| `POST` | `/jql/validate` | Server-side JQL syntax and AST validation | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/links` | Link this issue to another issue | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/attachments` | Upload an attachment file to S3 | JWT (`JwtAuthGuard`) |

---

## 3. Key Source Files

* Controller: [`issues.controller.ts`](../../backend/src/modules/issues/issues.controller.ts)
* Service: [`issues.service.ts`](../../backend/src/modules/issues/issues.service.ts)
* Sub-Services:
  * Core & Lifecycle: [`issue-core.service.ts`](../../backend/src/modules/issues/services/issue-core.service.ts)
  * Comments & Mentions: [`issue-comments.service.ts`](../../backend/src/modules/issues/services/issue-comments.service.ts)
  * Worklogs: [`issue-worklogs.service.ts`](../../backend/src/modules/issues/services/issue-worklogs.service.ts)
  * JQL Parser & Validator: [`jql-parser.service.ts`](../../backend/src/modules/issues/services/jql-parser.service.ts)
* Entities:
  * [`Issue`](../../backend/src/modules/issues/entities/issue.entity.ts)
  * [`IssueHistory`](../../backend/src/modules/issues/entities/issue-history.entity.ts)
  * [`Worklog`](../../backend/src/modules/issues/entities/worklog.entity.ts)
  * [`Comment`](../../backend/src/modules/issues/entities/comment.entity.ts)
  * [`IssueLink`](../../backend/src/modules/issues/entities/issue-link.entity.ts)
  * [`Attachment`](../../backend/src/modules/issues/entities/attachment.entity.ts)
