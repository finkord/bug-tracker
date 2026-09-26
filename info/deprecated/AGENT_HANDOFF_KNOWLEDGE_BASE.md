# BugTracker v2.0: Knowledge Transfer & Multi-Agent Handoff Guide

> **Target Audience:** Incoming AI Pair Programmer / Autonomous Agent / Human Engineering Lead  
> **Repository:** BugTracker Core Engine (`software/`) & University PPofSE Course Labs (`Lab1`–`Lab7`)  
> **Last Updated:** 2026-09-24  
> **Active Maintainer:** Volodymyr Fufalko (`devfinkord@gmail.com`)

---

## 1. Project Overview & System Purpose

The project is an enterprise-grade **Bug & Issue Tracking System (BugTracker v2.0)** with agile scrum management, real-time multi-user collaboration, automated security audit logging, distributed object storage, and advanced reporting.

It originated as a university project for the Principles & Practices of Software Engineering (PPofSE) and Software Security courses, and has evolved into an industrial-grade full-stack platform.

---

## 2. Infrastructure & Runtime Topology

### 2.1. Active Service Ports
| Service | Technology | Port / URL | Credentials / Notes |
|---|---|---|---|
| **Backend REST API** | NestJS 12 (TypeScript, ESM) | `http://localhost:3000/api/v1` | Swagger: `http://localhost:3000/api/docs` |
| **Real-Time WebSocket** | Socket.IO Gateway | `http://localhost:3000/events` | Namespace `/events` |
| **Frontend Web App** | React 19 + Vite (TypeScript) | `http://localhost:5173/` | Google Material Design 3 Expressive |
| **Database** | PostgreSQL 15 (Docker) | `localhost:5432` | DB: `bug_tracker`, User: `postgres`, Pass: `postgres` |
| **Distributed Object Storage** | SeaweedFS Cluster (Docker) | Master: `localhost:9333`<br>Volume: `localhost:8080` | S3-compatible, stores crash logs & screenshot evidence |
| **Cache & Pub/Sub** | Redis 7 (Docker) | `localhost:6379` | Token blacklisting & session caching |
| **Mail Server (Dev)** | Mailpit (Docker) | Web UI: `http://localhost:8025/`<br>SMTP: `localhost:1025` | Activation emails & 2FA codes |

### 2.2. Docker Containers
All four containers are managed via Docker Compose and must be running:
```bash
docker ps
# Expected: bugtracker-seaweedfs, bugtracker-redis, bugtracker-postgres, bugtracker-mailpit
```

---

## 3. Strict Development Rules & User Constraints

1. **English Comments Only:**  
   `Make comments in code only with english`. Never add Ukrainian or non-English comments in code files.
2. **IDE Feedback & Notification Instruments:**  
   The user explicitly requested that all major architectural proposals and delivery summaries MUST use IDE feedback instruments (`ArtifactMetadata: { RequestFeedback: true }` and `ask_question`).
3. **Design System Consistency:**  
   Strict adherence to **Google Material Design 3 Expressive**. Custom CSS tokens with fluid animations, glassmorphism, luminous badges, clean typography, and full dark/light theme support.
