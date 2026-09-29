# BugTracker Backend API (`software/backend`)

A robust, enterprise-grade REST & WebSocket API built with **NestJS 12 (TypeScript)**, **PostgreSQL 15**, and **Redis 7**. This backend powers the Bug / Issue Tracking System with comprehensive issue tracking, agile project management, and secure identity management.

---

## Features & Security Architecture

1. **Authentication, Identity & Security:**
   - **Argon2id & bcrypt Hashing:** Passwords hashed with high-work-factor salt and pepper.
   - **Strict Password Complexity:** Enforces 8+ characters, uppercase, lowercase, number, and special character.
   - **Bot Prevention (Cloudflare Turnstile):** Server-side verification via Cloudflare `/siteverify` API. Fails closed in production if credentials are missing.
   - **Email Account Activation:** Single-use cryptographic tokens (24h TTL) dispatched via Mailpit SMTP. Unactivated accounts are strictly forbidden from logging in (`401 Unauthorized`).
   - **Brute Force Mitigation:** Account lockout after 5 consecutive failed attempts (15-minute lockout) with `@nestjs/throttler` rate limiting.
   - **Security Audit Logging:** Comprehensive forensic audit trail (`login_audit_logs`) capturing IP address, User-Agent, attempted email, failure reason, and timestamps.
   - **Two-Factor Authentication (2FA):** RFC 6238 TOTP using `otplib` and `qrcode`. Seamless pairing and login challenge flow.
   - **OAuth2 / OIDC Integration:** Native GitHub and Google OAuth2 strategies with cryptographic state handling.
   - **Password Reset:** Secure single-use email reset tokens (15-minute expiry).
   - **Zero Secret Leakage:** Single-use tokens are never exposed in JSON API responses; they are delivered exclusively via email.

2. **Core Domain Services (PPofSE):**
   - **User Management & RBAC Schemes:** Custom project roles, user groups, permission schemes, and issue security schemes.
   - **Project Workspaces:** Multi-tenant project contexts with member assignments and project keys.
   - **Issue Tracking & FSM:** Formal Finite State Machine transitions (`New` -> `Assigned` -> `In Progress` -> `Pending Reporter` -> `Resolved` -> `Closed`).
   - **Agile Sprints & Backlogs:** Sprint planning, backlog item organization, and sprint lifecycle transitions.
   - **Time Tracking & Worklogs:** Forensic worklog submissions, aggregations, timesheet matrices, and original/remaining estimates.
   - **Real-Time WebSockets:** Socket.IO event gateway broadcasting ticket updates, comments, and presence in real-time.
   - **Attachments & Blobs:** S3-compatible file storage integration (SeaweedFS).

---

## Technology Stack

- **Framework:** NestJS 12 (`@nestjs/core`, `@nestjs/common`, `@nestjs/swagger`, `@nestjs/throttler`)
- **Runtime:** Node.js v24.21.0 LTS (Active LTS) / npm 11.19.0
- **Database:** PostgreSQL 15+ via TypeORM (`@nestjs/typeorm`, `pg`)
- **In-Memory Cache & Pub/Sub:** Redis 7+ via `ioredis`
- **Email Delivery (Local):** Mailpit (SMTP port `1025`, Web UI port `8025`)
- **Blob Storage:** SeaweedFS S3 API (ports `8333` / `9333`)
- **Validation:** `class-validator` & `class-transformer` with global `whitelist: true`
- **Testing:** Vitest & Supertest

---

## Directory Structure

```
software/backend/
├── src/
│   ├── main.ts                       # Application entrypoint, Swagger, CORS, CSP & ValidationPipe
│   ├── app.module.ts                 # Root NestJS module wiring TypeORM, Throttler, Mailer
│   ├── common/                       # Shared decorators, guards, filters, interceptors
│   │   ├── decorators/               # @CurrentUser, @Roles, @Public
│   │   ├── guards/                   # JwtAuthGuard, RolesGuard, ThrottlerGuard
│   │   └── filters/                  # Global HttpExceptionFilter
│   └── modules/
│       ├── auth/                     # Authentication, 2FA, OAuth, Activation, Password Reset
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/                  # RegisterDto, LoginDto, Enable2faDto, etc.
│       │   └── strategies/           # JwtStrategy, LocalStrategy, GitHubStrategy, GoogleStrategy
│       ├── users/                    # User profile, preferences, saved JQL filters
│       ├── projects/                 # Workspace projects, member assignments
│       ├── issues/                   # Issues, comments, worklogs, attachments, links
│       ├── sprints/                  # Agile sprints and backlog management
│       ├── rbac/                     # Project roles, user groups, permission schemes
│       ├── events/                   # Socket.IO real-time event gateway
│       ├── security-audit/           # Login audit logging & forensic reporting
│       ├── captcha/                  # Cloudflare Turnstile server-side verification service
│       └── admin/                    # System administration and platform analytics
├── test/                             # Unit and integration test suites
├── vitest.config.ts                  # Test runner configuration
└── tsconfig.json                     # Strict TypeScript compiler options
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure accordingly:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port for the NestJS API |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `bugtracker` | Database username |
| `DB_PASS` | `bugtracker_secret` | Database password |
| `DB_NAME` | `bugtracker_db` | Database name |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | `dev-access-token-secret-key-32chars` | Secret key for signing access JWTs |
| `JWT_REFRESH_SECRET` | `dev-refresh-token-secret-key-32chars` | Secret key for signing refresh JWTs |
| `MAIL_HOST` | `localhost` | SMTP host (Mailpit) |
| `MAIL_PORT` | `1025` | SMTP port (Mailpit) |
| `TURNSTILE_SECRET` | *(Cloudflare Secret Key)* | Secret key for Cloudflare Turnstile `/siteverify` |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed frontend origin for CORS |

---

## Operating Regimes

### 1. Development Mode (Watch & Hot-Reload)
```bash
# Install dependencies
npm install

# Start in watch mode
npm run start:dev
```
The API is available at `http://localhost:3000`. Swagger documentation is at `http://localhost:3000/api/docs`.

### 2. Production Regime (Optimized Build & Serving)
In production, strict security controls and fail-closed CAPTCHA are enforced, and optimized production bundles are executed:
```bash
# 1. Build the production distribution
npm run build

# 2. Start the production server
NODE_ENV=production PORT=3000 npm run start:prod
```

### 3. Testing
```bash
# Run unit test suite
npm test

# Run tests with coverage
npm run test:cov
```
