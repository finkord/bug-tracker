# Frontend Architecture & Technical Overview (`frontend/`)

The BugTracker client is built as a Single Page Application (SPA) using React 19, Vite 8, Tailwind CSS v4, and Material Design 3 Expressive styling.

---

## 1. Technical Stack & State Architecture

### Core Libraries
* **Framework**: React 19 + TypeScript (strict mode, zero `any` types).
* **Build Tooling**: Vite 8 with ES module hot-reloading.
* **Headless UI Primitives**:
  * Tables: `@tanstack/react-table` (v8) + `@tanstack/react-virtual` in [`DataTable.tsx`](../../frontend/src/components/ui/DataTable.tsx).
  * Drag & Drop: `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` with FSM validation.
  * Command Search: `cmdk` in [`QuickSearchModal.tsx`](../../frontend/src/components/workspace/QuickSearchModal.tsx).
* **Server State**: `@tanstack/react-query` v5 with standardized `queryOptions` factories and direct OpenAPI schemas (`api.generated.ts`).
* **Client State**: Zustand for lightweight reactive client-side store slices (`auth`, `ui`, `theme`, `broadcast`).
* **Icons**: `lucide-react` for consistent, crisp iconography.
* **Real-time Client**: `socket.io-client` connected to the backend `/events` WebSocket namespace for live board synchronization and personal notifications.
* **Audio Alerts**: Zero-dependency Web Audio API synthesizer generating clean two-tone chimes (587.33 Hz / 880.00 Hz) for incoming alerts, persisted via `localStorage` (`bugtracker_sound_alerts_enabled`).

---

## 2. Directory Layout (`frontend/src/`)

```
frontend/src/
├── api/                   # Typed API client functions and query factories
│   ├── modules/           # Domain API modules (issues, projects, rbac, notifications)
│   ├── queries/           # Standardized queryOptions factories and hooks
│   └── types/             # Generated OpenAPI schemas (api.generated.ts)
├── components/            # Reusable UI components
│   ├── ui/                # Atomic M3 primitives (DataTable, FormModal, EntityAvatar, AvatarPicker)
│   ├── notifications/     # NotificationBell, notification popover inbox, sound alert
│   ├── kanban/            # KanbanFlatBoard, DraggableKanbanCard (@dnd-kit), analytics
│   ├── agile/             # Backlog drawer, ActiveSprintBoard, sprint planning
│   ├── issue-detail/      # Unified IssueDetailView, comment stream, worklog forms
│   ├── workspace/         # WorkspaceHeader, ProjectSwitcher, QuickSearchModal (cmdk)
│   └── public/            # Landing navbar, hero elements
├── hooks/                 # Custom React hooks (useIssueModalUrl, useDebounce, etc.)
├── pages/                 # Route views and sub-routes (lazy-loaded via React.lazy)
│   └── admin/             # Modular Admin Center sub-routes & horizontal navigation tabs
├── store/                 # Zustand store slices (authStore, sidebarStore, themeStore)
├── types/                 # Shared TypeScript interfaces & DTO models
├── utils/                 # Utilities (date.ts, files.ts, workflowTransitions.ts)
├── index.css              # M3 Expressive design tokens (--md-sys-color-*)
└── App.tsx                # App layout shell, super-sidebar & route definitions
```

---

## 3. Layout Metaphor: Curved Shell & Super-Sidebar
The layout follows a Google Pixel OS / Material 3 Expressive curved shell architecture:
* **Full-Height Super-Sidebar**: Extends from viewport $y=0$ to $y=100vh$.
* **Floating Elevated Canvas**: The main content card renders with rounded edges (`rounded-2xl` / `rounded-3xl`), subtle outline borders, and background contrast against the sidebar surface container.
* **Workspace Action Strip**: The top header houses project breadcrumbs, quick action controls, theme toggle, and the real-time `NotificationBell` with dynamic M3 error badge (`99+`) and keyboard navigation support (`j`/`k`, `Enter`, `Escape`).
