# AI Context and Engineering Instructions (`software/` Implementation)

This document serves as the primary system context, architectural reference, and operational guide for AI agents working within the `/home/finkord/dev/PPofSE/software/` application codebase.

---

## 1. Project Identity & Academic Context

* **Project Title:** Bug / Issue Tracking System (*Розроблення системи обліку та супроводу помилок у програмному забезпеченні*).
* **Developer:** Fufalko V.V. (*Фуфалько В.В.*), Academic Group **IPZ-43** (*ІПЗ-43*).
* **Institution:** Vasyl Stefanyk Precarpathian National University (*Карпатський національний університет імені Василя Стефаника*).
* **Faculty & Department:** Faculty of Mathematics and Computer Science, Department of Information Technology.
* **Academic Cross-Course Alignment:**
  1. **PPofSE (Professional Practice of Software Engineering):**
     - Full software lifecycle: Requirements (Lab 2), UML Modeling (Lab 3), Architecture Design (Lab 4), Database Schema (Lab 5), Frontend Development (Lab 6–7).
  2. **SDSecurity (Software and Data Security):**
     - Lab 6 Project: *Secure User Account Management System* (15 points: registration, password policy, CAPTCHA, email activation, brute force protection, audit logging, 2FA TOTP, OAuth2/OIDC, email password reset, 7-step video report).
  3. **Future Course (2nd Semester):**
     - *Back-end Programming: NestJS* — The backend stack is deliberately selected to master NestJS ahead of time and maximize code/skill reuse.
  4. **Diploma Thesis (Future Connection):**
     - *Development of an IT Infrastructure Monitoring System using Go* — Go will not be used in the core business logic to avoid distributed microservice overhead, but will be integrated later as a lightweight infrastructure monitoring sidecar/daemon.

---

## 2. Technology Stack & System Components

| Layer | Technology | Key Libraries / Components | Rationale & Usage |
| :--- | :--- | :--- | :--- |
| **Backend API** | **NestJS 10 (TypeScript)** | `@nestjs/core`, `@nestjs/common`, `@nestjs/swagger`, `@nestjs/throttler`, `@nestjs-modules/mailer` | Modular monolith architecture (`Modules`, `Controllers`, `Services`, `Guards`, `Pipes`, `Interceptors`). Runs on Node.js v18.19.1. |
| **Authentication & Security** | **Passport.js & Crypto** | `@nestjs/passport`, `passport-jwt`, `passport-google-oauth20`, `passport-github2`, `bcrypt` / `argon2`, `otplib`, `qrcode` | Implements all 7 security tasks of SDSecurity Lab 6 (JWT access/refresh tokens in httpOnly cookies, TOTP 2FA, OAuth2, Argon2id). |
| **Data Validation** | **class-validator & class-transformer** | Declarative DTO decorators (`@IsEmail()`, `@MinLength()`, `@Matches()`, `@IsEnum()`) | Global `ValidationPipe({ whitelist: true, transform: true })` ensuring input sanitization and zero-trust validation. |
| **Database & ORM** | **PostgreSQL 15+ & TypeORM** | `@nestjs/typeorm`, `pg` | Relational 3NF database schema based on `PPofSE/Lab5/sql/schema.sql` extended with security audit tables and activation/2FA attributes. |
| **Cache & Real-time** | **Redis 7+** | `ioredis`, `@nestjs/websockets`, `socket.io` | Rate-limiting state, session invalidation, and Pub/Sub broker for real-time WebSocket Kanban board updates. |
| **Object Storage** | **SeaweedFS (Apache 2.0)** | `@aws-sdk/client-s3` (S3 API compatible) | High-performance, Go-based distributed blob store replacing MinIO. Stores bug attachments, crash dumps, and screenshots up to 25 MB. |
| **Local Mail Testing** | **Mailpit** | SMTP (port `1025`), Web UI (port `8025`) | Lightweight local email testing server for instant verification and video demonstration of activation links and password reset tokens. |
| **Frontend Client** | **React + Vite (TypeScript)** | `vite`, `@tanstack/react-query`, `lucide-react`, `tailwindcss`, `shadcn/ui`, `@hello-pangea/dnd` | Single Page Application (SPA) designed for responsive desktop/mobile usability (PPofSE Lab 6–7) with zero SSR complexity. |

---

## 3. Strict Coding Rules & Engineering Standards

> [!IMPORTANT]
> **RULE: English Comments and Code Artifacts**  
> All source code comments, commit messages, variable names, DTO definitions, and documentation within the codebase MUST BE WRITTEN IN ENGLISH ONLY. No exceptions.

1. **Strict TypeScript Standards:**
   - Always adhere to strict TypeScript checks (`strict: true`).
   - Avoid `any` types; define explicit interfaces, types, or DTO classes for all data transfers.
2. **DTO & Validation Discipline:**
   - Every incoming request payload must be mapped to a dedicated DTO with `class-validator` rules.
   - Strip unrecognized properties using global `whitelist: true`.
3. **Node.js Runtime Compatibility:**
   - The development environment runs **Node.js v24.21.0 (Active LTS)** and **npm 11.19.0** managed via NVM.
   - Use the latest **NestJS CLI (v12+)** (`@nestjs/cli`), fully satisfying NestJS official prerequisites (Node.js >= 22.12+ / 24+).
4. **Clean Architecture in NestJS:**
   - **Controllers:** Handle HTTP routing, input validation, and HTTP status codes only. No direct database or business logic.
   - **Services:** Contain domain logic, business transactions, and event emissions.
   - **Guards:** Enforce authorization (`JwtAuthGuard`, `RolesGuard`, `TwoFactorGuard`, `ThrottlerGuard`).
   - **Entities:** Represent TypeORM database models matching the PostgreSQL 3NF schema.

