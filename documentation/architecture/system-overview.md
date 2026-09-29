# System Architecture & Infrastructure Overview

This document provides a comprehensive technical overview of the **BugTracker** application architecture, component interactions, and infrastructure runtime environment.

---

## 1. High-Level Architecture Diagram

### Rendered Architecture View
![System Architecture](diagrams/system_architecture.png)

<details>
<summary><b>Click to expand Mermaid Source Code</b></summary>

```mermaid
graph TB
    subgraph ClientLayer["🖥️ Frontend Client (React 19 + Vite 8)"]
        SPA["React SPA<br/>(Tailwind v4 + M3 Expressive)"]
        Router["App Router (19 Pages)"]
        Stores["Zustand Stores<br/>(auth, ui, theme)"]
        Query["TanStack Query (Cache & Sync)"]
        WSClient["Socket.IO Client"]
        SPA --> Router
        Router --> Stores
        Router --> Query
        SPA --> WSClient
    end

    subgraph GatewayLayer["🛡️ HTTP & WebSocket Gateway (NestJS 12)"]
        Main["Fastify / Express API Gateway<br/>Port 3000 (Prefix: /api/v1)"]
        Pipes["ValidationPipe (class-validator)"]
        Guards["JwtAuthGuard | RolesGuard | ThrottlerGuard"]
        Gateway["EventsGateway (Socket.IO)<br/>Real-Time Board Updates"]
        Main --> Pipes
        Pipes --> Guards
    end

    subgraph BackendModules["📦 Modular Monolith Backend Domain"]
        AuthM["AuthModule & CaptchaModule<br/>(Argon2id, TOTP, OAuth2, Turnstile)"]
        UserM["UsersModule & AdminModule<br/>(Profiles, Saved Filters, Health)"]
        IssueM["IssuesModule & SprintsModule<br/>(Tickets, Links, Comments, Worklogs)"]
        RbacM["RbacModule & SecurityAuditModule<br/>(Schemes, Roles, Audit Logs)"]
        ProjM["ProjectsModule<br/>(Keys, Team Spaces, Workflows)"]
    end

    subgraph DataLayer["💾 Persistence & External Infrastructure"]
        Postgres[("PostgreSQL 15<br/>19 3NF Entities")]
        RedisCache[("Redis 7<br/>Rate-limiting & Pub/Sub")]
        Seaweed[("SeaweedFS S3<br/>Attachments & Dumps")]
        Mailpit[("Mailpit SMTP<br/>Port 1025 / UI 8025")]
    end

    SPA -- "REST HTTP (httpOnly Cookies)" --> Main
    WSClient -- "WebSocket WSS" --> Gateway
    Guards --> BackendModules

    BackendModules --> Postgres
    BackendModules --> RedisCache
    BackendModules --> Seaweed
    BackendModules --> Mailpit
```
</details>

---

## 2. Technology Stack & Service Endpoints

| Layer | Technology | Runtime / Port | Role & Key Responsibilities |
|---|---|---|---|
| **Backend API** | NestJS 12 (TypeScript) | Node.js 24 LTS / Port `3000` | Modular monolith architecture (`/api/v1`), Swagger (`/api/docs`), JWT cookies, input validation. |
| **Frontend SPA** | React 19 + Vite 8 | Port `5173` | Single-page application, Tailwind CSS v4, Material Design 3 Expressive theme, TanStack Query. |
| **Relational Database** | PostgreSQL 15 | Port `5432` | Relational 3NF persistence managed via TypeORM with 19 domain entities. |
| **Cache & Pub/Sub** | Redis 7 | Port `6379` | Throttling/rate-limit tracking, session state, and WebSocket distribution. |
| **Object Storage** | SeaweedFS (S3 API) | S3 Port `8333` / Master `9333` | S3-compatible blob storage for bug attachments, crash dumps, and avatars. |
| **Mail Testing** | Mailpit | SMTP `1025` / Web UI `8025` | Local zero-dependency mail server capturing activation links and password reset tokens. |
| **Real-time Gateway** | Socket.IO | WSS via Port `3000` | Real-time push events for Kanban board updates and issue status changes. |

---

## 3. Layered Design Principles (Backend Monolith)

1. **HTTP Ingestion Boundary**:
   - Every request reaches global `ValidationPipe({ whitelist: true, transform: true })`.
   - Security filters (`JwtAuthGuard`, `RolesGuard`, `ThrottlerGuard`) run before entering business logic.
2. **Domain Layering**:
   - `Controllers` handle HTTP parameter binding and response mapping.
   - `Services` encapsulate business transactions, external calls, and security enforcement.
   - `Entities` encapsulate TypeORM data definitions.
3. **Data Protection**:
   - Passwords hashed using Argon2id.
   - Sensitive fields (`passwordHash`, `twoFactorSecret`) stripped during serialization.
   - Access & refresh tokens stored in secure `httpOnly`, `SameSite=Lax` cookies.
