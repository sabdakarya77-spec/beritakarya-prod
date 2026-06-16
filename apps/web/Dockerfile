# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
# Copy workspace structure
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
WORKDIR /app
# Copy workspace structure
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
# Copy source
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY turbo.json tsconfig.json ./
# Install dependencies (all packages to ensure devDependencies for build)
RUN pnpm install --frozen-lockfile
# Build workspace packages first
RUN cd packages/types && pnpm run build
RUN cd packages/config && pnpm run build
RUN cd packages/utils && pnpm run build
# Build Next.js (standalone output)
RUN cd apps/web && pnpm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy static assets into the standalone output
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Copy public assets
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

# Health check — Next.js standalone server responds on /
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
