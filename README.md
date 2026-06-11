# BeritaKarya — Platform Media Digital Multisitus

Platform manajemen konten (CMS) modern berbasis monorepo untuk mengelola jaringan media digital. Dibangun dengan Next.js (frontend), Express.js (backend API), dan PostgreSQL sebagai database utama.

---

## Arsitektur Project

```
beritakarya/                         ← Monorepo Root (Turborepo + pnpm)
├── apps/
│   ├── api/                         ← Backend REST API (Express.js + TypeScript)
│   │   ├── src/
│   │   │   ├── modules/             ← auth, article, kyc, ads, site, …
│   │   │   ├── middleware/          ← Auth, CSRF, rate-limit, sanitize
│   │   │   ├── ai/                  ← Integrasi OpenAI
│   │   │   ├── cron/                ← KYC cleanup, token cleanup, scheduled publish
│   │   │   ├── db/                  ← Prisma client
│   │   │   └── lib/                 ← Logger, env, monitoring, rate limit
│   │   └── prisma/                  ← Schema & migrasi
│   └── web/                         ← Frontend (Next.js 16 App Router)
│       ├── app/[site]/              ← Halaman multisite (publik + dashboard)
│       └── components/
│           ├── layout/              ← Container, PublicSiteLayout, PublicInfoShell
│           ├── legal/               ← Dokumen legal (LegalStandardPage, …)
│           └── marketing/           ← Landing publik (mis. AdsMarketingPage)
├── packages/
│   ├── types/                       ← Shared TypeScript types
│   ├── utils/                       ← Shared utilities
│   └── config/                      ← Shared ESLint/TS config
├── docs/                            ← Design system, audit, roadmap UI/UX
├── infra/
│   ├── docker/                      ← Dockerfile & docker-compose
│   ├── nginx/                       ← Nginx (dev/staging/prod)
│   └── scripts/                     ← Setup, SSL, backup
└── .github/workflows/               ← CI & deploy (build image GHCR)
```

---

## Tech Stack

| Komponen       | Teknologi                                  |
|----------------|--------------------------------------------|
| **Monorepo**   | Turborepo + pnpm workspaces                |
| **Backend**    | Express.js 4, TypeScript, Prisma ORM     |
| **Frontend**   | Next.js 16, React 18, Tailwind CSS, Zustand |
| **Database**   | PostgreSQL 15                              |
| **Cache**      | Redis 7 (ioredis) — rate limiting          |
| **Search**     | Meilisearch v1.6                           |
| **AI**         | OpenAI API (GPT-4o default)                |
| **Auth**       | JWT HttpOnly cookie + CSRF                 |
| **Container**  | Docker + Docker Compose                    |
| **Web Server** | Nginx (reverse proxy di VPS)               |
| **SSL**        | Let's Encrypt (Certbot)                    |
| **Monitoring** | Sentry, Winston                            |

---

## Modul API (`/api/v1/`)

| Modul          | Endpoint           | Deskripsi                              |
|----------------|--------------------|----------------------------------------|
| Auth           | `/auth`            | Login, register, refresh, logout       |
| User           | `/users`           | CRUD user, profil, heartbeat           |
| Article        | `/articles`        | CRUD artikel, workflow editorial       |
| Category       | `/categories`      | Kategori global & per situs            |
| Site           | `/sites`           | Manajemen multisitus & settings        |
| Media          | `/media`           | Upload & manajemen file                |
| AI             | `/ai`              | Rewrite, grammar, layout, quota        |
| KYC            | `/kyc`             | Verifikasi identitas penulis           |
| Invitation     | `/invitations`     | Undangan user                          |
| Comment        | `/comments`        | Komentar artikel                       |
| Newsletter     | `/newsletter`      | Subscriber                             |
| Advertisement  | `/ads`             | Paket iklan, booking, slot banner      |
| Analytics      | `/analytics`       | Page view & statistik                  |
| Notification   | `/notifications`   | Notifikasi in-app                      |
| Audit          | `/audit`           | Audit log editorial                    |
| Admin          | `/admin`           | Panel superadmin                       |

Dokumentasi interaktif: **http://localhost:3001/api-docs** (Swagger).

---

## Sistem Role

| Role           | Kemampuan utama |
|----------------|-----------------|
| `reader`       | Membaca konten publik, berkomentar |
| `reporter`     | Menulis & submit artikel (perlu KYC disetujui) |
| `kontributor`  | Kontributor konten (KYC & gate serupa reporter) |
| `wapimred`     | Review/approve artikel, kategori, pengaturan situs |
| `advertiser`   | Memesan & mengelola kampanye iklan (dashboard ads) |
| `superadmin`   | Akses penuh semua situs & user |

> Role lama `jurnalis` telah dimigrasi ke `reporter` (lihat migrasi Prisma).

---

## Halaman Publik (Frontend)

| URL | Komponen | Keterangan |
|-----|----------|------------|
| `/[site]` | `SiteHomePage` | Homepage edisi |
| `/[site]/artikel/[slug]` | — | Halaman baca artikel |
| `/[site]/kebijakan-privasi` | `LegalStandardPage` | Kebijakan privasi (CMS `privacyPolicy`) |
| `/[site]/p/about`, `ethics`, `editorial`, `terms`, `media-siber` | `LegalStandardPage` | Dokumen legal dari site settings |
| `/[site]/p/ads` | `AdsMarketingPage` | Landing iklan untuk calon pengiklan |
| `/[site]/dashboard/ads` | — | Panel operasional iklan (login) |

