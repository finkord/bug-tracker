# Frontend Architecture & Technical Overview (`frontend/`)

The BugTracker client is built as a Single Page Application (SPA) using React 19, Vite 8, Tailwind CSS v4, and Material Design 3 Expressive styling.

---

## 1. Technical Stack & State Architecture

### Core Libraries
* **Framework**: React 19 + TypeScript (strict mode, zero `any` types).
* **Build Tooling**: Vite 8 with ES module hot-reloading.
* **Server State**: `@tanstack/react-query` v5 for asynchronous data fetching, automatic cache invalidation, and optimistic updates.
* **Client State**: Zustand for lightweight reactive client-side store slices (`auth`, `ui`, `theme`).
* **Icons**: `lucide-react` for consistent, crisp iconography.
* **Real-time Client**: `socket.io-client` connected to the backend `/events` WebSocket namespace.

---

## 2. Directory Layout (`frontend/src/`)

```
frontend/src/
├── api/                   # Typed API client functions (axios/fetch abstractions)
├── components/            # Reusable UI components
│   ├── common/            # Buttons, Modals, Inputs, Cards, Sidebar, Footer
│   ├── public/            # Landing navbar, hero elements
│   ├── workspace/         # WorkspaceHeader, ProjectSwitcher
│   └── issue/             # IssueCard, StatusBadge, PriorityIcon, WorklogModal
├── hooks/                 # Custom React hooks (useKanban, useDebounce, etc.)
├── pages/                 # 19 Route views (lazy-loaded via React.lazy)
├── store/                 # Zustand store slices (authStore, uiStore, themeStore)
├── types/                 # Shared TypeScript interfaces & DTO models
├── index.css              # M3 Expressive design tokens (--md-sys-color-*)
└── App.tsx                # App layout shell, super-sidebar & route definitions
```

---

## 3. Layout Metaphor: Curved Shell & Super-Sidebar
The layout follows a Google Pixel OS / Material 3 Expressive curved shell architecture:
* **Full-Height Super-Sidebar**: Extends from viewport $y=0$ to $y=100vh$.
* **Floating Elevated Canvas**: The main content card renders with rounded edges (`rounded-2xl` / `rounded-3xl`), subtle outline borders, and background contrast against the sidebar surface container.
