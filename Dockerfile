# syntax=docker/dockerfile:1
ARG BUN_VERSION=1.4

# ---------- base ----------
FROM oven/bun:${BUN_VERSION} AS base
WORKDIR /app

# ---------- dev: all deps, source is bind-mounted by compose ----------
FROM base AS dev
ENV NODE_ENV=development
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["bun", "run", "--hot", "src/index.ts"]

# ---------- prod-deps: production deps only ----------
FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---------- release: minimal runtime image ----------
FROM oven/bun:${BUN_VERSION}-slim AS release
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["bun", "-e", "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["bun", "run", "src/index.ts"]
