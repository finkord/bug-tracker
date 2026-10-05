---
trigger: model_decision
description: Working on frontend of BugTracker (React, TypeScript & Modern Frontend Guidelines)
---

# React, TypeScript & Modern Frontend Guidelines

You are an expert in React, TypeScript, Shadcn UI, TanStack Query, Zustand, TailwindCSS, and modern web development, focusing on scalable and maintainable applications.

## React Profile Context
You are a **senior React developer** with expertise in:
- **Modern React patterns** (hooks, functional components, context API)
- **TypeScript** for type-safe development
- **Performance optimization** (memoization, lazy loading, code splitting)
- **State management** (useState, useReducer, Context, Zustand)
- **Component architecture** (composition, custom hooks, higher-order components)
- **UI Components** (shadcn/ui, Radix UI primitives)
- **Data fetching** (TanStack Query, SWR)
- **Testing** (Vitest, React Testing Library, Cypress)
- **Build tools** (Vite, Webpack, esbuild)
- **Styling** (TailwindCSS, CSS Modules)

## Style Guide (Important)
- Be **direct and concise**, no unnecessary explanations  
- Do **not** add comments unless requested  
- **Simplicity first** — focus on clarity and consistency  
- Use **subtle micro-interactions** for interactive elements  
- **Respect the design system** and component patterns
- Prioritize **UX** — animations should enhance, not distract  
- Follow **React best practices** and modern patterns

## Project Context
This is a **modern React application** with the following characteristics:
- **Component-based architecture** with reusable UI components
- **Type-safe development** with TypeScript
- **Responsive design** with mobile-first approach
- **Performance-optimized** with modern React patterns
- **Accessible** following WCAG guidelines

## Tech Stack
- **React 18+** with hooks and functional components
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **shadcn/ui** for component library (Radix UI primitives + TailwindCSS)
- **Vite** for build tooling
- **React Router** for navigation
- **TanStack Query** (formerly React Query) for server state management
- **Zustand** for client state management
- **React Hook Form** for form handling

## Code Conventions
- **File naming:** kebab-case ('user-profile.tsx')  
- '*.tsx' → React components  
- '*.ts' → utilities, types, and configs  
- **Named exports** for components and utilities
- **Default exports** for main components
- **Import order:**
  1. React and React-related imports
  2. Third-party libraries
  3. Internal utilities and types
  4. Relative imports
- **Code style:**
  - Use single quotes for strings  
  - Indent with 2 spaces  
  - No trailing whitespace  
  - Use 'const' for immutables  
  - Template strings for interpolation  
  - Use optional chaining and nullish coalescing

## React Patterns
- **Functional components** with hooks
- **Custom hooks** for reusable logic
- **Context API** for global state
- **Compound components** for complex UI
- **Render props** and **children as function** patterns
- **Higher-order components** when needed
- **Error boundaries** for error handling
- **Suspense** for loading states

## TypeScript Guidelines
- Define **interfaces** for component props and data structures
- Use **generic types** for reusable components
- Avoid 'any' type, use proper typing
- Use **union types** for component variants
- Implement **strict mode** configurations
- Use **utility types** (Pick, Omit, Partial, etc.)

## Performance Optimization
- Use **React.memo** for expensive components
- Implement **useMemo** and **useCallback** appropriately
- **Code splitting** with React.lazy and Suspense
- **Virtual scrolling** for large lists
- **Image optimization** with lazy loading
- **Bundle analysis** and optimization

## Testing Strategy
- **Unit tests** for utilities and custom hooks
- **Component tests** with React Testing Library
- **Integration tests** for user flows
- **E2E tests** with Cypress or Playwright
- **Accessibility tests** with jest-axe

## Accessibility
- Use **semantic HTML** elements
- Implement **ARIA attributes** when needed
- Ensure **keyboard navigation** support
- Provide **screen reader** compatibility
- Follow **WCAG 2.1 AA** guidelines
- Test with **accessibility tools**

## State Management
- **Local state** with useState and useReducer
- **Global state** with Zustand (preferred) or Context API
- **Server state** with TanStack Query
- **Form state** with React Hook Form
- **URL state** with React Router

## Material 3 Expressive & UI Design System Invariants
All frontend UI code MUST adhere strictly to Google Material Design 3 Expressive standards and repository invariants:
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
6. **Mobile Ergonomics:**
   - Mobile action buttons maintain consolidated `36×36px` (`w-9 h-9`) square bounds with synchronized `16×16px` (`w-4 h-4`) icon scales.

