# Operational Commands & Developer Runbook

This runbook catalogs the standard CLI operations for managing infrastructure containers, development servers, database initialization, clean teardown, and customer production deployments.

---

## Developer Workflows (Makefile)

The project includes a Makefile for single-command automation:

| Command | Action |
|---|---|
| `make dev` | Start backing infra + launch backend (`port 3000`) and frontend (`port 5173`) with hot-reload |
| `make dev-backend` | Start backing infra + launch NestJS backend in watch mode (`port 3000`) |
| `make dev-frontend` | Start only Vite frontend server (`port 5173`) |
| `make dev-stop` | Stop local development servers running on host ports 3000 and 5173 |
| `make dev-down` | Stop host servers and backing infrastructure containers |
| `make dev-clean` | Completely wipe dev servers, Docker data volumes, build bundles, and test caches |
| `make dev-reset` | Reset database volume, restart infra containers, and reinitialize baseline system |
| `make setup` | First-time project setup (copies `.env`, installs deps, starts infra, initializes system) |
| `make doctor` | Run diagnostic check (Node/npm/Docker versions, port conflicts, container health) |
| `make env` | Ensure backend and frontend `.env` files exist from template defaults |
| `make check` | Run OxLint + TypeScript checks across both backend and frontend (Pre-delivery check) |
| `make test` | Run backend and frontend Vitest test suites |
| `make test-backend` | Run backend Vitest unit & integration tests |
| `make test-frontend` | Run frontend Vitest suite |
| `make test-cov` | Run backend test coverage report |
| `make infra-up` | Start backing Docker containers (PostgreSQL, Redis, Mailpit, SeaweedFS) |
| `make infra-down` | Stop backing Docker containers |
| `make infra-logs` | Stream logs from backing infrastructure containers |
| `make infra-ps` | Check health and status of backing infrastructure containers |
| `make infra-reset` | Wipe database volumes from scratch, restart, and reinitialize |
| `make prod` | Build images and launch full container stack on port 80 |
| `make prod-down` | Stop application containers (leaves backing infra intact) |
| `make prod-logs` | Stream application container logs |
| `make prod-init` | Initialize baseline system roles and admin account inside container |
| `make prod-seed` | Seed scalable test dataset in backend container (accepts `ARGS="--users=500"`) |
| `make down` | Stop all containers (both application and backing infra) |
| `make init-system` | Initialize baseline system (roles, permissions, groups, system admin account) |
| `make seed` | Seed scalable test dataset (accepts `ARGS="--users=100 --issues=300"`) |
| `make db-shell` | Open interactive PostgreSQL `psql` console in PostgreSQL container |
| `make redis-shell` | Open interactive Redis CLI in Redis container |
| `make build` | Compile production bundles for backend and frontend |
| `make clean` | Clean dist bundles, test coverage, and temporary cache artifacts |

---

## 1. Local Backing Infrastructure (`docker-compose.infra.yml`)

The local development environment uses a dedicated, stateful backing infrastructure file running PostgreSQL 15, Redis 7, Mailpit, and SeaweedFS in Docker:

```bash
# Start backing infrastructure containers (Postgres, Redis, Mailpit, SeaweedFS)
make infra-up
# Or directly:
docker compose -f docker-compose.infra.yml up -d

# Check status and health of backing containers
make infra-ps
# Or directly:
docker compose -f docker-compose.infra.yml ps

# Tail infrastructure logs
make infra-logs
# Or directly:
docker compose -f docker-compose.infra.yml logs -f

# Stop backing containers without losing data
make infra-down
# Or directly:
docker compose -f docker-compose.infra.yml down

# Destroy all containers and reset persistent database/S3 volumes (destructive)
make infra-reset
# Or directly:
docker compose -f docker-compose.infra.yml down -v
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
# Option A: Unified runner via Makefile (automatically starts backing infra + hot reload)
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

To stop host servers and stop backing infrastructure containers:
```bash
make dev-down
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

BugTracker separates production system initialization from synthetic test data:

```bash
# 1. Baseline System Initialization (Zero dummy tickets, creates default roles, permissions, admin account)
make init-system
# Or via npm:
npm --prefix backend run init:system

# 2. Automated Test Data Seeding (Scalable realistic dataset across teams, sprints, and issues)
make seed
# With custom sizing:
make seed ARGS="--users=100 --projects=8 --issues=300"
# Or via npm:
npm --prefix backend run seed:demo -- --users=100 --issues=300
```

