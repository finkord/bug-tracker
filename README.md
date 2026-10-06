# Bug / Issue Tracking System (Software Implementation)

> **Author:** Volodymyr Fufalko (*Володимир Фуфалько*)  

---

## Overview

This repository contains the production implementation of a lightweight, high-performance, enterprise-ready **Bug / Issue Tracking System**. The platform delivers a comprehensive suite of project management, quality engineering, and security controls:
- **Core Engineering & Lifecycle:** 3NF PostgreSQL database, modular monolith architecture, Agile sprints, Kanban swimlanes, hierarchical issue tracking, time tracking matrices, role-based access control (RBAC), real-time WebSockets, and a modern Material Design 3 React Single Page Application (SPA).
- **Enterprise Identity & Cybersecurity Controls:** Argon2id password hashing, RFC 6238 TOTP 2FA, GitHub and Google OAuth2 OIDC, brute-force mitigation with automatic account lockout, Cloudflare Turnstile CAPTCHA, cryptographic email activation, and forensic security audit logs.

---

## Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend API** | **NestJS 12 (TypeScript)** | Modular monolith REST API, dependency injection, class-validator, Swagger OpenAPI docs |
| **Real-time Gateway** | **Socket.IO (WebSockets)** | Event-driven gateway for instant board synchronization, comments, and presence |
| **Frontend Client** | **React 19 + Vite 8 (TypeScript)** | SPA powered by TanStack Query v5, Zustand, Tailwind CSS v4, Material Design 3 Expressive |
| **Database** | **PostgreSQL 15+** | Relational 3NF data tier with composite B-Tree indexes for sub-5ms query performance |
| **In-Memory / Cache** | **Redis 7+** | Rate limiting, session invalidation, and WebSocket pub/sub distribution |
| **Object Storage** | **SeaweedFS (Go / S3 API)** | Distributed blob storage (Apache 2.0) for attachments, screenshots, and issue assets |
| **Local Mail Testing** | **Mailpit** | Embedded SMTP server and web interface for instant email token verification |
| **Testing** | **Vitest** | Comprehensive unit & integration testing across backend services and frontend stores |

---

## Documentation Index

Comprehensive technical documentation for all architectural layers, subsystems, and operational workflows is organized in [`documentation/`](documentation/INDEX.md):

### Architecture & Schemas
- **[System Architecture & Overview](documentation/architecture/system-overview.md)**: High-level modular monolith, ports, and runtime infrastructure.
- **[Database Schema & ERD](documentation/architecture/database-schema.md)**: All 19 TypeORM domain entities, foreign key relations, and rendered ER diagrams.
- **[Architecture Diagrams](documentation/architecture/diagrams)**: Maintained Mermaid source code and high-resolution PNG renders.

### Backend Subsystems (`documentation/backend/`)
- **[Authentication & Security](documentation/backend/auth.md)**: Argon2id hashing, TOTP 2FA, OAuth2, Turnstile CAPTCHA, lockout forensics.
- **[Users & Profiles](documentation/backend/users.md)**: User accounts, profile preferences, and saved search filters.
- **[Projects & Workspaces](documentation/backend/projects.md)**: Team spaces, keys, and lead assignments.
- **[Issues & Worklogs](documentation/backend/issues.md)**: Finite State Machine tickets, attachments, links, and comments.
- **[Sprints & Planning](documentation/backend/sprints.md)**: Agile sprint lifecycles and backlog management.
- **[RBAC & Permissions](documentation/backend/rbac.md)**: Dual-layer authorization, project roles, user groups, and security levels.
- **[Security Audit](documentation/backend/security-audit.md)**: Forensic audit logs, IP tracking, and failure analysis.
- **[WebSockets & Events](documentation/backend/events.md)**: Real-time Socket.IO board events and user presence.
- **[Admin Console](documentation/backend/admin.md)**: System diagnostics, health checks, and user management.
- **[Database Seeder & Universal CLI](documentation/backend/seeding.md)**: Scalable multi-team engineering dataset (up to 500+ users, 1,000+ tickets).

### Frontend & Operations
- **[Frontend Architecture](documentation/frontend/overview.md)**: React 19 + Vite 8 SPA structure and state management.
- **[Pages & Routing (19 Views)](documentation/frontend/pages-and-routing.md)**: Route catalog, access guards, and view hierarchy.
- **[M3 Design System](documentation/frontend/design-system.md)**: Material Design 3 Expressive tokens, Pixel OS curved shell.
- **[Operational Commands & Runbook](documentation/operations/commands.md)**: Docker Compose, dev servers, builds, and test commands.
- **[API Verification Test Suite](documentation/operations/verification-api.md)**: Automated curl verification recipes.
- **[Product Backlog & Ideas](documentation/backlog/product_ideas.md)**: Product epics and developer notes.
- **[AI Agent Protocol](documentation/AGENTS.md)**: Agent rules and Doc-as-Code hygiene guidelines.

