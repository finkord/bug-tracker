# Issues & Effort Tracking Module (`IssuesModule`)

The `IssuesModule` is the core work-item engine of BugTracker, handling tickets, Finite State Machine (FSM) transitions, issue linking, threaded discussions, worklog time tracking, and SeaweedFS S3 attachments.

---

## 1. Domain Capabilities

### Issue Lifecycles (FSM)
Issues transition across discrete states:
```
[ OPEN ] ──► [ IN_PROGRESS ] ──► [ RESOLVED ] ──► [ CLOSED ]
    ▲               │
    └── Reopened ───┘
```
Supported Issue Types: `BUG`, `TASK`, `STORY`, `EPIC`.  
Supported Priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

### Subsystems Handled
1. **Worklogs (Time Tracking)**:
   - Engineers log hours/seconds against an issue.
   - Automatically aggregates cumulative `timeSpentSeconds` against estimated effort.
2. **Issue Linking**:
   - Directed relations between issues: `BLOCKS`, `IS_BLOCKED_BY`, `RELATES_TO`, `DUPLICATES`.
3. **Attachments**:
   - Uploaded directly to SeaweedFS distributed S3 object store (`@aws-sdk/client-s3`).
   - Secure download URLs generated on demand.
4. **Comments**:
   - Real-time discussion threads attached to issues.

---

## 2. Primary Endpoints (`/api/v1/issues`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | Query issues by project, sprintId, status, or assignee | JWT (`JwtAuthGuard`) |
| `POST` | `/` | Create a new issue in a project (with relational `sprintId`) | JWT (`JwtAuthGuard`) |
| `GET` | `/:id` | Get full issue details (with worklogs, comments & sprint) | JWT (`JwtAuthGuard`) |
| `PATCH` | `/:id` | Update issue attributes or transition status | JWT (`JwtAuthGuard`) |
| `PATCH` | `/:id/sprint` | Update relational sprint assignment (`sprintId: number \| null`) | JWT (`JwtAuthGuard`) |
| `DELETE` | `/:id` | Delete an issue | Admin / Project Lead |
| `POST` | `/:id/comments` | Add a comment to an issue | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/worklogs` | Log effort time against an issue | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/links` | Link this issue to another issue | JWT (`JwtAuthGuard`) |
| `POST` | `/:id/attachments` | Upload an attachment file to S3 | JWT (`JwtAuthGuard`) |

---

## 3. Key Source Files
* Controller: [`issues.controller.ts`](../../backend/src/modules/issues/issues.controller.ts)
* Service: [`issues.service.ts`](../../backend/src/modules/issues/issues.service.ts)
* Entities:
  * [`Issue`](../../backend/src/modules/issues/entities/issue.entity.ts)
  * [`Worklog`](../../backend/src/modules/issues/entities/worklog.entity.ts)
  * [`Comment`](../../backend/src/modules/issues/entities/comment.entity.ts)
  * [`IssueLink`](../../backend/src/modules/issues/entities/issue-link.entity.ts)
  * [`Attachment`](../../backend/src/modules/issues/entities/attachment.entity.ts)
