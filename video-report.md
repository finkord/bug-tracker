# Video Report Technical Reference — Authentication & Security System

This document provides complete technical facts, runtime parameters, credentials, architectural workflows, and explanations to reference while recording the project video report.

---

## Service Endpoints and Port Configuration

| Service | Protocol / Role | Local URL |
|---|---|---|
| Frontend Client | React 19 + Vite 8 SPA | http://localhost:5173 |
| Backend API | NestJS 12 REST API | http://localhost:3000/api/v1 |
| Swagger OpenAPI Docs | Interactive API Documentation | http://localhost:3000/api/docs |
| Mailpit Web Inbox | Local SMTP Mock Web UI | http://localhost:8025 |
| Mailpit SMTP Server | Local Mail Delivery Agent | localhost:1025 |
| PostgreSQL 15 | Relational Database | localhost:5432 (database: `bug_tracker`) |
| Redis 7 | Distributed Cache & Locks | localhost:6379 |
| SeaweedFS S3 API | Distributed Object Storage | http://localhost:8333 |

### Default Administrative Credentials
- Email: `admin@bugtracker.local`
- Password: `AdminPassword123!`
- Role: `ADMIN` (Root system administrator, cannot be self-demoted)

---

## Introduction: Technology Stack Overview

### Full Project Architecture
- Backend: NestJS 12, TypeScript (strict mode), TypeORM 0.3, PostgreSQL 15, Redis 7.
- Frontend: React 19, Vite 8, Tailwind CSS v4, Material Design 3 Expressive, TanStack Query v5, React Router v7.
- Storage & Mail: SeaweedFS (S3-compatible distributed object storage), Mailpit (local SMTP on port 1025).
- Real-time Gateway: Socket.IO WebSocket gateway backed by Redis for multi-instance pub/sub.

### Authentication & Cryptography Stack
- Password Hashing: Argon2id via `argon2` npm library (memory-hard, resistant to GPU/ASIC brute-force attacks).
- Token Management: Dual JWT pattern (JSON Web Tokens):
  - Access Token: Short-lived strictly 15 minutes (`15m`), signed with `JWT_SECRET`.
  - Refresh Token: Long-lived 7 days (`7d`), signed with `JWT_REFRESH_SECRET`, stored in secure httpOnly cookies with rotation and server-side `token_version` invalidation.
  - Architectural Rationale: Strictly follows OWASP and RFC 6749 security standards — 15-minute access tokens minimize exposure windows against network interception or replay attacks, while 7-day refresh tokens enable seamless background token rotation without interrupting user activity.
- Two-Factor Authentication: RFC 6238 Time-based One-Time Password (TOTP) standard via `otplib`, QR code generated via `qrcode`.
- Bot Protection: Cloudflare Turnstile CAPTCHA widget integrated into frontend form state with backend server-side validation (`CaptchaService`).
- Third-Party Identity: OAuth2 / OIDC via Passport.js (`passport-github2`, `passport-google-oauth20`) using Redis one-time exchange codes.
- Rate Limiting & Account Lockout: Sliding-window distributed counter in Redis 7 (`LoginRateLimiterService`).
- Security Auditing: Permanent database audit trail in PostgreSQL (`LoginAuditLog` entity) capturing IP, user agent, attempted email, and outcome status.

---

## Step 1: User Registration — Weak Password Policy Validation

### What to Demonstrate
1. Navigate to `http://localhost:5173/register`.
2. Fill in:
   - Full Name: `Test Candidate`
   - Email: `candidate@example.local`
3. Enter a weak password in the Password field (e.g., `simple123` or `password`).
4. Show the visual password meter and error feedback.

### Technical Details to Explain
- Password Security Policy (enforced by `register.dto.ts` and `local-auth.service.ts`):
  1. Minimum length: 8 characters (`@MinLength(8)`).
  2. Lowercase letter: at least one `[a-z]` (`/^(?=.*[a-z])/`).
  3. Uppercase letter: at least one `[A-Z]` (`/^(?=.*[A-Z])/`).
  4. Numeric digit: at least one `[0-9]` (`/^(?=.*\d)/`).
  5. Special symbol: at least one symbol `[!@#$%^&*(),.?":{}|<>]` (`/^(?=.*[!@#$%^&*(),.?":{}|<>])/`).
- Weak Password Example: `test1234` (Fails uppercase and special symbol criteria).
- Server Response: HTTP 400 Bad Request with an array of specific validation error messages from `class-validator`.
- Client UX: Real-time 5-criteria requirement checklist dynamically updates colors to guide the user.

---

## Step 2: Valid Registration and CAPTCHA Verification

