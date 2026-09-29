# Database Seeding & Engineering Dataset (`SeedService`)

The database seeder populates BugTracker with a realistic, multi-team engineering organization and authentic issue lifecycle data (*dogfooding*).

---

## 1. Multi-Team Organizational Structure

| Team / Project Key | Name | Lead Engineer | Default Login |
|---|---|---|---|
| **`UI`** | Frontend & Design System | Volodymyr Fufalko (Admin) | `volodymyr@bugtracker.local` |
| **`CORE`** | Core Platform & Auth API | Alex Mercer | `alex.mercer@bugtracker.local` |
| **`MON`** | SRE & Monitoring Operations | Sarah Chen | `sarah.chen@bugtracker.local` |
| **`INFRA`** | Cloud Infrastructure & S3 | David Miller | `david.miller@bugtracker.local` |
| **`NET`** | Network & Security Operations | Elena Rostova | `elena.rostova@bugtracker.local` |

* **Default Password for all seeded users**: `Password123!`

---

## 2. Dataset Metrics
When executed with `{ clean: true }`, the seeder resets tables and generates:
* **5 Engineering Teams / Projects** with custom project keys and descriptions.
* **30 Realistic Engineers & Leads** with verified email accounts and active status.
* **46 Authentic Issues** across states (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
* **18 Cross-Team Issue Links** (`BLOCKS`, `RELATES_TO`) showing team dependencies.
* **70 Worklog Entries** simulating real effort logs and timesheets.
* **Threaded Comments** demonstrating team collaboration and onboarding access reviews.

---

## 3. Running the Seeder

From the `backend/` directory:
```bash
npm run seed
```

Or from the repository root:
```bash
cd backend && npm run seed
```

---

## 4. Key Source Files
* CLI Entry Point: [`backend/src/database/seed.ts`](../../backend/src/database/seed.ts)
* Seeder Business Logic: [`backend/src/modules/admin/seed.service.ts`](../../backend/src/modules/admin/seed.service.ts)
