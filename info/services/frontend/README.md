# Frontend Web Application (`software/frontend`) Technical Documentation

This document provides a comprehensive technical guide and architectural reference for the **BugTracker Frontend Single Page Application (SPA)** located in `software/frontend`.

The frontend is built using **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and **React Router v7**. The visual design strictly adheres to **Material Design 3 (M3) Expressive** guidelines inspired by the clean, fluid aesthetic of Google Pixel OS.

---

## 1. Architectural Overview

The frontend operates as an independent client application that connects to the NestJS backend via a development proxy configuration:

```
[ Web Browser ]
      │
      ├── ThemeContext (Dark / Light Theme Tokens in CSS Variables)
      ├── AuthContext (Session Tokens, Profile State, 5-Role Extended RBAC)
      ├── React Router v7 (Public, Protected, Admin Routes)
      │
      ├── Collapsible Navigation Sidebar (Rail 64px / Expanded 240px)
      │     ├── Personal Dashboard (Assigned tickets, Saved Filters, Time stats)
      │     ├── Projects Directory & Lead Controls
      │     ├── Kanban Board (5 FSM Columns, Drag-and-Drop, Live Filters)
      │     ├── Agile Backlog & Sprints (Sprint 1 Active, Grooming)
      │     ├── Time Tracking Dashboard (Logged effort, Project breakdown)
      │     └── Admin Center (Users, Security & Health, Projects, Analytics)
      │
      ▼
[ Client API Layer ] (software/frontend/src/api/client.ts)
      │
      ▼ Vite Proxy (/api/v1 -> http://localhost:3000)
[ NestJS Backend API ] (software/backend)
```

---

## 2. Component & Screen Architecture

### 2.1. Navigation & Layout
- `Sidebar.tsx`: Collapsible navigation rail supporting expanded (240px) and collapsed (64px) modes, workspace switcher, and active route pills.
- `Navbar.tsx`: Sticky top header with brand identity, project links, theme toggle, and user avatar.
- `Avatar.tsx`: Reusable avatar supporting image URLs, Dicebear presets, and deterministic gradient initials.

### 2.2. Core Domain Pages
- `HomePage.tsx`:
  - **Guest View (`!user`):** High-converting landing page centered on Register (`/register`) and Sign In (`/login`) CTAs.
  - **Authenticated View (`user`):** Personal Dashboard displaying "Assigned to Me" tickets, project Kanban jump cards, and user's Saved Filters.
- `KanbanBoardPage.tsx`: Main workflow board with 5 status columns (`OPEN`, `IN_PROGRESS`, `REVIEW`, `RESOLVED`, `CLOSED`), Drag-and-Drop, quick status advance, self-assignment, and filter saving.
- `BacklogPage.tsx`: Agile backlog and sprint management (`/projects/:id/backlog` and `/backlog`), moving issues between active sprints and product backlog.
- `IssueDetailPage.tsx`: Standalone deep-linkable issue page (`/issues/:id`) with breadcrumbs, full editor, self-assignment, time tracking progress, and comments thread.
- `TimeTrackingPage.tsx`: Dedicated effort forensics dashboard (`/time-tracking`) with hours metrics, project breakdowns, team velocity, and worklogs table.
- `ProjectsPage.tsx`: Workspace directory with issue metrics, project lead attribution, and project creation modal.
- `AdminDashboardPage.tsx`: Unified administrative center with 4 tabs: User Management (5 roles, 2FA reset, activation, block toggle), System & Security (health & audit logs), Projects Control, and Team Analytics.

### 2.3. Modal Dialogs
- `IssueModal.tsx`: Accessible dialog for creating and editing issues with self-assignment, estimate, and sprint fields.
- `IssueDetailsModal.tsx`: Quick issue inspection drawer on the Kanban board with full comments thread and "Open Full Page" link.
- `LogWorkModal.tsx`: Dedicated time logging dialog for recording hours and work descriptions.
