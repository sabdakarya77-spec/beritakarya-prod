# BeritaKarya v0.1 — Implementation Plan

> Berdasarkan hasil profesional audit per 16 Juni 2026.
> Skor keseluruhan: **B+ (78/100)**

---

## Ringkasan Eksekutif

Document ini merinci rencana perbaikan BeritaKarya v0.1 berdasarkan temuan audit. Dibagi menjadi 4 fase berdasarkan prioritas dan dependensi. Setiap fase dirancang agar bisa dijalankan secara independen.

**Total estimasi:** 6–8 minggu (1 developer full-time)

---

## Fase 1: Foundation & Critical Fixes

**Target:** Production safety baseline
**Estimasi:** 1–2 minggu
**Dependensi:** Tidak ada

### 1.1 Verifikasi Keamanan Environment Variables

| Item | Detail |
|---|---|
| **Masalah** | File `.env` dan `.env.local` mungkin ter-commit ke git |
| **Action** | Jalankan `git ls-files '*.env' '*.env.local'` untuk verifikasi |
| **Jika ter-commit** | `git rm --cached` + tambahkan ke `.gitignore` + rotate semua secrets |
| **Jika tidak** | Pastikan `.gitignore` mencakup pattern ini |
| **Acceptance criteria** | `git ls-files` mengembalikan kosong untuk kedua pattern |
| **PIC** | DevOps / Lead Developer |
| **Effort** | 2–4 jam |

### 1.2 Bersihkan Broken Documentation References

| Item | Detail |
|---|---|
| **Masalah** | README mereferensikan file yang tidak ada: `docs/`, `AUDIT_SISTEM.md`, `VPS_DEPLOYMENT_GUIDE.md`, `infra/` |
| **Action 1** | Hapus atau tandai sebagai "Coming Soon" semua referensi broken di README.md |
| **Action 2** | Buat `docs/README.md` sebagai placeholder dengan daftar dokumentasi yang akan dibuat |
| **Acceptance criteria** | Tidak ada broken link di README, semua referensi valid atau ditandai jelas |
| **PIC** | Tech Writer / Developer |
| **Effort** | 2–3 jam |

### 1.3 Buat Dockerfile & docker-compose.yml

| Item | Detail |
|---|---|
| **Masalah** | Tidak ada Dockerfile, README mengklaim Docker support |
| **Deliverables** | |

**`apps/api/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --filter @beritakarya/api...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @beritakarya/api run db:generate
RUN pnpm --filter @beritakarya/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**`docker-compose.yml` (di root):**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: beritakarya
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  meilisearch:
    image: getmeili/meilisearch:v1.6
    ports: ["7700:7700"]
    environment:
      MEILI_MASTER_KEY: masterKey

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports: ["3001:3001"]
    depends_on: [postgres, redis, meilisearch]
    env_file: apps/api/.env

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports: ["3000:3000"]
    depends_on: [api]
    env_file: apps/web/.env.local

volumes:
  pgdata:
```

| Acceptance criteria | `docker-compose up` berhasil menjalankan semua service lokal |
|---|---|
| **PIC** | DevOps / Backend Developer |
| **Effort** | 1–2 hari |

### 1.4 Aktifkan ESLint Rules yang Dimatikan

| Item | Detail |
|---|---|
| **Masalah** | `no-explicit-any: 'off'` dan `exhaustive-deps: 'off'` mematikan linting penting |
| **Action** | Ubah kedua rules dari `'off'` menjadi `'warn'` |
| **Strategy** | Jalankan `pnpm lint` → catat jumlah warning → perbaiki secara bertahap per module |
| **Acceptance criteria** | Kedua rules aktif sebagai `'warn'`, tidak ada error baru yang blocking |
| **PIC** | Frontend + Backend Developer |
| **Effort** | 3–5 hari (bertahap) |

**File:** `.eslintrc.cjs`
```js
// Sebelum
'@typescript-eslint/no-explicit-any': 'off',
'react-hooks/exhaustive-deps': 'off',

// Sesudah
'@typescript-eslint/no-explicit-any': 'warn',
'react-hooks/exhaustive-deps': 'warn',
```

---

## Fase 2: Testing Strategy

**Target:** Mencapai minimum viable test coverage
**Estimasi:** 2–3 minggu
**Dependensi:** Fase 1 selesai

### 2.1 Setup API Coverage Thresholds

| Item | Detail |
|---|---|
| **Masalah** | Tidak ada coverage threshold untuk API package |
| **Action** | Buat `apps/api/vitest.config.mts` dengan threshold |
| **Acceptance criteria** | Threshold aktif dan CI gagal jika coverage turun |

