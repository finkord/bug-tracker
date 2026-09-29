# ==============================================================================
# BugTracker Backend — Production Multi-Stage Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build NestJS TypeScript bundle
# ------------------------------------------------------------------------------
FROM node:24-slim AS builder

# Install native compilation toolchain required for argon2 password hashing
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all dependencies (including devDependencies for TypeScript compilation)
COPY package*.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Minimal hardened production runtime
# ------------------------------------------------------------------------------
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install build tools temporarily to compile argon2 native addon for production deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install only production dependencies, then purge compiler toolchain
RUN npm ci --omit=dev \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Switch to standard unprivileged node user
USER node

EXPOSE 3000

# Execute compiled NestJS application entrypoint
CMD ["node", "dist/main.js"]
