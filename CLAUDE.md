# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BeritaKarya is a multi-site digital media CMS platform built as a monorepo with Turborepo + pnpm workspaces. The system manages a network of news/media sites with role-based access control, editorial workflows, and integrated AI features.

## Tech Stack

- **Monorepo**: Turborepo + pnpm 10+ workspaces
- **Backend**: Express.js 4, TypeScript, Prisma ORM, PostgreSQL 15
- **Frontend**: Next.js 16 (App Router), React 18, Tailwind CSS, Zustand
- **Cache**: Redis 7 (ioredis) for rate limiting
- **Search**: Meilisearch v1.6
- **Storage**: MinIO (S3-compatible, self-hosted) for media/KYC files
- **AI**: OpenAI API (GPT-4o default)
- **Auth**: JWT HttpOnly cookie
- **Testing**: Vitest (unit), Playwright (E2E)
- **Production**: Self-hosted LXC (Proxmox VE), PM2, Caddy, Cloudflare Tunnel

## Common Commands

### Root Level (Turborepo)

```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build production
pnpm test         # Run tests across all packages
pnpm lint         # ESLint across all packages
pnpm type-check   # TypeScript type checking
```

### API (apps/api)

```bash
pnpm --filter @beritakarya/api dev           # Start API dev server
pnpm --filter @beritakarya/api test          # Run API tests (Vitest)
pnpm --filter @beritakarya/api run db:generate   # Generate Prisma Client
pnpm --filter @beritakarya/api run db:migrate    # Run dev migrations
pnpm --filter @beritakarya/api run db:studio     # Open Prisma Studio
pnpm --filter @beritakarya/api run db:seed       # Seed database
```

### Web (apps/web)

```bash
pnpm --filter @beritakarya/web dev           # Start Next.js dev server
pnpm --filter @beritakarya/web test          # Run web tests (Vitest)
pnpm --filter @beritakarya/web exec playwright test  # Run E2E tests
```

### Running Single Tests

```bash
# API: Run specific test file
pnpm --filter @beritakarya/api test -- path/to/test.test.ts

# Web: Run specific test file
pnpm --filter @beritakarya/web test -- path/to/test.test.ts

# Utils: Run specific test file
pnpm --filter @beritakarya/utils test -- path/to/test.test.ts
```

## Architecture

### Workspace Structure

```
apps/
├── api/          # Express.js REST API (@beritakarya/api)
└── web/          # Next.js frontend (@beritakarya/web)
packages/
├── types/        # Shared TypeScript types (@beritakarya/types)
├── utils/        # Shared utilities (@beritakarya/utils)
└── config/       # Shared ESLint/TS config (@beritakarya/config)
```

### Backend Architecture (apps/api)

- **Entry**: `src/main.ts` - Express app setup, middleware, route registration
- **Modules**: `src/modules/` - Feature-based organization (auth, article, user, etc.)
- **Middleware**: `src/middleware/` - Auth, rate-limit, sanitize, site-scoping
- **Database**: Prisma schema in `prisma/schema.prisma`, client in `src/db/client.ts`
- **AI Integration**: `src/ai/` - OpenAI integration with quota management
- **Cron Jobs**: `src/cron/` - Scheduled tasks (KYC cleanup, token cleanup)

### Frontend Architecture (apps/web)

- **App Router**: `app/[site]/` - Multi-site routing with dynamic site parameter
- **Components**: `components/` - Organized by feature (layout, legal, marketing, dashboard)
- **State**: Zustand stores for client-side state management
- **Editor**: TipTap-based rich text editor for article creation

### Key Patterns

1. **Multi-site Support**: All content is scoped to a site via `siteId`. The `siteMiddleware` extracts site context from requests.

2. **Role-Based Access**: Six roles (reader, reporter, kontributor, wapimred, advertiser, superadmin) with hierarchical permissions.

3. **Editorial Workflow**: Articles follow: draft → submitted → review → revision → approved → scheduled → published

4. **KYC System**: Identity verification for content creators with attempt limits and account locking.

5. **AI Quota System**: Per-user daily/monthly limits on AI features with role-based restrictions.

6. **JWT Auth**: Tokens in HttpOnly cookies, CORS whitelist for protection.

## API Endpoints

All API routes are prefixed with `/api/v1/`. Key modules:
- `/auth` - Login, register, refresh, logout
- `/articles` - CRUD with editorial workflow
- `/sites` - Multi-site management
- `/ai` - AI features (rewrite, expand, headline, seo, grammar, readability, fact-check, objectivity, caption, summarize, translate, image-gen)
- `/kyc` - Identity verification
- `/ads` - Advertisement management

Swagger documentation: `http://localhost:3001/api-docs`

## Database

PostgreSQL 15 with Prisma ORM. Key models:
- **Site** - Multi-site configuration
- **User** - With KYC and AI quota fields
- **Article** - With versioning, editorial workflow, and multi-category support (max 3)
- **Category** - Global and site-specific categories
- **ArticleCategory** - Join table for article-category many-to-many relation
- **SiteCategory** - Site-category junction for global category allowlists
- **Advertisement/AdBooking** - Ad management system

Article workflow statuses: `draft`, `submitted`, `review`, `revision`, `approved`, `scheduled`, `published`, `archived`, `rejected`

## Environment Setup

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit: DATABASE_URL, JWT_SECRET (api) and NEXT_PUBLIC_API_URL (web)
```

## Services (Development)

| Service | Local URL |
|---------|-----------|
| Web     | http://localhost:3000 |
| API     | http://localhost:3001 |
| Swagger | http://localhost:3001/api-docs |

## Production Architecture

Hybrid: **Frontend di Vercel**, backend & database self-hosted di Proxmox VE (3 LXC Container, native tanpa Docker):

| Lokasi | Layanan |
|--------|---------|
| **Vercel** | Next.js frontend, wildcard subdomain (`*.beritakarya.co`), CDN edge |
| CT 101 (10.0.0.11) | PostgreSQL 15, Redis 7, Meilisearch v1.6, MinIO |
| CT 102 (10.0.0.12) | Express API (PM2), Caddy, Cloudflare Tunnel |
| CT 103 (10.0.0.13) | Prometheus, Grafana, Exporters |

- **Infra = kepastian**, codebase menyesuaikan
- Frontend multi-site routing via Vercel wildcard subdomain
- Backend API via Cloudflare Tunnel → `api.beritakarya.co`
- Media storage: MinIO (S3-compatible) di CT 101, bukan Supabase
- Dokumentasi: `docs/architecture.md`, `docs/panduan_produksi_lxc.md`, `docs/ads.md`

## Design System

The frontend uses a consistent layout system with `Container` components:
- `<Container>` - Max ~1160px width
- `<Container size="content">` - ~760px for reading
- `<Container bleed>` - Edge-to-edge layout

See `docs/design-system/layout-system.md` for details.

## Security Features

- JWT HttpOnly cookies (not localStorage)
- CORS whitelist (only allowed origins)
- Redis-based rate limiting (1000 req/min general, 30 attempts/15 min for auth)
- Helmet.js security headers
- Input sanitization with DOMPurify
- KYC lock after failed verification attempts
- Soft delete with `deletedAt` timestamps
- AI quota limits per user/role
