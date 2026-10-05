---
trigger: model_decision
description: Implementing end-to-end full-stack features connecting NestJS backend and React frontend
---

# Full-Stack Feature Contract & Integration Guide

This rule guides end-to-end feature implementation connecting the NestJS backend with the React 19 frontend. Follow this 5-step contract to prevent contract mismatches and `undefined` runtime errors.

---

## Step 1: Backend DTO & Controller Contract

1. Always validate incoming request payloads using `class-validator` DTOs.
2. Return flat, predictable responses from controllers. Do not add arbitrary nested wrappers:
   ```typescript
   // Recommended: return entity or clean data structure directly
   @Post()
   @RequireProjectPermission(ProjectPermission.CREATE_ISSUES)
   async create(@Body() dto: CreateIssueDto, @CurrentUser() user: User): Promise<IssueResponseDto> {
     return this.issuesService.create(dto, user);
   }
   ```

---

## Step 2: TypeORM Safe Persistence Patterns

1. **Explicit Relations**: TypeORM does NOT load relations by default. Always specify `relations: [...]` when relations are needed:
   ```typescript
   const issue = await this.issueRepo.findOne({
     where: { id },
     relations: ['project', 'assignee', 'reporter'],
   });
   ```
2. **Prevent N+1 Queries**: Never run queries inside `.map()` or `forEach()`. Use `In(ids)` or a single `QueryBuilder` with `leftJoinAndSelect`.
3. **Atomic Multi-Entity Mutations**: When saving multiple entities, wrap them in a transaction:
   ```typescript
   await this.dataSource.transaction(async (manager) => {
     const issue = await manager.save(Issue, newIssue);
     await manager.save(IssueHistory, historyRecord);
   });
   ```

---

## Step 3: Frontend API Contract & Client Function

1. **Auto-Generated Types from `api.generated.ts`**:
   - FORBIDDEN: Writing handwritten duplicate interfaces for backend models or DTOs.
   - MANDATORY: Sync types via `npm run api:sync` and import directly from `src/api/types/api.generated.ts`:
   ```typescript
   import type { components } from '../types/api.generated.js';

   export type IssueResponseDto = components['schemas']['IssueResponseDto'];
   export type CreateIssuePayload = components['schemas']['CreateIssueDto'];
   ```
2. **Expose in `src/api/modules/` via `request` or `uploadFile`**:
   ```typescript
   // frontend/src/api/modules/issues.api.ts
   import { request } from '../http.js';
   import type { IssueResponseDto, CreateIssuePayload } from '../types/index.js';

   export const issuesApi = {
     getById: (id: string) => request<IssueResponseDto>(`/issues/${id}`),
     create: (dto: CreateIssuePayload) =>
       request<IssueResponseDto>('/issues', { method: 'POST', body: JSON.stringify(dto) }),
   };
   ```

---

## Step 4: TanStack Query Hook & Cache Invalidation

Define hooks in `src/api/queries/`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesApi } from '../modules/issues.api';

export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (projectId: string) => [...issueKeys.lists(), projectId] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
};

// Query Hook
export const useIssueQuery = (id: string) =>
  useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: () => issuesApi.getById(id),
    enabled: Boolean(id),
  });

// Mutation Hook with Cache Invalidation
export const useCreateIssueMutation = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issuesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.list(projectId) });
    },
  });
};
```

---

## Step 5: Pre-Delivery Fast Self-Check (Mandatory)

Before finishing any task, run the fast verification loop to catch broken imports or syntax errors:

```bash
# 1. Backend Lint (fast sub-second check)
cd backend && npx oxlint src/modules/<changed-module>/

# 2. Frontend Lint & Typecheck
cd frontend && npx oxlint src/components/ && npx tsc --noEmit
```