**`apps/api/vitest.config.mts`:**
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
  },
});
```

### 2.2 E2E Tests — Core Business Workflows

| Item | Detail |
|---|---|
| **Masalah** | Hanya 1 E2E test (container layout), tidak ada workflow coverage |
| **Priority** | Test workflow inti bisnis yang menghasilkan revenue |

**Test suite yang harus dibuat:**

| # | Test Suite | Scenario | Prioritas |
|---|---|---|---|
| 1 | **Auth Flow** | Register → Login → Token Refresh → Logout | P0 |
| 2 | **Article Lifecycle** | Create Draft → Edit → Submit → Review → Approve → Publish | P0 |
| 3 | **Article Public View** | Published article accessible, draft not accessible | P0 |
| 4 | **Dashboard Access** | Role-based access control per dashboard page | P1 |
| 5 | **Media Upload** | Upload image → Insert to article → Display in published article | P1 |
| 6 | **KYC Flow** | Submit KYC → Admin Review → Approve/Reject | P2 |
| 7 | **Ad Management** | Create Ad → Book → Track impression/click | P2 |

**Contoh implementasi Auth Flow E2E:**

```ts
// apps/web/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register, login, and logout', async ({ page }) => {
    // Register
    await page.goto('/test-site/register');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/login/);

    // Login
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('expired token redirects to login', async ({ page }) => {
    // Set expired token in cookie
    await page.context().addCookies([{
      name: 'token',
      value: 'expired.jwt.token',
      domain: 'localhost',
      path: '/',
    }]);
    await page.goto('/test-site/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});
```

### 2.3 API Unit Tests — Critical Modules

| Item | Detail |
|---|---|
| **Masalah** | Banyak module tanpa test sama sekali |

**Module yang harus di-test (prioritas):**

| Module | Test File | Target Coverage |
|---|---|---|
| middleware/auth | `auth.middleware.test.ts` | requireAuth, requireRole, requireSuperadmin |
| middleware/aiQuota | `aiQuota.middleware.test.ts` | quota check, budget enforcement, warning |
| middleware/site | `site.middleware.test.ts` | site extraction, validation, role scoping |
| lib/accountLockout | `accountLockout.test.ts` | lockout trigger, unlock, Redis fallback |
| lib/rateLimit | `rateLimit.test.ts` | rate limit enforcement, Redis fallback |
| services/email | `email.service.test.ts` | send email, template rendering |
| services/storage | `storage.service.test.ts` | S3 upload, presigned URL |
| cron/* | `*.cron.test.ts` | token cleanup, KYC cleanup, pageview cleanup |

### 2.4 Test Infrastructure Improvements

| Item | Detail |
|---|---|
| **Action 1** | Buat shared test fixtures di `apps/api/test/fixtures/` (mock user, mock article, mock site) |
| **Action 2** | Buat test helper untuk Prisma mocking (in-memory SQLite atau mock client) |
| **Action 3** | Tambahkan `test:coverage` script ke root package.json |
| **Acceptance criteria** | API coverage ≥ 60%, Web coverage ≥ 65% |

---

## Fase 3: Architecture & Code Quality

**Target:** Konsistensi arsitektur dan maintainability
**Estimasi:** 2 minggu
**Dependensi:** Fase 2 selesai (butuh test coverage sebelum refactor)

### 3.1 Standarisasi Repository Layer

| Item | Detail |
|---|---|
| **Masalah** | Beberapa module langsung panggil Prisma dari controller |
| **Action** | Tambahkan repository layer untuk module yang belum punya |

**Module yang perlu repository layer:**

| Module | File Saat Ini | Action |
|---|---|---|
| user | `user.controller.ts` langsung Prisma | Buat `user.repository.ts` |
| notification | `notification.controller.ts` langsung Prisma | Buat `notification.repository.ts` |
| invitation | `invitation.controller.ts` langsung Prisma | Buat `invitation.repository.ts` |
| ad | `ad.controller.ts` langsung Prisma | Buat `ad.repository.ts` |
| kyc | `kyc.controller.ts` langsung Prisma | Buat `kyc.repository.ts` |

**Pattern yang harus diikuti:**
```ts
// user.repository.ts
export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
```

### 3.2 Standarisasi Pagination

| Item | Detail |
|---|---|
| **Masalah** | Setiap endpoint list punya format pagination berbeda |
| **Action** | Buat shared pagination utility |

**`packages/utils/src/pagination.ts`:**
```ts
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePagination(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
```

### 3.3 Persist Metrics ke Redis

| Item | Detail |
|---|---|
| **Masalah** | MetricsCollector in-memory, hilang saat restart |
| **Action** | Simpan metrics ke Redis dengan TTL 7 hari |
| **Acceptance criteria** | Metrics survive restart, `/metrics` endpoint menampilkan data historical |
| **Effort** | 1 hari |

### 3.4 Normalisasi JSON Columns (Opsional)

| Item | Detail |
|---|---|
| **Masalah** | Field `blocks`, `tags`, `socialLinks` sebagai JSON membatasi query |
| **Action** | Evaluasi mana yang perlu tabel terpisah vs tetap JSON |
| **Kandidat normalisasi** | `tags` → tabel `Tag` + junction `ArticleTag` |
| **Tetap JSON** | `blocks` (terlalu dinamis), `appearance` (config-like) |
| **Effort** | 2–3 hari (termasuk migration) |

---

## Fase 4: CI/CD & Deployment

**Target:** Automated deployment pipeline
**Estimasi:** 1–2 minggu
**Dependensi:** Fase 1.3 (Dockerfile) selesai

### 4.1 GitHub Actions Deployment Workflow

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  build-images:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        app: [api, web]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/${{ matrix.app }}/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ env.IMAGE_PREFIX }}-${{ matrix.app }}:${{ github.sha }}
            ghcr.io/${{ env.IMAGE_PREFIX }}-${{ matrix.app }}:latest

  deploy-staging:
    needs: build-images
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          # Sesuaikan dengan infra yang digunakan (VPS, Railway, Fly.io, dll)
          echo "Deploying to staging..."
          # ssh $STAGING_HOST "cd /app && docker-compose pull && docker-compose up -d"
```

### 4.2 Database Backup Automation

| Item | Detail |
|---|---|
| **Masalah** | Backup database hanya referensi manual di README |
| **Action** | Buat cron job GitHub Actions untuk daily backup |

**`.github/workflows/backup.yml`:**
```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Setiap jam 2 pagi UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Dump database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
      - name: Upload to storage
        run: |
          # Upload ke S3/R2/Supabase Storage
          echo "Upload backup..."
```

### 4.3 Environment Parity Checklist

| Aspect | Local | Staging | Production |
|---|---|---|---|
| Node.js version | 20.x | 20.x | 20.x |
| PostgreSQL | 15 | 15 | 15 |
| Redis | 7 | 7 | 7 |
| Meilisearch | 1.6 | 1.6 | 1.6 |
| SSL/TTLS | No | Yes | Yes |
| Sentry | Optional | Yes | Yes |
| Log level | debug | info | warn |

---

## Dokumentasi yang Harus Dibuat

| Dokumen | Lokasi | Prioritas | Estimasi |
|---|---|---|---|
| Setup Guide | `docs/setup.md` | P0 | 2 jam |
| Architecture Overview | `docs/architecture.md` | P0 | 3 jam |
| API Documentation | Swagger annotations di controller | P1 | 2–3 hari |
| Deployment Guide | `docs/deployment.md` | P1 | 1 hari |
| Contributing Guide | `CONTRIBUTING.md` | P2 | 2 jam |
| Changelog | `CHANGELOG.md` | P2 | Ongoing |
| Design System | `docs/design-system/layout-system.md` | P2 | 1 hari |

---

## Tracking Progress

### Milestone Checklist

#### Fase 1: Foundation (Week 1–2)
- [x] 1.1 Verifikasi .env files tidak di git ✅ (2026-06-16)
- [x] 1.2 Bersihkan broken docs references ✅ (2026-06-16)
- [x] 1.3 Buat Dockerfile (API + Web) ✅ (2026-06-16)
- [x] 1.3 Buat docker-compose.yml ✅ (2026-06-16)
- [ ] 1.3 Test `docker-compose up` berhasil
- [x] 1.4 Aktifkan ESLint rules (warn) ✅ (2026-06-16)
- [x] 1.4 Catat baseline warning count ✅ (2026-06-16) — 360 warnings, 0 errors

#### Fase 2: Testing (Week 3–5)
- [x] 2.1 Buat API vitest.config.mts dengan threshold ✅ (sudah ada sebelumnya)
- [x] 2.2 E2E: Auth flow test ✅ (2026-06-16) — 6 tests
- [x] 2.2 E2E: Article lifecycle test ✅ (2026-06-16) — 6 tests
- [x] 2.2 E2E: Article public view test ✅ (2026-06-16) — 8 tests
- [x] 2.2 E2E: Dashboard access test ✅ (2026-06-16) — 7 tests
- [x] 2.3 Unit: auth middleware test ✅ (2026-06-16) — 11 tests
- [ ] 2.3 Unit: aiQuota middleware test (complex, ditunda)
- [x] 2.3 Unit: site middleware test ✅ (2026-06-16) — 9 tests
- [x] 2.3 Unit: accountLockout test ✅ (2026-06-16) — 8 tests
- [ ] 2.3 Unit: rateLimit test (side effects, ditunda)
- [x] 2.3 Unit: sanitize middleware test ✅ (2026-06-16) — 9 tests
- [x] 2.3 Unit: error middleware test ✅ (2026-06-16) — 6 tests
- [x] 2.3 Unit: security middleware test ✅ (2026-06-16) — 4 tests
- [x] 2.3 Unit: requestId middleware test ✅ (2026-06-16) — 2 tests
- [x] 2.3 Unit: performance middleware test ✅ (2026-06-16) — 4 tests
- [x] 2.4 Shared test fixtures ✅ (2026-06-16) — mockUser, mockArticle, mockSite, mockReq/Res/Next
- [ ] 2.4 Prisma mock helper (ditunda)

#### Fase 3: Architecture (Week 5–6)
- [x] 3.1 User repository layer ✅ (sudah ada sebelumnya)
- [x] 3.1 Notification repository layer ✅ (sudah ada sebelumnya)
- [x] 3.1 Invitation repository layer ✅ (2026-06-16) — invitation.repository.ts + refactor controller
- [x] 3.1 Ad repository layer ✅ (2026-06-16) — ad.repository.ts + full controller refactor
- [x] 3.1 KYC repository layer ✅ (2026-06-16) — kyc.repository.ts
- [x] 3.2 Shared pagination utility ✅ (2026-06-16) — packages/utils/src/pagination.ts + types
- [ ] 3.2 Migrate semua list endpoints ke format standar (ditunda)
- [x] 3.3 Persist metrics ke Redis ✅ (2026-06-16) — auto-flush setiap 5 menit, load on startup
- [ ] 3.4 Evaluasi JSON columns (tags → tabel) (ditunda)

#### Fase 4: CI/CD (Week 6–8)
- [x] 4.1 Deploy workflow (GitHub Actions) ✅ (2026-06-16) — build & push to GHCR, staging deploy
- [x] 4.2 Database backup automation ✅ (2026-06-16) — daily cron, artifact retention 7 days
- [x] 4.3 Environment parity checklist ✅ (2026-06-16) — Docker HEALTHCHECK added to both Dockerfiles

#### Dokumentasi (Ongoing)
- [x] `docs/setup.md` ✅ (2026-06-16) — Local dev setup, env vars, Docker, troubleshooting
- [x] `docs/architecture.md` ✅ (2026-06-16) — System architecture, modules, database, security
- [ ] Swagger annotations (sudah ada di codebase)
- [x] `docs/deployment.md` ✅ (2026-06-16) — Vercel+Railway, VPS Docker, CI/CD, backup
- [x] `CONTRIBUTING.md` ✅ (2026-06-16) — Workflow, code style, testing, PR checklist

---

## Risiko & Mitigasi

| Risiko | Probabilitas | Impact | Mitigasi |
|---|---|---|---|
| Refactor repository layer memperkenalkan bug | Medium | High | Pastikan test coverage cukup sebelum refactor (Fase 2 dulu) |
| Docker build gagal karena monorepo complexity | Medium | Medium | Test Docker build secara lokal sebelum push ke CI |
| ESLint warnings terlalu banyak (>500) | High | Low | Fix secara bertahap per module, jangan sekaligus |
| E2E tests flaky karena timing issues | Medium | Medium | Gunakan `waitForSelector`, `waitForURL`, bukan `setTimeout` |
| Database migration untuk JSON normalization | Low | High | Buat migration yang reversible, test di staging dulu |

---

## Success Metrics

| Metric | Baseline (Sekarang) | Target (Setelah Fase 1–4) |
|---|---|---|
| Test coverage (API) | Tidak terukur | ≥ 60% |
| Test coverage (Web) | ~65% threshold | ≥ 70% |
| E2E test count | 1 | ≥ 5 |
| Docker support | Tidak ada | Full local dev + CI |
| Deployment automation | Manual | Automated via GitHub Actions |
| Broken documentation links | ~8+ | 0 |
| ESLint `any` usage | Unchecked | Tracked (warn) |
| Repository layer coverage | ~40% module | 100% module |
