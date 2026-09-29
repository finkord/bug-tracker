---
name: git-conventional-commits
description: >-
  Standardize and automate Git commit messages according to the Conventional
  Commits 1.0.0 specification for the BugTracker project. Incorporates the
  official awesome-copilot git-commit workflow, intelligent diff analysis,
  BugTracker domain scopes, and git safety protocols.
allowed-tools: Bash
---

# Git Commit with Conventional Commits

This skill enforces the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) specification across the BugTracker repository, combining the battle-tested GitHub `awesome-copilot` workflow with project-specific scopes and safety rules.

---

## 1. Commit Structure

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Constraints:
1. **Language:** English only (per project rule).
2. **Subject line length:** <= 72 characters.
3. **Imperative mood:** Use "add", "fix", "refactor", not "added", "fixes", "refactoring".
4. **Casing:** Lowercase type, scope, and first word of description (unless proper noun).
5. **Punctuation:** No trailing period (`.`) in the subject line.
6. **Separation:** Blank line between header, body, and footers.

---

## 2. Commit Types

| Type       | Purpose | Example |
|------------|---------|---------|
| `feat`     | A new feature or user-facing capability | `feat(auth): add totp two-factor authentication` |
| `fix`      | A bug fix | `fix(theme): prevent switch to light mode on reload` |
| `refactor` | Code restructuring without fixing a bug or adding a feature | `refactor(auth): remove mock oauth endpoints and dtos` |
| `test`     | Adding, updating, or fixing tests (Vitest) | `test(store): add unit tests for theme store persistence` |
| `perf`     | Performance improvement | `perf(kanban): virtualize card list rendering` |
| `style`    | Formatting, whitespace, semicolon changes (no code logic change) | `style(ui): align modal padding with m3 tokens` |
| `docs`     | Documentation changes only | `docs(readme): update local setup and mailpit port` |
| `chore`    | Tooling, config, dependencies, maintenance | `chore(deps): update vitest to 5.0.2` |
| `ci`       | CI/CD workflows, build pipelines | `ci(github): add oxlint and tsc checks to pr action` |
| `revert`   | Reverting a previous commit | `revert: revert feat(auth): add oauth mock` |

---

## 3. Allowed Scopes for BugTracker

### Backend Scopes:
- `auth`: Authentication, JWT, TOTP, guards, cookies, sessions
- `users`: User profiles, avatars, settings
- `projects`: Project management, memberships, roles
- `issues`: Issue tracking, priorities, labels, assignments
- `comments`: Issue comments and reactions
- `events`: WebSocket real-time gateway and notifications
- `storage`: S3 / SeaweedFS file attachments
- `database`: Migrations, seeders, TypeORM entities

### Frontend Scopes:
- `ui`: Shared UI primitives (buttons, dialogs, inputs, badges)
- `theme`: M3 color tokens, dark/light theme persistence
- `navbar`: App header, public header, navigation
- `sidebar`: App drawer and navigation menu
- `kanban`: Kanban board, sprint views, drag-and-drop
- `store`: Zustand state management (`useAuthStore`, `useThemeStore`)
- `api`: HTTP client, interceptors, react-query hooks
- `router`: Routes, protected routes, redirects

### Cross-Cutting / Infra Scopes:
- `agent`: Rules, skills, agent instructions
- `docker`: Dockerfile, docker-compose
- `deps`: Dependency upgrades or package.json changes
- `config`: Environment variables, Vite config, Nest config

---

## 4. Breaking Changes

Mark breaking changes by adding an exclamation mark `!` before the colon, and provide a `BREAKING CHANGE:` explanation in the footer:

```text
feat(auth)!: require csrf header on all state-changing api calls

BREAKING CHANGE: All API clients must now send `x-csrf-token` header.
```

---

## 5. Workflow: Intelligent Diff Analysis & Execution

### Step 1: Analyze Diff
```bash
# If files are staged, use staged diff
git diff --staged

# If nothing staged, inspect status and working tree diff
git status --porcelain
git diff
```

### Step 2: Stage Files (Intelligent Grouping)
- Stage only files related to a single logical change.
- Never commit secrets (`.env`, credentials, private keys).
```bash
git add backend/src/modules/auth/...
```

### Step 3: Formulate and Execute Commit
```bash
# Single line
git commit -m "<type>(<scope>): <description>"

# Multi-line with body and footer
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<optional explanatory body answering what and why>

<optional footer e.g. Closes #42 or BREAKING CHANGE: details>
EOF
)"
```

---

## 6. Git Safety Protocol (Non-Negotiable)

- **NEVER** force push (`--force`, `-f`) to `main` / `master`.
- **NEVER** run destructive commands (`git reset --hard`, `git clean -fd`) without explicit confirmation.
- **NEVER** skip hooks (`--no-verify`) unless explicitly instructed by the user.
- **NEVER** commit `.env` or sensitive configuration files.
- If a pre-commit check fails, fix the underlying issue and create a clean commit (do NOT blind-amend).
