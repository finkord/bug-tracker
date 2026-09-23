#!/usr/bin/env bash
# ==============================================================================
# Operational & Verification CLI Commands for Bug / Issue Tracking System
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Local Infrastructure (Docker Compose)
# ------------------------------------------------------------------------------
# Start all infrastructure containers (PostgreSQL 15, Redis 7, Mailpit, SeaweedFS):
docker compose up -d

# Check status of running containers:
docker compose ps

# View container logs:
docker compose logs -f

# Stop all containers:
docker compose down

# Reset database and storage (destroys persistent Docker volumes):
docker compose down -v

# ------------------------------------------------------------------------------
# 2. Development Mode (Hot-Reload & Local Tooling)
# ------------------------------------------------------------------------------
# Install dependencies:
cd backend && npm install
cd ../frontend && npm install

# Start Backend in Development Watch Mode:
cd backend && npm run start:dev

# Start Frontend in Development Mode (Vite on port 5173):
cd frontend && npm run dev

# Run unit tests:
cd backend && npm test

# ------------------------------------------------------------------------------
# 3. Production Regime (Production Build & Serving)
# ------------------------------------------------------------------------------
# Build NestJS backend distribution bundle (outputs to backend/dist):
cd backend && npm run build

# Start Backend in Production Mode:
cd backend && NODE_ENV=production PORT=3000 npm run start:prod

# Build React SPA production bundle (outputs to frontend/dist):
cd frontend && npm run build

# Preview Frontend production bundle locally:
cd frontend && npm run preview -- --port 5173

# Single-command execution from 'software/' directory:
# (cd backend && npm run build && NODE_ENV=production PORT=3000 npm run start:prod) & (cd frontend && npm run build && npm run preview -- --port 5173)

# Single-command execution from repository root ('PPofSE/'):
# (cd software/backend && npm run build && NODE_ENV=production PORT=3000 npm run start:prod) & (cd software/frontend && npm run build && npm run preview -- --port 5173)

# Full production launch sequence:
# 1. cd software && docker compose up -d
# 2. cd software/backend && npm run build && NODE_ENV=production PORT=3000 npm run start:prod
# 3. cd software/frontend && npm run build && npm run preview -- --port 5173

# ------------------------------------------------------------------------------
# 4. Developer Portals & Interface Access
# ------------------------------------------------------------------------------
# - Frontend Application:  http://localhost:5173
# - Backend API & Swagger: http://localhost:3000/api/docs
# - Mailpit Web Inbox:     http://localhost:8025
# - SeaweedFS Master UI:   http://localhost:9333
# - SeaweedFS S3 Endpoint: http://localhost:8333

# ------------------------------------------------------------------------------
# 5. SDSecurity Lab 6 Verification Commands (All 7 Tasks)
# ------------------------------------------------------------------------------

# Task 1: Registration with Complex Password Policy
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Vasyl Fufalko","email":"user@example.com","password":"SecurePassword!2026","captchaToken":"valid-captcha-token"}'

# Task 2: Bot Prevention (CAPTCHA)
# Missing token fails with 400 Bad Request:
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Bot User","email":"bot@example.com","password":"SecurePassword!2026","captchaToken":""}'

# Task 3: Email Account Activation (Strict Single-Use Token)
# Attempting to sign in before activation fails with 401 Unauthorized:
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePassword!2026"}'

# Retrieve the activation token from Mailpit (http://localhost:8025) and activate:
# curl -s "http://localhost:3000/api/v1/auth/activate?token=<ACTIVATION_TOKEN>"

# Task 4: Brute-Force Protection & Account Lockout (5 failed attempts trigger 15-min lockout)
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"WrongPassword123!"}'
  echo ""
done

# Task 4: Admin Security Audit Log Inspection
# curl -s http://localhost:3000/api/v1/admin/security/login-logs -H "Authorization: Bearer <ADMIN_TOKEN>"

# Task 5: Two-Factor Authentication (TOTP RFC 6238)
# 1. Generate 2FA Secret & QR Code:
# curl -s -X POST http://localhost:3000/api/v1/auth/2fa/generate -H "Authorization: Bearer <TOKEN>"
# 2. Confirm and Enable 2FA:
# curl -s -X POST http://localhost:3000/api/v1/auth/2fa/enable -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"code":"<6_DIGIT_CODE>"}'
# 3. Complete 2FA login challenge:
# curl -s -X POST http://localhost:3000/api/v1/auth/2fa/verify -H "Content-Type: application/json" -d '{"tempToken":"<TEMP_TOKEN>","code":"<6_DIGIT_CODE>"}'

# Task 6: External Identity Providers (OAuth2 / GitHub)
# Initiate OAuth redirect in browser:
# http://localhost:3000/api/v1/auth/github
# Note: Mock OAuth (/auth/oauth/mock) is strictly disabled in production mode.

# Task 7: Password Reset Flow via Email
# 1. Request Reset Link (dispatched exclusively via email):
# curl -s -X POST http://localhost:3000/api/v1/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"user@example.com"}'
# 2. Reset Password using token received in Mailpit inbox:
# curl -s -X POST http://localhost:3000/api/v1/auth/reset-password -H "Content-Type: application/json" -d '{"token":"<RESET_TOKEN>","newPassword":"BrandNewPass!2026"}'
