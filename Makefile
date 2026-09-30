# ==============================================================================
# BugTracker — Developer Workflow Makefile
# ==============================================================================
# Usage:
#   make [target]
#   make help       Display this help menu
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ANSI Color codes for styled terminal output
CYAN    := \033[36m
GREEN   := \033[32m
YELLOW  := \033[33m
BLUE    := \033[34m
MAGENTA := \033[35m
RED     := \033[31m
RESET   := \033[0m
BOLD    := \033[1m

.PHONY: help setup env doctor dev dev-backend dev-frontend dev-stop dev-down dev-clean dev-reset \
        infra-up infra-down infra-logs infra-ps infra-reset wait-infra \
        init-system seed seed-demo db-shell redis-shell \
        test test-backend test-frontend test-watch test-cov \
        lint typecheck check build clean \
        prod-build prod-up prod-down prod-logs prod-init prod-seed

# ------------------------------------------------------------------------------
# 1. Self-Documenting Help Menu
# ------------------------------------------------------------------------------
help:
	@echo ""
	@printf "  $(BOLD)$(CYAN)BugTracker Developer CLI$(RESET)\n"
	@printf "  $(YELLOW)======================================================================$(RESET)\n"
	@echo ""
	@printf "  $(BOLD)[DEV] Development Workflows$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev" "Start backend and frontend together with unified colored logs"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-backend" "Start only NestJS backend in watch mode (port 3000)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-frontend" "Start only Vite React frontend (port 5173)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-stop" "Stop local development processes (ports 3000 and 5173)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-down" "Stop backing infrastructure containers safely"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-clean" "Teardown dev servers, docker volumes, and build caches"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-reset" "Reset database and storage volumes, restart, and initialize"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make setup" "Bootstrap full environment (deps, .env, docker, init-system)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make doctor" "Run environment diagnostic check (tools, ports, docker)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make env" "Ensure backend and frontend .env files exist from templates"
	@echo ""
	@printf "  $(BOLD)[INFRA] Infrastructure (Docker Dev Stack)$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-up" "Start backing containers (Postgres, Redis, Mailpit, SeaweedFS)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-down" "Stop backing containers safely"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-logs" "Stream logs from all infrastructure containers"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-ps" "Check health and status of running containers"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-reset" "Reset database and storage volumes (destructive)"
	@echo ""
	@printf "  $(BOLD)[DB] Database & System Initialization$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make init-system" "Initialize baseline system (roles, permissions, admin account)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make seed-demo" "Seed legacy dummy tickets and demo users for testing"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make db-shell" "Open interactive psql CLI in PostgreSQL container"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make redis-shell" "Open interactive redis-cli in Redis container"
	@echo ""
	@printf "  $(BOLD)[QA] Quality Assurance & Testing$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make check" "Run oxlint + TypeScript verification (Pre-delivery check)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make lint" "Run oxlint static analysis across backend and frontend"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make typecheck" "Run tsc --noEmit across backend and frontend"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make test" "Run backend and frontend Vitest test suites"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make test-backend" "Run backend Vitest suite"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make test-frontend" "Run frontend Vitest suite"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make test-cov" "Run backend test coverage report"
	@echo ""
	@printf "  $(BOLD)[PROD] Production Packaging & Deployment$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-build" "Build customer production images (NestJS backend + Nginx SPA)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-up" "Launch customer production stack on port 80"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-down" "Stop production container stack"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-logs" "Stream production container logs"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-init" "Initialize production system roles & admin inside container"
	@echo ""
	@printf "  $(BOLD)[MAINT] Maintenance & Teardown$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make build" "Compile production bundles for backend and frontend"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make clean" "Clean dist directories, coverage, and cache artifacts"
	@echo ""

# ------------------------------------------------------------------------------
# 2. Setup & Environment
# ------------------------------------------------------------------------------
env:
	@if [ ! -f backend/.env ]; then \
		echo "Creating backend/.env from backend/.env.example..."; \
		cp backend/.env.example backend/.env; \
	fi
	@if [ ! -f frontend/.env ]; then \
		echo "Creating frontend/.env from frontend/.env.example..."; \
		cp frontend/.env.example frontend/.env; \
	fi
	@echo "Environment files verified."

doctor:
	@./scripts/doctor.sh

setup: env
	@echo "Installing monorepo dependencies..."
	@npm install
	@npm --prefix backend install
	@npm --prefix frontend install
	@echo "Starting Docker infrastructure..."
	@$(MAKE) infra-up
	@$(MAKE) wait-infra
	@echo "Initializing system roles, permissions, and admin account..."
	@$(MAKE) init-system
	@echo ""
	@printf "  $(GREEN)$(BOLD)[PASS] Setup complete!$(RESET) Run $(CYAN)make dev$(RESET) to start developing.\n\n"

# ------------------------------------------------------------------------------
# 3. Development Workflows
# ------------------------------------------------------------------------------
dev:
	@docker compose up -d
	@npm run dev

dev-backend:
	@docker compose up -d
	@npm run dev:backend

dev-frontend:
	@npm run dev:frontend

dev-stop:
	@echo "Stopping local development servers (ports 3000 and 5173)..."
	@fuser -k 3000/tcp 5173/tcp 2>/dev/null || true
	@echo "Development servers stopped."

dev-down:
	@echo "Stopping backing infrastructure containers..."
	@docker compose down

dev-clean: dev-stop
	@echo "Stopping infrastructure and removing data volumes..."
	@docker compose down -v
	@$(MAKE) clean
	@echo "Development environment completely cleaned."

dev-reset: dev-stop
	@echo "Resetting development database and storage..."
	@docker compose down -v
	@docker compose up -d
	@$(MAKE) wait-infra
	@$(MAKE) init-system
	@echo "Development environment reset complete."

# ------------------------------------------------------------------------------
# 4. Infrastructure (Docker Dev Stack)
# ------------------------------------------------------------------------------
infra-up:
	docker compose up -d

infra-down:
	docker compose down

infra-logs:
	docker compose logs -f

infra-ps:
	docker compose ps

wait-infra:
	@echo "Waiting for PostgreSQL to accept connections..."
	@until docker compose exec postgres pg_isready -U postgres -d bug_tracker >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "PostgreSQL is ready."
	@echo "Waiting for Redis..."
	@until docker compose exec redis redis-cli ping >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "Redis is ready."

infra-reset:
	docker compose down -v
	docker compose up -d
	@$(MAKE) wait-infra
	@$(MAKE) init-system

# ------------------------------------------------------------------------------
# 5. Database & System Initialization
# ------------------------------------------------------------------------------
init-system:
	npm --prefix backend run init:system

seed-demo:
	npm --prefix backend run seed:demo

db-shell:
	docker compose exec postgres psql -U postgres -d bug_tracker

redis-shell:
	docker compose exec redis redis-cli

# ------------------------------------------------------------------------------
# 6. Quality Assurance & Testing
# ------------------------------------------------------------------------------
lint:
	npm --prefix backend run lint
	npm --prefix frontend run lint

typecheck:
	@echo "Type checking backend..."
	@cd backend && npx tsc --noEmit
	@echo "Type checking frontend..."
	@cd frontend && npx tsc --noEmit
	@echo "TypeScript type checks passed!"

check: lint typecheck

test:
	npm --prefix backend test
	npm --prefix frontend test

test-backend:
	npm --prefix backend test

test-frontend:
	npm --prefix frontend test

test-watch:
	npm --prefix backend run test:watch

test-cov:
	npm --prefix backend run test:cov

# ------------------------------------------------------------------------------
# 7. Production Stack (Containerized Deployment)
# ------------------------------------------------------------------------------
prod-build:
	docker compose -f docker-compose.prod.yml build

prod-up:
	docker compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

prod-init:
	docker compose -f docker-compose.prod.yml exec backend npm run init:system:prod

prod-seed: prod-init

# ------------------------------------------------------------------------------
# 8. Maintenance
# ------------------------------------------------------------------------------
build:
	npm --prefix backend run build
	npm --prefix frontend run build

clean:
	@echo "Cleaning build artifacts and temporary files..."
	@rm -rf backend/dist frontend/dist coverage backend/coverage frontend/coverage \
	       backend/*.tsbuildinfo frontend/*.tsbuildinfo *.log npm-debug.log*
	@echo "Clean completed."
