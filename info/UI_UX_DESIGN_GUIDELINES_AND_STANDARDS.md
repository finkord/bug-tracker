# BugTracker UI/UX Design Guidelines & Standards

## 1. Design Philosophy: "M3 Precision"

BugTracker combines Google's **Material Design 3 (M3) System Tokens** with the **compact, high-density ergonomics** of modern developer productivity tools (such as Linear, Jira Cloud, and GitHub).

The design philosophy is built on four core tenets:
1. **Predictable Tonal Elevation:** Use Material 3 surface containers (`surface-container-lowest` through `highest`) instead of harsh, heavy drop-shadows to establish depth and hierarchy.
2. **Contextual Information Density:** Generous, tactile geometry for authentication and profile screens; crisp, dense, space-efficient geometry for engineering workspaces (Kanban, Backlog, Tables).
3. **Headless Accessibility:** Every modal, dropdown, tooltip, and popover must be backed by accessible headless primitives (Radix UI) ensuring keyboard navigation, focus management, and ARIA compliance.
4. **Zero Arbitrary Colors:** All foregrounds, backgrounds, outlines, and semantic states must consume CSS custom properties defined in [`src/index.css`](file:///home/finkord/dev/PPofSE/software/frontend/src/index.css).

---

## 2. Token Architecture & Rules of Engagement

### Rule 1: No Hardcoded Hex Colors or Raw Tailwind Colors
- ❌ **Forbidden:** `bg-blue-600`, `text-gray-900`, `border-zinc-700`, `bg-[#1a1a1a]`.
- ✅ **Required:** `bg-[var(--md-sys-color-primary)]`, `text-[var(--md-sys-color-on-surface)]`, `border-[var(--md-sys-color-outline-variant)]`.

### Rule 2: Strict Semantic Color Taxonomy

| Token | Purpose | Usage Example |
| :--- | :--- | :--- |
| `--md-sys-color-surface` | Baseline page canvas / window ground | Main page backdrop, base card |
| `--md-sys-color-surface-container-low` | Recessed areas, secondary panels | Sidebar background, subtle headers |
| `--md-sys-color-surface-container` | Standard content card elevation | Kanban column background, ticket cards |
| `--md-sys-color-surface-container-high` | Elevated containers, dialog windows | Modal bodies, interactive tiles |
| `--md-sys-color-surface-container-highest` | Top-level overlays, hover highlights | Dropdown menus, tooltips, list item hover |
| `--md-sys-color-on-surface` | Primary high-contrast text | Card titles, body copy, active inputs |
| `--md-sys-color-on-surface-variant` | Secondary readable text | Subtitles, field labels, metadata timestamps |
| `--md-sys-color-outline` | High-emphasis borders | Input focus borders, active separators |
| `--md-sys-color-outline-variant` | Subtle structural dividers | Card borders, table dividers, panel seams |
| `--md-sys-color-primary` | Key brand actions, active toggles | Primary buttons, active tab indicators |
| `--md-sys-color-primary-container` | Low-stress primary badges & chips | Active sprint chip, key indicator badge |
| `--md-sys-color-error` / `-container` | Destructive alerts & actions | Delete buttons, validation error banners |
| `--md-sys-color-success` / `-container` | Verified states, resolved issues | Turnstile check, completed sprint pill |

---

## 3. Contextual Shape & Corner Radius Standards

Pure M3 mobile styles use 28px corners everywhere. For desktop web productivity, corner radiuses are categorized strictly by context:

| Context | Corner Radius | Tailwind Class | Application |
| :--- | :--- | :--- | :--- |
| **Auth & Onboarding** | `24px – 28px` | `rounded-[24px]` / `rounded-3xl` | Login / Register card, 2FA prompt |
| **Modal Dialogs** | `16px – 20px` | `rounded-2xl` | Issue Create Modal, Confirmation Prompts |
| **Dropdown Menus & Popovers** | `12px – 14px` | `rounded-xl` | Context menus, filter pickers, user menu |
| **Kanban Columns & Table Containers** | `12px – 14px` | `rounded-xl` | Column board containers, backlog panels |
| **Kanban Cards & Worklog Items** | `8px – 10px` | `rounded-lg` | Individual draggable tickets, timesheet rows |
| **Form Inputs & Search Bars** | `10px – 12px` | `rounded-xl` | Text inputs, select dropdowns, search bars |
| **Buttons & Action Triggers** | `8px – 10px` | `rounded-lg` (or `rounded-full` for chips) | Buttons, segmented controls |
| **Status, Priority & Role Badges** | `6px` or `pill` | `rounded-md` or `rounded-full` | `OPEN`, `BUG`, `CRITICAL`, `ADMIN` badges |

---

## 4. Typography & Information Hierarchy

- **Font Family:** `font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`.
- **Headings:**
  - Page Title (`H1`): `text-xl sm:text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]`
  - Section Header (`H2`): `text-base sm:text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]`
  - Card Title (`H3`): `text-sm font-semibold text-[var(--md-sys-color-on-surface)]`
  - Metadata / Form Label: `text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider`
- **Body & Data:**
  - Standard Body: `text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]`
  - Compact Meta / Timestamps: `text-xs text-[var(--md-sys-color-on-surface-variant)]`
  - Monospace Identifiers (Issue Keys, Hashes, IP): `font-mono text-xs font-semibold`

---

## 5. Atomic Component Kit Standards (`src/components/ui/`)

All new features and page refactorings must consume the shared atomic UI primitives:

```tsx
import { Button, Input, Modal, Dropdown, Tooltip, Badge, Card } from '@/components/ui';
```

### 1. `Button`
- **Variants:**
  - `filled`: Use for the primary affirmative action on a view (max 1 per card/modal).
  - `tonal`: Use for secondary actions (e.g. "Save as Draft", "Export CSV").
  - `outline`: Use for neutral, reversible actions (e.g. "Filter", "Manage").
  - `ghost`: Use inside toolbars, table action columns, and icon buttons.
  - `danger` / `danger-tonal`: Use for irreversible actions ("Delete Issue", "Revoke Token").
- **Sizes:**
  - `sm`: 32px height — Standard for data tables, kanban cards, and compact toolbars.
  - `md`: 40px height — Standard for modal forms and page action headers.
  - `lg`: 48px height — Auth forms and landing hero CTAs.
  - `icon-sm` / `icon-md`: Square icon triggers (combine with `<Tooltip>`).

### 2. `Input`
- Standardize all inputs with built-in `label`, `error`, `leftIcon`, and `rightIcon` props.
- Never show raw unformatted browser error tooltips; pass validation errors to `error="..."`.

### 3. `Modal` (Dialog)
- Backed by Radix UI.
- Never write `fixed inset-0 bg-black/50` by hand. Always use:
  ```tsx
  <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="..." size="md|lg|xl">
    {/* Body */}
  </Modal>
  ```
- Always ensure `Escape` closes the modal and focus returns to the triggering element.

### 4. `Dropdown` (DropdownMenu)
- Backed by Radix UI.
- Never write manual `document.addEventListener('mousedown')` click-outside listeners.
- Use composite primitives (`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`) or the quick `<Dropdown trigger={...} items={...} />` component.

### 5. `Tooltip`
- Wrap all icon-only buttons with `<Tooltip content="Description">` to ensure immediate clarity and accessibility.

### 6. `Badge`
- Always map issue status and priority through `<Badge variant="open|in-progress|resolved|closed|critical">` to guarantee unified colors and dot indicators across all boards and tables.

---

## 6. Micro-Interactions & Animation Standards

1. **Duration & Easing:**
   - Interactive elements: `duration-150` with standard easing `cubic-bezier(0.2, 0, 0, 1)`.
   - Modals and Overlays: `duration-200 animate-in fade-in zoom-in-95`.
2. **Active Feedback:**
   - Buttons and clickable cards should scale down slightly on click: `active:scale-[0.98]`.
3. **Focus States:**
   - Always retain keyboard outline: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]`.
   - Never suppress focus rings with `outline-none` without an alternative visible indicator.

---

## 7. Code Conventions & Quality Rules

1. **English-Only Comments:** In accordance with repository rules, all comments, docstrings, and error messages in code must be written in English.
2. **Utility Merging:** Always use `cn(...)` from [`src/utils/cn.ts`](file:///home/finkord/dev/PPofSE/software/frontend/src/utils/cn.ts) to merge custom page classes with component defaults.
3. **No Dead Code:** Delete obsolete event listeners, manual open states, and unused React imports when refactoring to Radix primitives.
