# Time Tracking & Effort Forensics Service (`software/backend/src/modules/issues` & `worklogs`)

This document details the architecture and operational mechanics of the **Time Tracking Subsystem** in BugTracker.

---

## 1. Domain Entities & Database Schema

### 1.1. `Worklog` Entity
- `id`: Unique integer identifier.
- `issueId`: Foreign key to `issues.id` with `ON DELETE CASCADE`.
- `userId`: Foreign key to `users.id` with `ON DELETE RESTRICT`.
- `timeSpentHours`: Floating point decimal representing hours spent (e.g. `1.5`, `2.25`).
- `dateLogged`: Date string (`YYYY-MM-DD`) when the effort was performed.
- `description`: Optional text summarizing technical tasks completed.
- `createdAt`: Timestamp when log was registered.

### 1.2. Issue Aggregations
When work is logged via `POST /api/v1/issues/:id/worklogs`:
1. The new `Worklog` record is inserted.
2. The target issue's `loggedHours` field is atomically incremented by `timeSpentHours`.
3. The visual progress percentage on cards and issue pages updates automatically:
   $$\text{Progress} = \min\left(100, \left\lfloor \frac{\text{loggedHours}}{\text{estimatedHours}} \times 100 \right\rfloor\right)$$

---

## 2. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/issues/:id/worklogs` | Log hours spent on an issue and update aggregate |
| `GET` | `/api/v1/issues/:id/worklogs` | Retrieve all worklogs for a given issue |
| `GET` | `/api/v1/issues/worklogs/me` | Retrieve current user's logged work history |
| `GET` | `/api/v1/issues/worklogs/stats` | Aggregated metrics: total hours, today, this week, by project, by user |

---

## 4. Team Timesheet Matrix & Dual-View Time Tracking Specification

### 4.1 REST API: `GET /api/v1/issues/worklogs/matrix`
* **Query Parameters:**
  * `startDate` (optional, `YYYY-MM-DD`): Start boundary for daily aggregation.
  * `endDate` (optional, `YYYY-MM-DD`): End boundary for daily aggregation.
* **Response Payload (`TeamTimesheetMatrix`):**
  ```json
  {
    "startDate": "2026-09-11",
    "endDate": "2026-09-24",
    "days": ["2026-09-11", "2026-09-12", "...", "2026-09-24"],
    "members": [
      {
        "userId": 8,
        "fullName": "Volodymyr",
        "email": "devfinkord@gmail.com",
        "systemRole": "ADMIN",
        "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=devfinkord",
        "dailyHours": {
          "2026-09-24": 6.6
        },
        "totalPeriodHours": 6.6
      }
    ],
    "dailyTotals": {
      "2026-09-24": 6.6
    },
    "grandTotal": 16.6
  }
  ```

### 4.2 Dual-View Architecture
1. **Team Capacity & Timesheet Matrix (`/time-tracking`):**
   * Multi-worker timesheet matrix table with daily breakdown.
   * Team monthly capacity calendar.
   * Preset filters: *Last 7 Days*, *Last 14 Days*, *This Month*, *Previous Month*.
2. **Personal Time & Achievements (`/profile?tab=time`):**
   * Dedicated personal view with active day streak, achievement badges, and individual monthly calendar with day inspector.
