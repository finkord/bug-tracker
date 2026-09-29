# Operational Commands & Developer Runbook

This runbook catalogs the standard CLI operations for managing infrastructure containers, development servers, seeding datasets, and production builds.

---

## 1. Local Infrastructure (Docker Compose)

The environment runs PostgreSQL 15, Redis 7, Mailpit, and SeaweedFS in Docker.

```bash
# Start all infrastructure containers in the background
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

## 4. Production Build & Serving

Ensure ports `3000` and `5173` are not blocked before launching:
```bash
# 1. Build and launch NestJS backend distribution
cd backend && npm run build
NODE_ENV=production PORT=3000 npm run start:prod

# 2. Build and preview React SPA production bundle
cd frontend && npm run build
npm run preview -- --port 5173
```

---

## 5. Web Portals & Local Access

| Service | Access URL | Credentials / Notes |
|---|---|---|
| **Frontend Web App** | `http://localhost:5173` | Main user and admin interface |
| **Backend REST API & Swagger** | `http://localhost:3000/api/docs` | Interactive OpenAPI documentation |
| **Mailpit Web Inbox** | `http://localhost:8025` | Inspect activation links & reset tokens |
| **SeaweedFS Master Console** | `http://localhost:9333` | Volume status & cluster diagnostics |
| **SeaweedFS S3 Storage Endpoint** | `http://localhost:8333` | S3-compatible attachment uploads |