---

## 3. Testing & Code Quality Verification

```bash
# Run backend Vitest unit & integration tests
make test-backend
# Or via npm:
npm --prefix backend test

# Run frontend Vitest suite
make test-frontend
# Or via npm:
npm --prefix frontend test

# Run all test suites
make test

# Run targeted test for a specific module
cd backend && npx vitest run src/modules/auth/auth.service.spec.ts

# Fast pre-delivery check (OxLint + tsc --noEmit across backend and frontend)
make check
```

---

## 4. Production & Cloud Deployment Architecture

The application tier is strictly decoupled from stateful backing infrastructure:

- **Local Backing Infrastructure (`docker-compose.infra.yml`)**: PostgreSQL 15, Redis 7, SeaweedFS (S3), and Mailpit.
- **Application Tier (`docker-compose.yml`)**: Cloud-portable stateless manifest running `backend` (NestJS) and `frontend` (Nginx SPA + Reverse Proxy on port 80).
- **Environment Configuration (`.env.production.example`)**: Connects to either local container backing or AWS managed services (RDS, ElastiCache, S3, SES).

### Deployment Workflows

1. **Local Full-Stack Preview (App + Infra on Port 80):**
   ```bash
   make prod
   # Or directly:
   docker compose -f docker-compose.infra.yml -f docker-compose.yml up -d --build
   ```

2. **Standalone Cloud / AWS Deployment:**
   ```bash
   cp .env.production.example .env.production
   # Configure DB_HOST (RDS), REDIS_HOST (ElastiCache), S3_ENDPOINT, and MAIL_HOST (SES)
   docker compose --env-file .env.production up -d
   ```

3. **System Initialization (Baseline Roles & Admin):**
   ```bash
   make prod-init
   # Or directly:
   docker compose exec backend node dist/database/init-system.js
   ```

4. **Automated Data Seeding (Universal CLI Tool):**
   ```bash
   # Standard production seed (25 users, 5 projects, 120 issues)
   make prod-seed

   # Scale production data with custom counts
   make prod-seed ARGS="--users=500 --projects=8 --issues=1000"

   # Direct execution in container
   docker exec -it bugtracker-backend node dist/database/seed.js --users=500 --issues=1000

   # Non-destructive seed (append without clearing previous data)
   docker exec -it bugtracker-backend node dist/database/seed.js --users=50 --issues=100 --no-clean
   ```

5. **Stream Logs:**
   ```bash
   make prod-logs
   # Or directly:
   docker compose logs -f
   ```

6. **Interactive Consoles:**
   ```bash
   # PostgreSQL psql shell
   make db-shell

   # Redis redis-cli shell
   make redis-shell
   ```

7. **Stop Containers:**
   ```bash
   # Stop application containers:
   make prod-down

   # Stop all containers (including backing infrastructure):
   make down
   ```

---

## 5. Web Portals & Access Endpoints

### Development Endpoints (`make dev`)
| Service | Access URL | Role / Notes |
|---|---|---|
| **Frontend Web App** | `http://localhost:5173` | Vite dev server with instant HMR and `/api` proxy |
| **Backend REST API & Swagger** | `http://localhost:3000/api/docs` | Interactive OpenAPI documentation (`/api/v1`) |
| **Mailpit Web Inbox** | `http://localhost:8025` | Inspect activation links & reset tokens (SMTP port `1025`) |
| **SeaweedFS Master Console** | `http://localhost:9333` | Volume status & cluster diagnostics |
| **SeaweedFS S3 Storage Endpoint** | `http://localhost:8333` | S3-compatible attachment uploads |

### Production Preview Endpoints (`make prod` or Port 80)
| Service | Access URL | Role / Notes |
|---|---|---|
| **Nginx Ingress Proxy** | `http://localhost` (Port `80`) | Unified ingress: static SPA serving, `/api` proxy, WebSocket forwarding |
| **Backend API (Container Internal)** | Internal port `3000` | NestJS container API |
| **Customer Mail Server** | External SMTP (port 587/465) | Real email notifications via customer SMTP server |
