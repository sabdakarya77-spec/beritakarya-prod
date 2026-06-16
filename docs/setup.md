# Setup Guide

Panduan lengkap untuk menjalankan BeritaKarya secara lokal.

## Prasyarat

| Tool | Versi | Keterangan |
|------|-------|------------|
| Node.js | 20+ | LTS recommended |
| pnpm | 10+ | Package manager |
| PostgreSQL | 15 | Database utama |
| Redis | 7 | Rate limiting (opsional untuk dev) |
| Meilisearch | v1.6 | Search engine (opsional) |

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/akunisinecoc-jpg/beritakarya-v.0.1.git
cd beritakarya-v.0.1

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit: minimal DATABASE_URL, JWT_SECRET (api) dan NEXT_PUBLIC_API_URL (web)

# 4. Generate Prisma Client
pnpm --filter @beritakarya/api run db:generate

# 5. Run database migrations
pnpm --filter @beritakarya/api run db:migrate

# 6. Seed database (opsional)
pnpm --filter @beritakarya/api run db:seed

# 7. Start development servers
pnpm dev
```

## Environment Variables

### API (`apps/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key untuk JWT (min 32 chars) |
| `PORT` | ❌ | API port (default: 3001) |
| `NODE_ENV` | ❌ | `development` / `production` |
| `API_URL` | ❌ | API base URL |
| `CORS_ORIGIN` | ❌ | Allowed CORS origins |
| `REDIS_HOST` | ❌ | Redis host (untuk rate limiting) |
| `REDIS_PORT` | ❌ | Redis port (default: 6379) |
| `OPENAI_API_KEY` | ❌ | OpenAI API key untuk fitur AI |
| `MEILISEARCH_HOST` | ❌ | Meilisearch URL |
| `MEILISEARCH_KEY` | ❌ | Meilisearch API key |
| `S3_ENDPOINT` | ❌ | S3/R2 endpoint untuk storage |
| `S3_ACCESS_KEY` | ❌ | S3 access key |
| `S3_SECRET_KEY` | ❌ | S3 secret key |
| `SMTP_HOST` | ❌ | SMTP server untuk email |
| `SMTP_PORT` | ❌ | SMTP port |
| `SMTP_USER` | ❌ | SMTP username |
| `SMTP_PASS` | ❌ | SMTP password |
| `SENTRY_DSN` | ❌ | Sentry DSN untuk error tracking |

### Web (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | API URL (default: `http://localhost:3001`) |
| `NEXT_PUBLIC_URL` | ❌ | Web app URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_GA_ID` | ❌ | Google Analytics ID |
| `NEXT_PUBLIC_SITE_ID` | ❌ | Default site ID |

## Docker Setup

```bash
# Jalankan semua services dengan Docker Compose
docker compose up -d

# Atau build dan jalankan manual
docker compose up postgres redis meilisearch -d
pnpm dev
```

Services yang tersedia via Docker Compose:
- `postgres` — PostgreSQL 15 (port 5432)
- `redis` — Redis 7 (port 6379)
- `meilisearch` — Meilisearch v1.6 (port 7700)
- `api` — Backend API (port 3001)
- `web` — Frontend Next.js (port 3000)

## Common Commands

```bash
# Development
pnpm dev                    # Start all apps
pnpm build                  # Build production
pnpm test                   # Run all tests
pnpm lint                   # ESLint
pnpm type-check             # TypeScript check

# API
pnpm --filter @beritakarya/api dev           # Start API dev server
pnpm --filter @beritakarya/api test          # Run API tests
pnpm --filter @beritakarya/api run db:generate   # Generate Prisma Client
pnpm --filter @beritakarya/api run db:migrate    # Run migrations
pnpm --filter @beritakarya/api run db:studio     # Open Prisma Studio
pnpm --filter @beritakarya/api run db:seed       # Seed database

# Web
pnpm --filter @beritakarya/web dev           # Start Next.js dev server
pnpm --filter @beritakarya/web test          # Run web tests
pnpm --filter @beritakarya/web exec playwright test  # Run E2E tests

# Single test file
pnpm --filter @beritakarya/api test -- path/to/test.test.ts
pnpm --filter @beritakarya/web test -- path/to/test.test.ts
```

## Troubleshooting

### Database connection error
Pastikan PostgreSQL berjalan dan `DATABASE_URL` benar:
```bash
# Cek koneksi
psql $DATABASE_URL
```

### Prisma Client belum generate
```bash
pnpm --filter @beritakarya/api run db:generate
```

### Port sudah digunakan
```bash
# Cek process di port
netstat -ano | findstr :3001
# Kill process
taskkill /PID <PID> /F
```

### Redis tidak tersedia
Redis opsional untuk development. Rate limiting akan fallback ke in-memory jika Redis tidak tersedia.
