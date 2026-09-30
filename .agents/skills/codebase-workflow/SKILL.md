---
name: codebase-workflow
description: >-
  Mandatory entry-point workflow for ANY task on the BugTracker codebase.
  Activate this skill FIRST before reading source files to prevent context
  overflow and quota waste. Guides the agent through: task classification,
  targeted file discovery via MODULE_MAP, rule selection, implementation
  sequence, and verification. Use whenever implementing a feature, fixing a
  bug, refactoring, or writing tests on this project.
---

# BugTracker Codebase Workflow

## Pre-Task Checklist (run BEFORE touching any source file)

Execute every step in order. Do not skip.

1. **Classify the task domain** using the table in `resources/MODULE_MAP.md` (read that file now).
2. **Identify the affected module(s)** — get exact entry-point paths from the MODULE_MAP.
3. **Load the matching rule(s)** from the Rule Selection Matrix below.
4. **Check `documentation/INDEX.md` and `documentation/backlog/`** for relevant architecture docs and feature requirements.
5. **Read a maximum of 5 source files** before forming the implementation plan.

---

## Rule & Skill Selection Matrix

| Task Domain                          | Rules to activate                                                         | Skills to activate            |
|--------------------------------------|---------------------------------------------------------------------------|-------------------------------|
| Backend (NestJS / service / guard)   | `typescript_nestjs_clean_code.md`                                         | `vitest-tdd` (when testing)   |
| Frontend (React / components / UI)   | `react_frontend_guidelines.md` + `m3_ui_cookbook.md`                      | `vitest-tdd` (when testing)   |
| Full-Stack Feature (API ↔ UI)        | `fullstack_feature_contract.md`                                           | `vitest-tdd`                  |
| UI / UX Design Principles            | `ui_ux_design_principles.md`                                              | —                             |
| Architecture & Production standards  | `production_engineering_standards.md`                                     | —                             |
| Unit / Integration Testing (Vitest)  | `typescript_nestjs_clean_code.md` / `react_frontend_guidelines.md`        | `vitest-tdd`                  |
| Git Commits, PRs, Changelogs         | —                                                                         | `git-conventional-commits`    |

---

## File Discovery Protocol (Anti-Quota Rules)

Follow these rules strictly to avoid burning quota on useless indexing:

- **NEVER** call `list_dir` on `node_modules/`, `dist/`, `.git/`, `coverage/`, or any `*.tsbuildinfo` path.
- **NEVER** read `package-lock.json`, `*.lock`, or generated build artefacts.
- **Read `package.json`** to understand dependencies — do not list `node_modules/`.
- **Use `grep_search` with `Includes` glob filters** instead of recursive `list_dir` for finding symbols.
- **Go at most 3 directory levels deep** before switching to targeted `grep_search`.
- **Prefer MODULE_MAP.md paths** over any exploratory listing — the map is always authoritative.

---

## Implementation Sequence

Follow this order for every backend change:

```
Entity → DTO → Service → Controller → E2E/Unit Test → Frontend API client → Frontend component/page
```

For frontend-only changes:

```
API type → API module function → TanStack Query hook → Component/Page → Store slice (if needed)
```

---

## Verification Steps

### During active development (after each significant code block)

Run only the targeted checks — do NOT run full builds between incremental edits:

```bash
# Lint only the changed files
cd backend && npx oxlint src/modules/<module>/

# Run only the specific test for the changed service
cd backend && npx vitest run src/modules/<module>/<service>.spec.ts

# Frontend lint
cd frontend && npx oxlint src/components/<component>/
```

### Final verification (once task is complete)

Run the full build to confirm compilation before declaring the task done:

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### TypeScript type-check only (fast, no emit)

```bash
cd backend  && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

## Scalability & Production-Readiness Protocol (10,000+ Users)

Every feature and refactoring must be engineered to sustain tens of thousands of active concurrent users:

1. **Mandatory Pagination & Bounded Queries**: Every query returning lists MUST enforce pagination (`limit` & `offset` or keyset/cursor pagination). Never fetch unbounded rows or use `.getMany()` without explicit limits.
2. **Zero Full-Table Scans**: All columns used in `WHERE`, `ORDER BY`, or `JOIN` conditions must have proper database indexes (B-Tree for foreign keys and filters, GIN for PostgreSQL full-text search).
3. **Database-Level Aggregation**: Never pull raw datasets into Node.js heap memory to iterate, sum, count, or filter in JavaScript. Compute all metrics using SQL aggregates (`SUM`, `COUNT`, `AVG`, `GROUP BY`).
4. **Backend-First Business Logic**: The frontend is solely a display and interaction layer. Business rules, data transformations, search AST parsing, permission resolutions, and calculations must reside on the backend.
5. **Distributed State (Redis)**: Any transient or shared state (rate limits, session revocations, OAuth exchange codes, WebSocket rooms) must use Redis, never single-instance Node.js memory (`Map`, global variables).
6. **Concurrency & Atomicity**: Concurrent writes (e.g. logging work hours, status changes) must use database transactions with atomic SQL increments or row locks (`Pessimistic / Optimistic Locking`) to prevent race conditions.
7. **Absolute Zero-Stubs Policy**: Developing mocks, stubs, faux engines, or "TODO" dummy handlers in production code is strictly forbidden in any form. Every implementation must be real, functional, and wired end-to-end.

---

## Anti-Patterns Quick Reference

| Anti-Pattern                                       | Correct Alternative                                             |
|----------------------------------------------------|-----------------------------------------------------------------|
| `list_dir node_modules/`                           | Read `package.json` only                                        |
| Read all 10 backend modules upfront                | Read only the module(s) in scope via MODULE_MAP paths           |
| Start writing code before creating a plan          | Check `documentation/INDEX.md` & write plan artifact first      |
| Rely on obsolete documentation                     | Active code is source of truth; use `documentation/` & `MODULE_MAP.md` |
| Run `npm run build` after every small edit         | Use `oxlint` / targeted `vitest run <file>.spec.ts` during work |
| Hard-code Tailwind color utilities                 | Use `var(--md-sys-color-*)` tokens from `src/index.css`         |
| Import from another module's private `entities/`  | Use the module's public service or DTO exports only             |
| Stubs, mocks, or fake returns in production code   | 100% functional, real implementation wired end-to-end           |
| Client-side dataset filtering / search AST parsing | Server-side TypeORM query with indexed `WHERE` & pagination     |
| Pulling entire DB table into memory to sum in JS   | SQL aggregation: `SUM(...)`, `COUNT(...)`, `GROUP BY` in DB     |
| In-memory `Map` for tokens, sessions, or locks     | Distributed Redis cache (`SETEX`, `GETDEL`, hashes)             |
| Loose string foreign keys (e.g. `sprint: string`)  | Relational foreign keys (`@ManyToOne(() => Sprint)`)            |

