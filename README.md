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
│   │   │   ├── middleware/          ← Auth, rate-limit, sanitize
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
├── docs/                            ← Documentation (Coming Soon)
├── docker-compose.yml               ← Local dev services
└── .github/workflows/               ← CI pipeline
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
| **Auth**       | JWT HttpOnly cookie + CORS whitelist       |
| **Container**  | Docker + Docker Compose                    |
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
- **CORS ketat** — Hanya origin tertentu yang diizinkan
- **Rate limiting (Redis)** — API umum: **1000 req/menit**; auth: **30 percobaan / 15 menit** (hanya yang gagal)
- **Helmet.js** — Security headers
- **Sanitasi input** — DOMPurify pada body request
- **KYC lock** — Lock sementara setelah percobaan verifikasi gagal berulang
- **Soft delete** — `deletedAt` pada entitas utama
- **Kuota AI** — Limit harian & budget bulanan per user/role

<!-- TODO: Tambahkan ringkasan audit setelah AUDIT_SISTEM.md dibuat -->

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

---

## Database (ringkas)

PostgreSQL 15 + Prisma. Model utama: **Site**, **User**, **Article**, **ArticleVersion**, **Category**, **Media**, **Advertisement** / **AdBooking**, **Comment**, **AuditLog**, **Notification**, **PageView**, **AIUsage**, **Invitation**, **NewsletterSubscriber**, dan tabel session/KYC.

Workflow artikel: `draft` → `submitted` → `review` → `revision` → `approved` → `scheduled` → `published` (atau `archived` / `rejected`).

---

## Deployment

Arsitektur produksi: **Self-Hosted LXC** (Proxmox VE) + **Cloudflare** (DNS/Tunnel/CDN).

```
┌─────────────────────────────────────────────────────────┐
│  MikroTik Router → Proxmox VE → 3 LXC Containers       │
│                                                         │
│  CT 101: PostgreSQL + Redis + Meilisearch + MinIO       │
│  CT 102: Next.js + Express API + Caddy + Cloudflare     │
│  CT 103: Prometheus + Grafana                           │
└─────────────────────────────────────────────────────────┘
```

### Dokumentasi Deployment

| Dokumen | Deskripsi |
|---------|-----------|
| [`docs/implementasi-infra.md`](docs/implementasi-infra.md) | Plan infrastruktur LXC (referensi utama) |
| [`docs/implementasi-codebase.md`](docs/implementasi-codebase.md) | Plan penyesuaian codebase |
| [`docs/Analisa.md`](docs/Analisa.md) | Analisis mendalam + checklist gabungan |
| [`docs/panduan_produksi_lxc.md`](docs/panduan_produksi_lxc.md) | Panduan teknis LXC container |
| [`docs/mikrotik-tutorial-expanded.md`](docs/mikrotik-tutorial-expanded.md) | Panduan topologi jaringan MikroTik |

### Quick Deploy (Self-Hosted)

```bash
# Di CT 102 (10.0.0.12)
cd /var/www/beritakarya-prod
bash scripts/deploy.sh
```

### GitHub Actions

- **`ci.yml`** — lint, type-check, build, test, `pnpm audit` (level high), E2E Playwright
- **`deploy.yml`** — build & push Docker images ke GHCR (triggered on push to main)
- **`backup.yml`** — daily database backup (2 AM UTC / 9 AM WIB)

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

- [Architecture](docs/architecture.md) — Arsitektur sistem
- [Implementasi Infra](docs/implementasi-infra.md) — Plan infrastruktur produksi
- [Implementasi Codebase](docs/implementasi-codebase.md) — Plan penyesuaian codebase
- [Analisa](docs/Analisa.md) — Analisis mendalam + checklist
- [WordPress Import](docs/wordpress-import.md) — Panduan impor berita lama
- [Contributing](CONTRIBUTING.md) — Cara berkontribusi
- Layout System — `Container`, token, bleed _(Coming Soon)_

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

- [Documentation](docs/README.md) — Semua dokumentasi
- UI/UX Roadmap _(Coming Soon)_
- Audit Sistem _(Coming Soon)_

---

## Backup Database

Backup PostgreSQL otomatis dijalankan setiap malam pukul 02:00 via cron di CT 101:

```bash
# Lokasi backup
/var/backups/postgresql/

# Retensi: 3 hari (disk sharing dengan MinIO)
# Off-site: rsync ke NAS atau MinIO bucket terpisah (rekomendasi)
```

Lihat `docs/implementasi-infra.md` BAB 4.6 untuk detail script backup.

---

## Lisensi

Proprietary — dikembangkan untuk BeritaKarya.