---

## Architecture & Directory Layout

```
software/
├── README.md                               # Project overview and quick start guide (this file)
├── docker-compose.yml                      # PostgreSQL 15, Redis 7, Mailpit, SeaweedFS
├── documentation/                          # Single source of truth technical documentation
│   ├── INDEX.md                            # Central agent and developer router
│   ├── AGENTS.md                           # AI agent rules & doc hygiene protocol
│   ├── architecture/                       # System overview, ERD, and diagrams (MMD + PNG)
│   ├── backend/                            # 10 Domain backend module specifications
│   ├── frontend/                           # React 19 architecture, 19 views, M3 design
│   ├── operations/                         # CLI runbooks and API verification suites
│   └── backlog/                            # Feature backlog and raw notes
├── backend/                                # NestJS 12 REST & WebSocket API application
│   ├── src/
│   │   ├── main.ts                         # App bootstrap, Swagger, CORS, ValidationPipe
│   │   ├── app.module.ts                   # Root NestJS module wiring TypeORM, Mailer, Redis
│   │   └── modules/                        # Domain feature modules
│   │       ├── auth/                       # Argon2id, JWT, 2FA, OAuth2, Account Lockout
│   │       ├── users/                      # User profile, preferences, saved JQL filters
│   │       ├── projects/                   # Workspaces, member assignments, project keys
│   │       ├── issues/                     # Issues, comments, worklogs, attachments, links
│   │       ├── sprints/                    # Agile sprints and backlog management
│   │       ├── rbac/                       # Project roles, user groups, permission schemes
│   │       ├── security-audit/             # Forensic login audit trail & IP inspection
│   │       ├── captcha/                    # Cloudflare Turnstile server-side verification
│   │       ├── events/                     # Socket.IO real-time event gateway
│   │       └── admin/                      # System administration and platform analytics
│   └── test/                               # Vitest unit and integration suites
└── frontend/                               # React 19 + Vite 8 Single Page Application
    ├── src/
    │   ├── api/                            # Typed API client & TanStack Query hooks
    │   ├── components/                     # Reusable Material Design 3 UI components
    │   │   ├── agile/                      # Backlog, sprint planner, issue rows
    │   │   ├── kanban/                     # Kanban board, swimlanes, issue modals
    │   │   ├── time/                       # Timesheet matrix, worklog calendar, breakdown
    │   │   ├── search/                     # JQL editor bar, search split-view, tables
    │   │   ├── admin/                      # Admin tabs (users, projects, RBAC, audit)
    │   │   └── workspace/                  # Topbar, user menu, global search, switcher
    │   ├── hooks/                          # Custom domain hooks & WebSocket listeners
    │   ├── pages/                          # Routed views (Dashboard, Board, Profile, etc.)
    │   ├── store/                          # Zustand state stores (auth, theme, sidebar)
    │   └── index.css                       # M3 Expressive design tokens (CSS variables)
    └── vite.config.ts                      # Vite configuration & backend proxy
```

---

## Getting Started

### Prerequisites
- **Node.js:** `v24.x` (Active LTS, e.g., `v24.21.0`)
- **Docker & Docker Compose:** Installed and running
- **npm:** `v11.x` (or higher)

### Quick Start (Recommended)
You can bootstrap and launch the entire stack with Makefile automation:
```bash
# First-time setup (generates .env, installs dependencies, starts Docker, initializes system)
make setup

# Daily development (starts backing containers and runs backend + frontend concurrently)
make dev
```

### Stopping and Cleaning Up Development
- **Stop local dev servers (free ports 3000 & 5173):** `make dev-stop`
- **Stop backing containers safely:** `make dev-down`
- **Reset database and reinitialize system:** `make dev-reset`
- **Full cleanup (stop servers, remove volumes, delete build caches):** `make dev-clean`

---

### Step-by-Step Manual Start

#### 1. Start Infrastructure Services
Launch PostgreSQL, Redis, Mailpit, and SeaweedFS in the background:
```bash
docker compose up -d
```

#### 2. Initialize Baseline System
Initialize system roles, permissions, groups, and the initial administrator account (zero dummy tickets):
```bash
npm --prefix backend run init:system
```
*(Optional: If you need sample tickets and mock users for UI testing, run `npm --prefix backend run seed:demo`).*

