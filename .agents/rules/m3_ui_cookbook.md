---
trigger: model_decision
description: UI recipes and component usage cookbook for BugTracker (Button, Card, Modal, Input, Badge, Select, Tabs)
---

# Material 3 Expressive UI Cookbook (BugTracker)

This cookbook provides ready-to-use recipes for building UI in BugTracker.
All UI components MUST be imported from `src/components/ui/` and styled with CSS custom properties (`var(--md-sys-color-*)`).

---

## 1. Component Import Quick Reference

```tsx
import {
  Button,
  Card,
  Modal,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  StatusBadge,
  PriorityBadge,
  UserPicker,
  EmptyState,
} from '@/components/ui';
```

---

## 2. Recipe: Standard Action Form Modal

Use for creating or editing items (Issues, Sprints, Projects, Filters).

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Input, Button } from '@/components/ui';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export const CreateItemModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Item"
      description="Fill in the required information below"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="filled" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            Save
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. Fix authentication timeout bug"
          error={errors.title?.message}
          {...register('title')}
        />
      </form>
    </Modal>
  );
};
```

---

## 3. Recipe: Interactive Data Card (Kanban / Backlog Item)

Use for list rows, kanban cards, and interactive tiles.

```tsx
import React from 'react';
import { Card, Badge } from '@/components/ui';

export const IssueCard: React.FC<{
  title: string;
  issueKey: string;
  status: 'open' | 'in-progress' | 'review' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  onClick?: () => void;
}> = ({ title, issueKey, status, priority, onClick }) => {
  return (
    <Card
      variant="filled"
      padding="sm"
      rounded="xl"
      onClick={onClick}
      className="cursor-pointer hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-primary)]/40 transition-all duration-150"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-[var(--md-sys-color-primary)]">
          {issueKey}
        </span>
        <Badge variant={priority} size="sm">
          {priority}
        </Badge>
      </div>
      <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)] line-clamp-2">
        {title}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <Badge variant={status} size="sm" dot>
          {status}
        </Badge>
      </div>
    </Card>
  );
};
```

---

## 4. Recipe: Filter & Search Toolbar

Use for page headers, list filters, and search query controls.

```tsx
import React from 'react';
import { Search } from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';

export const FilterToolbar: React.FC<{
  search: string;
  onSearchChange: (val: string) => void;
  onAddClick: () => void;
}> = ({ search, onSearchChange, onAddClick }) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div className="flex-1 max-w-md">
        <Input
          placeholder="Search issues, projects, tickets..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="tonal" size="md">
          Filter
        </Button>
        <Button variant="filled" size="md" onClick={onAddClick}>
          Create Issue
        </Button>
      </div>
    </div>
  );
};
```

---

## 5. Recipe: UserPicker (Universal User Selection)

Use for Assignee, Reporter, Project Lead, or user filtering with instant popover search, avatar rendering, and "Assign to me".

```tsx
import React, { useState } from 'react';
import { UserPicker, type UserPickerUser } from '@/components/ui';

export const AssigneeSelector: React.FC<{
  users: UserPickerUser[];
  currentUserId?: number;
}> = ({ users, currentUserId }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
        Assignee
      </label>
      <UserPicker
        value={selectedUserId}
        onChange={(userId) => setSelectedUserId(userId)}
        users={users}
        currentUserId={currentUserId}
        placeholder="Unassigned"
        showAssignToMe
        size="md"
      />
    </div>
  );
};
```

---

## 6. Recipe: StatusBadge & PriorityBadge (Static & Interactive)

Use for rendering issue status and priority with canonical Material 3 tokens. Supports interactive popover selection out-of-the-box.

```tsx
import React from 'react';
import { StatusBadge, PriorityBadge } from '@/components/ui';
import type { IssueStatusType } from '@/components/ui/StatusBadge';
import type { IssuePriorityType } from '@/components/ui/PriorityBadge';

export const IssueMetaBar: React.FC<{
  status: IssueStatusType;
  priority: IssuePriorityType;
  onStatusChange?: (status: IssueStatusType) => void;
  onPriorityChange?: (priority: IssuePriorityType) => void;
}> = ({ status, priority, onStatusChange, onPriorityChange }) => {
  return (
    <div className="flex items-center gap-2">
      {/* Interactive Status Badge */}
      <StatusBadge
        status={status}
        interactive={Boolean(onStatusChange)}
        onStatusChange={onStatusChange}
        size="sm"
      />

      {/* Interactive Priority Badge */}
      <PriorityBadge
        priority={priority}
        interactive={Boolean(onPriorityChange)}
        onPriorityChange={onPriorityChange}
        size="sm"
      />
    </div>
  );
};
```

---

## 7. Recipe: EmptyState (Zero-State & Placeholder Cards)

Use for empty lists, search zero-results, or blank tabs.

```tsx
import React from 'react';
import { EmptyState } from '@/components/ui';
import { MessageSquare, Plus } from 'lucide-react';

export const EmptyComments: React.FC<{ onAddComment: () => void }> = ({ onAddComment }) => {
  return (
    <EmptyState
      icon={<MessageSquare />}
      title="No comments yet"
      description="Be the first to share an update or start a discussion on this issue."
      action={{
        label: "Add Comment",
        onClick: onAddComment,
        icon: <Plus className="w-4 h-4" />,
      }}
      compact
    />
  );
};
```

---

## 8. Status & Priority Badge Mapping

Always map issue states and priorities to predefined Badge variants:

| Entity Value | Badge `variant` | Visual Palette |
|---|---|---|
| `OPEN` | `open` | Surface container highest / outline |
| `IN_PROGRESS` | `in-progress` | Primary container (Blue) |
| `REVIEW` | `review` | Secondary container (Slate Blue) |
| `RESOLVED` | `resolved` | Success container (Forest Mint) |
| `CLOSED` | `closed` | Surface container high / neutral |
| `LOW` | `low` | Slate neutral pill |
| `MEDIUM` | `medium` | Amber gold container |
| `HIGH` | `high` | Orange fire container |
| `CRITICAL` | `critical` | Rose / Carmine container |

---

## 9. Color Tokens Cheatsheet (Never use raw hex or Tailwind palette)

| Intent | Background Token | Text Token |
|---|---|---|
| Primary action | `var(--md-sys-color-primary)` | `var(--md-sys-color-on-primary)` |
| Secondary / Tonal | `var(--md-sys-color-secondary-container)` | `var(--md-sys-color-on-secondary-container)` |
| Success / Done | `var(--md-sys-color-success-container)` | `var(--md-sys-color-on-success-container)` |
| Error / Danger | `var(--md-sys-color-error-container)` | `var(--md-sys-color-on-error-container)` |
| Base Surface | `var(--md-sys-color-surface)` | `var(--md-sys-color-on-surface)` |
| Raised Container | `var(--md-sys-color-surface-container)` | `var(--md-sys-color-on-surface)` |
| High Elevation | `var(--md-sys-color-surface-container-high)` | `var(--md-sys-color-on-surface)` |
| Subdued Text | - | `var(--md-sys-color-on-surface-variant)` |
| Outlines / Borders | - | `var(--md-sys-color-outline-variant)` |
