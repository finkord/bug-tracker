# Database Schema & Entity Relationships

This document details the PostgreSQL 15 database schema configured via TypeORM in the NestJS backend (`backend/src/`).

---

## 1. Entity-Relationship Diagram

### Rendered ER View
![Database ER Diagram](diagrams/database_er.png)

<details>
<summary><b>Click to expand Mermaid Source Code</b></summary>

```mermaid
erDiagram
    User ||--o{ SavedFilter : "creates"
    User ||--o{ Project : "leads"
    User ||--o{ Issue : "reports"
    User ||--o{ Issue : "assigned_to"
    User ||--o{ Comment : "authors"
    User ||--o{ Worklog : "logs_effort"
    User ||--o{ Attachment : "uploads"
    User ||--o{ UserGroup : "belongs_to"
    User ||--o{ LoginAuditLog : "generates"

    Project ||--o{ Sprint : "contains"
    Project ||--o{ Issue : "owns"
    Project ||--o{ ProjectRoleActor : "configures"

    Sprint ||--o{ Issue : "schedules"

    Issue ||--o{ Comment : "has"
    Issue ||--o{ Worklog : "tracks"
    Issue ||--o{ Attachment : "attaches"
    Issue ||--o{ IssueLink : "source_of"
    Issue ||--o{ IssueLink : "target_of"

    Group ||--o{ UserGroup : "includes"

    PermissionScheme ||--o{ PermissionGrant : "defines"
    ProjectRole ||--o{ ProjectRoleActor : "assigned_in"

    IssueSecurityScheme ||--o{ IssueSecurityLevel : "contains"
    IssueSecurityLevel ||--o{ IssueSecurityGrant : "governs"
```
</details>

---

## 2. Entity Catalog (19 Domain Entities)

### A. Identity & Core Users (`modules/users/`)
1. **[`User`](../../backend/src/modules/users/entities/user.entity.ts)**:
   - Primary table: `users`
   - Attributes: `id` (UUID), `email` (UK), `fullName`, `passwordHash` (Argon2id), `systemRole` (`ADMIN`, `USER`), `twoFactorSecret`, `isTwoFactorEnabled`, `isActive`, `activationToken`, `lockoutUntil`, `failedLoginAttempts`, `avatarUrl`, `themePreference`.
2. **[`SavedFilter`](../../backend/src/modules/users/entities/saved-filter.entity.ts)**:
   - Saved custom JQL/query filters per user (`userId`, `name`, `query`, `isFavorite`).

### B. Projects, Sprints & Planning (`modules/projects/`, `modules/sprints/`)
3. **[`Project`](../../backend/src/modules/projects/entities/project.entity.ts)**:
   - Primary table: `projects`
   - Attributes: `id` (UUID), `key` (UK, e.g. `CORE`, `UI`), `name`, `description`, `leadId` (FK to `users`), `permissionSchemeId`.
4. **[`Sprint`](../../backend/src/modules/sprints/entities/sprint.entity.ts)**:
   - Primary table: `sprints`
   - Attributes: `id`, `projectId`, `name`, `goal`, `status` (`PLANNED`, `ACTIVE`, `COMPLETED`), `startDate`, `endDate`.

### C. Issue Tracking & Forensics (`modules/issues/`)
5. **[`Issue`](../../backend/src/modules/issues/entities/issue.entity.ts)**:
   - Primary table: `issues`
   - Attributes: `id`, `key` (UK, e.g. `CORE-101`), `title`, `description`, `type` (`BUG`, `TASK`, `STORY`, `EPIC`), `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `projectId`, `sprintId`, `reporterId`, `assigneeId`, `estimateHours`, `timeSpentHours`.
6. **[`Worklog`](../../backend/src/modules/issues/entities/worklog.entity.ts)**:
   - Tracks logged engineering effort: `id`, `issueId`, `authorId`, `timeSpentSeconds`, `startedAt`, `description`.
7. **[`Comment`](../../backend/src/modules/issues/entities/comment.entity.ts)**:
   - Threaded issue discussions: `id`, `issueId`, `authorId`, `body`, `createdAt`, `updatedAt`.
8. **[`Attachment`](../../backend/src/modules/issues/entities/attachment.entity.ts)**:
   - Metadata for S3 files: `id`, `issueId`, `uploaderId`, `filename`, `s3Key`, `mimeType`, `sizeBytes`.
9. **[`IssueLink`](../../backend/src/modules/issues/entities/issue-link.entity.ts)**:
   - Inter-issue relationships: `id`, `sourceIssueId`, `targetIssueId`, `type` (`BLOCKS`, `IS_BLOCKED_BY`, `RELATES_TO`, `DUPLICATES`).

### D. Granular RBAC & Security Schemes (`modules/rbac/`)
10. **[`PermissionScheme`](../../backend/src/modules/rbac/entities/permission-scheme.entity.ts)**: Groups of permissions assigned to projects.
11. **[`PermissionGrant`](../../backend/src/modules/rbac/entities/permission-grant.entity.ts)**: Binds permissions (`CREATE_ISSUE`, `ASSIGN_ISSUE`, `CLOSE_ISSUE`) to roles, groups, or leads.
12. **[`ProjectRole`](../../backend/src/modules/rbac/entities/project-role.entity.ts)**: Roles scoped to projects (e.g. `Developer`, `Project Admin`).
13. **[`ProjectRoleActor`](../../backend/src/modules/rbac/entities/project-role-actor.entity.ts)**: Maps specific users or groups to project roles within a project.
14. **[`Group`](../../backend/src/modules/rbac/entities/group.entity.ts)**: Organization groups (e.g., `Engineering-CORE`, `Security`).
15. **[`UserGroup`](../../backend/src/modules/rbac/entities/user-group.entity.ts)**: Membership join table linking users and groups.
16. **[`IssueSecurityScheme`](../../backend/src/modules/rbac/entities/issue-security-scheme.entity.ts)**: Schemes regulating access to confidential issues.
17. **[`IssueSecurityLevel`](../../backend/src/modules/rbac/entities/issue-security-level.entity.ts)**: Sensitivity tiers (e.g., `Internal Security Only`).
18. **[`IssueSecurityGrant`](../../backend/src/modules/rbac/entities/issue-security-grant.entity.ts)**: Whitelist actors granted access to a security level.

### E. Forensic Auditing (`modules/security-audit/`)
19. **[`LoginAuditLog`](../../backend/src/modules/security-audit/entities/login-audit-log.entity.ts)**:
   - Primary table: `login_audit_logs`
   - Attributes: `id`, `email`, `ipAddress`, `userAgent`, `status` (`SUCCESS`, `FAILURE`, `2FA_CHALLENGE`, `LOCKED_OUT`), `failureReason`, `createdAt`.
