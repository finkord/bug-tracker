# BugTracker Technical Documentation Index

Welcome to the central documentation hub for **BugTracker**. This directory serves as the authoritative, up-to-date knowledge base for both human engineers and AI coding agents.

> [!TIP]
> **For Coding Agents**: Consult the [Quick Lookup Router](#1-quick-lookup-router-for-agents) below to locate the specific leaf document for your active task. Do not load all docs into context at once. Read [`AGENTS.md`](AGENTS.md) for the mandatory Doc-as-Code hygiene rules.

---

## 1. Quick Lookup Router for Agents

| Domain / Keyword | Target Subsystem | Primary Code Path | Documentation Path |
|---|---|---|---|
| **System Architecture** | Infrastructure, Ports, Stack | [`backend/src/main.ts`](../backend/src/main.ts) | [`architecture/system-overview.md`](architecture/system-overview.md) |
| **Database Schema** | 19 Entities, Relations, ERD | [`backend/src/**/*.entity.ts`](../backend/src) | [`architecture/database-schema.md`](architecture/database-schema.md) |
| **Auth & Security** | JWT, Argon2id, 2FA, Captcha, Lockout | [`backend/src/modules/auth/`](../backend/src/modules/auth) | [`backend/auth.md`](backend/auth.md) |
| **User Profiles** | Avatar, Settings, Saved Filters | [`backend/src/modules/users/`](../backend/src/modules/users) | [`backend/users.md`](backend/users.md) |
| **Projects & Teams** | Spaces, Keys, Leads | [`backend/src/modules/projects/`](../backend/src/modules/projects) | [`backend/projects.md`](backend/projects.md) |
| **Issues & Worklogs** | Tickets, FSM, Attachments, Links | [`backend/src/modules/issues/`](../backend/src/modules/issues) | [`backend/issues.md`](backend/issues.md) |
| **Sprints & Backlog** | Agile Sprints, Planning | [`backend/src/modules/sprints/`](../backend/src/modules/sprints) | [`backend/sprints.md`](backend/sprints.md) |
| **RBAC & Permissions**| Schemes, Roles, Groups, Security | [`backend/src/modules/rbac/`](../backend/src/modules/rbac) | [`backend/rbac.md`](backend/rbac.md) |
| **Forensic Audit** | LoginAuditLog, IP analysis | [`backend/src/modules/security-audit/`](../backend/src/modules/security-audit) | [`backend/security-audit.md`](backend/security-audit.md) |
| **WebSockets** | Socket.IO, Real-Time Board | [`backend/src/modules/events/`](../backend/src/modules/events) | [`backend/events.md`](backend/events.md) |
| **Admin Operations** | Health, Metrics, User Control | [`backend/src/modules/admin/`](../backend/src/modules/admin) | [`backend/admin.md`](backend/admin.md) |
| **Database Seeding** | 5 Teams, 30 Engineers, 46 Issues | [`backend/src/database/seed.ts`](../backend/src/database/seed.ts) | [`backend/seeding.md`](backend/seeding.md) |
| **Frontend Core** | React 19, Zustand, Query | [`frontend/src/App.tsx`](../frontend/src/App.tsx) | [`frontend/overview.md`](frontend/overview.md) |
| **Routes & Views** | 19 Page views, Route Guards | [`frontend/src/pages/`](../frontend/src/pages) | [`frontend/pages-and-routing.md`](frontend/pages-and-routing.md) |
| **Design System** | M3 Expressive, Tokens, Curves | [`frontend/src/index.css`](../frontend/src/index.css) | [`frontend/design-system.md`](frontend/design-system.md) |
| **CLI & Docker** | Runbooks, dev, prod commands | [`docker-compose.yml`](../docker-compose.yml) | [`operations/commands.md`](operations/commands.md) |
| **API Verification** | Automated curl test suite | Live API (`localhost:3000`) | [`operations/verification-api.md`](operations/verification-api.md) |
| **Product Backlog** | Developer feature ideas & vision | User requirements backlog | [`backlog/product_ideas.md`](backlog/product_ideas.md) |

---

## 2. Visual Architecture Diagrams (Mermaid & PNG)

All architecture diagrams are maintained in [`architecture/diagrams/`](architecture/diagrams):
1. **[System Architecture](architecture/diagrams/system_architecture.png)** ([Source](architecture/diagrams/system_architecture.mmd))
2. **[Database Entity Relationships](architecture/diagrams/database_er.png)** ([Source](architecture/diagrams/database_er.mmd))
3. **[Authentication & Security Lifecycle](architecture/diagrams/auth_security_flow.png)** ([Source](architecture/diagrams/auth_security_flow.mmd))
4. **[Onboarding & RBAC Ticket Workflow](architecture/diagrams/onboarding_rbac_workflow.png)** ([Source](architecture/diagrams/onboarding_rbac_workflow.mmd))

---

## 3. Directory Structure

```
documentation/
├── INDEX.md                         # This central routing hub
├── AGENTS.md                        # AI coding agent rules & Doc Hygiene Protocol
├── architecture/                    # Global system and database architecture
│   ├── system-overview.md
│   ├── database-schema.md
│   └── diagrams/                    # Paired Mermaid (.mmd) and PNG (.png) diagrams
├── backend/                         # 10 Domain-specific backend module docs
│   ├── auth.md
│   ├── users.md
│   ├── projects.md
│   ├── issues.md
│   ├── sprints.md
│   ├── rbac.md
│   ├── security-audit.md
│   ├── events.md
│   ├── admin.md
│   └── seeding.md
├── frontend/                        # Frontend SPA architecture and design system
│   ├── overview.md
│   ├── pages-and-routing.md
│   └── design-system.md
├── operations/                      # Developer runbooks and verification suites
│   ├── commands.md
│   └── verification-api.md
└── backlog/                         # Product backlog and developer's original vision
    ├── product_ideas.md
    └── raw_notes.txt
```
