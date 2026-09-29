# Bug / Issue Tracking System (Software Implementation)

> **Author:** Volodymyr Fufalko (*Володимир Фуфалько*)  

---

## Overview

This repository contains the production implementation of a lightweight, high-performance, enterprise-ready **Bug / Issue Tracking System**. The project satisfies two core engineering and security curricula:
1. **PPofSE (Labs 1–7):** Enterprise software engineering lifecycle, 3NF PostgreSQL database, modular monolith architecture, Agile sprints, Kanban swimlanes, time tracking matrices, role-based access control (RBAC), real-time WebSockets, and a modern React Single Page Application (SPA).
2. **SDSecurity (Lab 6 Project):** Enterprise-grade identity, access management, and cybersecurity controls (Argon2id hashing, RFC 6238 TOTP 2FA, GitHub/Google OAuth2 OIDC, brute-force mitigation & account lockout, Cloudflare Turnstile CAPTCHA, email activation, and forensic security audit logs).

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

Detailed technical documentation for all subsystems is organized in `info/`:

### Core Subsystems (`info/services/`)
- **[Authentication & Security Service](file:///home/finkord/dev/PPofSE/software/info/services/auth/README.md)** (`info/services/auth/README.md`): Complete security specification (Argon2id, TOTP 2FA, OAuth2 OIDC, Turnstile CAPTCHA, lockout, sequence diagrams, SDSecurity Lab 6).
- **[Projects, Issues & Agile Boards](file:///home/finkord/dev/PPofSE/software/info/services/projects-issues/README.md)** (`info/services/projects-issues/README.md`): Issue tracking, Finite State Machine workflows, Agile Kanban boards, and sprint cycles.
- **[Role-Based Access Control (RBAC)](file:///home/finkord/dev/PPofSE/software/info/services/rbac/README.md)** (`info/services/rbac/README.md`): Custom roles, user groups, permission schemes, and issue security schemes.
- **[Time Tracking & Effort Forensics](file:///home/finkord/dev/PPofSE/software/info/services/time-tracking/README.md)** (`info/services/time-tracking/README.md`): Timesheet matrix, worklog aggregations, calendar views, and estimate forecasting.
- **[Database Seeding & Realistic Dataset Generator](file:///home/finkord/dev/PPofSE/software/info/services/seeding/README.md)** (`info/services/seeding/README.md`): 5 engineering teams (`UI`, `CORE`, `MON`, `INFRA`, `NET`), 30 engineers, 46 sprint tickets, 18 links, and 70 worklogs.
- **[Frontend Architecture & Design System](file:///home/finkord/dev/PPofSE/software/info/services/frontend/README.md)** (`info/services/frontend/README.md`): Material Design 3 Expressive UI, Google Pixel OS curves, color tokens, and state management.

### Architecture & Operations
- **[Agent Workflow & Coding Standards](file:///home/finkord/dev/PPofSE/software/info/default_instructions.md)** (`info/default_instructions.md`): Core AI context, strict engineering rules, and clean code principles.
- **[Operational Commands Reference](file:///home/finkord/dev/PPofSE/software/info/commands.bash)** (`info/commands.bash`): Operational scripts, testing commands, and database management.
- **[Tech Stack & Evaluation (Archive)](file:///home/finkord/dev/PPofSE/software/info/deprecated/TECH_STACK_AND_AUTH_PREPARATION.md)** (`info/deprecated/TECH_STACK_AND_AUTH_PREPARATION.md`): Initial architectural design, trade-offs, and capacity planning.

---

## Architecture & Directory Layout

```
software/
├── README.md                               # Project overview and quick start guide (this file)
├── docker-compose.yml                      # PostgreSQL 15, Redis 7, Mailpit, SeaweedFS
├── info/                                   # Architectural documentation, guides, and manuals
│   ├── default_instructions.md             # Developer & AI agent coding standards
│   ├── commands.bash                       # Operational CLI scripts
│   └── services/                           # Dedicated subsystem documentation
│       ├── auth/                           # Authentication & Security service docs
│       ├── frontend/                       # Frontend architecture & M3 design system docs
│       ├── projects-issues/                # Issue tracking & Agile lifecycle docs
│       ├── rbac/                           # RBAC & permission scheme docs
│       ├── seeding/                        # Realistic dataset generator docs
│       └── time-tracking/                  # Timesheet & worklog analytics docs
├── backend/                                # NestJS 12 REST & WebSocket API application
│   ├── src/
│   │   ├── main.ts                         # App bootstrap, Swagger, CORS, ValidationPipe
│   │   ├── app.module.ts                   # Root NestJS module wiring TypeORM, Mailer, Redis
│   │   ├── database/                       # Migrations and automated seed runner
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

### 1. Start Infrastructure Services
Launch PostgreSQL, Redis, Mailpit, and SeaweedFS in the background:
```bash
docker compose up -d
```

### 2. Start Backend API
```bash
cd backend
npm install
npm run start:dev
```
- API Endpoint: [`http://localhost:3000`](http://localhost:3000)
- Interactive Swagger OpenAPI Docs: [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs)

### 3. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
- Web Application: [`http://localhost:5173`](http://localhost:5173) (automatically routes authenticated users to `/dashboard`)

### 4. Developer Portals & Tools
| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Frontend App** | [`http://localhost:5173`](http://localhost:5173) | Main application interface |
| **Backend Swagger** | [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) | Interactive API exploration |
| **Mailpit Inbox** | [`http://localhost:8025`](http://localhost:8025) | Local SMTP web client for activation & password emails |
| **SeaweedFS S3** | [`http://localhost:8333`](http://localhost:8333) | S3-compatible blob storage portal |

---

## Production Regime (Build & Execution)

In production, all development shortcuts are disabled, and strict security controls are enforced:

### 1. Build & Run Backend
```bash
cd backend
npm install --omit=dev
npm run build
NODE_ENV=production PORT=3000 npm run start:prod
```

### 2. Build & Serve Frontend
```bash
cd frontend
npm install
npm run build
npm run preview -- --port 5173
```
*(Or serve the compiled `frontend/dist` directory via Nginx, Caddy, or a reverse proxy).*

---

## Security Architecture & Hardening

* **Zero Secret Leakage:** Single-use tokens (`activationToken`, `resetPasswordToken`) are never returned in JSON HTTP responses; they are delivered exclusively via cryptographic email links.
* **Fail-Closed CAPTCHA:** Cloudflare Turnstile token validation strictly rejects test bypass tokens in production.
* **Enforced Activation Lock:** Unactivated accounts cannot log in under any circumstances (HTTP `401 Unauthorized`).
* **Real OAuth2 OIDC Integration:** Native integration with GitHub and Google OAuth2 providers.
* **Brute-Force Throttling & Account Lockout:** 5 consecutive failed login attempts trigger an immediate 15-minute account lockout, audited in `login_audit_logs`.
* **RFC 6238 TOTP Two-Factor Authentication:** Cryptographically verified time-based one-time passwords for enhanced account protection.
* **Forensic Security Audit Trail:** Live forensic audit log capturing IP address, User-Agent, failure reasons, and timestamps.
