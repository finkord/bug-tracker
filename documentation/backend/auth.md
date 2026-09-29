# Authentication & Security Module (`AuthModule`)

The `AuthModule` provides zero-trust identity authentication, multi-factor verification, and session governance for BugTracker.

---

## 1. Authentication Flow Diagram

### Rendered Sequence Diagram
![Auth Security Flow](../architecture/diagrams/auth_security_flow.png)

<details>
<summary><b>Click to expand Mermaid Source Code</b></summary>

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Browser
    participant API as NestJS AuthController
    participant Captcha as CaptchaService
    participant Users as UsersService
    participant Audit as SecurityAuditService
    participant Mail as Mailpit SMTP
    participant DB as PostgreSQL 15

    Client->>API: POST /api/v1/auth/register (Email, Password, Turnstile Token)
    API->>Captcha: validateToken(turnstileToken)
    API->>Users: hashPassword(Argon2id)
    API->>DB: INSERT User (isActive = false, activationToken)
    API->>Mail: sendActivationEmail(activationLink)
    API-->>Client: 201 Created

    Client->>API: GET /api/v1/auth/activate?token=XYZ
    API->>DB: UPDATE User SET isActive = true
    API-->>Client: 200 OK

    Client->>API: POST /api/v1/auth/login (Email, Password)
    alt Invalid Password
        API->>Audit: recordFailure(email, ip, bad_credentials)
        API-->>Client: 401 Unauthorized
    else Valid Password & 2FA Enabled
        API->>Audit: recordChallenge(email, ip, 2fa_required)
        API-->>Client: 200 OK { requires2FA: true, tempToken }
        Client->>API: POST /api/v1/auth/2fa/verify (tempToken, totpCode)
        API->>Audit: recordSuccess(email, ip, login_success)
        API-->>Client: 200 OK + Set-Cookie: access_token, refresh_token
    end
```
</details>

---

## 2. Key Security Mechanisms

### Cryptography & Passwords
* **Argon2id**: Passwords hashed using Argon2id with memory cost 65536 KiB, time cost 3, parallelism 4.
* **TOTP 2FA (RFC 6238)**: `otplib` generates base32 secret and pairs with authenticator apps (Google Authenticator, Authy).
* **Cloudflare Turnstile**: Client tokens validated via Cloudflare siteverify endpoint in `CaptchaService`.

### Session Management
* **Dual-Token Cookie Model**:
  * `access_token`: Short-lived (15 min) JWT containing `{ sub, email, role }`.
  * `refresh_token`: Long-lived (7 days) signed token.
  * Both cookies set with `httpOnly: true`, `SameSite: Lax`, and `secure` in production.

### Brute-Force & Lockout Protection
* Tracks consecutive failed login attempts in `User.failedLoginAttempts`.
* 5 failed attempts trigger a 15-minute account freeze (`User.lockoutUntil`).
* Every attempt emits an audit record via `SecurityAuditService`.

---

## 3. Primary Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/register` | Register new user with password & CAPTCHA | Public |
| `POST` | `/login` | Authenticate with email & password | Public |
| `GET` | `/activate` | Verify single-use account activation token | Public |
| `POST` | `/logout` | Invalidate cookies and end active session | User |
| `POST` | `/forgot-password` | Request password reset token to email | Public |
| `POST` | `/reset-password` | Reset password using verified token | Public |
| `POST` | `/2fa/generate` | Generate TOTP secret and QR code URI | User |
| `POST` | `/2fa/enable` | Confirm TOTP code and enable 2FA | User |
| `POST` | `/2fa/verify` | Complete 2FA login challenge with temp token | Public |
| `GET` | `/github` | Initiate GitHub OAuth2 authorization redirect | Public |
| `GET` | `/github/callback` | OAuth2 callback exchanging code for session | Public |

---

## 4. Key Source Files
* Controller: [`auth.controller.ts`](../../backend/src/modules/auth/auth.controller.ts)
* Service: [`auth.service.ts`](../../backend/src/modules/auth/auth.service.ts)
* Captcha: [`captcha.service.ts`](../../backend/src/modules/captcha/captcha.service.ts)
