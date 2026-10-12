# Automated Testing Execution Matrix & Quality Assurance Report

This document details the automated testing architecture, test suite catalogue, coverage breakdown, and verification protocols of the BugTracker platform for university laboratory reports (Software Testing & QA).

---

## 1. Test Architecture Overview

| Testing Domain | Framework & Tooling | Scope | Execution Target |
| :--- | :--- | :--- | :--- |
| **Backend Unit & Service** | Vitest 4, Mocked TypeORM Repositories, NestJS Test Module | Business logic, authentication, JWT tokens, RBAC evaluation, FSM workflow transitions | 31 test suites (290 tests) |
| **Backend End-to-End** | Supertest, Testcontainers / Isolated PG & Redis | HTTP request boundary, serialization, validation pipes, cookies | Integration endpoints |
| **Frontend Unit & Component** | Vitest 5, React Testing Library, JSDOM | Component rendering, user interactions, forms, modals, URL sync | 73 test suites (302 tests) |
| **Static Analysis & Types** | Oxlint, TypeScript Compiler (`tsc --noEmit`) | Strict type checking, dead code detection, rule conformance | Zero errors |

---

## 2. Test Execution Results Summary

### Backend Test Results (`npm --prefix backend test`)
- **Total Test Suites**: 31 passed / 31 total (100%)
- **Total Assertions**: 290 passed / 290 total (100%)
- **Duration**: ~9.4 seconds

```
✓ src/modules/auth/services/local-auth.service.spec.ts (11 tests)
✓ src/modules/auth/services/login-rate-limiter.service.spec.ts (5 tests)
✓ src/modules/auth/services/oauth-code-store.service.spec.ts (4 tests)
✓ src/modules/auth/services/token-session.service.spec.ts (7 tests)
✓ src/modules/auth/services/two-factor-auth.service.spec.ts (6 tests)
✓ src/modules/auth/strategies/jwt.strategy.spec.ts (7 tests)
✓ src/modules/events/events.gateway.spec.ts (16 tests)
✓ src/modules/issues/services/issue-core.service.spec.ts (36 tests)
✓ src/modules/issues/services/issue-links.service.spec.ts (5 tests)
✓ src/modules/issues/services/issue-worklog.service.spec.ts (11 tests)
✓ src/modules/issues/services/issue-comments.service.spec.ts (7 tests)
✓ src/modules/issues/services/issue-attachments.service.spec.ts (5 tests)
✓ src/modules/issues/services/jql-parser.service.spec.ts (15 tests)
✓ src/modules/issues/services/seaweedfs.service.spec.ts (2 tests)
✓ src/modules/admin/system-banner.service.spec.ts (3 tests)
✓ src/modules/notifications/notifications.service.spec.ts (6 tests)
...
```

### Frontend Test Results (`npm --prefix frontend test`)
- **Total Test Suites**: 73 passed / 73 total (100%)
- **Total Assertions**: 302 passed / 302 total (100%)
- **Duration**: ~52.9 seconds

```
✓ src/components/auth/CaptchaWidget.spec.tsx (4 tests)
✓ src/components/auth/DevAdminQuickFill.spec.tsx (3 tests)
✓ src/components/notifications/NotificationBell.spec.tsx (5 tests)
✓ src/components/kanban/KanbanToolbar.spec.tsx (4 tests)
✓ src/components/kanban/IssueDetailsModal.spec.tsx (3 tests)
✓ src/pages/ProjectOverviewPage.spec.tsx (5 tests)
✓ src/pages/ForbiddenPage.spec.tsx (5 tests)
✓ src/pages/NotFoundPage.spec.tsx (5 tests)
✓ src/components/ui/universal-components.spec.tsx (13 tests)
✓ src/utils/workflowTransitions.spec.ts (7 tests)
✓ src/store/useActiveProjectStore.spec.ts (4 tests)
✓ src/store/useAuthStore.spec.ts (6 tests)
...
```

---

## 3. High-Priority Testing Scenarios Verified

### Scenario 1: Authentication & Zero-Trust Token Invariants
- **Verification**: Verifies that 15-minute access tokens signed with `JWT_SECRET` and 7-day refresh tokens signed with `JWT_REFRESH_SECRET` cannot be swapped. Refresh tokens presented at protected boundaries are rejected with `401 Unauthorized`.
- **2FA Challenge Separation**: Temporary tokens tagged with `tokenType: '2fa_challenge'` are strictly forbidden from accessing protected business endpoints before TOTP verification.

### Scenario 2: Brute-Force Rate Limiting
- **Verification**: Simulates 5 sequential invalid login attempts for an email.
- **Outcome**: The 5th attempt triggers a 900-second lockout in Redis (`auth:lockout:<email>`), subsequent attempts immediately return `401 Account Locked` with remaining countdown seconds, and attempts are recorded in `security_audit_logs`.

### Scenario 3: Finite State Machine (FSM) Workflow Transitions
- **Verification**: Tests all permitted transitions (`OPEN` -> `IN_PROGRESS` -> `REVIEW` -> `RESOLVED` -> `CLOSED`) and asserts that illegal jumps (e.g. `CLOSED` directly to `REVIEW` or `OPEN` directly to `REVIEW`) are strictly rejected with `400 Bad Request`.

### Scenario 4: WebSocket Real-time Room Isolation
- **Verification**: Connects multiple simulated sockets. When an issue in project 10 is updated, the event `issue:updated` is emitted strictly to `project_10` and `issue_<id>`. Clients subscribed to `project_20` receive zero packets, preventing data leakage across organizational boundaries.
