# API Verification & Security Test Suite

This document provides automated curl recipes to verify security controls, authentication flows, and API endpoints against the live backend (`http://localhost:3000`).

---

## 1. Authentication Security Verification (7 Core Scenarios)

### Scenario 1: User Registration with Strong Password
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Engineer",
    "email": "test.engineer@bugtracker.local",
    "password": "SecurePassword!2026",
    "captchaToken": "valid-turnstile-token"
  }'
```
* **Expected Result**: `201 Created` with message indicating activation email was sent.

### Scenario 2: Bot Prevention (Turnstile CAPTCHA)
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Bot Attempt",
    "email": "bot@example.com",
    "password": "SecurePassword!2026",
    "captchaToken": ""
  }'
```
* **Expected Result**: `400 Bad Request` rejecting empty CAPTCHA token.

### Scenario 3: Single-Use Email Activation
```bash
# 1. Attempt login before activation (fails with 401):
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.engineer@bugtracker.local","password":"SecurePassword!2026"}'

# 2. Extract activation token from Mailpit (http://localhost:8025) and activate:
curl -s "http://localhost:3000/api/v1/auth/activate?token=<ACTIVATION_TOKEN>"
```
* **Expected Result**: Pre-activation fails with `401 Unauthorized`; activation endpoint returns `200 OK`.

### Scenario 4: Brute-Force Lockout Protection (5 Failed Attempts)
```bash
for i in {1..5}; do
  echo "Attempt $i:"
  curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"volodymyr@bugtracker.local","password":"WrongPassword123!"}'
  echo ""
done
```
* **Expected Result**: Attempts 1–4 return `401 Unauthorized`; attempt 5 triggers account freeze (`Account locked for 15 minutes`).

### Scenario 5: TOTP Two-Factor Authentication (RFC 6238)
```bash
# 1. Generate 2FA Secret & QR Code:
curl -s -X POST http://localhost:3000/api/v1/auth/2fa/generate \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 2. Confirm and Enable 2FA:
curl -s -X POST http://localhost:3000/api/v1/auth/2fa/enable \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"code":"<6_DIGIT_TOTP_CODE>"}'

# 3. Complete 2FA login challenge:
curl -s -X POST http://localhost:3000/api/v1/auth/2fa/verify \
  -H "Content-Type: application/json" \
  -d '{"tempToken":"<TEMP_TOKEN>","code":"<6_DIGIT_TOTP_CODE>"}'
```

### Scenario 6: Password Reset Flow via Email
```bash
# 1. Dispatch password reset token:
curl -s -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test.engineer@bugtracker.local"}'

# 2. Reset password using Mailpit token:
curl -s -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<RESET_TOKEN>","newPassword":"BrandNewPassword!2026"}'
```

---

## 2. Admin Security Audit Log Inspection
```bash
curl -s http://localhost:3000/api/v1/admin/security/login-logs \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```
