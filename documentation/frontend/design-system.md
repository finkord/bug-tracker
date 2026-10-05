# Material Design 3 Expressive Design System (`frontend/`)

BugTracker uses an expressive, accessible design system grounded in Google Material Design 3 (M3) and Google Pixel OS optical design principles.

---

## 1. Strict Design Token Policy

> [!IMPORTANT]
> **Zero Raw Tailwind Colors**:
> Never use raw Tailwind palette classes (such as `bg-blue-600`, `text-gray-500`, `bg-red-400`).
> Always use semantic CSS variables defined in [`frontend/src/index.css`](../../frontend/src/index.css): `var(--md-sys-color-*)`.

### Primary Design Tokens

| Token Variable | Semantic Purpose |
|---|---|
| `var(--md-sys-color-primary)` | High-emphasis interactive elements, primary action buttons |
| `var(--md-sys-color-on-primary)` | Content/text rendered on top of `primary` fill |
| `var(--md-sys-color-primary-container)` | Low-to-medium emphasis containers, active tabs |
| `var(--md-sys-color-on-primary-container)` | Content rendered on `primary-container` |
| `var(--md-sys-color-surface)` | Card and modal surfaces |
| `var(--md-sys-color-surface-container-low)` | Subtle background fill (e.g. behind super-sidebar) |
| `var(--md-sys-color-background)` | Application base canvas background |
| `var(--md-sys-color-outline)` | Component boundary borders |
| `var(--md-sys-color-outline-variant)` | Subtle dividers, inactive borders, card separations |
| `var(--md-sys-color-error)` | Destructive actions, validation errors, lockout alerts |

---

## 2. Tone Contrast Rules ($\Delta\text{Tone} \ge 60$)

In adherence to WCAG 2.1 AA / AAA standards and M3 tonal palettes:
* Text placed over a container must have a lightness difference of at least 60 tones ($\Delta\text{Tone} \ge 60$).
* Pairings:
  * `primary` (Tone 40 light / Tone 80 dark) pairs with `on-primary` (Tone 100 light / Tone 20 dark).
  * `primary-container` (Tone 90 light / Tone 30 dark) pairs with `on-primary-container` (Tone 10 light / Tone 90 dark).

---

## 3. Pixel OS Curved Shell Anatomy

```
┌─────────────────┬────────────────────────────────────────────────────────┐
│  SUPER-SIDEBAR  │ TOP WORKSPACE STRIP (Header, Project, Profile, Theme)  │
│  (Full Height   ├────────────────────────────────────────────────────────┤
│   y=0 to        │  FLOATING ELEVATED CANVAS CARD                         │
│   y=100vh)      │  (rounded-2xl / rounded-3xl, bg-background, shadow-xs) │
│                 │                                                        │
│                 │                                                        │
└─────────────────┴────────────────────────────────────────────────────────┘
```
* **Continuous Border Curves**: Rounded corners on the floating main canvas (`rounded-xl sm:rounded-2xl md:rounded-3xl`) soften the viewport and provide clear visual focus.
* **Micro-Interactions**: Hover transitions use subtle `duration-150` or `duration-200` ease curves for buttons, list rows, and Kanban cards.

---

## 4. Canonical Reusable UI Primitives

To eliminate fragmented duplicate styles and ensure unified Material 3 token consumption:

* **`FormModal`** ([`frontend/src/components/ui/FormModal.tsx`](../../frontend/src/components/ui/FormModal.tsx)):
  - Canonical form modal wrapping Radix Dialog with pinned M3 action footer, native form submit handling, loading spinner, error alert banner (`role="alert"`), and extensible extraFooter slot.
* **`UserPicker`** ([`frontend/src/components/ui/UserPicker.tsx`](../../frontend/src/components/ui/UserPicker.tsx)):
  - Canonical user selector supporting avatar rendering, search filtering, and single or multi-select modes.
* **`StatusBadge`** ([`frontend/src/components/ui/StatusBadge.tsx`](../../frontend/src/components/ui/StatusBadge.tsx)):
  - Uniform issue status indicators (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) with semantic M3 tonal containers.
* **`PriorityBadge`** ([`frontend/src/components/ui/PriorityBadge.tsx`](../../frontend/src/components/ui/PriorityBadge.tsx)):
  - Crisp priority representations (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with unified iconography and sizing variants (`sm`, `md`).
* **`EmptyState`** ([`frontend/src/components/ui/EmptyState.tsx`](../../frontend/src/components/ui/EmptyState.tsx)):
  - Zero-data presentation with icon container, headline, description, and primary action button.
* **`ConfirmDialog`** ([`frontend/src/components/ui/ConfirmDialog.tsx`](../../frontend/src/components/ui/ConfirmDialog.tsx)):
  - Accessible modal dialog for confirmations, destructive operations, and sprint rollovers.
* **`SearchInput`** ([`frontend/src/components/ui/SearchInput.tsx`](../../frontend/src/components/ui/SearchInput.tsx)):
  - Search input with clear button, debounce hooks, and keyboard shortcut hint badges.

---

## 5. Keyboard Velocity & Ergonomics

The interface is engineered for power users, matching modern issue tracker ergonomics:

* **Global `C` Shortcut**: Triggers quick ticket creation modal from anywhere in the app with auto-focus on the title input.
* **`Cmd+Enter` / `Ctrl+Enter`**: Submits creation and editing forms without reaching for the mouse.
* **`J` / `K` Navigation**: Moves selection focus sequentially up and down cards on the Kanban board and rows in the Backlog.
* **Multi-Select & Bulk Actions**:
  - `Shift+Click` and `X` toggle multi-issue selection in Backlog and Kanban.
  - Floating M3 Bulk Action Bar enables batch status transitions, reassignments, sprint moves, and deletions in a single atomic action.
