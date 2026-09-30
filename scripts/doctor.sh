#!/usr/bin/env bash
# ==============================================================================
# BugTracker Environment Diagnostic Tool ("Doctor")
# ==============================================================================
# Validates developer prerequisites, dependencies, port bindings, and Docker health.
# ==============================================================================

set -e

# ANSI Colors
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
CYAN="\033[36m"
BOLD="\033[1m"
RESET="\033[0m"

pass() {
  printf "  ${GREEN}[PASS]${RESET} %-40s ${GREEN}%s${RESET}\n" "$1" "$2"
}

fail() {
  printf "  ${RED}[FAIL]${RESET} %-40s ${RED}%s${RESET}\n" "$1" "$2"
  ERRORS=$((ERRORS + 1))
}

warn() {
  printf "  ${YELLOW}[WARN]${RESET} %-40s ${YELLOW}%s${RESET}\n" "$1" "$2"
  WARNINGS=$((WARNINGS + 1))
}

ERRORS=0
WARNINGS=0

echo ""
printf "  ${BOLD}${CYAN}BugTracker Environment Health Check${RESET}\n"
printf "  ======================================================================\n"
echo ""

# 1. System Binaries & Runtimes
printf "  ${BOLD}1. System Prerequisites${RESET}\n"

if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v)
  pass "Node.js installed" "$NODE_VER"
else
  fail "Node.js installed" "Not found (Node.js >= 20/24 required)"
fi

if command -v npm >/dev/null 2>&1; then
  NPM_VER=$(npm -v)
  pass "npm package manager" "v$NPM_VER"
else
  fail "npm package manager" "Not found"
fi

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    DOCKER_VER=$(docker --version | awk '{print $3}' | tr -d ',')
    pass "Docker Daemon" "Running (v$DOCKER_VER)"
  else
    fail "Docker Daemon" "Installed but daemon is not running"
  fi
else
  fail "Docker CLI" "Not found (Docker is required for databases)"
fi

if command -v make >/dev/null 2>&1; then
  pass "GNU Make" "Available"
else
  warn "GNU Make" "Not found (Install build-essential or make)"
fi

echo ""

# 2. Environment Configuration
printf "  ${BOLD}2. Environment Configuration${RESET}\n"

if [ -f "backend/.env" ]; then
  pass "backend/.env" "Present"
else
  warn "backend/.env" "Missing! Run 'make env' to create from template"
fi

if [ -f "frontend/.env" ]; then
  pass "frontend/.env" "Present"
else
  warn "frontend/.env" "Missing! Run 'make env' to create from template"
fi

echo ""

# 3. Docker Infrastructure Status
printf "  ${BOLD}3. Docker Infrastructure Status${RESET}\n"

check_container() {
  NAME=$1
  PORT=$2
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${NAME}$"; then
    pass "Container ${NAME}" "Running on port ${PORT}"
  else
    warn "Container ${NAME}" "Stopped (Run 'make infra-up' to start)"
  fi
}

check_container "bugtracker-postgres" "5432"
check_container "bugtracker-redis" "6379"
check_container "bugtracker-mailpit" "8025 / 1025"
check_container "bugtracker-seaweedfs" "8333 / 9333"

echo ""

# 4. Port Availability for Dev Servers
printf "  ${BOLD}4. Dev Port Availability${RESET}\n"

check_port() {
  SERVICE=$1
  PORT=$2
  if command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 "$PORT" >/dev/null 2>&1; then
      warn "Port ${PORT} (${SERVICE})" "Port is currently in use"
    else
      pass "Port ${PORT} (${SERVICE})" "Free and ready"
    fi
  elif command -v ss >/dev/null 2>&1; then
    if ss -tuln | grep -q ":${PORT} "; then
      warn "Port ${PORT} (${SERVICE})" "Port is currently in use"
    else
      pass "Port ${PORT} (${SERVICE})" "Free and ready"
    fi
  else
    pass "Port ${PORT} (${SERVICE})" "Scanner skipped (nc/ss not installed)"
  fi
}

check_port "Backend NestJS" "3000"
check_port "Frontend Vite" "5173"

echo ""

# Summary
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  printf "  ${GREEN}${BOLD}[PASS] Environment is healthy and ready for development!${RESET}\n"
elif [ "$ERRORS" -eq 0 ]; then
  printf "  ${YELLOW}${BOLD}[WARN] Environment is functional with %d warning(s).${RESET}\n" "$WARNINGS"
else
  printf "  ${RED}${BOLD}[FAIL] Environment has %d critical error(s) and %d warning(s). Please fix them.${RESET}\n" "$ERRORS" "$WARNINGS"
fi
echo ""