4. **Triage Standardization (Priority-Only):**  
   The user explicitly directed to **remove `Severity` completely from the UI**. All issue creation, editing, filtering, and triage MUST use **`Priority`** (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
5. **Coworker Discipline Titles vs. Security RBAC:**  
   Decouple coworker job titles (`jobTitle`) from security roles (`SystemRole`):
   - Professional titles: `Software Developer`, `DevOps Engineer`, `QA Engineer`, `Security Engineer`, `Product Manager`, `UI/UX Designer`.
   - Security roles: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `QA_ENGINEER`, `DEVOPS_ENGINEER`, `SECURITY_ENGINEER`, `USER`.
   - **Crucial Rule:** QA Engineers and DevOps Engineers are first-class contributors who can be assigned tickets, transition statuses, review code, and log work effort.

---

## 4. Key Credentials & Authenticated User Context

- **Administrator Account:** `devfinkord@gmail.com`
- **User ID:** `8`
- **Full Name:** Volodymyr
- **System Role:** `ADMIN`
- **Job Title:** `Software Engineer`
- **JWT Secret:** `super_secret_jwt_access_key_change_in_production_min_32_chars`
- **Token Duration:** `8 hours` (with background silent refresh and expiration modals)

To generate a direct valid JWT token via Node:
```bash
node -e "
const jwt = require('/home/finkord/dev/PPofSE/software/backend/node_modules/jsonwebtoken');
console.log(jwt.sign(
  { sub: 8, email: 'devfinkord@gmail.com', role: 'ADMIN', jobTitle: 'Software Engineer' },
  'super_secret_jwt_access_key_change_in_production_min_32_chars',
  { expiresIn: '8h' }
));
"
```

---

## 5. Architectural Modules & File Locations

### 5.1. Backend (`software/backend/`)
- `src/main.ts`: Application bootstrap, CORS, global validation pipes.
- `src/app.module.ts`: Root module importing TypeORM, Config, Mailer, Throttler, and business modules.
- `src/modules/events/events.gateway.ts`: Socket.IO gateway (`/events`) with room handlers (`join:project`, `join:issue`) and broadcasers (`issue:created`, `issue:updated`, `issue:deleted`, `worklog:created`, `comment:created`, `attachment:uploaded`).
- `src/modules/events/events.module.ts`: Global module exporting `EventsGateway`.
- `src/modules/issues/services/seaweedfs.service.ts`: Distributed object storage client handling `/dir/assign` and volume upload/download/deletion.
- `src/modules/issues/entities/attachment.entity.ts`: Attachment model (`id`, `issueId`, `filename`, `fileSize`, `mimeType`, `fid`, `url`, `uploaderId`).
- `src/modules/issues/issues.service.ts`: Full-text search, issue lifecycle, self-assignment, sprint management, worklog calculation, and event broadcasts.
- `src/modules/issues/issues.controller.ts`: Endpoints including multipart file attachment upload (`FileInterceptor`, 25MB limit).
- `src/modules/users/entities/user.entity.ts`: User model with `jobTitle` and `systemRole`.
- `src/modules/users/entities/saved-filter.entity.ts`: Saved search presets.

### 5.2. Frontend (`software/frontend/`)
- `src/api/client.ts`: Typed API client for all endpoints (issues, projects, attachments, worklogs, users, RBAC).
- `src/api/socket.ts`: Singleton `realtimeSocket` managing WebSocket connections and event subscriptions.
- `src/pages/KanbanBoardPage.tsx`: Interactive Kanban board with live WebSocket synchronization across browser tabs.
- `src/pages/IssueDetailPage.tsx`: Deep-linked issue details, SeaweedFS evidence upload zone (drag-and-drop, full-screen lightbox modal), worklog tracker, and live viewer presence indicators.
- `src/pages/BacklogPage.tsx`: Sprint planning, `+ Create Sprint` modal, sprint lifecycle (`Start Sprint`, `Complete Sprint` with task rollover), and Sprint Analytics.
- `src/components/kanban/SprintAnalyticsModal.tsx`: Interactive SVG Sprint Burndown Curve (Ideal vs. Actual Effort), team velocity chart, and stakeholder CSV export.
- `src/pages/AdvancedSearchPage.tsx`: Full-text keyword matching, multi-criteria filtering, saved filter chips, and CSV export.
- `src/pages/TimeTrackingPage.tsx`: Dual-view timesheet: Team capacity matrix + personal achievement streak.
- `src/pages/AdminDashboardPage.tsx`: Visual RBAC capability matrix and custom role creation.
- `src/components/common/Navbar.tsx`: Material 3 top app bar with custom user-editable announcement banner.
- `src/components/common/Sidebar.tsx`: Workspace switcher and section navigation.

---

## 6. Documentation & Lab Mapping

All comprehensive documentation is committed in `software/info/`:
- `software/info/PROJECT_EVOLUTION_BEYOND_LABS.md`:
  - **Section 11:** 8-Hour Session Lifecycle, Background Token Refresh & Graceful Expired Modal
  - **Section 12:** Material 3 Expressive Top App Bar & Sidebar Layout Architecture
  - **Section 13:** Dual-View Time Tracking: Team Matrix & Personal Achievements
  - **Section 13 (bis):** Decoupling Coworker Work Roles (`jobTitle`) from Security RBAC
  - **Section 14:** Priority-First Triage & Advanced Search Capabilities
  - **Section 15:** SeaweedFS S3-Compatible Storage for Evidence & Attachments
  - **Section 16:** WebSocket Real-Time Gateway & Live Collaboration
  - **Section 17:** Agile Analytics, Sprint Burndown & Velocity Tracking
- **University Lab Reports:**
  - `Lab2/`: Requirements analysis, use cases, domain model
  - `Lab3/`: UML class diagrams, sequence diagrams, design patterns
  - `Lab4/`: Microservices architecture, C4 diagrams, container strategies
  - `Lab5/`: Fault tolerance, rate limiting, security controls
  - `Lab6/`: Secure authentication, 2FA, OAuth2, audit logging
  - `Lab7/`: Automated testing, CI/CD, burndown & velocity analytics

---

## 7. How to Run, Test, and Verify

### 7.1. Run Backend Server
```bash
cd /home/finkord/dev/PPofSE/software/backend
npm run build
node dist/main.js
# Or start in background as a daemon
```

### 7.2. Run Backend Tests
```bash
cd /home/finkord/dev/PPofSE/software/backend
npm test
# Runs vitest: tests cover SeaweedFsService, EventsGateway, and AppController (7/7 passed)
```

### 7.3. Run Frontend Server
```bash
cd /home/finkord/dev/PPofSE/software/frontend
npm run dev
# Running on http://localhost:5173/
```

### 7.4. Compile & Lint Frontend
```bash
cd /home/finkord/dev/PPofSE/software/frontend
npm run build   # tsc -b && vite build (0 errors)
npm run lint    # oxlint (0 errors)
```

---

## 8. Current Status & Immediate Next Steps for Next Agent

1. **System Health:** Backend is active as daemon task `task-2124`. Frontend dev server is active on `5173`. PostgreSQL, SeaweedFS, Redis, and Mailpit containers are healthy.
2. **Completed Milestones:** All 5 phases (Time Tracking, Search, SeaweedFS Attachments, WebSocket Gateway, Sprint Burndown Analytics) are fully implemented and verified.
3. **Potential Next Steps (User-Driven):**
   - Enhance sprint retrospective summary with automated Mailpit email notifications sent to team members when a sprint is completed.
   - Implement PDF generation using a headless HTML-to-PDF pipeline for official stakeholder sign-offs.
   - Expand unit test coverage across project and user modules.
