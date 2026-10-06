# Automated High-Volume Data Seeding & Universal CLI Tool (`SeedService`)

The BugTracker Universal Data Seeder populates the system with realistic, multi-team engineering workspaces, agile Scrum teams, sprints, issues, and cross-project dependencies. It is designed to work identically across local development environments, continuous integration pipelines, and containerized customer production deployments.

---

## 1. Capabilities & Architecture

| Capability | Technical Design |
|---|---|
| **Universal Execution** | Runs via host CLI (`npm run seed:demo`), Makefile targets (`make seed`, `make seed-demo`, `make prod-seed`), or directly inside Docker backend containers (`node dist/database/seed.js`). |
| **High-Volume Scaling** | Supports generating 25 to 500+ users, multiple projects, and 1,000+ tickets in under 5 seconds. |
| **Argon2id Hash Optimization** | Precomputes a single Argon2id hash once at startup and reuses it across all generated accounts, eliminating CPU bottlenecks while maintaining full OWASP password hashing. |
| **Agile Organization** | Automatically establishes Scrum teams, team leads, Scrum Masters, Product Owners, Developers, and QA Engineers with weekly sprint capacity allocations. |
| **Multi-Sprint Timelines** | Generates completed milestone sprints, active Kanban sprints, and upcoming planned sprints per workspace, alongside unassigned backlog tickets. |
| **Realistic Faker Datasets** | Powered by `@faker-js/faker` to synthesize realistic engineering roles, technical ticket titles, descriptions, worklogs, and discussion comments. |
| **Zero Backdoor Guarantee** | Executed strictly as an isolated administrative CLI script; no unauthenticated HTTP backdoors or bypass endpoints exist in production. |

---

## 2. CLI Options & Flag Reference

The seeder accepts standard GNU/POSIX-style command line flags:

| Option | Shorthand | Type | Default | Description |
|---|---|---|---|---|
| `--users` | `-u` | Integer | `25` | Total number of engineers, leads, and administrators to seed |
| `--projects` | `-p` | Integer | `5` | Total number of project workspaces to generate |
| `--sprints` | `-s` | Integer | `15` | Total sprints distributed across workspaces |
| `--issues` | `-i` | Integer | `120` | Total tickets to seed across active sprints and backlogs |
| `--seed-number` | None | Integer | None | Deterministic pseudo-random seed number for repeatable datasets |
| `--clean` | None | Boolean | `true` | Wipe existing database records prior to seeding |
| `--no-clean` | None | Flag | `false` | Append data without wiping existing database entities |
| `--help` | `-h` | Flag | `false` | Display command-line usage syntax and exit |

---

## 3. Usage Examples

### Local Development (Host Machine)

```bash
# Standard default dataset (25 users, 5 projects, 120 issues)
make seed

# Scale to 100 users, 8 projects, 300 issues via Makefile
make seed ARGS="--users=100 --projects=8 --issues=300"

# Direct npm script execution from software/backend/
npm run seed:demo -- --users=100 --projects=8 --issues=300

# High-volume stress testing (500 users, 10 projects, 1000 issues)
npm run seed:demo -- --users=500 --projects=10 --sprints=30 --issues=1000
```

### Production Deployment (Docker Container Stack)

```bash
# Seed production container using Makefile
make prod-seed

# Scale production dataset with custom arguments via Makefile
make prod-seed ARGS="--users=500 --issues=1000"

# Direct execution inside running backend container
docker exec -it bugtracker-backend node dist/database/seed.js --users=500 --issues=1000

# Non-destructive seed (append without clearing previous records)
docker exec -it bugtracker-backend node dist/database/seed.js --users=50 --issues=100 --no-clean
```

---

## 4. Default Seeded Credentials

All seeded users are pre-configured with the standard demonstration password:

> **Default Password:** `Password123!`

### Core Leadership Accounts

| Team / Project Key | Workspace Name | Lead Name | Email Address | System Role |
|---|---|---|---|---|
| `UI` | Web UI & Design Systems | Volodymyr Fufalko | `volodymyr@bugtracker.local` | `ADMIN` |
| `CORE` | Core Platform & Auth API | Alex Mercer | `alex.mercer@bugtracker.local` | `USER` |
| `MON` | SRE & Monitoring Operations | Sarah Chen | `sarah.chen@bugtracker.local` | `USER` |
| `INFRA` | Cloud Infrastructure & S3 | David Miller | `david.miller@bugtracker.local` | `USER` |
| `NET` | Network & Security Operations | Elena Rostova | `elena.rostova@bugtracker.local` | `USER` |
| None | Global System Administration | System Administrator | `admin@bugtracker.local` | `ADMIN` |

*Note: Generated engineers follow the naming convention `user<N>.<handle>@bugtracker.local`.*

---

## 5. Key Source Files

- CLI Parser & Invocation: [`backend/src/database/seed.ts`](../../backend/src/database/seed.ts)
- Seeding Engine & Data Generators: [`backend/src/modules/admin/seed.service.ts`](../../backend/src/modules/admin/seed.service.ts)
- Unit & Regression Tests: [`backend/src/modules/admin/seed.service.spec.ts`](../../backend/src/modules/admin/seed.service.spec.ts)
