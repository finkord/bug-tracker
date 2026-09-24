# BugTracker System Expansion Plan & Architecture Changes

This document details the architectural specifications, database schema modifications, REST API contracts, and frontend component blueprints for the major system expansion of the **BugTracker** platform.

---

## 1. Database Schema Changes

### 1.1. Modifications to `users`
- Added column: `avatar_url` (`varchar(500)`, nullable)
- Extended enum `SystemRole`: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `QA_ENGINEER`, `USER`
  - Default on registration: `USER`
  - All users have the ability to create issues and view boards.

### 1.2. Modifications to `issues`
- Added column: `estimated_hours` (`float`, default 0.0)
- Added column: `logged_hours` (`float`, default 0.0)
- Added column: `sprint` (`varchar(100)`, nullable)
- Relation: `@OneToMany('Worklog', 'issue')`

### 1.3. New Entity: `worklogs`
```sql
CREATE TABLE worklogs (
    id SERIAL PRIMARY KEY,
    issue_id INT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    time_spent_hours FLOAT NOT NULL,
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.4. New Entity: `saved_filters`
```sql
CREATE TABLE saved_filters (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    criteria TEXT NOT NULL, -- JSON serialized query: search, status, priority, type, projectId
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. REST API Contracts

### 2.1. Users & Profiles
- `PATCH /api/v1/users/me/avatar`: Body `{ avatarUrl: string }`
- `GET /api/v1/users/me/filters`: Returns user's saved filters
- `POST /api/v1/users/me/filters`: Body `{ name: string, criteria: string }`
- `DELETE /api/v1/users/me/filters/:id`: Deletes saved filter
- `PATCH /api/v1/users/:id/role`: Body `{ role: SystemRole }` (Admins only)

### 2.2. Issues & Worklogs
- `PATCH /api/v1/issues/:id/assign-me`: Sets `assigneeId` to `req.user.id`
- `POST /api/v1/issues/:id/worklogs`: Body `{ timeSpentHours: number, dateLogged?: string, description?: string }`
- `GET /api/v1/issues/:id/worklogs`: Returns issue worklogs with user details
- `GET /api/v1/issues/worklogs/me`: Returns current user's worklogs
- `GET /api/v1/issues/worklogs/stats`: Returns aggregated time by project and user
- `PATCH /api/v1/issues/:id/sprint`: Body `{ sprint: string | null }`

---

## 3. Frontend Architecture

### 3.1. Navigation & Layout
- `Sidebar.tsx`: Collapsible navigation rail (64px) / drawer (240px)
- `HomePage.tsx`:
  - Guest: Hero banner + Register / Login primary CTA buttons + Swagger link
  - Authenticated: `UserDashboard` (Assigned to Me, Kanban jump, Saved filters, Time logged)
- `IssueDetailPage.tsx`: Standalone `/issues/:id` deep-linkable page
- `TimeTrackingPage.tsx`: Dedicated `/time-tracking` dashboard
- `BacklogPage.tsx`: Agile backlog & sprint management at `/projects/:projectId/backlog`
- `AdminDashboardPage.tsx`: 4 tabs with sidebar integration:
  1. Users (5 roles)
  2. Security & System
  3. Projects
  4. Team Analytics & Velocity
