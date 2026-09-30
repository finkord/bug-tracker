# Operational Commands & Developer Runbook

This runbook catalogs the standard CLI operations for managing infrastructure containers, development servers, database initialization, clean teardown, and customer production deployments.

---

## Developer Workflows (Makefile)

The project includes a Makefile for single-command automation:

| Command | Action |
|---|---|
| `make dev` | Start backend and frontend together with unified colored logs and auto-docker startup |
| `make dev-backend` | Start only NestJS backend in watch mode (`port 3000`) |
| `make dev-frontend` | Start only Vite frontend server (`port 5173`) |
| `make dev-stop` | Stop local development servers running on host ports 3000 and 5173 |
| `make dev-down` | Gracefully stop backing Docker containers without losing data |
| `make dev-clean` | Completely wipe dev servers, Docker data volumes, build bundles, and test caches |
| `make dev-reset` | Reset database and storage volumes, restart containers, and reinitialize system |
| `make setup` | First-time project setup (copies `.env`, installs deps, starts Docker, initializes system) |
| `make doctor` | Run diagnostic check (Node/npm/Docker versions, port conflicts, container health) |
| `make check` | Run OxLint + TypeScript checks across both backend and frontend (Pre-delivery check) |
| `make test` | Run backend and frontend Vitest test suites |
| `make infra-up` | Start backing Docker containers (PostgreSQL, Redis, Mailpit, SeaweedFS) |
| `make infra-down` | Gracefully stop backing Docker containers |
| `make infra-reset` | Wipe and re-create database volumes from scratch, then reinitialize |
| `make init-system` | Initialize baseline system (roles, permissions, groups, system admin account) |
| `make seed` | Alias to `init-system` (clean initialization without fake tickets) |
| `make seed-demo` | Seed legacy dummy tickets and demo users for testing |
| `make db-shell` | Open interactive PostgreSQL `psql` console |
| `make redis-shell` | Open interactive Redis CLI |
| `make prod-build` | Build customer production images (NestJS backend + Nginx SPA) |
| `make prod-up` | Launch containerized production stack on port 80 |
| `make prod-down` | Stop production container stack |
| `make prod-init` | Initialize production system roles and admin account inside container |
| `make clean` | Clean dist bundles, test coverage, and temporary cache artifacts |

---

## 1. Local Infrastructure (Docker Compose)

The local development environment runs PostgreSQL 15, Redis 7, Mailpit, and SeaweedFS in Docker.

```bash
# Start backing infrastructure containers in the background (Postgres, Redis, Mailpit, SeaweedFS)
docker compose up -d

# Check status of running containers
docker compose ps

# Tail infrastructure logs
docker compose logs -f

# Stop containers without losing data
docker compose down

# Destroy all containers and reset persistent database/S3 volumes
docker compose down -v
```

---

## 2. Active Development Workflow

### Dependency Installation
```bash
# From workspace root
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Starting Development Servers
```bash
# Option A: Unified runner via Makefile (recommended)
make dev

# Option B: Direct npm scripts from workspace root
npm run dev

# Option C: Dedicated terminals
# Terminal 1: Backend in watch mode (port 3000)
cd backend && npm run start:dev

# Terminal 2: Frontend Vite server (port 5173)
cd frontend && npm run dev
```

### Stopping and Cleaning Up Development Environment

To stop running dev servers and release ports 3000 and 5173:
```bash
make dev-stop
```
Or manually:
```bash
fuser -k 3000/tcp 5173/tcp 2>/dev/null || true
```

To perform a complete teardown (stopping servers, removing docker containers and volumes, and removing build caches):
```bash
make dev-clean
```

To reset the database cleanly and reinitialize system roles and admin:
```bash
make dev-reset
```

### System Initialization & Seeding

BugTracker separates production system initialization from dummy test data.

```bash
# 1. Baseline System Initialization (Zero dummy tickets, creates default roles, permissions, admin account)
make init-system
# Or via npm:
npm --prefix backend run init:system

# 2. Legacy Demo Seeding (Only if needed for exploratory UI testing with sample tickets)
make seed-demo
# Or via npm:
npm --prefix backend run seed:demo
```

---

## 3. Testing & Code Quality Verification

```bash
# Run backend Vitest unit & integration tests
npm --prefix backend test

# Run frontend Vitest suite
npm --prefix frontend test

# Run targeted test for a specific module
cd backend && npx vitest run src/modules/auth/auth.service.spec.ts

# Fast pre-delivery check (OxLint + tsc --noEmit across backend and frontend)
make check
```

---

## 4. Production Deployment (Customer Package)

The production package (`docker-compose.prod.yml`) is designed for customer deployment on their own infrastructure. It excludes developer mock tools (such as Mailpit) and connects to the customer mail server via standard SMTP.

### Deployment Steps

1. **Configure Environment Variables:**
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod to set database passwords, JWT secrets, SMTP credentials, and initial admin credentials
   ```

2. **Build and Launch Container Stack:**
   ```bash
   make prod-up
   # Or directly:
   docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
   ```

3. **Initialize System Roles & Admin User:**
   ```bash
   make prod-init
   # Or directly:
   docker compose -f docker-compose.prod.yml exec backend npm run init:system:prod
   ```
   This command creates:
   - System permission taxonomy and standard roles (`Global Administrator`, `Project Manager`, `Engineer`, `Reporter`)
   - Default system groups (`administrators`, `engineering`, `qa`)
   - System administrator account specified by `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`
   - Zero fake tickets or dummy users are injected.

4. **Stream Logs:**
   ```bash
   make prod-logs
   # Or directly:
   docker compose -f docker-compose.prod.yml logs -f
   ```

5. **Stop Production Stack:**
   ```bash
   make prod-down
   # Or directly:
   docker compose -f docker-compose.prod.yml down
   ```

---

## 5. Web Portals & Access Endpoints

### Development Endpoints
| Service | Access URL | Role / Notes |
|---|---|---|
| **Frontend Web App** | `http://localhost:5173` | Vite dev server with instant HMR and `/api` proxy |
| **Backend REST API & Swagger** | `http://localhost:3000/api/docs` | Interactive OpenAPI documentation (`/api/v1`) |
| **Mailpit Web Inbox** | `http://localhost:8025` | Inspect activation links & reset tokens (SMTP port `1025`) |
| **SeaweedFS Master Console** | `http://localhost:9333` | Volume status & cluster diagnostics |
| **SeaweedFS S3 Storage Endpoint** | `http://localhost:8333` | S3-compatible attachment uploads |

### Production Endpoints (`docker-compose.prod.yml`)
| Service | Access URL | Role / Notes |
|---|---|---|
| **Nginx Ingress Proxy** | `http://<host-ip-or-domain>` (Port `80`) | Unified ingress: static SPA serving, `/api` proxy, WebSocket forwarding |
| **Backend API (Container Internal)** | Internal port `3000` | NestJS container API |
| **Customer Mail Server** | External SMTP (port 587/465) | Real email notifications via customer SMTP server |
