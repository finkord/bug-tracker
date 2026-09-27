---
trigger: manual
---

# Production Engineering Standards & Architecture Rules

### 1. Production-Grade Engineering Rigor (Zero "Prototype" Mindset)
- Treat BugTracker as a mission-critical, enterprise-grade production software system.
- Never write temporary hacky shortcuts, mock placeholders, or inline monoliths.
- Always apply Clean Architecture, SOLID principles, and high-cohesion/low-coupling design.

### 2. Single Source of Truth & Zero Dual-State Accretion
- When introducing a new architecture or service (e.g. RBAC replacing static enum roles), **fully refactor and remove the legacy subsystem**.
- Never maintain parallel duplicate authorization systems, duplicate database columns, or complex bridge synchronizers when a single canonical source of truth should exist.

### 3. Single Responsibility Principle & Modularity Limits
- **Service Size Guideline**: Aim for domain services under 250–300 lines.
- **Decompose Monoliths (God Objects)**: If a service handles multiple sub-domains (e.g. issues, comments, worklogs, attachments, links), split it into focused domain services (e.g. `IssueCommentsService`, `IssueAttachmentsService`, `IssueWorklogsService`).
- **Frontend Component Granularity**: Break down complex pages (>300 lines) into reusable sub-components, custom hooks, and modals in `src/components/`.

### 4. Strict Boundary Authorization Enforcement
- Never leave mutating controller routes unguarded.
- All HTTP endpoints must explicitly declare their security boundaries (e.g. `@RequireProjectPermission(ProjectPermission.CREATE_ISSUES)` via `ProjectPermissionGuard`, or `@UseGuards(RolesGuard)` for system admin operations).
- Authorization must be enforced at the backend HTTP boundary, not just conditionally hidden in frontend UI.

### 5. Robust Dependency Injection
- Use TypeORM's global `DataSource` or explicit module exports when resolving cross-module entity queries in guards and shared services to prevent NestJS `UnknownDependenciesException`.

### 6. Clean Terminology & Professional UX
- Avoid artificial marketing buzzwords ("Enterprise Active", sparkle icons) or toy labels.
- Do not use third-party product names (e.g. "Jira-grade", "Jira style") in code, comments, or UI unless explicitly instructed.
- All code comments and identifiers must strictly be written in English.
