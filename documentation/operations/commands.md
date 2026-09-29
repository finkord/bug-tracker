# Operational Commands & Developer Runbook

This runbook catalogs the standard CLI operations for managing infrastructure containers, development servers, seeding datasets, and production builds.

---

## 1. Local Infrastructure (Docker Compose)

The environment runs PostgreSQL 15, Redis 7, Mailpit, SeaweedFS, and Nginx Ingress Proxy in Docker.

```bash
# Start all infrastructure containers in the background (Postgres, Redis, Mailpit, SeaweedFS, Nginx)
docker compose up -d

# Check status of running containers
docker compose ps

# Tail infrastructure logs (or specifically Nginx)
docker compose logs -f
docker compose logs -f nginx

# Test Nginx configuration syntax
docker compose exec nginx nginx -t

# Reload Nginx configuration without downtime
docker compose exec nginx nginx -s reload

# Stop containers without losing data
docker compose down

# Destroy all containers and reset persistent database/S3 volumes
docker compose down -v
```

---

## 2. Active Development Workflow

### Dependency Installation
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Starting Development Servers
```bash
# Terminal 1: Start Backend in Watch Mode (port 3000)
cd backend && npm run start:dev

# Terminal 2: Start Frontend Vite Server (port 5173)
cd frontend && npm run dev
```

### Seeding Realistic Engineering Dataset
Populates 5 teams (`UI`, `CORE`, `MON`, `INFRA`, `NET`), 30 engineers, 46 issues, and 70 worklogs:
```bash
cd backend && npm run seed
```

---

## 3. Testing & Code Quality Verification

```bash
# Run backend Vitest unit & integration tests
cd backend && npm test

# Run targeted test for a specific module
cd backend && npx vitest run src/modules/auth/auth.service.spec.ts

# Fast lint check (OxLint)
cd backend && npx oxlint
cd ../frontend && npx oxlint

# Fast TypeScript compilation check (no emit)
cd backend && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit
```

---

## 4. Production Deployment (Containerized)

The production stack is 100% containerized with zero local Node.js requirement. It compiles the NestJS bundle into a hardened unprivileged `node:24-slim` container and bundles the React 19 SPA directly into `nginx:alpine` with immutable asset caching.

```bash
# 1. Build and launch the complete production stack
docker compose -f docker-compose.prod.yml up -d --build

# 2. Check running production containers
docker compose -f docker-compose.prod.yml ps

# 3. Seed realistic initial dataset inside the production backend container
docker compose -f docker-compose.prod.yml exec backend npm run seed:prod

# 4. Stream production logs
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx

# 5. Gracefully stop the production stack
docker compose -f docker-compose.prod.yml down
```

### Local Manual Production Build (Host-Only Alternative)
If you wish to test production artifacts directly on your host machine:
```bash
# Backend build & start
cd backend && npm run build
NODE_ENV=production PORT=3000 npm run start:prod

# Frontend build & preview
cd frontend && npm run build
npm run preview -- --port 5173
```

---

## 5. Web Portals & Local Access

| Service | Access URL | Credentials / Notes |
|---|---|---|
| **Nginx Ingress Proxy** | `http://localhost` (Port `80`) | Unified entry point routing `/api` to backend and `/*` to SPA |
| **Frontend Web App (Direct)**| `http://localhost:5173` | Main user and admin interface (Vite dev server) |
| **Backend REST API & Swagger** | `http://localhost:3000/api/docs` | Interactive OpenAPI documentation |
| **Mailpit Web Inbox** | `http://localhost:8025` | Inspect activation links & reset tokens |
| **SeaweedFS Master Console** | `http://localhost:9333` | Volume status & cluster diagnostics |
| **SeaweedFS S3 Storage Endpoint** | `http://localhost:8333` | S3-compatible attachment uploads |
