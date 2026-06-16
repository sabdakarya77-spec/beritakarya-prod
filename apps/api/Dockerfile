# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
# Copy workspace structure for filtered install
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --filter @beritakarya/api...

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY turbo.json pnpm-workspace.yaml pnpm-lock.yaml package.json ./
# Generate Prisma Client and build
RUN cd apps/api && npx prisma generate
RUN cd apps/api && pnpm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL for Prisma (Alpine uses musl)
RUN apk add --no-cache openssl

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/scripts ./scripts
COPY --from=builder /app/apps/api/package.json ./

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./app_node_modules/
RUN cp -r /app/app_node_modules/* /app/node_modules/ 2>/dev/null || true
RUN rm -rf /app/app_node_modules

EXPOSE 3001

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
