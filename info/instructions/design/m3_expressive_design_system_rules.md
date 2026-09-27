# Material 3 Expressive: Core Rules & Compliance Guidelines for Agents

## 1. Scope & Objective
This instruction defines mandatory rules for all AI coding agents working on the BugTracker frontend. Every feature, component, and page must strictly comply with **Google Material Design 3 (M3) Expressive** standards.

---

## 2. Inviolable Design System Rules

### Rule 1: Zero Hardcoded Colors
- **NEVER** use generic Tailwind color classes (e.g. `text-blue-600`, `bg-emerald-500/10`, `text-slate-500`, `bg-amber-500/20`, `bg-red-500`).
- **ALWAYS** consume CSS custom properties defined in [`src/index.css`](file:///home/finkord/dev/PPofSE/software/frontend/src/index.css) via `var(--md-sys-color-*)` or dedicated UI components.

```tsx
// ❌ FORBIDDEN:
<span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">Resolved</span>
<button className="bg-blue-600 hover:bg-blue-700 text-white">Submit</button>

// ✅ REQUIRED:
<Badge variant="resolved">Resolved</Badge>
<Button variant="filled">Submit</Button>
```

---

### Rule 2: Strict Tonal Container Hierarchy (No Random Borders)
M3 Expressive uses **5-tier tonal elevation** instead of harsh drop shadows or stroke borders:

| Surface Tier Token | Purpose & Application |
| :--- | :--- |
| `var(--md-sys-color-surface-container-lowest)` | Lowest recessed areas: Input fields, code editors, inner wells |
| `var(--md-sys-color-surface-container-low)` | Ambient shell framework & outer page canvas |
| `var(--md-sys-color-surface-container)` | Base container: Kanban columns, backlog cards, table rows |
| `var(--md-sys-color-surface-container-high)` | Elevated controls: Toolbar items, hover states, filter chips |
| `var(--md-sys-color-surface-container-highest)` | Highest elevation: Modals, popovers, active tab pills |

---

### Rule 3: Perceptual Contrast & Tone Delta ($\Delta \text{Tone} \ge 60$)
Always use paired color tokens to ensure WCAG 2.1 AAA contrast compliance in both Light and Dark themes:

| Solid Role Token | Paired Text/Icon Token | Correct Usage |
| :--- | :--- | :--- |
| `--md-sys-color-primary` | `--md-sys-color-on-primary` | Primary solid buttons & active indicators |
| `--md-sys-color-primary-container` | `--md-sys-color-on-primary-container` | Tonal buttons, selected items, highlights |
| `--md-sys-color-secondary-container`| `--md-sys-color-on-secondary-container`| Neutral badges, filter chips |
| `--md-sys-color-tertiary-container` | `--md-sys-color-on-tertiary-container` | Review badges, specialized milestones |
| `--md-sys-color-success-container`  | `--md-sys-color-on-success-container`  | Resolved status, positive KPIs |
| `--md-sys-color-warning-container`  | `--md-sys-color-on-warning-container`  | Blocked warnings, medium priority |
| `--md-sys-color-error-container`    | `--md-sys-color-on-error-container`    | Critical errors, destructive alerts |

---

### Rule 4: Mandatory Atomic UI Kit Usage
Always import primitives from [`src/components/ui`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/index.ts):
- `<Button variant="filled|tonal|outline|ghost|danger|danger-tonal">`
- `<Badge variant="open|in-progress|review|resolved|closed|low|medium|high|critical">`
- `<Input label="..." error="..." leftIcon="..." />`
- `<Modal isOpen={...} onClose={...} title="...">`
- `<DropdownMenu>` / `<DropdownMenuItem>`
- `<Tooltip content="...">`
- `<Card variant="filled|elevated|outlined">`

Do **NOT** hand-craft modal overlays with custom `fixed inset-0` or dropdowns with custom `mousedown` ref listeners.

---

### Rule 5: Contextual Geometry
- **Interactive Controls (Buttons, inputs, chips):** `rounded-xl` / `rounded-full` with tactile active micro-interactions (`active:scale-[0.98]`).
- **Data & Workspaces (Kanban cards, backlog rows, tables):** Crisp `rounded-2xl` / `rounded-3xl` with dense padding.
- **Main Canvas Card:** `rounded-2xl md:rounded-3xl` set inside the ambient shell.
