# Automated High-Volume Test Data Seeding Investigation

## 1. Executive Summary

This document presents the architectural investigation for generating scalable, realistic test datasets (100 to 500+ users, multiple projects, teams, sprints, issues, and worklogs) in BugTracker.

The primary objective is to allow engineers, automated end-to-end tests, and manual testers to evaluate application behavior, frontend rendering performance (virtualized tables, Kanban drag-and-drop, user pickers), and database query efficiency under realistic organizational scale without manual data entry.

---

## 2. Library Evaluation Matrix

We evaluated the primary JavaScript/TypeScript ecosystems for mock data generation:

| Library | Strengths | Weaknesses | Suitability for BugTracker |
|---|---|---|---|
| **`@faker-js/faker`** (v9+) | - Active community fork of Faker<br>- Comprehensive domain modules (names, internet, corporate, tech)<br>- Fully typed with zero dependencies<br>- Deterministic seeds via `faker.seed(1234)`<br>- Very high generation speed (>50,000 records/sec in Node.js) | - Pure generator, does not understand ORM relationships out of the box | **Recommended** (Industry Standard) |
| **`typeorm-extension`** | - Factory & seeder abstraction designed specifically for TypeORM<br>- Built-in CLI runner and entity factories | - Heavy coupling with TypeORM migration structures<br>- Frequently lags behind TypeORM minor/major versions<br>- Inflexible for complex domain rules (e.g., Jira-style permission schemes, sprint date constraints) | Not recommended (High maintenance overhead) |
| **`Fishery`** / **`Factory.ts`** | - Excellent in-memory builder pattern for unit tests<br>- Strong TypeScript inference | - Designed for unit testing individual models, lacks built-in mass domain generators | Complementary for unit tests, inadequate for bulk DB seeding |
| **`Chance.js`** | - Lightweight random generator | - Less active maintenance than Faker<br>- Smaller library of realistic engineering/tech terminology | Not recommended |

### Decision
Adopt **`@faker-js/faker`** as a `devDependency` within `backend/package.json`. It provides the richest domain dictionaries (avatars, job titles, tech tags, issue descriptions, Git branch names) while preserving full TypeScript type safety and deterministic repeatability.

---

## 3. Key Architectural Requirements & Constraints

1. **Strict Runtime Isolation (Zero Production Pollution)**:
   - The seeder must remain strictly a CLI tool (`npm run seed:demo`) or test harness utility.
   - It is **not** exposed as an unauthenticated or public HTTP endpoint on the production API.
   - Production Docker images do not run seeding logic; only `init-system.ts` runs to seed the single root admin account and default RBAC schemes if empty.

2. **Argon2id Hashing Optimization**:
   - Standard Argon2id configuration (minimum memory cost: 65,536 KiB, time cost: 3 iterations) takes ~150-250ms per single password hash to prevent brute-force attacks.
   - Hashing 500 individual passwords sequentially would take **75 to 125 seconds** purely in CPU calculations.
   - **Solution**: Precompute **one single** Argon2id hash for the universal test password (`Password123!`) at seeder startup, and assign this precomputed hash to all generated users. Total hash time: **< 200ms**.

3. **Batch Inserts & Transaction Boundaries**:
   - Avoid executing single `repository.save(entity)` loops over hundreds of items.
   - Use `chunk()` batch inserts (e.g. 100 items per chunk) via TypeORM `insert()` or `manager.save(Entity, items, { chunk: 100 })` to execute bulk SQL statements (`INSERT INTO users (...) VALUES (...), (...)`), minimizing round-trip latency to PostgreSQL.

4. **Realistic Relational Topology**:
   - Entities must be generated hierarchically:
     ```
     Users (100-500)
       ├── Teams (distributed across projects)
       │     └── Team Members & Team Leads
       ├── Projects (configurable, e.g. 5-20)
       │     ├── Project Roles & RBAC Grants
       │     ├── Sprints (PLANNED, ACTIVE, COMPLETED)
       │     └── Components & Versions
       └── Issues (Tickets linked to Project, Sprint, Assignee, Reporter)
             ├── Worklogs (logged effort over time)
             ├── Comments
             └── Issue Dependencies (blocks, relates to, duplicates)
     ```

