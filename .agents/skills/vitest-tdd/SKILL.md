---
name: vitest-tdd
description: >-
  Strict Test-Driven Development (TDD) workflow and unit/integration testing guide
  using Vitest across NestJS backend and React frontend. Incorporates the battle-tested
  superpowers TDD protocol (The Iron Law, Red-Green-Refactor, Verify-RED) tailored
  with Vitest, TypeORM repository mocks, Zustand stores, and React Testing Library.
---

# Vitest TDD & Unit Testing Skill

This skill enforces strict **Test-Driven Development (TDD)** using **Vitest** for both NestJS backend and React frontend.

---

## 1. The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? **Delete it. Start over.**

- Do NOT keep it as "reference".
- Do NOT "adapt" it while writing tests.
- Tests written after code pass immediately — which proves nothing. You never watched it fail, so you never proved it can catch the bug.

---

## 2. The Red-Green-Refactor Cycle

```text
       ┌───────────┐
       │  1. RED   │  Write one minimal failing test specifying expected behavior.
       └─────┬─────┘
             │
             ▼
       ┌───────────┐
       │VERIFY RED │  Run test. Confirm: FAILS for the expected reason (feature missing,
       └─────┬─────┘  NOT a syntax error or wrong import). Never skip this!
             │
             ▼
       ┌───────────┐
       │ 2. GREEN  │  Write MINIMAL production code to make the test pass.
       └─────┬─────┘  Do not over-engineer or add unneeded features.
             │
             ▼
       ┌───────────┐
       │VERIFY GRN │  Run test suite. Confirm test passes and existing suite remains green.
       └─────┬─────┘
             │
             ▼
       ┌───────────┐
       │3. REFACTOR│  Clean up duplication, improve naming, optimize.
       └─────┬─────┘  Keep tests green. Run oxlint + tsc --noEmit.
             │
             └────────► Repeat for next requirement.
```

---

## 3. Targeted Test Execution (Vitest)

Run targeted test files during development to keep the feedback loop fast:

### Backend:
```bash
# Run a specific spec file
cd backend && npx vitest run src/modules/auth/services/local-auth.service.spec.ts

# Run all tests in a module
cd backend && npx vitest run src/modules/auth/

# Run in watch mode during active TDD loop
cd backend && npm run test:watch src/modules/auth/services/local-auth.service.spec.ts
```

### Frontend:
```bash
# Run a specific spec file
cd frontend && npx vitest run src/store/useAuthStore.spec.ts

# Run all tests in a directory
cd frontend && npx vitest run src/components/common/

# Run in watch mode during active TDD loop
cd frontend && npm run test:watch src/store/useAuthStore.spec.ts
```

---

## 4. Good Tests vs Bad Tests

| Quality | Good | Bad |
|---------|------|-----|
| **Single Responsibility** | Tests one behavior. | `test('validates email and saves user and sends notification')` |
| **Clear Name** | `it('throws ConflictException when email is already registered')` | `it('works')` |
| **Real Code** | Tests actual logic with minimal, targeted mocks. | Tests the mock implementation instead of production code. |
| **Arrange-Act-Assert** | Clear visual separation between setup, execution, assertions. | Tangled setup and assertions mixed together. |

---

## 5. Backend Unit Testing Patterns (NestJS + Vitest)

### Testing Services with Mocked Repositories:
Use `Test.createTestingModule` and mock TypeORM repository tokens with `vi.fn()`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  const mockRepo = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { id: 'uuid-1', email: 'test@example.com' } as User;
      mockRepo.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById('uuid-1');

      // Assert
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('unknown-id')).rejects.toThrowError();
    });
  });
});
```

---

## 6. Frontend Testing Patterns (React 19 + RTL + Vitest)

### Testing Zustand Stores:
Isolate state between tests by resetting the store in `beforeEach`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset Zustand store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
  });

  it('sets user and sets isAuthenticated to true on login', () => {
    const mockUser = { id: '1', email: 'dev@test.com', username: 'dev' };
    
    useAuthStore.getState().setUser(mockUser);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });
});
```

### Testing UI Components:
Use React Testing Library with accessible queries:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button label and fires onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });
});
```

---

## 7. Red Flags: STOP and Start Over

If any of the following occur, stop immediately and restart the cycle:
- Production code written before test.
- Test passes on first run without code changes.
- Cannot explain why the test failed.
- Rationalizing "I'll write tests later" or "It's too simple to test".
- Using `setTimeout` or arbitrary sleeps in tests (use `waitFor` or `vi.useFakeTimers()`).
- Casting types to `any` in tests (violates project strict typing constraint).
