# Security & Forensic Audit Module (`SecurityAuditModule`)

The `SecurityAuditModule` captures an immutable, tamper-resistant trail of all authentication events, suspicious logins, and account lockouts across BugTracker.

---

## 1. Domain Responsibilities
* **Forensic Event Recording**: Records every login attempt (successful, invalid credentials, 2FA challenge, 2FA failure, lockout).
* **Metadata Capture**: Stores IP address, User-Agent header, and precise timestamp.
* **Security Anomaly Detection**: Enables administrators to review brute-force patterns and suspicious origin IPs on the Admin Security Audit page.

---

## 2. Primary Endpoints (`/api/v1/security-audit` / `/admin/security`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/logs` | Paginated search of login audit logs with filtering | Admin (`Roles('ADMIN')`) |
| `GET` | `/stats` | Aggregate login metrics (success rate, lockout count) | Admin (`Roles('ADMIN')`) |

---

## 3. Key Source Files
* Controller: [`security-audit.controller.ts`](../../backend/src/modules/security-audit/security-audit.controller.ts)
* Service: [`security-audit.service.ts`](../../backend/src/modules/security-audit/security-audit.service.ts)
* Entity: [`LoginAuditLog`](../../backend/src/modules/security-audit/entities/login-audit-log.entity.ts)
