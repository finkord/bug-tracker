# Component Usage Guidelines for AI Agents

## 1. Overview
All frontend page and feature implementations in BugTracker must consume the centralized atomic component kit located in [`src/components/ui/`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/index.ts).

---

## 2. Component Specifications & Code Examples

### 2.1 `<Button>` ([`src/components/ui/Button.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Button.tsx))
Supports 6 M3 Expressive variants and built-in loading states:

```tsx
import { Button } from '../components/ui';
import { Plus, Trash2 } from 'lucide-react';

// Primary CTA
<Button variant="filled" size="md" leftIcon={<Plus className="w-4 h-4" />}>
  Create Issue
</Button>

// Secondary / Tonal Action
<Button variant="tonal" size="sm">
  Filter Tasks
</Button>

// Destructive Action
<Button variant="danger-tonal" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
  Delete Sprint
</Button>

// Async Loading State
<Button variant="filled" isLoading={isSubmitting}>
  Save Changes
</Button>
```

---

### 2.2 `<Badge>` ([`src/components/ui/Badge.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Badge.tsx))
Encapsulates all Jira/BugTracker issue statuses, priorities, and semantic roles:

```tsx
import { Badge } from '../components/ui';

// Issue Status Badges
<Badge variant="open">To Do</Badge>
<Badge variant="in-progress" dot>In Progress</Badge>
<Badge variant="review">Review</Badge>
<Badge variant="resolved">Resolved</Badge>
<Badge variant="closed">Closed</Badge>

// Priority Badges
<Badge variant="critical" dot>Critical</Badge>
<Badge variant="high">High</Badge>
<Badge variant="medium">Medium</Badge>
<Badge variant="low">Low</Badge>
```

---

### 2.3 `<Input>` ([`src/components/ui/Input.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Input.tsx))
M3 filled-tonal input with accessible labels, errors, and icon slots:

```tsx
import { Input } from '../components/ui';
import { Search } from 'lucide-react';

<Input
  label="Issue Title"
  placeholder="Enter ticket title..."
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  error={errors.title}
  leftIcon={<Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />}
/>
```

---

### 2.4 `<SelectField>` & `<Select>` ([`src/components/ui/Select.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Select.tsx))
Accessible Radix UI select dropdown with label, error, helper text, and icon support:

```tsx
import { SelectField } from '../components/ui';

<SelectField
  label="Priority"
  value={priority}
  onValueChange={setPriority}
  options={[
    { value: 'LOW', label: 'Low Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'CRITICAL', label: 'Critical Priority' },
  ]}
/>
```

---

### 2.5 `<Tabs>` ([`src/components/ui/Tabs.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Tabs.tsx))
Accessible Radix UI tabs with `pills` or `underline` variants:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';

<Tabs defaultValue="overview">
  <TabsList variant="pills">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    {/* Content */}
  </TabsContent>
</Tabs>
```

---

### 2.6 `<Modal>` ([`src/components/ui/Modal.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Modal.tsx))
Headless Radix UI dialog with focus trapping, `Escape` key handling, and backdrop blur:

```tsx
import { Modal, Button } from '../components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create Sprint"
  description="Define duration and sprint commitment scope"
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="filled" size="sm" onClick={handleSave}>
        Start Sprint
      </Button>
    </div>
  }
>
  <div className="space-y-3">
    {/* Form contents */}
  </div>
</Modal>
```

---

### 2.7 `<DropdownMenu>` ([`src/components/ui/Dropdown.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Dropdown.tsx))
Headless Radix dropdown menu with full arrow-key keyboard navigation:

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from '../components/ui';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">Actions ▾</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>Edit Issue</DropdownMenuItem>
    <DropdownMenuItem onClick={handleClone}>Clone Ticket</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} danger>
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 2.8 `<Tooltip>` & `<Card>` ([`src/components/ui/Tooltip.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Tooltip.tsx) & [`src/components/ui/Card.tsx`](file:///home/finkord/dev/PPofSE/software/frontend/src/components/ui/Card.tsx))

```tsx
import { Tooltip, Card } from '../components/ui';

<Tooltip content="Keyboard shortcut: Shift + C">
  <button>Copy Key</button>
</Tooltip>

<Card variant="filled" padding="md" rounded="xl">
  <h4>Card Header</h4>
  <p>Tonal surface container content</p>
</Card>
```
