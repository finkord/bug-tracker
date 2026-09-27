# 📋 План заміни застарілих/сирих елементів на уніфіковані UI-компоненти (UI Components Replacement Plan)

> **Мета:** Замінити всі сирі `<select>`, кастомні вкладки та нетипізовані поля на уніфіковані компоненти з `@/components/ui/` (`SelectField`, `Select`, `Tabs`, `Button`, `Badge`, `Input`, `Modal`, `DropdownMenu`).

---

## 1. Карта виявлених сирих елементів та цільових замін

### А. Заміна сирих `<select>` на `<SelectField>` / `<Select>`:
1. **[`IssueModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueModal.tsx)**:
   - Type select (`BUG`, `FEATURE`, `TASK`, `IMPROVEMENT`)
   - Priority select (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
   - Status select (`OPEN`, `IN_PROGRESS`, `REVIEW`, `RESOLVED`, `CLOSED`)
   - Assignee select (список користувачів проекту)
2. **[`LogWorkModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/LogWorkModal.tsx)**:
   - Work category / activity select
3. **[`IssueDetailsModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueDetailsModal.tsx)**:
   - Issue status select / Assignee quick change
4. **[`IssueLinksSection.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueLinksSection.tsx)**:
   - Link type select (`blocks`, `is blocked by`, `relates to`, `duplicates`)
5. **[`AdminDashboardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminDashboardPage.tsx)**:
   - User role filter / assignment selects
6. **[`AdminSecurityAuditPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminSecurityAuditPage.tsx)**:
   - Audit action type filter select
7. **[`BacklogPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/BacklogPage.tsx)**:
   - Target sprint dropdown / select

### Б. Заміна кастомних кнопок вкладок на `<Tabs>`, `<TabsList>`, `<TabsTrigger>`:
1. **[`SprintAnalyticsModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/SprintAnalyticsModal.tsx)**:
   - Вкладки: `Burndown`, `Velocity`, `Report`
2. **[`TimeTrackingPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/TimeTrackingPage.tsx)**:
   - Вкладки: `Matrix View`, `Calendar View`, `Personal Log`
3. **[`ProfilePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ProfilePage.tsx)**:
   - Вкладки: `Account Overview`, `Time Tracking History`
4. **[`AdminDashboardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminDashboardPage.tsx)**:
   - Вкладки: `Users`, `Roles & RBAC`, `System Health`, `Projects`, `Analytics`

---

## 2. Етапи виконання (Implementation Steps)

1. **Крок 1 (Виконано):** Оновлено модальні вікна створення та редагування тікетів:
   - [`IssueModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueModal.tsx) — замінено на `SelectField` (Project, Assignee, Type, Priority) та `Input`.
   - [`LogWorkModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/LogWorkModal.tsx) — замінено вибір тікету на `SelectField`.
   - [`IssueLinksSection.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueLinksSection.tsx) — замінено вибір типу зв'язку на `SelectField`.
2. **Крок 2 (Виконано):** Оновлено вкладки навігації на уніфіковані `Tabs`, `TabsList`, `TabsTrigger`:
   - [`SprintAnalyticsModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/SprintAnalyticsModal.tsx) — Burndown, Velocity, Report.
   - [`TimeTrackingPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/TimeTrackingPage.tsx) — Team Timesheet Matrix, Monthly Calendar, My Recent Worklogs.
   - [`ProfilePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ProfilePage.tsx) — Security & Account, Personal Time & Achievements.
   - [`AdminDashboardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminDashboardPage.tsx) — User Management, RBAC, System Health, Projects, Analytics, а також `SelectField` для фільтрації ролей.
3. **Крок 3 (Виконано):** Валідація збірки `npm run build` пройшла успішно (0 помилок).

---

## 3. Критерії приймання (Acceptance Criteria)
- [x] Жодних сирих невпорядкованих `<select>` у ключових формах створення/редагування та фільтрації.
- [x] Всі вкладки використовують уніфіковані `Tabs`, `TabsList`, `TabsTrigger`.
- [x] `npm run build` проходить з 0 помилок.
