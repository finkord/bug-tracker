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

COMPOSE_INFRA := docker compose -f docker-compose.infra.yml
COMPOSE_APP   := docker compose -f docker-compose.yml
COMPOSE_ALL   := docker compose -f docker-compose.infra.yml -f docker-compose.yml

.PHONY: help setup env doctor \
        dev dev-backend dev-frontend dev-stop dev-down dev-clean dev-reset \
        infra-up infra-down infra-logs infra-ps infra-reset wait-infra \
        prod prod-up prod-down prod-logs prod-build prod-init prod-seed down \
        init-system seed seed-demo db-shell redis-shell \
        test test-backend test-frontend test-watch test-cov \
        lint typecheck check build clean

# ------------------------------------------------------------------------------
# 1. Self-Documenting Help Menu
# ------------------------------------------------------------------------------
help:
	@echo ""
	@printf "  $(BOLD)$(CYAN)BugTracker Developer CLI$(RESET)\n"
	@printf "  $(YELLOW)======================================================================$(RESET)\n"
	@echo ""
	@printf "  $(BOLD)[DEV] Development Workflows (Host + Hot-Reload)$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev" "Start backing infra + launch backend (:3000) & frontend (:5173)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-backend" "Start backing infra + launch only backend in watch mode"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-frontend" "Start only Vite frontend (:5173)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-stop" "Stop host node processes on ports 3000 and 5173"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-down" "Stop host servers and backing infra containers"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make dev-reset" "Reset database volume, restart infra, and initialize schema"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make setup" "Bootstrap full environment (deps, .env, docker, init-system)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make doctor" "Run environment diagnostic check (tools, ports, docker)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make env" "Ensure backend and frontend .env files exist from templates"
	@echo ""
	@printf "  $(BOLD)[INFRA] Backing Infrastructure (Postgres, Redis, SeaweedFS, Mailpit)$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-up" "Start backing infrastructure containers"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-down" "Stop backing infrastructure containers"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-logs" "Stream logs from backing infrastructure containers"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-ps" "Check health and status of backing containers"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make infra-reset" "Reset database and storage volumes (destructive)"
	@echo ""
	@printf "  $(BOLD)[PROD] Production Preview (Full Container Stack on Port 80)$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod" "Build images and launch container stack (port 80)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-down" "Stop application containers"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-logs" "Stream application container logs"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-init" "Run baseline system initialization inside backend container"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make prod-seed" "Seed test data inside backend container (ARGS=\"--users=100\")"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make down" "Stop all containers (both application and backing infra)"
	@echo ""
	@printf "  $(BOLD)[DATA] Database & Test Data Management$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make init-system" "Initialize baseline system (roles, permissions, admin account)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make seed" "Seed scalable test dataset (ARGS=\"--users=100 --issues=300\")"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make db-shell" "Open interactive psql CLI in PostgreSQL container"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make redis-shell" "Open interactive redis-cli in Redis container"
	@echo ""
	@printf "  $(BOLD)[QA] Quality Assurance & Testing$(RESET)\n"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make check" "Run oxlint + TypeScript verification (Pre-delivery check)"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make lint" "Run oxlint static analysis across backend and frontend"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make typecheck" "Run tsc --noEmit across backend and frontend"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make test" "Run backend and frontend Vitest test suites"
	@printf "    $(GREEN)%-18s$(RESET) %s\n" "make test-cov" "Run backend test coverage report"
	@echo ""
	@printf "  $(BOLD)[MAINT] Maintenance & Build$(RESET)\n"
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
	@echo "Starting Docker backing infrastructure..."
	@$(MAKE) infra-up
	@$(MAKE) wait-infra
	@echo "Initializing system roles, permissions, and admin account..."
	@$(MAKE) init-system
	@echo ""
	@printf "  $(GREEN)$(BOLD)[PASS] Setup complete!$(RESET) Run $(CYAN)make dev$(RESET) or $(CYAN)make prod$(RESET).\n\n"

# ------------------------------------------------------------------------------
# 3. Development Workflows
# ------------------------------------------------------------------------------
dev:
	@$(MAKE) infra-up
	@$(MAKE) wait-infra
	@npm run dev

dev-backend:
	@$(MAKE) infra-up
	@$(MAKE) wait-infra
	@npm run dev:backend

dev-frontend:
	@npm run dev:frontend

dev-stop:
	@echo "Stopping local development servers (ports 3000 and 5173)..."
	@fuser -k 3000/tcp 5173/tcp 2>/dev/null || true
	@echo "Development servers stopped."

dev-down: dev-stop
	@echo "Stopping backing infrastructure containers..."
	@$(COMPOSE_INFRA) down

dev-clean: dev-stop
	@echo "Stopping infrastructure and removing data volumes..."
	@$(COMPOSE_INFRA) down -v
	@$(MAKE) clean
	@echo "Development environment completely cleaned."

dev-reset: dev-stop
	@echo "Resetting development database and storage..."
	@$(MAKE) infra-reset
	@echo "Development environment reset complete."

# ------------------------------------------------------------------------------
# 4. Backing Infrastructure Tier (PostgreSQL, Redis, SeaweedFS, Mailpit)
# ------------------------------------------------------------------------------
infra-up:
	$(COMPOSE_INFRA) up -d

infra-down:
	$(COMPOSE_INFRA) down

infra-logs:
	$(COMPOSE_INFRA) logs -f

infra-ps:
	$(COMPOSE_INFRA) ps

wait-infra:
	@echo "Waiting for PostgreSQL to accept connections..."
	@until $(COMPOSE_INFRA) exec postgres pg_isready -U postgres -d bug_tracker >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "PostgreSQL is ready."
	@echo "Waiting for Redis..."
	@until $(COMPOSE_INFRA) exec redis redis-cli ping >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "Redis is ready."

infra-reset:
	$(COMPOSE_INFRA) down -v
	$(COMPOSE_INFRA) up -d
	@$(MAKE) wait-infra
	@$(MAKE) init-system

# ------------------------------------------------------------------------------
# 5. Production Stack (Containerized Application Tier)
# ------------------------------------------------------------------------------
prod: prod-up

prod-build:
	$(COMPOSE_APP) build

prod-up:
	@$(MAKE) infra-up
	@$(MAKE) wait-infra
	$(COMPOSE_ALL) up -d --build

prod-down:
	$(COMPOSE_APP) down

prod-logs:
	$(COMPOSE_APP) logs -f

prod-init:
	$(COMPOSE_APP) exec backend node dist/database/init-system.js

prod-seed:
	$(COMPOSE_APP) exec backend node dist/database/seed.js $(ARGS)

down:
	@echo "Stopping all containers..."
	$(COMPOSE_ALL) down

# ------------------------------------------------------------------------------
# 6. Database & System Initialization (Universal)
# ------------------------------------------------------------------------------
init-system:
	npm --prefix backend run build
	npm --prefix backend run init:system

seed:
	npm --prefix backend run build
	node backend/dist/database/seed.js $(ARGS)

seed-demo: seed

db-shell:
	$(COMPOSE_INFRA) exec postgres psql -U postgres -d bug_tracker

redis-shell:
	$(COMPOSE_INFRA) exec redis redis-cli

# ------------------------------------------------------------------------------
# 7. Quality Assurance & Testing
# ------------------------------------------------------------------------------
lint:
	npm --prefix backend run lint
	npm --prefix frontend run lint

typecheck:
	@echo "Type checking backend..."
	@cd backend && npx tsc --noEmit
	@echo "Type checking frontend..."
	@cd frontend && npx tsc --noEmit
	@echo "TypeScript type checks passed."

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
# 8. Maintenance & Build
# ------------------------------------------------------------------------------
build:
	npm --prefix backend run build
	npm --prefix frontend run build

clean:
	@echo "Cleaning build artifacts and temporary files..."
	@rm -rf backend/dist frontend/dist coverage backend/coverage frontend/coverage \
	       backend/*.tsbuildinfo frontend/*.tsbuildinfo *.log npm-debug.log*
	@echo "Clean completed."
