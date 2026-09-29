# Database Seeder & Realistic Engineering Data Generator

> **Subsystem:** Admin / Database Seeding Subsystem  
> **Source Files:** [`software/backend/src/modules/admin/seed.service.ts`](file:///home/finkord/dev/PPofSE/software/backend/src/modules/admin/seed.service.ts), [`software/backend/src/database/seed.ts`](file:///home/finkord/dev/PPofSE/software/backend/src/database/seed.ts), [`software/backend/src/modules/admin/seed.controller.ts`](file:///home/finkord/dev/PPofSE/software/backend/src/modules/admin/seed.controller.ts)

---

## 1. Overview & Purpose

The **BugTracker Database Seeding Engine** generates a realistic, multi-team enterprise engineering environment designed to demonstrate:
- Cross-functional collaboration across multiple specialized teams.
- Sprint management with past, active, and upcoming sprints.
- Real-time collaborative Kanban boards with status workflows.
- Inter-project issue dependencies and blocking links.
- Team capacity forensics via dynamic timesheets, calendar views, and effort estimations.

All seeded data represents an authentic software company building the **BugTracker** platform itself.

---

## 2. Engineering Teams & Project Structure

The generator provisions **5 specialized engineering teams** (projects), each headed by a designated engineering lead:

| Key | Team Name | Team Lead | Focus & Domain |
| :--- | :--- | :--- | :--- |
| **`UI`** | **Web UI & Design Systems** | Volodymyr Fufalko (`volodymyr@bugtracker.local`) | Frontend client interfaces, responsive layouts, Material 3 Design System, Gantt roadmaps, accessibility audits. |
| **`CORE`** | **Core Platform & Domain Engine** | Alex Mercer (`alex.mercer@bugtracker.local`) | Business logic, NestJS modules, TypeORM entities, JWT authentication, Lucene search indexing, SeaweedFS attachments. |
| **`MON`** | **Observability & Telemetry** | Sarah Chen (`sarah.chen@bugtracker.local`) | Prometheus metrics, OpenTelemetry distributed tracing, Grafana alerts, Loki log pipelines, SLO/SLA dashboards. |
| **`INFRA`** | **Cloud Infrastructure & DevOps** | David Miller (`david.miller@bugtracker.local`) | Kubernetes cluster administration, Terraform IaC, Docker optimization, Redis Sentinel HA, blue-green deployments. |
| **`NET`** | **Network Security & Edge Operations** | Elena Rostova (`elena.rostova@bugtracker.local`) | Cloudflare Turnstile, TLS 1.3 cipher hardening, sliding-window rate limiters, TOTP 2FA audit, CSP headers, Okta SSO. |

---

## 3. User Directory & Authentication Credentials

The seeder generates **30 active engineering accounts** across distinct RBAC system roles (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `DEVOPS_ENGINEER`, `SECURITY_ENGINEER`, `QA_ENGINEER`).

### 3.1 Security & Hashing
- **Algorithm:** Argon2id (`argon2.argon2id`, memory cost 64MB, time cost 3, parallelism 4).
- **Default Password:** `Password123!` (for all seeded users).
- **Activation Status:** Pre-activated (`isActivated: true`), ready for immediate login.

### 3.2 Key Seeded Users Directory

| Email | Full Name | Team / Role | Job Title |
| :--- | :--- | :--- | :--- |
| `volodymyr@bugtracker.local` | Volodymyr Fufalko | `UI` / `ADMIN` | Principal Frontend Architect |
| `sonya@bugtracker.local` | Sonya Saparava | `UI` / `DEVELOPER` | Senior UI/UX Engineer |
| `olena@bugtracker.local` | Olena Melnyk | `UI` / `DEVELOPER` | Design Systems Developer |
| `daniel.kim@bugtracker.local` | Daniel Kim | `UI` / `DEVELOPER` | Frontend Engineer |
| `sophia.m@bugtracker.local` | Sophia Martinez | `UI` / `QA_ENGINEER` | Lead QA Automation Engineer |
| `lucas.w@bugtracker.local` | Lucas Weber | `UI` / `DEVELOPER` | Accessibility & CSS Specialist |
| `alex.mercer@bugtracker.local` | Alex Mercer | `CORE` / `PROJECT_MANAGER` | Core Platform Engineering Lead |
| `marcus.v@bugtracker.local` | Marcus Vance | `CORE` / `DEVELOPER` | Senior Backend Engineer (Postgres/ORM) |
| `taras.sh@bugtracker.local` | Taras Shevchenko | `CORE` / `DEVELOPER` | Distributed Systems Engineer |
| `rachel.g@bugtracker.local` | Rachel Green | `CORE` / `DEVELOPER` | Backend Security & Auth Engineer |
| `dmitry.v@bugtracker.local` | Dmitry Volkov | `CORE` / `DEVELOPER` | API Gateway & GraphQL Specialist |
| `liam.oc@bugtracker.local` | Liam O'Connor | `CORE` / `QA_ENGINEER` | Backend QA & Performance Tester |
| `sarah.chen@bugtracker.local` | Sarah Chen | `MON` / `DEVOPS_ENGINEER` | Lead SRE & Observability Architect |
| `ethan.davis@bugtracker.local` | Ethan Davis | `MON` / `DEVOPS_ENGINEER` | Prometheus & Alertmanager Specialist |
| `yuliia.k@bugtracker.local` | Yuliia Kovalenko | `MON` / `DEVOPS_ENGINEER` | Grafana & Telemetry Dashboard Engineer |
| `kevin.zhang@bugtracker.local` | Kevin Zhang | `MON` / `DEVELOPER` | OpenTelemetry Trace Instrumentation Dev |
| `maya.patel@bugtracker.local` | Maya Patel | `MON` / `QA_ENGINEER` | Chaos Engineering & Reliability QA |
| `noah.g@bugtracker.local` | Noah Garcia | `MON` / `DEVOPS_ENGINEER` | Logs & Elasticsearch Engineer |
| `david.miller@bugtracker.local` | David Miller | `INFRA` / `DEVOPS_ENGINEER` | Principal Cloud Platform Architect |
| `brandon.lee@bugtracker.local` | Brandon Lee | `INFRA` / `DEVOPS_ENGINEER` | Kubernetes Cluster Administrator |
| `andrii.b@bugtracker.local` | Andrii Boyko | `INFRA` / `DEVOPS_ENGINEER` | Terraform & IaC Dev |
| `chloe.dubois@bugtracker.local` | Chloe Dubois | `INFRA` / `DEVOPS_ENGINEER` | Redis & DB Cluster Ops Engineer |
| `victor.stone@bugtracker.local` | Victor Stone | `INFRA` / `DEVOPS_ENGINEER` | CI/CD Pipeline Automation Specialist |
| `benjamin.t@bugtracker.local` | Benjamin Taylor | `INFRA` / `QA_ENGINEER` | Infrastructure Integration QA |
| `elena.rostova@bugtracker.local` | Elena Rostova | `NET` / `SECURITY_ENGINEER` | Head of Information Security |
| `maxim.petrov@bugtracker.local` | Maxim Petrov | `NET` / `SECURITY_ENGINEER` | Application Security & Penetration Tester |
| `ryan.murphy@bugtracker.local` | Ryan Murphy | `NET` / `SECURITY_ENGINEER` | Cloudflare Edge & WAF Specialist |
| `oksana.b@bugtracker.local` | Oksana Bondarenko | `NET` / `SECURITY_ENGINEER` | IAM & Authentication Dev |
| `arthur.p@bugtracker.local` | Arthur Pendelton | `NET` / `SECURITY_ENGINEER` | Network Security & Firewall Engineer |
| `grace.h@bugtracker.local` | Grace Hopper | `NET` / `SECURITY_ENGINEER` | Compliance & Cryptographic Auditor |

---

## 4. Tickets & Sprint Structure

The generator creates **46 authentic tickets** classified by types (`BUG`, `FEATURE`, `TASK`, `IMPROVEMENT`), priorities (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and severities (`BLOCKER`, `MAJOR`, `MINOR`, `TRIVIAL`).

### 4.1 Sprint Allocations
- **`Sprint 1 (Completed)`**: Resolved foundational features and closed bugs.
- **`Sprint 2 (Active)`**: In-progress items, active development, code review, and active worklogs.
- **`Sprint 3 (Upcoming)`**: Planned backlog tickets estimated and assigned for upcoming sprint cycles.
- **`Backlog` (`sprint: null`)**: Unscheduled enhancements, tech debt, and spikes.

---

## 5. Cross-Team Dependency Links

The seeder creates **18 inter-project issue links** using standard relationship types (`BLOCKS`, `RELATES_TO`, `IS_BLOCKED_BY`) to illustrate cross-departmental coordination:

```
[CORE-2: Token Concurrency Bug]  ──BLOCKS──►  [UI-5: Live WebSocket Sync]
[INFRA-2: Redis Sentinel Cluster] ──BLOCKS──►  [CORE-2: Token Concurrency Bug]
[NET-3: Rate Limiter Mitigation] ──BLOCKS──►  [CORE-2: Token Concurrency Bug]
[INFRA-6: Vault Secret Injection] ──BLOCKS──►  [CORE-5: SeaweedFS Distributed Storage]
[NET-7: Trivy Vulnerability Scan] ──BLOCKS──►  [INFRA-4: Docker Multi-Stage Optimization]
[CORE-1: Login Audit DB Index]   ──BLOCKS──►  [UI-2: Safari Backdrop Glitch]
[CORE-3: Lucene Indexer]         ──RELATES_TO──► [UI-3: Keyboard Nav Shortcuts]
[MON-2: OpenTelemetry Tracing]   ──RELATES_TO──► [CORE-3: Lucene Indexer]
[NET-1: Turnstile Fallback]      ──RELATES_TO──► [UI-5: Live WebSocket Sync]
```

---

## 6. Time Tracking Forensics & Worklog Distribution

The seeder inserts **70 individual worklog records** distributed across the **past 3 weeks and current week** (0 to 21 days ago):
- Every log entry includes exact duration in hours (e.g. `3.5h`, `6.0h`, `8.0h`), logging timestamp, author association, and descriptive engineering notes.
- Aggregate issue `loggedHours` are calculated and saved to synchronize issue progress bars.
- Populates the **Team Timesheet Matrix** (`/time-tracking`), **Interactive Day-Cell Tooltips**, and **Monthly Team Capacity Calendar**.

---

## 7. How to Run the Seeder

### Option A: Command Line (CLI)
Run directly from the `backend/` directory:
```bash
cd backend
npm run seed
```

Output summary example:
```
🚀 Initializing BugTracker Database Seeder Application Context...
📁 Teams / Projects Created: 5
👥 Engineers & Leads Created: 30
🎫 Authentic Tickets Created: 46
🔗 Cross-Team Links Created: 18
⏱️ Worklogs Generated:       70
💬 Issue Comments Created:    11
✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!
```

### Option B: REST API Endpoint
Trigger database reseeding over HTTP:
```http
POST /api/v1/admin/seed
Content-Type: application/json

{
  "clean": true
}
```

**Response Payload:**
```json
{
  "success": true,
  "message": "Realistic multi-team engineering dataset generated successfully",
  "data": {
    "projectsCount": 5,
    "usersCount": 30,
    "issuesCount": 46,
    "linksCount": 18,
    "worklogsCount": 70,
    "commentsCount": 11
  }
}
```