---

## 4. Proposed CLI Interface & Configurable Parameters

Developers will be able to invoke the seeder via CLI arguments or environment variables:

```bash
# Default balanced seed (~30 users, 5 projects, realistic backlog)
npm run seed:demo

# High-volume stress test dataset (500 users, 12 projects, 60 sprints, 1500 tickets)
npm run seed:demo -- --users=500 --projects=12 --sprints=60 --issues=1500

# Non-destructive additive mode (do not wipe existing database)
npm run seed:demo -- --users=100 --clean=false
```

### Parameter Specification

| CLI Flag | Default | Description |
|---|---|---|
| `--users` | `30` | Number of engineers, QA, and leads to generate |
| `--projects` | `5` | Number of project workspaces (with unique keys like `CORE`, `UI`, `CLOUD`) |
| `--teams` | `users / 8` | Number of agile development teams |
| `--sprints` | `3 per project` | Total sprints created (1 completed, 1 active, 1 planned per project) |
| `--issues` | `users * 4` | Total realistic tickets (Stories, Bugs, Tasks, Epics) |
| `--clean` | `true` | When true, truncates transactional tables before seeding |
| `--seed-number` | `42` | Seed number passed to `faker.seed()` for deterministic data generation |

---

## 5. Entity Generation & Distribution Strategy

### 5.1 Users
- Generated with realistic human names (`faker.person.fullName()`), job titles (`Senior Distributed Systems Engineer`, `Lead QA Specialist`), and avatar URLs (`faker.image.avatar()`).
- Primary test users (e.g., `admin@bugtracker.local`) are guaranteed deterministic credentials so developers can immediately sign in.

### 5.2 Projects & Teams
- Configurable project count (e.g. 2 to 25).
- Each project receives a unique uppercase key (e.g. `PAY`, `AUTH`, `FRONT`, `DATA`, `INFRA`).
- Projects are automatically bound to the default Agile Collaborative Permission Scheme.
- Users are assigned to teams with designated team leads and varying weekly sprint capacities.

### 5.3 Sprints & Agile Backlogs
- For each project:
  - 1 `COMPLETED` Sprint (past 2 weeks, with resolved issues).
  - 1 `ACTIVE` Sprint (started 4 days ago, ending in 10 days, with in-flight tasks and WIP distribution).
  - 1 or more `PLANNED` Sprints (future milestones with estimated backlog tickets).

### 5.4 Issues & Worklogs
- Distributed statuses based on realistic workflow ratios:
  - ~30% `OPEN`
  - ~25% `IN_PROGRESS`
  - ~15% `CODE_REVIEW`
  - ~20% `RESOLVED`
  - ~10% `CLOSED`
- Realistic story points (Fibonacci sequence: 1, 2, 3, 5, 8, 13).
- Worklogs attached to active and closed tickets to populate time tracking charts and velocity reports.

---

## 6. Implementation Plan

1. **Step 1: Install Dependency**:
   - Add `@faker-js/faker` to `backend/package.json` under `devDependencies`.
2. **Step 2: Enhance `SeedService`**:
   - Update `SeedService.runSeed()` to accept a configuration options object (`SeedOptions`: `usersCount`, `projectsCount`, `sprintsCount`, `issuesCount`, `clean`, `seedNumber`).
   - Introduce batch insertion helpers using TypeORM transactions and chunking.
3. **Step 3: Update `src/database/seed.ts`**:
   - Parse CLI arguments (e.g. via `node:util parseArgs`) so flags like `--users=500` and `--projects=10` are parsed and forwarded to `SeedService`.
4. **Step 4: Benchmarking & Verification**:
   - Verify execution speed (target: 500 users, 10 projects, 1000 tickets generated in **< 10 seconds**).
   - Verify frontend rendering with 500 users in user pickers, team tables, and Kanban boards.
