# BugTracker: Page-by-Page UI/UX Design Implementation Plan

This document outlines the systematic, page-by-page audit and upgrade plan for all 16 views in the BugTracker application to achieve full compliance with the [UI/UX Design Guidelines & Standards](file:///home/finkord/dev/PPofSE/software/info/UI_UX_DESIGN_GUIDELINES_AND_STANDARDS.md) ("M3 Precision").

---

## Master Status & Progress Dashboard

| Section | Page File | Route | Complexity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Auth & Onboarding** | [`LoginPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/LoginPage.tsx) | `/login` | Medium | ✅ Complete |
| | [`RegisterPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/RegisterPage.tsx) | `/register` | Medium | ✅ Complete |
| | [`ForgotPasswordPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ForgotPasswordPage.tsx) | `/forgot-password` | Low | ⏳ Planned |
| | [`ResetPasswordPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ResetPasswordPage.tsx) | `/reset-password` | Low | ⏳ Planned |
| | [`ActivatePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ActivatePage.tsx) | `/activate` | Low | ⏳ Planned |
| | [`OAuthCallbackPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/OAuthCallbackPage.tsx) | `/oauth/callback` | Low | ⏳ Planned |
| **Core Workspace** | [`ProjectsPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ProjectsPage.tsx) | `/projects` | Medium | ✅ Complete |
| | [`KanbanBoardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/KanbanBoardPage.tsx) | `/kanban`, `/projects/:id` | High | ✅ Complete |
| | [`BacklogPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/BacklogPage.tsx) | `/projects/:id/backlog` | High | ✅ Complete |
| | [`IssueDetailPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/IssueDetailPage.tsx) | `/issues/:id` | High | ✅ Complete |
| | [`AdvancedSearchPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdvancedSearchPage.tsx) | `/search` | High | ✅ Complete |
| **User & Analytics** | [`ProfilePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ProfilePage.tsx) | `/profile` | High | ✅ Complete |
| | [`TimeTrackingPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/TimeTrackingPage.tsx) | `/time-tracking` | High | ✅ Complete |
| **Administration** | [`AdminDashboardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminDashboardPage.tsx) | `/admin` | Very High | ⏳ Next Up (Sprint 4) |
| | [`AdminSecurityAuditPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminSecurityAuditPage.tsx) | `/admin/audit` | Medium | ⏳ Planned |
| **Public Landing** | [`HomePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/HomePage.tsx) | `/` | Medium | ⏳ Planned |

---

## 1. Authentication & Onboarding Views

### 1.1 [`LoginPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/LoginPage.tsx) (`/login`)
- **Status:** **Completed in Phase 1 & 2.**
- **Implemented Features:**
  - Material 3 Expressive tactile card with ambient dark-mode backdrop glow.
  - Show/Hide password toggle with accessible button states.
  - Caps Lock warning badge via `getModifierState('CapsLock')`.
  - Cloudflare Turnstile integration with full-width alignment and zero theme reload glitches.
  - 2FA challenge stage with autofocus 6-digit TOTP input.
  - Standard autocomplete tags (`email`, `current-password`, `one-time-code`).

### 1.2 [`RegisterPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/RegisterPage.tsx) (`/register`)
- **Status:** **Completed in Phase 1 & 2.**
- **Implemented Features:**
  - Password strength meter upgraded to responsive, wrap-friendly pill tags.
  - Turnstile widget matching exact input container width.
  - Single/Multi-criteria live validation feedback.
  - Google and GitHub OAuth federated entry points.

### 1.3 [`ForgotPasswordPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ForgotPasswordPage.tsx) (`/forgot-password`)
- **Current Issues:** Basic raw input container; lacks consistent M3 card elevation; lacks clear instructions on rate limits and token expiry.
- **Target Design:**
  - Wrap in standard M3 Expressive card (`rounded-3xl bg-[var(--md-sys-color-surface-container)]`).
  - Replace raw input with `<Input label="Email Address" leftIcon={<Mail />} />`.
  - Replace raw submit button with `<Button variant="filled" size="lg" isLoading={loading}>Send Reset Instructions</Button>`.
  - Add success state card with an illustration, countdown timer, and "Resend email" link.
- **Tasks:**
  - [ ] Refactor form to use `<Input>` and `<Button>`.
  - [ ] Add Mailpit deep link in local development banner ("Testing locally? View email in Mailpit").

### 1.4 [`ResetPasswordPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ResetPasswordPage.tsx) (`/reset-password`)
- **Current Issues:** No live password strength validator; lacks Caps Lock detection; raw button styles.
- **Target Design:**
  - Incorporate [`PasswordStrengthMeter`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/auth/PasswordStrengthMeter.tsx) for instant feedback.
  - Add password visibility toggle (`Eye`/`EyeOff`).
  - Standardize error display using M3 error container banners.
- **Tasks:**
  - [ ] Add password visibility toggle state.
  - [ ] Add password confirmation match indicator.
  - [ ] Connect with `<Button>` and `<Input>` primitives.

### 1.5 [`ActivatePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ActivatePage.tsx) (`/activate`)
- **Current Issues:** Plain centered text; lacks celebratory micro-animations when activation succeeds.
- **Target Design:**
  - Elevated status card with `CheckCircle2` success icon and `canvas-confetti` trigger on success.
  - Clear countdown with automatic redirect to `/login` after 3 seconds.
  - Primary button to "Proceed to Sign In immediately".
- **Tasks:**
  - [ ] Upgrade success/failure card to M3 tonal layout.
  - [ ] Add redirect countdown and confetti celebration.

### 1.6 [`OAuthCallbackPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/OAuthCallbackPage.tsx) (`/oauth/callback`)
- **Current Issues:** Plain white/dark blank screen with raw text spinner.
- **Target Design:**
  - Centered tactile badge with pulsing brand shield icon and animated progress bar indicating authentication finalization.
- **Tasks:**
  - [ ] Replace raw spinner with M3 branded loader.

---

## 2. Core Workspace & Issue Management Views

### 2.1 [`ProjectsPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ProjectsPage.tsx) (`/projects`)
- **Current Issues:** Hand-crafted modal using `fixed inset-0` with no keyboard `Esc` or focus trap; project cards have inconsistent padding; lacks quick stats (open issue count, active sprint).
- **Target Design:**
  - **Project Catalog Grid:** Clean responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`).
  - **Project Card (`<Card variant="filled" rounded="xl">`):**
    - Project key badge (`font-mono bg-[var(--md-sys-color-primary-container)]`).
    - Project name, description with 2-line line-clamp.
    - Quick links to Kanban (`/projects/:id`), Backlog (`/projects/:id/backlog`), and Settings.
  - **Create Project Modal:** Replace hand-crafted overlay with `<Modal isOpen={isModalOpen} onClose={...} title="Create New Project">` and `<Input>`.
- **Tasks:**
  - [ ] Migrate `isModalOpen` modal to `<Modal>`.
  - [ ] Convert project creation inputs to `<Input>`.
  - [ ] Standardize project action buttons to `<Button variant="tonal" size="sm">`.

### 2.2 [`KanbanBoardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/KanbanBoardPage.tsx) (`/kanban`, `/projects/:id`)
- **Current Issues:** HTML5 drag-and-drop lacks smooth physics; filter bar takes too much vertical height; tickets need higher data density.
- **Target Design:**
  - **High-Density Kanban Cards:** 8px–10px corner radiuses, compact priority icons, assignee avatar with tooltip, issue key pill.
  - **Filter Bar:** Sticky compact toolbar with quick search `<Input>`, type filter chips, and assignee filter capsules.
  - **Column Headers:** Status badge with live issue counter pill, quick "+ Add issue" button.
  - **Issue Dialogs:** Already migrated [`IssueModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueModal.tsx) to `<Modal>`. Apply the same to `IssueDetailsModal.tsx`.
- **Tasks:**
  - [ ] Compact the header toolbar and project switcher.
  - [ ] Add `<Tooltip>` to column action buttons.
  - [ ] Integrate `<Badge>` components inside `IssueCard.tsx`.

### 2.3 [`BacklogPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/BacklogPage.tsx) (`/projects/:id/backlog`)
- **Current Issues:** Sprint creation uses hand-crafted modal; backlog issue rows have wide spacing causing excessive vertical scrolling; sprint action buttons lack keyboard tooltips.
- **Target Design:**
  - **Sprint Containers:** Collapsible M3 container cards with sprint goal badge, date range, estimate totals, and "Start Sprint" button.
  - **Compact Issue List Rows:** Dense 38px height rows with drag handle, key badge, summary text, assignee pill, estimate badge, and context menu `<Dropdown>`.
  - **Create Sprint Dialog:** Refactor to `<Modal>` with standard date pickers.
