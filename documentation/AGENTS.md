# Agent Guidelines & Documentation Hygiene Protocol

This document establishes the operational rules and maintenance protocols that all AI coding agents must follow when reading, modifying, or generating code and documentation in BugTracker.

---

## 1. Anti-Quota & Fast-Lookup Rules for Agents

To prevent context exhaustion and token quota burnout:
* **Never load the entire `documentation/` directory**: Agents must only read the specific leaf document corresponding to the active task domain (e.g. read `backend/auth.md` when modifying auth).
* **Consult [`documentation/INDEX.md`](INDEX.md) First**: Use the index as a 1-step routing hub to locate the exact documentation file and code path.
* **Keep Documents Concise**: Documentation files should remain under ~250 lines of high-density technical facts, tables, and clickable links.

---

## 2. Documentation Hygiene Protocol (Doc-as-Code)

Whenever you add, modify, or refactor code in the repository, you **must** update the corresponding documentation:

| Code Modification Area | Affected Source Paths | Required Documentation Update |
|---|---|---|
| **Auth & Security** | `backend/src/modules/auth/`, `captcha/` | [`documentation/backend/auth.md`](backend/auth.md) |
| **User Profiles & Filters** | `backend/src/modules/users/` | [`documentation/backend/users.md`](backend/users.md) |
| **Projects & Teams** | `backend/src/modules/projects/` | [`documentation/backend/projects.md`](backend/projects.md) |
| **Issues, Worklogs, Links** | `backend/src/modules/issues/` | [`documentation/backend/issues.md`](backend/issues.md) |
| **Sprints & Backlog** | `backend/src/modules/sprints/` | [`documentation/backend/sprints.md`](backend/sprints.md) |
| **RBAC & Schemes** | `backend/src/modules/rbac/` | [`documentation/backend/rbac.md`](backend/rbac.md) |
| **Audit Logs** | `backend/src/modules/security-audit/` | [`documentation/backend/security-audit.md`](backend/security-audit.md) |
| **WebSocket Events** | `backend/src/modules/events/` | [`documentation/backend/events.md`](backend/events.md) |
| **Admin APIs** | `backend/src/modules/admin/` | [`documentation/backend/admin.md`](backend/admin.md) |
| **Database Entities / Schema**| `backend/src/**/*.entity.ts` | [`documentation/architecture/database-schema.md`](architecture/database-schema.md) |
| **Frontend Views & Routes** | `frontend/src/pages/`, `App.tsx` | [`documentation/frontend/pages-and-routing.md`](frontend/pages-and-routing.md) |
| **UI Components & Tokens** | `frontend/src/index.css`, `components/`| [`documentation/frontend/design-system.md`](frontend/design-system.md) |
| **CLI / Scripts / Docker** | `docker-compose.yml`, `package.json` | [`documentation/operations/commands.md`](operations/commands.md) |

---

## 3. Maintaining Architecture Diagrams (Mermaid + PNG)

Architecture diagrams are stored as paired files under `documentation/architecture/diagrams/`:
* `*.mmd` — The declarative Mermaid source code.
* `*.png` — The rendered high-resolution image used in markdown previews.

### Protocol for Updating Diagrams
When system architecture, database entities, or authentication flows change:
1. Update the `.mmd` definition file (e.g. `database_er.mmd`).
2. Re-render the `.png` image using `mmdc`:
   ```bash
   npx -y @mermaid-js/mermaid-cli -i documentation/architecture/diagrams/<name>.mmd -o documentation/architecture/diagrams/<name>.png -b white -s 2
   ```
3. Verify that the referencing markdown files embed the updated PNG.
