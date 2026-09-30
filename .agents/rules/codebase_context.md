---
trigger: always_on
---

# BugTracker — Critical Agent Context

This rule is always loaded. It provides the essential context needed to start any task
on the BugTracker codebase.

## Stack at a Glance

| Layer            | Technology                                                         |
|------------------|--------------------------------------------------------------------|
| **Backend**      | NestJS 12, TypeScript (strict), TypeORM, PostgreSQL 15, Redis 7   |
| **Frontend**     | React 19, Vite 8, Tailwind CSS v4, Material Design 3 Expressive   |
| **Auth**         | JWT (httpOnly cookies), Argon2id, TOTP 2FA, Google/GitHub OAuth2  |
| **Storage**      | SeaweedFS (S3 API), Mailpit (local SMTP on port 1025)             |
| **Real-time**    | Socket.IO WebSocket gateway via `events` module                   |

## Service Endpoints (Dev)

- Frontend: `http://localhost:5173`
- Backend API + Swagger: `http://localhost:3000/api/docs`
- Mailpit Inbox: `http://localhost:8025`

## Hard Constraints (Non-Negotiable)

- All source code, comments, identifiers, and documentation → **English only**.
- **Absolute Prohibition of Stubs & Mocks**: Zero placeholders, mocks, dummy responses, fake engines, or "TODO" stubs in production paths. Production code must be 100% functional and wired end-to-end. Mocks are restricted solely to automated test files (`*.spec.ts`).
- **Backend-First Business Logic & Computation**: The frontend is strictly a presentation and interaction layer. FORBIDDEN: client-side dataset filtering (e.g. client-side JQL/search evaluation), client-side metrics aggregation, or permission inference. MANDATORY: All filtering, search parsing, permission evaluations, and mathematical/business aggregations must execute on the backend (NestJS / PostgreSQL).
- **Enterprise Scalability (10,000+ Users)**:
  - All collection endpoints must enforce server-side pagination (`limit` & `offset`/`cursor`). Never return unbounded arrays.
  - Zero full-table scans. All filtered/searched columns must be backed by appropriate PostgreSQL indexes (B-Tree, GIN for full-text search).
  - Never load entire database tables into Node.js heap memory to aggregate or iterate in JavaScript. Use database-level SQL aggregations (`SUM`, `COUNT`, `GROUP BY`).
  - No single-instance in-memory state (`Map`, local variables) for distributed features (tokens, rate limiting, WebSockets). Use Redis for horizontal multi-instance scaling.
  - Atomic database updates and transactions for concurrent writes (prevent lost updates and race conditions).
- UI colours → **only** `var(--md-sys-color-*)` tokens from `src/index.css`. Never raw Tailwind palette classes.
- Authorization → enforced at the **backend HTTP boundary** (guards on every mutating endpoint).
- Never browse `node_modules/`, `dist/`, `.git/`, or `*.lock` files — they are quota sinks.
- **Pre-delivery self-check**: Run `oxlint` + `tsc --noEmit` on modified files before declaring work done.

## Mandatory First Step for Any Task

Before reading any source file, activate the **`codebase-workflow`** skill.
It contains the task classification protocol, MODULE_MAP pointer, rule selection matrix,
and the correct implementation + verification sequence.

## Available Workspace Skills

| Skill | Purpose | When to use |
|---|---|---|
| **`codebase-workflow`** | Architecture map, rule routing & file discovery | Start of every task |
| **`vitest-tdd`** | Vitest Red-Green-Refactor testing guide | Writing/fixing unit or store tests |
| **`git-conventional-commits`** | Conventional Commits 1.0.0 standard | Formulating commits, PRs, changelogs |