- **Tasks:**
  - [ ] Replace `createSprintModalOpen` with `<Modal>`.
  - [ ] Replace issue row dropdowns with accessible `<Dropdown>`.
  - [ ] Add sprint analytics toggle with `<Button variant="tonal">`.

### 2.4 [`IssueDetailPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/IssueDetailPage.tsx) (`/issues/:id`)
- **Current Issues:** Monolithic layout without clear visual hierarchy between issue description, evidence/attachments, and discussion timeline.
- **Target Design:**
  - **2-Column SaaS Layout (Linear/Jira style):**
    - Left Column (70%): Title, description, attachments carousel/grid, discussion comments timeline, log work history.
    - Right Sticky Sidebar (30%): Status dropdown, Priority selector, Assignee picker, Reporter, Sprint, Estimated vs Spent Hours, Time Tracking progress bar.
  - **Evidence/Attachments:** Lightbox preview with zoom and download triggers.
- **Tasks:**
  - [ ] Restructure into responsive 70/30 split pane.
  - [ ] Convert status and priority selectors to M3 `<Dropdown>`.
  - [ ] Standardize comment input with `<Input>` and `<Button variant="filled">`.

### 2.5 [`AdvancedSearchPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdvancedSearchPage.tsx) (`/search`)
- **Current Issues:** Multi-criteria filter options take over the page; results table lacks sorting headers and compact density.
- **Target Design:**
  - **Filter Bar Capsule:** Compact horizontal filter row with search query, project dropdown, status multi-select, and assignee picker.
  - **Results Table:** High-density M3 table with sticky headers, zebra hover stripes, and clickable rows navigating directly to issues.