#### 3. Start Development Servers
```bash
# Terminal 1: Start Backend API in Watch Mode (port 3000)
cd backend && npm run start:dev

# Terminal 2: Start Frontend Vite Server (port 5173)
cd frontend && npm run dev
```
- Web Application: [`http://localhost:5173`](http://localhost:5173)
- Interactive Swagger OpenAPI Docs: [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs)

#### 4. Developer Portals & Tools
| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Frontend App** | [`http://localhost:5173`](http://localhost:5173) | Initial Administrator: `admin@bugtracker.local` / `AdminPassword123!` |
| **Backend Swagger** | [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) | Interactive API exploration |
| **Mailpit Inbox** | [`http://localhost:8025`](http://localhost:8025) | Local SMTP web client for activation & password emails |
| **SeaweedFS S3** | [`http://localhost:8333`](http://localhost:8333) | S3-compatible blob storage portal |

---

## Production & Cloud Deployment (Decoupled Architecture)

BugTracker separates stateless application containers from stateful backing infrastructure:

- **Application Tier (`docker-compose.yml`)**: Cloud-portable manifest running `backend` (NestJS) and `frontend` (Nginx SPA + Reverse Proxy on port 80).
- **Backing Infrastructure (`docker-compose.infra.yml`)**: PostgreSQL 15, Redis 7, SeaweedFS (S3), and Mailpit.
- **Cloud & AWS Deployments**: Point environment variables (`DB_HOST`, `REDIS_HOST`, `S3_ENDPOINT`, `MAIL_HOST`) to AWS RDS, AWS ElastiCache, Amazon S3, and AWS SES.

### 1. Configure Production Environment
```bash
cp .env.production.example .env.production
# Edit .env.production with database credentials, SMTP configuration, and security secrets
```

### 2. Launch Local Full-Stack Preview (Port 80)
```bash
make prod
# Or via docker compose directly:
docker compose -f docker-compose.infra.yml -f docker-compose.yml up -d --build
```

### 3. Launch Standalone Cloud / AWS Deployment
```bash
docker compose --env-file .env.production up -d
```

### 4. Initialize Production Database
```bash
make prod-init
# Or directly:
docker compose exec backend node dist/database/init-system.js
```
This sets up system permission taxonomy, standard roles, system groups, and creates the initial administrator specified in `.env.production`.

### 5. Stop Production Stack
```bash
make prod-down    # Stops application containers
make down         # Stops all containers including backing infrastructure
```

---

## Security Architecture & Hardening

* **Zero Secret Leakage:** Single-use tokens (`activationToken`, `resetPasswordToken`) are never returned in JSON HTTP responses; they are delivered exclusively via cryptographic email links.
* **Fail-Closed CAPTCHA:** Cloudflare Turnstile token validation strictly rejects test bypass tokens in production.
* **Enforced Activation Lock:** Unactivated accounts cannot log in under any circumstances (HTTP `401 Unauthorized`).
* **Real OAuth2 OIDC Integration:** Native integration with GitHub and Google OAuth2 providers with distributed Redis code exchange.
* **Distributed Redis Session Cache & Rate Limiting:** JWT user sessions cached in Redis with instant global revocation via `tokenVersion`; sliding-window rate limiting prevents distributed brute-force attacks.
* **Brute-Force Throttling & Account Lockout:** 5 consecutive failed login attempts trigger an immediate 15-minute account lockout, audited in `login_audit_logs`.
* **RFC 6238 TOTP Two-Factor Authentication:** Cryptographically verified time-based one-time passwords for enhanced account protection.
* **Single-Pass RBAC Evaluation & Fail-Closed Guards:** Zero N+1 query cascades via single-pass SQL evaluation and Redis caching; fail-closed authorization eliminates ambient access vulnerabilities.
* **Multi-Tenant Workspace Isolation:** Project queries strictly scoped via dynamic permission evaluation; project creation atomically provisions default schemes and lead administrator roles.
* **Relational Sprints & Zero-Leak Real-Time WebSockets:** Relational `sprint_id` foreign keys with atomic rollovers; Socket.IO real-time events strictly scoped to authenticated, authorized rooms with zero global broadcast leaks.
* **Forensic Security Audit Trail:** Live forensic audit log capturing IP address, User-Agent, failure reasons, and timestamps.
* **Pure Dynamic RBAC & Root Administrator Immutability:** Legacy static role enums retired to pure `ADMIN` and `USER` system roles; coworker titles captured in `jobTitle`; root administrator accounts cannot be demoted, blocked, deleted, or evicted from the administrators group.
