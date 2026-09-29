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
- **[Database Seeder](documentation/backend/seeding.md)**: Multi-team engineering dataset (5 teams, 30 engineers, 46 issues).

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