Shell bersama halaman informasi: **`PublicInfoShell`** (`components/layout/`). Dokumen legal memakai **`components/legal/`**; marketing iklan memakai **`components/marketing/`**.

---

## Fitur Keamanan

- **JWT cookie-based** — Token di HttpOnly cookie, bukan `localStorage`
- **CSRF** — Token CSRF pada mutasi API (kecuali beberapa route auth)
- **Rate limiting (Redis)** — API umum: **1000 req/menit**; auth: **30 percobaan / 15 menit** (hanya yang gagal)
- **Helmet.js** — Security headers
- **Sanitasi input** — DOMPurify pada body request
- **KYC lock** — Lock sementara setelah percobaan verifikasi gagal berulang
- **Soft delete** — `deletedAt` pada entitas utama
- **Kuota AI** — Limit harian & budget bulanan per user/role

Ringkasan audit lengkap: [AUDIT_SISTEM.md](./AUDIT_SISTEM.md).

---

## Menjalankan Lokal

### Prasyarat

- Node.js 20+
- pnpm 10+
- PostgreSQL 15
- Redis 7 (disarankan untuk rate limit production-like)
- Meilisearch (opsional)

### Setup

```bash
git clone https://github.com/sabdakarya77-spec/beritakarya.git
cd beritakarya

pnpm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit: minimal DATABASE_URL, JWT_SECRET (api) dan NEXT_PUBLIC_API_URL (web)

pnpm --filter @beritakarya/api run db:generate
pnpm --filter @beritakarya/api run db:migrate
pnpm --filter @beritakarya/api run db:seed   # opsional

pnpm dev
```

| Layanan | URL |
|---------|-----|
| Web     | http://localhost:3000 |
| API     | http://localhost:3001 |
| Swagger | http://localhost:3001/api-docs |

---

## Scripts

### Root (Turborepo)

| Script            | Deskripsi                    |
|-------------------|------------------------------|
| `pnpm dev`        | Dev semua apps               |
| `pnpm build`      | Build production             |
| `pnpm test`       | Vitest (api, web, utils)     |
| `pnpm lint`       | ESLint                       |
| `pnpm type-check` | `tsc --noEmit`               |

### API (`apps/api`)

| Script                 | Deskripsi                |
|------------------------|--------------------------|
| `db:generate`          | Generate Prisma Client   |
| `db:migrate`           | Migrasi dev              |
| `db:migrate:deploy`    | Migrasi production       |
| `db:studio`            | Prisma Studio            |
| `db:seed`              | Seed data                |

### Web — Playwright (layout E2E)

```bash
pnpm --filter @beritakarya/web exec playwright test
```

---

## Environment Variables

| File | Dipakai oleh |
|------|----------------|
| `apps/api/.env.example` | API + Prisma |
| `apps/web/.env.example` | Next.js (utama: `NEXT_PUBLIC_*` untuk dev lokal) |
| `.env.production.example` | Referensi VPS |
| `infra/docker/.env` | Docker di server _(buat manual, di-gitignore)_ |

---

## Database (ringkas)

PostgreSQL 15 + Prisma. Model utama: **Site**, **User**, **Article**, **ArticleVersion**, **Category**, **Media**, **Advertisement** / **AdBooking**, **Comment**, **AuditLog**, **Notification**, **PageView**, **AIUsage**, **Invitation**, **NewsletterSubscriber**, dan tabel session/KYC.

Workflow artikel: `draft` → `submitted` → `review` → `revision` → `approved` → `scheduled` → `published` (atau `archived` / `rejected`).

---

## Deployment

Panduan VPS: **[VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)**

GitHub Actions:

- **`ci.yml`** — lint, type-check, build, `pnpm audit` (level high)
- **`deploy.yml`** — test + build & push image Docker ke GHCR (job deploy VPS dapat dinonaktifkan)

Frontend juga dapat di-deploy ke **Vercel** (`apps/web/vercel.json`).

---

## Testing

```bash
pnpm test                              # semua paket
pnpm --filter @beritakarya/api test    # API (Vitest + Supertest)
pnpm --filter @beritakarya/web test    # Web (Vitest)
```

---

## Design System & Dokumentasi

### Layout & halaman publik

- [Layout System](./docs/design-system/layout-system.md) — `Container`, token, bleed
- [Homepage Spec](./docs/design-system/homepage-spec.md)
- [Article Page Spec](./docs/design-system/article-spec.md)
- [Legal Public Pages](./docs/design-system/legal-public-page-spec.md)
- [Ads Public Page](./docs/design-system/ads-public-page-spec.md)

### Contoh `Container`

```tsx
import { Container } from '@/components/layout/Container'

<Container>{/* max ~1160px */}</Container>
<Container size="content">{/* ~760px untuk baca */}</Container>
<Container bleed>{/* edge-to-edge */}</Container>
```

### Contoh halaman legal

```tsx
import { LegalStandardPage } from '@/components/legal'

<LegalStandardPage
  siteConfig={siteConfig}
  title="Ketentuan Penggunaan"
  intro="…"
  content={htmlFromCms}
/>
```

### Roadmap & audit

- [UI/UX Roadmap (checklist S-tier)](./docs/UI_UX_ROADMAP.md)
- [Audit Sistem](./AUDIT_SISTEM.md)

---

## Backup Database

```bash
bash infra/scripts/backup-database.sh
```

Backup di `/var/backups/beritakarya/`, rotasi 7 hari.

---

## Lisensi

Proprietary — dikembangkan untuk BeritaKarya.
