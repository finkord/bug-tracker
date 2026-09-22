#!/usr/bin/env bash
# ==============================================================================
# Useful CLI Commands for Bug / Issue Tracking System
# ==============================================================================

# 1. Project Scaffolding
# Scaffolding the NestJS backend application:
nest new bug-tracker --directory backend --package-manager npm --skip-git --no-observe

# 2. Local Infrastructure (Docker Compose)
# Start all infrastructure containers (Postgres, Redis, Mailpit, SeaweedFS) in background:
docker compose up -d

# Check status of running containers:
docker compose ps

# View container logs:
docker compose logs -f

# Stop all containers:
docker compose down

# Stop all containers and remove persistent volumes (database reset):
docker compose down -v

# 3. Backend Development
# Install backend dependencies:
cd backend && npm install

# Build the NestJS application:
cd backend && npm run build

# Run unit tests:
cd backend && npm test

# Start development server with live reload:
cd backend && npm run start:dev

# Access developer interfaces:
# - Mailpit Web Dashboard: http://localhost:8025
# - SeaweedFS Master UI:   http://localhost:9333
# - SeaweedFS S3 Endpoint: http://localhost:8333
# - Backend API & Swagger: http://localhost:3000/api/docs

# 4. SDSecurity Lab 6 Demonstration & Verification Commands (All 7 Tasks)

# Task 1: Registration with Password Policy Enforcement
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Vasyl Fufalko","email":"user@example.com","password":"SecurePassword!2026","captchaToken":"valid-captcha-token"}'

# Task 2: CAPTCHA Verification (Rejection on missing/invalid token)
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Bot User","email":"bot@example.com","password":"SecurePassword!2026","captchaToken":""}'

# Task 3: Account Activation via Email Token
# Retrieve token from Mailpit (http://localhost:8025) and call:
# curl -s "http://localhost:3000/api/v1/auth/activate?token=<ACTIVATION_TOKEN>"

# Task 4: Brute-Force Protection & Account Lockout (5 failed attempts trigger 15-min lockout)
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"WrongPassword123!"}'
  echo ""
done

# Task 4: Admin Audit Log Retrieval
# curl -s http://localhost:3000/api/v1/admin/security/login-logs -H "Authorization: Bearer <ADMIN_TOKEN>"

# Task 5: Two-Factor Authentication (TOTP / Google Authenticator)
# 1. Generate 2FA Secret & QR Code:
# curl -s -X POST http://localhost:3000/api/v1/auth/2fa/generate -H "Authorization: Bearer <TOKEN>"
# 2. Confirm and Enable 2FA:
# curl -s -X POST http://localhost:3000/api/v1/auth/2fa/enable -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"code":"<6_DIGIT_CODE>"}'
# 3. Verify 2FA challenge on login:
# curl -s -X POST http://localhost:3000/api/v1/auth/2fa/verify -H "Content-Type: application/json" -d '{"tempToken":"<TEMP_TOKEN>","code":"<6_DIGIT_CODE>"}'

# Task 6: External Identity Providers (OAuth2 / GitHub)
# Initiate OAuth redirect in browser:
# http://localhost:3000/api/v1/auth/github
# Or simulate OAuth verification via mock endpoint:
# curl -s -X POST http://localhost:3000/api/v1/auth/oauth/mock -H "Content-Type: application/json" -d '{"provider":"GITHUB","oauthId":"gh-12345","email":"dev@github.local","fullName":"GitHub Dev"}'

# Task 7: Password Reset via Email Token
# 1. Request Reset Link:
# curl -s -X POST http://localhost:3000/api/v1/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"user@example.com"}'
# 2. Reset Password using token received in Mailpit:
# curl -s -X POST http://localhost:3000/api/v1/auth/reset-password -H "Content-Type: application/json" -d '{"token":"<RESET_TOKEN>","newPassword":"BrandNewPass!2026"}'

