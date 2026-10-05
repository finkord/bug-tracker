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
    subgraph ClientTier["Presentation Tier (React 19 SPA)"]
        SPA["React 19 SPA Client<br/>(Tailwind v4 + M3 Expressive)"]
        Primitives["Headless Primitives<br/>(DataTable, cmdk, @dnd-kit, EntityAvatar)"]
        Router["App Router (19 Views)"]
        Stores["Zustand Stores (auth, ui, theme)"]
        Query["TanStack Query (queryOptions factories)"]
        OpenAPI["Generated OpenAPI Types<br/>(api.generated.ts contract)"]
        WSClient["Socket.IO Client"]
        SPA --> Router
        SPA --> Primitives
        Router --> Stores
        Router --> Query
        Query --> OpenAPI
        SPA --> WSClient
    end

    subgraph IngressTier["Level 2: Ingress & Edge Proxy Tier (Nginx Ingress)"]
        Nginx["Nginx Reverse Proxy (Port 80 / 443)<br/>HTTP/2 + TLS 1.3 Termination"]
        RateLimit["Rate Limiting (limit_req)<br/>20 req/s, burst=30"]
        StaticCache["Static Asset Cache & Gzip<br/>Cache-Control: immutable"]
        BodyCap["Attachment Cap (25 MB)<br/>Client Body Limiter"]
        Nginx --> RateLimit
        Nginx --> StaticCache
        Nginx --> BodyCap
    end

    subgraph GatewayTier["Level 3: API & Event Gateway (NestJS 12)"]
        Main["Express API Gateway (Port 3000)<br/>Prefix: /api/v1"]
        Pipes["ValidationPipe (class-validator)"]
        Guards["JwtAuthGuard | RolesGuard | ThrottlerGuard"]
        EventsGW["EventsGateway (Socket.IO)<br/>Namespace: /events"]
        Main --> Pipes
        Pipes --> Guards
    end

    subgraph CoreModules["Modular Monolith Core Domain"]
        AuthM["AuthModule & CaptchaModule<br/>(Argon2id, TOTP 2FA, OAuth2, Turnstile)"]
        UserM["UsersModule & AdminModule<br/>(Profiles, Saved Filters, Diagnostics)"]
        IssueM["IssuesModule & SprintsModule<br/>(FSM Workflow, JQL Validation, Reordering, Worklogs)"]
        RbacM["RbacModule & SecurityAuditModule<br/>(Schemes, Roles, Audit Logs)"]
        ProjM["ProjectsModule<br/>(Keys, Team Spaces, Workflows)"]
    end

    subgraph DataTier["Level 4: Persistence & Storage Tier"]
        Postgres[("PostgreSQL 15<br/>19 3NF Entities")]
        RedisCache[("Redis 7<br/>Rate-limiting & Pub/Sub")]
        Seaweed[("SeaweedFS S3<br/>Attachments & Dumps")]
        Mailpit[("Mailpit SMTP<br/>Port 1025 / Web 8025")]
    end

    SPA -- "HTTP / WebSocket (Port 80)" --> Nginx
    RateLimit -- "Proxy: /api/*" --> Main
    RateLimit -- "Proxy: /events/* (Upgrade)" --> EventsGW
    StaticCache -- "Serve: /assets/* & /*" --> SPA

    Guards --> CoreModules
    EventsGW --> RedisCache

    CoreModules --> Postgres
    CoreModules --> RedisCache
    CoreModules --> Seaweed
    CoreModules --> Mailpit
```
</details>

---

## 2. Technology Stack & Service Endpoints

| Layer | Technology | Runtime / Port | Role & Key Responsibilities |
|---|---|---|---|
| **Ingress & Edge Proxy**| Nginx Alpine | Port `80` (HTTP) / `443` (TLS) *(Production Tier)* | Production single unified entry point, edge IP rate-limiting (`limit_req`), static bundle cache, 25MB body limit. |
| **Backend API** | NestJS 12 (TypeScript) | Node.js 24 LTS / Port `3000` | Modular monolith architecture (`/api/v1`), Swagger (`/api/docs`), JWT cookies, input validation. |
| **Frontend SPA** | React 19 + Vite 8 | Port `5173` | Single-page application, Tailwind CSS v4, Material Design 3 Expressive theme, TanStack Query. |
| **Relational Database** | PostgreSQL 15 | Port `5432` | Relational 3NF persistence managed via TypeORM with 19 domain entities. |
| **Cache & Pub/Sub** | Redis 7 | Port `6379` | Fast session caching (`user:session:*`), RBAC permissions caching, sliding-window rate limiting, and horizontal Socket.IO Redis adapter distribution. |
| **Object Storage** | SeaweedFS (S3 API) | S3 Port `8333` / Master `9333` | S3-compatible blob storage for bug attachments, crash dumps, and avatars. |
| **Mail Testing** | Mailpit | SMTP `1025` / Web UI `8025` | Local zero-dependency mail server capturing activation links and password reset tokens. |
| **Real-time Gateway** | Socket.IO | WSS via Port `3000` / `/events`| Real-time push events for Kanban board updates and issue status changes. |

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