- **Tasks:**
  - [ ] Wrap filters in compact `<Card variant="outlined" padding="sm">`.
  - [ ] Use `<Badge>` for all status and priority table cells.

---

## 3. User & Analytics Views

### 3.1 [`ProfilePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ProfilePage.tsx) (`/profile`)
- **Current Issues:** Long scrolling page; 2FA setup QR modal has inconsistent styling; session revocation lacks confirmation dialog.
- **Target Design:**
  - **Segmented Tabs:** "Account Details", "Security & 2FA", "Active Sessions", "Personal Achievements".
  - **2FA Enrollment Flow:** Step-by-step modal with QR code, copyable secret key, 6-digit verification input, and emergency backup codes banner.
  - **Session Management:** High-contrast list of active JWT tokens with device icon, IP address, and "Revoke Session" `<Button variant="danger-tonal">`.
- **Tasks:**
  - [ ] Convert 2FA enrollment modal to `<Modal>`.
  - [ ] Standardize password change form with `<Input>` and `<Button>`.
  - [ ] Add confirmation modal for "Revoke All Other Sessions".

### 3.2 [`TimeTrackingPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/TimeTrackingPage.tsx) (`/time-tracking`)
- **Current Issues:** Custom date selector lacks month/week quick toggles; manual log work button triggers unstyled modal.
- **Target Design:**
  - **Calendar Header:** Month navigator with `<Button variant="outline" size="sm">`, "Today" quick jump, and total logged hours badge.
  - **Timesheet Matrix:** Clean day-by-day table showing issues logged, description snippets, and duration pills.
  - **Log Work Modal:** Powered by `<Modal>` with issue search selector and duration input.
