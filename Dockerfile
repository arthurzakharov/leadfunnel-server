# --- Stage 1: Build ---
FROM oven/bun:latest AS base
WORKDIR /app

# This "Smart COPY" tells Docker:
# "Copy package.json, and copy any lockfile you find (bun, npm, yarn, or pnpm), but don't crash if you don't find them."
COPY package.json bun.lockb* package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .c

# The default port Hono runs on
EXPOSE 3000

# Default command (this will be overridden by Docker Compose in development)
CMD ["bun", "run", "src/index.ts"]
