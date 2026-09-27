# Material 3 Expressive & Precision Design Rules

All frontend UI code and engineering workflows in BugTracker MUST adhere strictly to Google Material Design 3 Expressive standards and repository invariants:

1. **Zero Hardcoded Colors:**
   - Never use arbitrary Tailwind color utilities (e.g., `text-blue-600`, `bg-emerald-500/10`, `text-slate-500`, `bg-amber-500/15`, `bg-red-500`).
   - Always consume CSS custom properties defined in `src/index.css` via `var(--md-sys-color-*)` or dedicated UI components.

2. **Perceptual Contrast & Tone Deltas:**
   - Always use paired tokens (`on-primary` with `primary`, `on-primary-container` with `primary-container`, `on-success-container` with `success-container`, etc.) to guarantee WCAG 2.1 AAA contrast.

3. **5-Tier Tonal Surface Elevation:**
   - Use tonal surface nesting (`surface-container-lowest` to `surface-container-highest`) to denote depth instead of heavy drop shadows or stroke borders.

4. **Atomic UI Component Kit:**
   - Always import primitives from `src/components/ui/` (`<Button>`, `<Badge>`, `<Input>`, `<SelectField>`, `<Select>`, `<Tabs>`, `<Modal>`, `<DropdownMenu>`, `<Card>`, `<Tooltip>`).
   - Never hand-craft custom modal overlays or dropdown outside-click listeners.

5. **Panel Shell & Curved Layout:**
   - Maintain the outer framework shell (`h-screen overflow-hidden`) with a full-height Super-Sidebar and an elevated inset canvas card (`rounded-2xl md:rounded-3xl` with margin).

6. **Mandatory Pre-Planning Workflow:**
   - Prior to implementing any module, page, or major feature, create or update a structured plan in `info/planning/*.md` outlining requirements, component breakdown, and acceptance criteria.

7. **Architecture & Service Documentation:**
   - Completed services and major subsystems must be documented in `info/core/<service>/*.md` or `info/frontend/*.md` with architectural overviews and Mermaid sequence/class diagrams.

8. **Mobile View Ergonomics & Header Balance:**
   - Mobile header action buttons must maintain consolidated `36×36px` (`w-9 h-9`) square bounds with synchronized `16×16px` (`w-4 h-4`) icon scales.
   - Maintain symmetric vertical alignment with `mt-0` on the main canvas card and zero asymmetric top padding in the mobile slide-over drawer header.
