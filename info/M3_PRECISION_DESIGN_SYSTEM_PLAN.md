# Material Design 3 Precision: UI/UX Architecture & Implementation Plan

## 1. Executive Summary & Problem Definition

The BugTracker project represents a full-featured Jira alternative developed with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **TypeScript**. 

While the initial visual foundation established Google Material Design 3 (M3) Expressive color tokens in [`src/index.css`](file:///home/finkord/dev/PPofSE/software/frontend/src/index.css), frontend feature development currently suffers from two major bottlenecks:

1. **Information Density Friction:**  
   Google M3 Expressive was engineered primarily for mobile handheld touchscreens (28px corner radiuses, large bubbly padding, floating pill buttons). In a desktop-first engineering tool (Kanban boards with 40+ tickets, backlogs, complex filter bars, time logs, and code diffs), pure mobile M3 layout wastes up to 35% of horizontal and vertical screen real estate.
2. **Duplicated Component Logic & Lack of Headless Primitives:**  
   Currently, every single page ([`KanbanBoardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/KanbanBoardPage.tsx), [`AdminDashboardPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/AdminDashboardPage.tsx), [`BacklogPage.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/pages/BacklogPage.tsx)) manually hand-crafts modals, overlays, buttons, inputs, and dropdowns with 15–20 lines of raw Tailwind classes. Furthermore:
   - Modals lack proper ARIA focus-trapping, `Escape` key handling, and backdrop scroll-locks.
   - Dropdown menus require custom `useRef` and `document.addEventListener('mousedown')` hooks that often leak or fail on rapid multi-click.
   - Tooltips are either missing or hand-coded with CSS hover hacks that fail keyboard navigation.

---

## 2. Architectural Blueprint: "M3 Precision"

**M3 Precision** bridges Google's scientific Material 3 color & tonal elevation system with the compact, accessible ergonomics required by modern developer SaaS tools (like Linear, Jira Cloud, and GitHub).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        M3 Precision Architecture                       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Foundations: Zero-Runtime M3 Color & Tonal Elevation Tokens         │
│    - Light & Dark CSS custom properties (--md-sys-color-*)             │
│    - Contextual border radiuses (24-28px for Auth, 8-12px for Data)    │
│                                                                        │
│ 2. Headless Accessible Primitives Layer (Radix UI)                     │
│    - @radix-ui/react-dialog       (Accessible Modal Dialogs)           │
│    - @radix-ui/react-dropdown-menu (Context Menus & Actions)            │
│    - @radix-ui/react-tooltip      (Actionable Hover Hints)             │
│    - @radix-ui/react-popover      (Filter Panels & Pickers)            │
│                                                                        │
│ 3. Atomic M3 Precision Component Kit (`src/components/ui/`)           │
│    - Button.tsx  - Input.tsx      - Modal.tsx                          │
│    - Badge.tsx   - Dropdown.tsx   - Tooltip.tsx                        │
│    - Card.tsx    - Select.tsx                                          │
│                                                                        │
│ 4. Application Pages & Views                                           │
│    - Kanban Board, Backlog, Issue Details, Admin, Auth                 │
└────────────────────────────────────────────────────────────────────────┘
```

### Contextual Geometry Strategy

| Surface Category | Examples | Border Radius | Visual Tone |
| :--- | :--- | :--- | :--- |
| **Auth & Marketing** | Login, Register, Forgot Password, Landing Hero | `24px – 28px` (M3 `shape-corner-extra-large`) | Welcoming, smooth, tactile pill buttons |
| **Data & Workspaces** | Kanban Columns & Cards, Backlog List Rows, Tables | `8px – 12px` (M3 `shape-corner-medium`) | Dense, compact, crisp grid alignment |
| **Modals & Overlays** | Issue Create Dialog, Delete Prompt, Profile Dropdown | `16px – 20px` (M3 `shape-corner-large`) | Clear elevation, high contrast border, backdrop blur |
| **Interactive Controls**| Buttons, Filter Chips, Status Badges | `6px – 8px` (or pill for status tags) | Crisp click targets, active scale micro-interactions |

---

## 3. Atomic Component Kit Specification (`src/components/ui/`)

### 1. `Button` (`src/components/ui/Button.tsx`)
- **Variants:**
  - `filled` (Primary action, solid `primary` with `on-primary` text)
  - `tonal` (Secondary action, `secondary-container` with `on-secondary-container`)
  - `outline` (Low-emphasis bordered button with surface hover tint)
  - `ghost` (Icon buttons, table row actions, seamless inline buttons)
  - `danger` (Destructive actions, `error-container` / `error` solid)
- **Sizes:** `sm` (compact 30px height for tables/kanban), `md` (standard 38px), `lg` (prominent 46px for auth submit).
- **Features:** Built-in `isLoading` state showing Lucide `Loader2`, icon prefix/suffix slots, full ref forwarding.

### 2. `Input` (`src/components/ui/Input.tsx`)
- **Styling:** Material 3 filled-tonal input with high contrast text in dark & light themes.
- **Features:** Optional `label`, `helperText`, `error` validation message, `leftIcon`, `rightIcon` (e.g. password visibility, search clear).

### 3. `Modal` / `Dialog` (`src/components/ui/Modal.tsx`)
- **Engine:** `@radix-ui/react-dialog`.
- **Features:**
  - Accessible dialog overlay with backdrop blur (`backdrop-blur-sm bg-black/45`).
  - Animated entry (`fade-in zoom-in-95 duration-200`).
  - Built-in accessible Title, Description, and Header/Footer slots.
  - Automatic focus trapping, `Escape` key dismissal, and scroll lock on `body`.

### 4. `Dropdown` (`src/components/ui/Dropdown.tsx`)
- **Engine:** `@radix-ui/react-dropdown-menu`.
- **Features:**
  - Replaces fragile custom click-outside refs.
  - Full keyboard navigation (Arrow Up/Down, Enter, Esc).
  - Supports item icons, shortcut badges, danger items, and section dividers.

### 5. `Tooltip` (`src/components/ui/Tooltip.tsx`)
- **Engine:** `@radix-ui/react-tooltip`.
- **Features:** Compact M3 surface-container tooltip with subtle outline and micro-delay, ideal for icon-only toolbar buttons.

### 6. `Badge` (`src/components/ui/Badge.tsx`)
- **Styling:** M3 tonal status pills for issue statuses (`OPEN`, `IN_PROGRESS`, `REVIEW`, `RESOLVED`, `CLOSED`), priorities (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and roles (`ADMIN`, `QA`, `DEVELOPER`).

### 7. Class Merging Utility (`src/utils/cn.ts`)
- Standard industry utility using `clsx` and `tailwind-merge` to safely combine default component classes with custom page overrides without specificity conflicts.

---

## 4. Multi-Phase Implementation Plan

### Phase 1: Core Primitives & Setup
- [ ] Install `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `clsx`, `tailwind-merge`.
- [ ] Implement [`src/utils/cn.ts`](file:///home/finkord/dev/PPofSE/software/frontend/src/utils/cn.ts).
- [ ] Add Radix animation keyframes to [`src/index.css`](file:///home/finkord/dev/PPofSE/software/frontend/src/index.css) if needed.

### Phase 2: Build Atomic Component Kit
- [ ] Implement `src/components/ui/Button.tsx`.
- [ ] Implement `src/components/ui/Input.tsx`.
- [ ] Implement `src/components/ui/Badge.tsx`.
- [ ] Implement `src/components/ui/Modal.tsx`.
- [ ] Implement `src/components/ui/Dropdown.tsx`.
- [ ] Implement `src/components/ui/Tooltip.tsx`.
- [ ] Export all from `src/components/ui/index.ts`.

### Phase 3: Pilot Integration & Page Migration
- [ ] **Navbar Profile Dropdown:** Replace 100+ lines of custom click-outside dropdown logic in [`Navbar.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/common/Navbar.tsx) with `<Dropdown>`.
- [ ] **Issue Creation & Details Modals:** Refactor [`IssueModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueModal.tsx) and [`IssueDetailsModal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/kanban/IssueDetailsModal.tsx) to use `<Modal>`, `<Input>`, `<Button>`, and `<Badge>`.
- [ ] **Kanban Board Quick Actions:** Standardize status badges and column controls.

### Phase 4: Validation & Quality Assurance
- [ ] Verify light and dark mode theme switching across all refactored components.
- [ ] Verify keyboard accessibility (`Tab`, `Escape`, arrow keys on dropdowns).
- [ ] Run `npm run build` and ensure 0 TypeScript or Vite bundle warnings.
- [ ] Test on desktop viewport (`1440px`) and mobile responsive viewport (`390px`).

---

## 5. Verification & Acceptance Criteria

1. **Zero Bundle Regressions:** Total frontend bundle size increase must remain under 15 kB gzip (Radix primitives are tree-shakeable and tiny).
2. **Keyboard Accessibility:** All dialogs trap focus and close on `Esc`; dropdowns open and navigate with arrow keys.
3. **Strict English Comments:** All code comments and documentation remain strictly in English.
4. **Theme Consistency:** All new components strictly consume `--md-sys-color-*` CSS variables without hardcoded hex codes.