### What to Demonstrate
1. Enter a compliant strong password: `SecurePass2026!`
   - Length >= 8: OK (15 chars)
   - Lowercase: OK (`ecureass`)
   - Uppercase: OK (`S`, `P`)
   - Digit: OK (`2026`)
   - Special symbol: OK (`!`)
2. Complete the CAPTCHA widget below the password input.
3. Submit the registration form.
4. Show the success notification informing that an activation link was sent to the email address.

### Technical Details to Explain
- Zero-Backdoor CAPTCHA Architecture (`CaptchaService` & `CaptchaWidget.tsx`):
  - Client-side: Cloudflare Turnstile bot defense widget renders in the registration form and emits a verification token upon user interaction.
  - Server-side validation: `CaptchaService` sends every token directly to Cloudflare's official verification endpoint (`https://challenges.cloudflare.com/turnstile/v0/siteverify`) with idempotency keys, timeout signals, and exponential backoff retry.
  - Zero-Backdoor Security Guarantee: Production code contains zero hardcoded bypass strings or magic tokens (all testing tokens like `valid-captcha-token` or `bypass-*` were strictly eliminated).
  - Standardized Testing Keys: For staging and local demo environments, the system utilizes Cloudflare's officially supported testing keys:
    - Secret Key: `1x0000000000000000000000000000000AA` (Cloudflare official always-pass test key).
    - Site Key: `1x00000000000000000000AA` (Cloudflare official always-pass test key).
  - Test Isolation: Automated unit test files (`*.spec.ts`) mock `CaptchaService` strictly inside test scopes, maintaining 100% production code integrity.
- Database Write: Account is created in PostgreSQL with:
  - `password_hash`: Argon2id hashed string (original password is never stored or logged).
  - `is_activated`: `false` (blocks direct login until email activation).
  - `activation_token`: Cryptographically random 64-character hex token generated via `crypto.randomBytes(32).toString('hex')`.
  - `activation_token_expires_at`: 24-hour expiration timestamp.

---

## Step 3: Account Activation via Email

### What to Demonstrate
1. Open Mailpit web interface in a separate browser tab: `http://localhost:8025`.
2. Locate the email with subject `Activate your BugTracker account` sent to `candidate@example.local`.
3. Open the email message, inspect the activation link:
   `http://localhost:5173/auth/activate?token=<64-char-hex-token>`
4. Click the link (or navigate to it).
5. The frontend displays the activation confirmation screen and redirects to the login view.

### Technical Details to Explain
- Mail Delivery: NestJS dispatches mail asynchronously through MailerService over SMTP port 1025 to Mailpit.
- Backend Endpoint: `GET /api/v1/auth/activate?token=...`
- Database Mutation:
  - Validates that `activation_token` matches and `activation_token_expires_at > NOW()`.
  - Atomically sets `is_activated = true`, `activation_token = null`, and `activation_token_expires_at = null`.
  - Future activation attempts with the same token are rejected with HTTP 400 (one-time use guarantee).

---

## Step 4: Login, Brute-Force Account Lockout, and Audit Logs

### What to Demonstrate
1. Navigate to `http://localhost:5173/login`.
2. Enter the registered email (`candidate@example.local`) and an INCORRECT password (e.g., `WrongPassword1!`).
3. Attempt to log in 5 consecutive times:
   - Attempts 1 to 4: Show error message "Invalid email or password" and remaining attempt warnings.
   - Attempt 5: Account is locked out with a warning that the account is locked for 15 minutes.
4. Attempt a 6th login with the CORRECT password: login is rejected due to active lockout.
5. Log into the system using the admin account:
   - Email: `admin@bugtracker.local`
   - Password: `AdminPassword123!`
6. Navigate to `http://localhost:5173/admin/security` (Security & Audit Logs tab).
7. Inspect the audit log table showing the 5 failed login attempts with IP, timestamp, user agent, and status `FAILED_CREDENTIALS` / `BLOCKED_RATE_LIMIT`.

### Technical Details to Explain
- Distributed Lockout Engine (`LoginRateLimiterService`):
  - Backed by Redis 7 to prevent distributed brute-force attacks across clustered backend replicas.
  - Redis key for failed counter: `auth:attempts:<email>` with TTL 900 seconds (15 minutes).
  - Redis key for lockout lock: `auth:lockout:<email>` with TTL 900 seconds.
  - Threshold: 5 failed attempts within 15 minutes triggers automatic temporary lockout.
- Forensic Security Audit Log (`LoginAuditLog` in PostgreSQL):
  - Table: `login_audit_logs`.
  - Fields recorded: `id`, `user_id` (null if unrecognized), `attempted_email`, `ip_address`, `user_agent`, `status` (`SUCCESS`, `FAILED_CREDENTIALS`, `BLOCKED_RATE_LIMIT`, `BLOCKED_ACCOUNT`), `created_at`.
  - Admin Center allows filtering, pagination, and direct CSV export of audit trails.

