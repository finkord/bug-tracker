# Bug / Issue Tracking System (Software Implementation)

> **Author:** Volodymyr Fufalko (*Володимир Фуфалько*)  

---

## Overview

This repository directory contains the production implementation of a lightweight, high-performance **Bug / Issue Tracking System**. The project bridges two core university requirements:
1. **PPofSE (Labs 1–7):** Enterprise software engineering lifecycle, 3NF PostgreSQL database, modular monolith architecture, and a modern React Single Page Application (SPA).
2. **SDSecurity (Lab 6 Project):** Enterprise-grade identity, access management, and cybersecurity controls (Argon2id hashing, TOTP 2FA, OAuth2/OIDC, brute force mitigation, bot CAPTCHA, email activation, and security audit logs).

---

## Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **NestJS 10 (TypeScript)** | Modular monolith API, dependency injection, class-validator, Swagger OpenAPI docs |
| **Frontend** | **React + Vite (TypeScript)** | Single Page Application (SPA), Tailwind CSS, shadcn/ui, TanStack Query |
| **Database** | **PostgreSQL 15+** | Relational 3NF data tier with composite B-Tree indexes for sub-5ms query performance |
| **In-Memory / Cache** | **Redis 7+** | Rate limiting, session invalidation, and WebSocket real-time event pub/sub |
| **Object Storage** | **SeaweedFS (Go / S3 API)** | Ultra-fast distributed blob storage (Apache 2.0) for attachments, screenshots, and logs |
| **Local Mail Testing** | **Mailpit** | Embedded SMTP server and web interface for instant email token verification |

---

## Documentation Index

- **[info/services/auth/README.md](file:///home/finkord/dev/PPofSE/software/info/services/auth/README.md)** — **Authentication & Security Service**: Complete technical specification (dependencies, database schema, module architecture, sequence diagrams, all 7 SDSecurity Lab 6 tasks).
- **[info/default_instructions.md](file:///home/finkord/dev/PPofSE/software/info/default_instructions.md)** — Core AI agent context, strict engineering standards, and stack reference.
- **[info/TECH_STACK_AND_AUTH_PREPARATION.md](file:///home/finkord/dev/PPofSE/software/info/TECH_STACK_AND_AUTH_PREPARATION.md)** — Architectural design, backend & frontend evaluation, SDSecurity mapping, and capacity planning.
- **[info/commands.bash](file:///home/finkord/dev/PPofSE/software/info/commands.bash)** — Reference CLI commands and operational scripts.
- **[Root Project Context](file:///home/finkord/dev/PPofSE/default_instructions.md)** — Historical lab records (Labs 1–5), UML diagrams, and academic passports.

---

## Architecture & Directory Layout

```
PPofSE/software/
├── README.md                               # Project overview and quick start guide (this file)
├── docker-compose.yml                      # PostgreSQL 15, Redis 7, Mailpit, SeaweedFS
├── info/                                   # Project documentation, guides, and commands
│   ├── commands.bash                       # Reference CLI commands
│   ├── default_instructions.md             # Agent context and coding standards
│   ├── TECH_STACK_AND_AUTH_PREPARATION.md  # Deep architecture & tech evaluation
│   └── services/                           # Dedicated service technical documentation
│       └── auth/                           # Authentication & Security service documentation
│           └── README.md                   # Full spec: dependencies, tables, structure, flows
├── backend/                                # NestJS 12 REST & WebSocket API application
└── frontend/                               # React + Vite Single Page Application
```

---

## Getting Started

### Prerequisites
- **Node.js:** `v24.x` (Active LTS, e.g., `v24.21.0`)
- **Docker & Docker Compose:** Installed and running
- **npm:** `v11.x` (or higher)

### Quick Start (Local Development)
1. **Start infrastructure services:**
   ```bash
   docker compose up -d
   ```
2. **Access local developer portals:**
   - **PostgreSQL:** `localhost:5432` (`postgres` / `postgres`)
   - **Redis:** `localhost:6379`
   - **Mailpit Web UI:** [`http://localhost:8025`](http://localhost:8025)
   - **SeaweedFS S3 API:** [`http://localhost:8333`](http://localhost:8333)
   - **Backend API & Swagger:** [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs)