- **Tasks:**
  - [ ] Standardize Log Work dialog to `<Modal>`.
  - [ ] Convert calendar navigation to M3 segmented controls.

---

## 4. Administration & Governance Views

### 4.1 [`AdminDashboardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminDashboardPage.tsx) (`/admin`)
- **Current Issues:** 1,100+ lines; monolithic state; user management table has ad-hoc pagination controls and manual role select dropdowns.
- **Target Design:**
  - **Admin Navigation Rail/Tabs:** Distinct tabs for Users, RBAC Matrix, System Health, and Analytics.
  - **User Management Table:** Accessible data table with search `<Input>`, role filter `<Dropdown>`, and row actions menu.
  - **System Metrics Tiles:** M3 squircle tiles displaying CPU/Memory, PostgreSQL pool health, Redis cache latency, and Docker containers.
- **Tasks:**
  - [ ] Modularize tabs into clean child components.
  - [ ] Replace custom role select with accessible `<Dropdown>`.
  - [ ] Standardize user create/edit dialog to `<Modal>`.

### 4.2 [`AdminSecurityAuditPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminSecurityAuditPage.tsx) (`/admin/audit`)
- **Current Issues:** Raw log rows with plain text status strings; lack of IP address geolocating badges.
- **Target Design:**
  - **Audit Stream:** High-density log table with color-coded badges (`SUCCESS` in green, `FAILED` in red, `2FA_CHALLENGE` in amber).
  - **Filter Controls:** Date range picker and event type filter pills.
- **Tasks:**
  - [ ] Standardize table badges with `<Badge variant="success|error|warning">`.
  - [ ] Add JSON payload inspection drawer/modal.

---

## 5. Public Landing Page

### 5.1 [`HomePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/HomePage.tsx) (`/`)
- **Current Issues:** Hero section lacks dynamic CTA states; feature grid does not showcase the live M3 theme accurately.
- **Target Design:**
  - **Hero Section:** Large M3 Expressive typography, luminous glowing background pill, "Open Live Workspace" `<Button size="lg" variant="filled">`.
  - **Interactive Preview:** Mini interactive Kanban preview card demonstrating fluid drag states and Dark/Light mode reactivity.
- **Tasks:**
  - [ ] Modernize hero buttons to `<Button size="lg">`.
  - [ ] Refine feature cards using `<Card variant="elevated" rounded="2xl">`.

---

## 6. Execution Phases & Milestones

1. **Sprint 1 (Immediate Next Steps):** Core Workspace Views
   - Migrate [`ProjectsPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ProjectsPage.tsx) to `<Modal>`, `<Card>`, and `<Button>`.
   - Complete modal migrations in [`IssueDetailsModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueDetailsModal.tsx).
   - Refactor sprint creation modal in [`BacklogPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/BacklogPage.tsx).
2. **Sprint 2 (Completed):** Detail & Search Views
   - Refactor [`IssueDetailPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/IssueDetailPage.tsx) into the 70/30 split pane.
   - Upgrade [`AdvancedSearchPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdvancedSearchPage.tsx) table and filter pills.
3. **Sprint 3 (Completed):** User Space & Timesheets
   - Upgrade [`ProfilePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/ProfilePage.tsx) (2FA flow, session revocation dialog).
   - Upgrade [`TimeTrackingPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/TimeTrackingPage.tsx) (Calendar controls, Log Work dialog).
4. **Sprint 4 (Next Up):** Administration & Landing
   - Modularize [`AdminDashboardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminDashboardPage.tsx).
   - Polish [`HomePage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/HomePage.tsx).