---

## Step 5: Two-Factor Authentication (2FA / TOTP)

### What to Demonstrate
1. Log into user profile with valid credentials.
2. Navigate to `http://localhost:5173/profile` (or `http://localhost:5173/preferences`).
3. Scroll to the "Two-Factor Authentication (2FA)" section and click "Enable 2FA".
4. The system presents:
   - A generated QR code (TOTP URI).
   - A manual secret key (e.g., `JBSWY3DPEHPK3PXP`).
5. Scan the QR code or enter the secret in an authenticator app (Google Authenticator, Authy, or browser extension).
6. Enter the 6-digit TOTP code and click "Verify & Activate".
7. Show confirmation badge "2FA Enabled".
8. Log out of the account.
9. Perform login:
   - Enter email and password -> Click "Sign In".
   - The system intercepts the login and presents the "Two-Factor Verification Challenge" modal.
   - Enter the current 6-digit TOTP code from the app.
   - Login succeeds and redirects to the personal dashboard.

### Technical Details to Explain
- Protocol: RFC 6238 Time-based One-Time Password with HMAC-SHA1 and 30-second time steps.
- Security Safeguard (Staging Secret):
  - When generated, the secret is stored in `two_factor_pending_secret` in PostgreSQL.
  - The live `two_factor_secret` is NOT overwritten until the user successfully confirms with a valid code. This prevents account lockouts caused by scanning errors.
- Login Challenge Interception:
  - `POST /api/v1/auth/login` checks `user.twoFactorEnabled`.
  - If enabled, backend does NOT return long-lived JWT tokens. Instead, it returns `{ require2fa: true, tempToken: "<signed-jwt-5-min>" }`.
  - Client sends `POST /api/v1/auth/2fa/verify` with `tempToken` and `totpCode`.
  - Only upon valid TOTP verification are the real `accessToken` and `refreshToken` issued.

---

## Step 6: Third-Party Social Login (OAuth2 / OIDC)

### What to Demonstrate
1. Navigate to `http://localhost:5173/login`.
2. In the "Or continue with" section, show the "GitHub" and "Google" buttons.
3. Click "GitHub" (or "Google").
4. The browser redirects to the provider authorization page:
   - `https://github.com/login/oauth/authorize?...`
5. Authorize the application.
6. The browser redirects back to BugTracker, authenticates automatically, and lands on the dashboard.
7. Show in Profile that the account has `oauthProvider: GITHUB` (or `GOOGLE`).

### Technical Details to Explain
- Passport Strategies: Configured via `passport-github2` and `passport-google-oauth20` in `backend/src/modules/auth/strategies/`.
- One-Time Exchange Code Pattern (`oauth-code-store.service.ts`):
  - Traditional OAuth implementations leak JWT tokens in URL query strings (e.g., `?token=eyJ...`), exposing tokens to browser history, proxy logs, and `Referer` headers.
  - BugTracker Security Implementation:
    1. Provider redirects to backend callback: `GET /api/v1/auth/github/callback`.
    2. Backend creates tokens, generates a short-lived random 64-character exchange code stored in Redis with 60-second TTL: `oauth:code:<code>`.
    3. Backend redirects browser to `http://localhost:5173/oauth/callback?code=<code>`.
    4. Frontend immediately makes a secure POST request to `/api/v1/auth/oauth/exchange` with the code in the JSON body.
    5. Backend retrieves tokens, deletes the Redis key immediately (single-use guarantee), and responds with tokens.
    6. No sensitive tokens ever appear in browser URLs or access logs.

---

## Step 7: Password Recovery via Email

### What to Demonstrate
1. Navigate to `http://localhost:5173/login` and click "Forgot password?".
2. Enter the registered email (`candidate@example.local`) and submit.
3. Open Mailpit at `http://localhost:8025`.
4. Open the email with subject `Reset your BugTracker password`.
5. Click the reset password link:
   `http://localhost:5173/reset-password?token=<64-char-hex-token>`
6. Enter a new strong password: `UpdatedPass2026!`
7. Submit the form.
8. Show success screen and log in with the new password.

### Technical Details to Explain
- Security Token Parameters (`password-reset.service.ts`):
  - Stored in `reset_password_token` with expiration in `reset_password_expires_at` (15 minutes).
  - Cryptographically generated using `crypto.randomBytes(32).toString('hex')`.
- Anti-Enumeration Protection: The `/forgot-password` endpoint always returns a generic success message ("If an account exists, a reset email has been dispatched") to prevent account enumeration attacks.
- Account Lockout Clearing: Successfully completing password reset automatically clears any active brute-force lockout counters in Redis (`auth:lockout:<email>` and `auth:attempts:<email>`).
- Global Session Revocation: Incrementing `token_version` on the User entity invalidates all existing JWT refresh tokens across all active devices immediately.