---

## 4. SDSecurity Lab 6 Specification Mapping

All AI agents must ensure that the authentication service maintains complete compliance with the 7 core lab tasks:

1. **Task 1: Registration & Password Policy**
   - Minimum 8 characters, uppercase letter, lowercase letter, number, and special symbol.
   - Password strength evaluation on client and server.
   - Password hashing via **Argon2id** or **bcrypt** (cost 12).
   - User profile endpoint (`GET /api/v1/users/me`) and secure logout (refresh token revocation).
2. **Task 2: CAPTCHA Protection**
   - Verification token submitted with registration; validated via `CaptchaService` (Cloudflare Turnstile / Google reCAPTCHA).
3. **Task 3: Email Account Activation**
   - Single-use, cryptographically secure activation token (TTL = 24h).
   - Email dispatch via Mailpit with one-click activation link (`/api/v1/auth/activate?token=...`).
   - Account activation status visible in profile (`is_activated`).
4. **Task 4: Brute Force Mitigation & Security Audit Logs**
   - Rate limiting via `@nestjs/throttler` on login attempts.
   - Temporary lockout: after 5 failed login attempts, account locked for 15 minutes (`locked_until`).
   - Security audit logging table (`login_audit_logs`): records IP address, User-Agent, attempted email, failure reason, and timestamp.
   - Administrator controls: `GET /api/v1/admin/security/login-logs`, `PATCH /api/v1/admin/users/:id/block`, and `PATCH /api/v1/admin/users/:id/unblock`.
5. **Task 5: Two-Factor Authentication (2FA / TOTP)**
   - RFC 6238 TOTP via `otplib` and QR code rendering (`qrcode`).
   - User toggle in profile (enable/disable with confirmation code).
   - Login challenge: if 2FA is active, prompt for 6-digit TOTP code before issuing final session tokens.
6. **Task 6: External Identity Providers (OAuth2 / OIDC)**
   - GitHub OAuth2 (`passport-github2`) and Google OAuth2 (`passport-google-oauth20`).
   - Automatic account linking or creation with `oauth_provider` and `oauth_id`.
7. **Task 7: Password Reset Flow**
   - Request reset link via email (`POST /api/v1/auth/forgot-password`).
   - One-time token with short expiry (15 minutes).
   - Reset endpoint (`POST /api/v1/auth/reset-password`) enforcing the complex password policy.

---

## 5. Target Directory Layout

```
PPofSE/software/
├── README.md                               # Project overview and quick start guide
├── default_instructions.md                 # This file: AI agent instructions & stack context
├── TECH_STACK_AND_AUTH_PREPARATION.md      # Comprehensive architecture & evaluation document
├── docker-compose.yml                      # Local infrastructure: PostgreSQL, Redis, Mailpit, SeaweedFS
├── backend/                                # NestJS 10 REST & WebSocket API application
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts                         # Application entrypoint, Swagger, CORS, ValidationPipe
│   │   ├── app.module.ts                   # Root application module
│   │   ├── common/                         # Shared decorators, guards, filters, interceptors
│   │   ├── config/                         # Environment configuration (.env validation)
│   │   ├── database/                       # TypeORM configuration, migrations, seeds
│   │   └── modules/
│   │       ├── auth/                       # Register, login, 2FA, OAuth, activation, password reset
│   │       ├── users/                      # User profile, RBAC management, admin controls
│   │       ├── security-audit/             # Login attempts logging, brute force tracking
│   │       ├── mail/                       # Mailpit / SMTP client for transactional emails
│   │       ├── captcha/                    # CAPTCHA verification service
│   │       ├── attachments/                # S3 file uploads via SeaweedFS
│   │       ├── projects/                   # Project workspace management (PPofSE)
│   │       └── issues/                     # Bug/Issue FSM lifecycle management (PPofSE)
│   └── test/                               # E2E and unit test suites
└── frontend/                               # React + Vite Single Page Application (PPofSE Lab 6–7)
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── components/                     # Reusable UI components (buttons, modals, forms)
        ├── features/                       # Domain features (auth, kanban, issues, admin)
        ├── hooks/                          # Custom React hooks (auth, query, websocket)
        └── services/                       # Typed API clients (Axios / TanStack Query)
```

---

## 6. Execution Roadmap & Milestones

1. **Milestone 1 — Infrastructure & Authentication (SDSecurity Lab 6):**
   - Spin up `docker-compose.yml` (PostgreSQL 15, Redis 7, Mailpit, SeaweedFS).
   - Initialize NestJS backend in `backend/` and configure database connection.
   - Implement `AuthModule` covering all 7 SDSecurity requirements.
   - Record and verify the 7-step video demonstration using Swagger UI and Mailpit.
2. **Milestone 2 — Core Domain & Issue Tracking (PPofSE Backend):**
   - Implement `ProjectsModule`, `IssuesModule` (Kanban FSM transitions), `CommentsModule`, and `AttachmentsModule` (SeaweedFS).
   - Configure WebSocket gateway for real-time issue updates.
3. **Milestone 3 — Frontend SPA (PPofSE Lab 6–7):**
   - Scaffold Vite React SPA in `frontend/`.
   - Implement responsive layouts, authentication/2FA views, issue submission forms, and drag-and-drop Kanban board.
4. **Milestone 4 — Final Polish & Diploma Connection:**
   - Optional lightweight Go monitoring sidecar collecting container health metrics to bridge directly with the diploma thesis.
