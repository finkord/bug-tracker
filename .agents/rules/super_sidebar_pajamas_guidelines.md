# GitLab Pajamas Super-Sidebar & Navigation Architecture Guidelines

You are an expert in modern enterprise navigation architecture, specializing in the **GitLab Pajamas Super-Sidebar** paradigm and Google Material Design 3 Expressive integration.

## 1. Core Principles of the Super-Sidebar
1. **Single Anchor of Context:**
   - The Super-Sidebar is the single primary navigation spine (full 100vh height on desktop).
   - All navigation items adapt dynamically based on the active **Project Context**.
2. **Predictable Geometry & Zero Horizontal Jitter:**
   - Expanded width: `256px` (`w-64`).
   - Collapsed width: `72px` (`w-[72px]`).
   - The icon slot must remain anchored at a fixed `72px` width at `x=0` across both states to eliminate layout shifts and visual jitter.
3. **M3 Expressive Integration:**
   - Use `var(--md-sys-color-surface-container-low)` for the sidebar background.
   - Active navigation states use M3 capsule pills (`bg-[var(--md-sys-color-secondary-container)]` with `text-[var(--md-sys-color-on-secondary-container)]`).
   - The right-hand main content area renders as an elevated floating canvas card (`rounded-2xl md:rounded-3xl` with margin).

---

## 2. Component Decomposition Standard
Never place the entire sidebar in a single monolithic file. The Super-Sidebar must strictly be decomposed into modular components (<120 lines each):

```
frontend/src/components/navigation/
├── SuperSidebar.tsx            # Root desktop/mobile container coordinator
├── SidebarBrandHeader.tsx      # Brand logo and workspace badge
├── SidebarContextSwitcher.tsx  # Project switcher, key avatar, and dropdown
├── SidebarNavList.tsx          # Navigation section list & route matcher
├── SidebarNavItem.tsx          # Individual nav item with M3 pill & flyout
├── SidebarBottomActions.tsx    # API/Docs link, shortcut badges & collapse toggle
└── SidebarMobileDrawer.tsx     # Mobile off-canvas slide-over drawer
```

---

## 3. Navigation Sections & Context Switching
1. **Context Switcher (Top):**
   - Displays current project avatar (initials / icon), project name, and project key.
   - Clicking opens a high-density dropdown to search, select recent projects, or manage all projects.
2. **Navigation Grouping (Middle):**
   - **Workspace Level:** Dashboard, Projects List, Global Filters & Search, Time Tracking.
   - **Project Level (Contextual):** Kanban Board, Backlog & Sprints, Project Settings.
   - **Admin / System Level:** Admin Center, Access & RBAC (guarded by administrative permissions).
3. **Utility Actions (Bottom):**
   - External Swagger OpenAPI link.
   - Collapse / Expand trigger with visual chevron indicator.

---

## 4. Interaction & Accessibility Standards
1. **Collapsed State Flyouts & Tooltips:**
   - When collapsed (`w-[72px]`), hover or focus on a navigation item must display an M3 flyout tooltip with the full label and shortcut keys.
2. **Keyboard Accessibility:**
   - Support `[` or `Ctrl/Cmd + B` to toggle sidebar collapse/expand.
   - `Escape` closes active dropdowns or mobile drawer.
   - Full keyboard `Tab` / arrow navigation with visible focus rings.
3. **State Persistence:**
   - Sidebar collapse state (`bt_sidebar_collapsed`) and user preferences must be persisted in local storage or via Zustand store slices.
4. **Mobile Slide-Over:**
   - Below `md` breakpoint, sidebar becomes an off-canvas drawer (`fixed inset-0 z-50`) with backdrop blur and touch dismiss.
