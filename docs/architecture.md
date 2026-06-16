# Architecture Overview

Arsitektur sistem BeritaKarya — platform CMS media digital multi-situs.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    Next.js 16 (App Router)                   │
│                    React 18 + Tailwind CSS                   │
│                    Zustand (state management)                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────┐
│                        Backend API                           │
│                    Express.js 4 + TypeScript                 │
│                    Prisma ORM + PostgreSQL                   │
│                    Redis (rate limiting)                     │
│                    Meilisearch (search)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Infrastructure                          │
│              PostgreSQL 15 │ Redis 7 │ Meilisearch v1.6     │
│              S3/R2 (storage) │ Sentry (monitoring)          │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
beritakarya/
├── apps/
│   ├── api/                    # Backend REST API
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules (auth, article, etc.)
│   │   │   ├── middleware/      # Express middleware
│   │   │   ├── services/        # Business logic services
│   │   │   ├── lib/             # Utilities (redis, logger, env, etc.)
│   │   │   ├── cron/            # Scheduled tasks
│   │   │   ├── db/              # Prisma client
│   │   │   ├── ai/              # OpenAI integration
│   │   │   └── test/            # Test setup & fixtures
│   │   └── prisma/              # Schema & migrations
│   └── web/                    # Frontend Next.js
│       ├── app/[site]/         # Multi-site routing
│       ├── components/         # UI components
│       ├── store/              # Zustand stores
│       ├── lib/                # Utilities
│       └── tests/e2e/          # Playwright E2E tests
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── config/                 # Shared ESLint/TS config
├── docs/                       # Documentation
└── .github/workflows/          # CI/CD pipelines
```

## Backend Architecture

### Module Pattern

Setiap fitur diorganisasikan sebagai module dengan struktur:

```
modules/<feature>/
├── <feature>.controller.ts     # Route handlers (HTTP layer)
├── <feature>.service.ts        # Business logic
├── <feature>.repository.ts     # Database access (Prisma)
├── <feature>.validator.ts      # Input validation (Zod)
└── <feature>.test.ts           # Unit tests
```

### Key Modules

| Module | Endpoint | Description |
|--------|----------|-------------|
| auth | `/api/v1/auth` | Login, register, refresh, logout |
| article | `/api/v1/articles` | CRUD + editorial workflow |
| user | `/api/v1/users` | User management |
| category | `/api/v1/categories` | Global & site categories |
| site | `/api/v1/sites` | Multi-site management |
| media | `/api/v1/media` | File upload & management |
| ai | `/api/v1/ai` | AI features (rewrite, grammar) |
| kyc | `/api/v1/kyc` | Identity verification |
| ad | `/api/v1/ads` | Advertisement system |
| notification | `/api/v1/notifications` | In-app notifications |
| comment | `/api/v1/comments` | Article comments |
| analytics | `/api/v1/analytics` | Page views & stats |
| audit | `/api/v1/audit` | Audit logs |

### Middleware Pipeline

```
Request → CORS → Helmet → JWT Verify → Rate Limit → Site Middleware
  → Auth Middleware → Route Handler → Error Middleware → Response
```

### Authentication Flow

1. User login → API validates credentials
2. API generates JWT access token (HttpOnly cookie)
3. API generates refresh token (stored in DB)
4. Subsequent requests: JWT verified by `jwtVerify` middleware
5. Token expired → Client calls `/auth/refresh` with refresh token
6. Logout → Tokens blacklisted/deleted

## Frontend Architecture

### Multi-Site Routing

```
/[site]/                    # Site homepage
/[site]/artikel/[slug]      # Article page
/[site]/dashboard/          # Dashboard (auth required)
/[site]/dashboard/articles  # Article management
/[site]/dashboard/ads       # Ad management
/[site]/p/[slug]            # Static pages
```

### State Management

- **Zustand stores**: `authStore`, `editorStore`
- **Server state**: Fetched via API calls (no React Query)
- **Local state**: React `useState` for UI state

### Component Organization

```
components/
├── layout/           # Container, PublicSiteLayout, PublicInfoShell
├── editor/           # TipTap rich text editor
├── legal/            # Legal document components
├── marketing/        # Landing page components
└── pages/            # Page-level components (SiteHomePage)
```

## Database Schema

### Core Models

| Model | Description |
|-------|-------------|
| Site | Multi-site configuration |
| User | Users with KYC and AI quota fields |
| Article | Articles with versioning and workflow |
| ArticleVersion | Article version history |
| Category | Global and site-specific categories |
| SiteCategory | Site-category junction |
| Media | Uploaded files |
| Advertisement | Ad banners and slots |
| AdPackage | Ad pricing packages |
| AdBooking | Ad booking transactions |
| Comment | Article comments |
| Notification | In-app notifications |
| AuditLog | Editorial audit trail |
| PageView | Page view tracking |
| AIUsage | AI feature usage tracking |
| KYCViewLog | KYC document access log |
| Invitation | User invitations |
| RefreshToken | JWT refresh tokens |
| BlacklistedToken | Revoked tokens |

### Article Workflow

```
draft → submitted → review → revision → approved → scheduled → published
                                                      ↓
                                              archived / rejected
```

## Security

- JWT HttpOnly cookies (not localStorage)
- CORS whitelist
- Redis-based rate limiting
- Helmet.js security headers
- Input sanitization (DOMPurify)
- KYC lock after failed attempts
- Soft delete with `deletedAt`
- AI quota limits per user/role