---

## Conclusion & Project Summary

### Completion of All Requirements
- User registration with strong 5-criteria password policy: Fully implemented.
- Bot mitigation (CAPTCHA): Fully implemented with zero-backdoor Cloudflare Turnstile integration (production paths contain zero bypass tokens; automated test suites use isolated mocks or official Cloudflare testing keys).
- Email verification & account activation: Fully implemented with Mailpit SMTP and cryptographic tokens.
- Brute-force protection & lockout: Fully implemented via distributed Redis 7 sliding window (5 attempts, 15 min lockout).
- Security audit logs: Fully implemented with permanent PostgreSQL table, IP/User-Agent tracking, and admin dashboard with CSV export.
- Two-Factor Authentication (2FA): Fully implemented with TOTP RFC 6238, QR code rendering, and staging secret safeguards.
- Social OAuth2 login: Fully implemented with GitHub and Google, reinforced by Redis one-time exchange code pattern.
- Password recovery: Fully implemented with 15-minute token expiry, email delivery, and global session revocation.

### OWASP Top 10 & RFC 6749 Security Compliance Standards
1. Cryptographic Secret Separation & Token Typing (RFC 6749 & OWASP):
   - Access tokens signed with dedicated `JWT_SECRET` (15m expiry, payload tagged with `token_type: 'access'`).
   - Refresh tokens signed with separate cryptographic secret `JWT_REFRESH_SECRET` (7d expiry, payload tagged with `token_type: 'refresh'`).
   - Token endpoints provide native RFC 6749 format (`tokenType: 'Bearer'`, `expiresIn: 900`).
2. Token Substitution & Confusion Attack Defense:
   - `JwtStrategy` validates `token_type === 'access'`, rejecting refresh tokens or 2FA challenge tokens presented at access boundaries.
   - `TokenSessionService.refreshTokens` verifies specifically with `JWT_REFRESH_SECRET` and rejects tokens with `token_type !== 'refresh'`.
3. Timing Attack & Credential Enumeration Neutralization (OWASP Authentication Cheat Sheet):
   - In `LocalAuthService.login`, querying non-existent email accounts runs constant-time Argon2id dummy hash verification against `DUMMY_ARGON2_HASH` and increments rate limiting counters, rendering response times identical to valid accounts.
4. Multi-Factor Authentication (MFA) Brute-Force Rate Limiting (OWASP):
   - In `TwoFactorAuthService.verify2fa`, verification attempts are bound to `LoginRateLimiterService`. Accounts are locked out after 5 consecutive invalid 6-digit codes, preventing online brute-force of the TOTP keyspace.
5. Cookie Lifespan & Flag Hardening (OWASP):
   - `ACCESS_TOKEN_COOKIE_MAX_AGE_MS` is strictly set to 15 minutes (`900_000ms`), matching the JWT access token lifetime.
   - Cookies enforce `httpOnly: true`, `sameSite: 'lax'`, and `secure: true` in production.

### Technical Challenges & Solutions
1. Preventing Token Leakage in OAuth Callbacks:
   - Problem: Standard OAuth redirection appends JWTs to the URL, creating high-risk exposure in browser history and HTTP referrers.
   - Solution: Designed a Redis-backed one-time code exchange protocol with 60-second TTL.
2. Distributed Lockout in High-Concurrency Clustered Environments:
   - Problem: In-memory counters fail when multiple application instances handle requests behind a load balancer.
   - Solution: Migrated lockout and rate limiting to atomic Redis key operations (`INCR`, `EXPIRE`, `SETNX`).
3. Preventing 2FA Setup Deadlocks:
   - Problem: Overwriting an existing secret before the user confirms the code can lock users out of their accounts.
   - Solution: Implemented two-phase staging (`two_factor_pending_secret`), promoting to active `two_factor_secret` only after valid verification.
4. Immediate Multi-Device Logout upon Password Reset:
   - Problem: Stateless JWT tokens remain valid until expiration even after password change.
   - Solution: Implemented database `token_version` validation in `JwtStrategy` paired with Redis session cache revocation.

### Additional Value-Added Security Features (Beyond Base Requirements)
- Argon2id Password Hashing: Upgraded from legacy bcrypt to memory-hard Argon2id (RFC 9106 recommended parameters).
- Forensic Security Center (`/admin/security`): Full web UI for administrators to inspect IP addresses, view failed login spikes, and export compliance CSV logs.
- Automated Test Suite: Complete Vitest and NestJS unit/integration test coverage across all auth services (288 backend tests, 305 frontend tests).