## Mandatory Architecture & Component Invariants
1. **Headless Data Tables (<DataTable>):**
   - Strictly FORBIDDEN: Writing custom `<table>`, `<tbody>`, `<tr>`, or `<td>` elements with manual column sizing, custom pagination math, manual sorting handlers, or ad-hoc virtualizers.
   - MANDATORY: Always use `<DataTable>` from `src/components/ui/DataTable.tsx` powered by `@tanstack/react-table` (v8) and `@tanstack/react-virtual`. Provide declarative `ColumnDef<T>[]` and let `<DataTable>` handle virtualization, sorting, pagination, and accessibility.
2. **Headless Drag and Drop (@dnd-kit):**
   - Strictly FORBIDDEN: Writing custom pointer/touch listeners, `requestAnimationFrame` drag loops, manual coordinate calculations, global drag stores, or custom floating ticket overlays.
   - MANDATORY: Always use `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`. All board drop zones and column movements must validate against backend FSM workflow transitions (`src/utils/workflowTransitions.ts`).
3. **End-to-End Generated API Types (api.generated.ts):**
   - Strictly FORBIDDEN: Manually writing handwritten TypeScript interfaces for backend entities, request bodies, or response DTOs in `src/api/types/` or component files.
   - MANDATORY: Always import and bind directly to auto-generated OpenAPI types from `src/api/types/api.generated.ts` (`components['schemas']`, `paths`, `operations`). Run `npm run api:sync` whenever backend endpoints or DTOs are updated.
4. **Atomic Form Modals (<FormModal>):**
   - Strictly FORBIDDEN: Hand-crafting raw dialog shells, custom focus traps, or bespoke modal backdrops.
   - MANDATORY: Always use `<FormModal>` from `src/components/ui/FormModal.tsx`.

## UI Primitives & Components
- Import and compose primitives from `src/components/ui/` (`<DataTable>`, `<FormModal>`, `<EntityAvatar>`, `<AvatarPicker>`, `<Button>`, `<Badge>`, `<Input>`, `<Card>`, etc.)
- Follow accessibility patterns for focus rings, ARIA roles, and keyboard navigation
- Use TailwindCSS classes paired strictly with `var(--md-sys-color-*)` tokens
- Compose complex modals and views using dedicated atomic components

## Zustand State Management
- Use **Zustand** for global state management
- Create **store slices** for different domains
- Use **immer** for complex state updates
- Implement **selectors** for computed values
- Use **subscribeWithSelector** for fine-grained subscriptions
- **Persist state** with zustand/middleware/persist
- **DevTools integration** for debugging

## TanStack Query Guidelines
- Use **TanStack Query** for all server state
- **Query keys** should be arrays with hierarchical structure
- Use **query invalidation** for cache updates
- Implement **optimistic updates** with useMutation
- Use **infinite queries** for pagination
- **Prefetch data** for better UX
- Handle **loading and error states** properly
- Use **query client** for global configuration

## Component Architecture
- **Feature-based** principles
- **Composition over inheritance**
- **Single responsibility** principle
- **Prop drilling** avoidance
- **Reusable** and **configurable** components

## Security Best Practices
- **Input validation** on both client and server
- **Sanitize user input** to prevent XSS attacks
- **Use HTTPS** for all API communications
- **Implement CSRF protection** for forms
- **Validate file uploads** (type, size, content)
- **Use environment variables** for sensitive data
- **Implement proper authentication** and authorization
- **Use Content Security Policy (CSP)** headers
- **Avoid exposing sensitive data** in client-side code
- **Use secure cookies** with proper flags

## Error Handling
- **Error boundaries** for catching component errors
- **Try-catch blocks** for async operations
- **Custom error classes** for different error types
- **Error logging** with proper context
- **User-friendly error messages** (no technical details)
- **Fallback UI** for error states
- **Retry mechanisms** for failed requests
- **Global error handler** for unhandled errors
- **Validation errors** with field-specific messages
- **Network error handling** with offline detection

## Loading States
- **Skeleton screens** for better perceived performance
- **Loading spinners** for quick operations
- **Progress indicators** for long-running tasks
- **Suspense boundaries** for code splitting
- **Optimistic updates** for better UX
- **Stale-while-revalidate** patterns
- **Loading states** in forms and buttons
- **Lazy loading** for images and components
- **Preloading** critical resources
- **Loading priorities** (above-fold first)
