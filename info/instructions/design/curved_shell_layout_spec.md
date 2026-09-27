# Panel-Based Outer Shell & Curved Layout Specification for AI Agents

## 1. Overview & Architectural Principles

BugTracker's layout uses a **Panel-Based Outer Framework Shell** inspired by modern desktop tools (GitLab Super-Sidebar, Linear, and Jira Cloud). 

The visual "curve" between navigation and workspace is an **optical illusion**:
- The **Outer Shell** (`h-screen w-screen overflow-hidden`) hosts the full-height Super-Sidebar and top control strip.
- The **Main Viewport Canvas** is an elevated card (`bg-[var(--md-sys-color-background)]`) with rounded corners (`rounded-2xl md:rounded-3xl`), 1px subtle outline, and soft shadow inset with a margin (`8px–12px`) away from the viewport edges.

---

## 2. Layout Structure & DOM Blueprint

```tsx
<div className="h-screen w-screen overflow-hidden flex bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-background)]">
  {/* 1. Super Sidebar (Full Height y=0 to y=100vh) */}
  {user && <Sidebar />}

  {/* 2. Workspace Shell: Top Bar + Inset Canvas Card */}
  <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
    <Navbar />

    {/* 3. Main Canvas Card (The Optical Curve Metaphor) */}
    <main
      className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden ${
        user
          ? 'm-2 md:mr-3 md:mb-3 md:mt-0 bg-[var(--md-sys-color-background)] rounded-2xl md:rounded-3xl border border-[var(--md-sys-color-outline-variant)]/25 shadow-xs transition-all duration-200'
          : 'bg-[var(--md-sys-color-background)]'
      }`}
    >
      {children}
    </main>
  </div>
</div>
```

---

## 3. Mandatory Layout Rules for AI Agents

1. **No Full-Window Scrollbars:** The root window is locked with `overflow-hidden`. Only the main canvas card or specific panels (Kanban columns, backlog tables) should scroll vertically with `overflow-y-auto`.
2. **Never Place Navbar Across the Sidebar:** The Sidebar must remain a continuous vertical pillar from top to bottom.
3. **Preserve the Inset Margin:** When rendering workspace views, never remove the outer margin (`m-2 md:mr-3 md:mb-3`) around the main canvas card.
4. **Concentric Geometry:** Nested elements within the canvas card should have smaller radii (`rounded-xl` or `rounded-2xl`) than the outer canvas card (`rounded-3xl`) to maintain geometric harmony.
