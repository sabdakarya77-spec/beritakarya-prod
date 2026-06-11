import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, CalendarDays, Eye, FileText, Flame, Globe, Mail, Tags, User2, Users } from 'lucide-react'
import { SITE_MAP } from '@beritakarya/config'
import PublicSiteLayout from '../../../../components/layout/PublicSiteLayout'
import { Container } from '../../../../components/layout/Container'
import NewsCard from '../../../../components/ui/NewsCard'
import { ROLE_LABELS, getCategoryColor } from '../../../../lib/constants'
import { cn } from '../../../../lib/utils'

interface Props {
  params: { site: string; id: string }
}

interface AuthorProfileResponse {
  profile: {
    id: string
    name: string
    role: string
    bio: string | null
    createdAt: string
  }
  stats: {
    publishedCount: number
    totalViews: number
  }
  recentArticles: any[]
}

// ─── Fetch helpers ──────────────────────────────────────────────────

async function getSiteSettings(siteId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/sites/settings?site=${siteId}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch {
    return null
  }
}

async function getAuthorProfile(siteId: string, authorId: string): Promise<AuthorProfileResponse | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/users/public/${authorId}?site=${siteId}`, {
      next: { revalidate: 60 }
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch {
    return null
  }
}

async function getOtherAuthors(siteId: string, currentId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/users/authors?site=${siteId}&limit=6`, { next: { revalidate: 120 } })
    if (!res.ok) return []
    const json = await res.json()
    const authors = json?.data || []
    return authors.filter((a: any) => a.id !== currentId).slice(0, 4)
  } catch {
    return []
  }
}

// ─── Utility helpers ────────────────────────────────────────────────

function getFallbackBio(name: string, role: string, siteName: string) {
  const roleLabel = ROLE_LABELS[role] || 'Penulis'
  return `${name} merupakan ${roleLabel.toLowerCase()} di ${siteName} yang aktif menyajikan informasi secara akurat, ringkas, dan relevan bagi pembaca.`
}

function formatJoinDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function getRoleGradient(role: string) {
  switch (role?.toLowerCase()) {
    case 'superadmin':
      return 'from-brand-red to-red-700 shadow-[0_20px_50px_rgba(225,29,72,0.22)]'
    case 'wapimred':
      return 'from-amber-500 to-amber-700 shadow-[0_20px_50px_rgba(245,158,11,0.22)]'
    case 'reporter':
      return 'from-blue-500 to-blue-700 shadow-[0_20px_50px_rgba(59,130,246,0.22)]'
    case 'kontributor':
      return 'from-indigo-500 to-indigo-700 shadow-[0_20px_50px_rgba(99,102,241,0.22)]'
    default:
      return 'from-slate-500 to-slate-700 shadow-[0_20px_50px_rgba(100,116,139,0.22)]'
  }
}

function getRoleBadgeClass(role: string) {
  switch (role?.toLowerCase()) {
    case 'superadmin':
      return 'bg-red-50 text-brand-red dark:bg-brand-red/10 dark:text-red-400'
    case 'wapimred':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    case 'reporter':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
    case 'kontributor':
      return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
    default:
      return 'bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-brand-text-muted'
  }
}

// ─── Expertise extraction ───────────────────────────────────────────

function extractExpertise(articles: any[]): { name: string; count: number }[] {
  const categoryMap = new Map<string, number>()
  for (const article of articles) {
    const cat = article.category?.name
    if (cat) categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
  }
  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

// ─── Metadata ───────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const siteParam = resolvedParams?.site || 'pusat'
  const authorId = resolvedParams?.id

  const [profileData, siteSettings] = await Promise.all([
    getAuthorProfile(siteParam, authorId),
    getSiteSettings(siteParam)
  ])

  const fallbackConfig = SITE_MAP[siteParam] || SITE_MAP.pusat
  const siteName = siteSettings?.name || fallbackConfig?.name || 'BeritaKarya'
  const faviconUrl = siteSettings?.faviconUrl || '/favicon.ico'

  if (!profileData) {
    return { title: 'Profil Penulis Tidak Ditemukan', description: 'Profil penulis yang Anda cari tidak tersedia.', icons: faviconUrl }
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const title = `${profileData.profile.name} - Profil Penulis ${siteName}`
  const description = (profileData.profile.bio || getFallbackBio(profileData.profile.name, profileData.profile.role, siteName)).slice(0, 160)
  const url = `${baseUrl}/${siteParam}/penulis/${authorId}`

  return {
    title, description, metadataBase: new URL(baseUrl),
    openGraph: { title, description, url, siteName, locale: 'id_ID', type: 'profile' },
    twitter: { card: 'summary_large_image', title, description, creator: '@beritakarya' },
    icons: faviconUrl,
  }
}

// ─── Page Component ─────────────────────────────────────────────────

export default async function AuthorProfilePage({ params }: Props) {
  const resolvedParams = await params
  const siteParam = resolvedParams?.site || 'pusat'
  const authorId = resolvedParams?.id

  const [siteSettings, profileData, otherAuthors] = await Promise.all([
    getSiteSettings(siteParam),
    getAuthorProfile(siteParam, authorId),
    getOtherAuthors(siteParam, authorId),
  ])

  if (!profileData) notFound()

  const siteConfig = {
    id: siteParam,
    name: siteSettings?.name || SITE_MAP[siteParam]?.name || (siteParam.charAt(0).toUpperCase() + siteParam.slice(1)),
    domain: siteSettings?.domain || SITE_MAP[siteParam]?.domain || `${siteParam}.beritakarya.co`,
    description: siteSettings?.description || SITE_MAP[siteParam]?.description || `Portal berita resmi ${siteParam}.`,
    footerText: siteSettings?.footerText || SITE_MAP[siteParam]?.footerText || `© ${new Date().getFullYear()} BERITA KARYA. ALL RIGHTS RESERVED.`,
    address: siteSettings?.address || SITE_MAP[siteParam]?.address || 'Jl. Merdeka No. 123, Jakarta Pusat, Indonesia',
    contactEmail: siteSettings?.contactEmail || SITE_MAP[siteParam]?.contactEmail || 'support.beritakarya@gmail.com',
    phone: siteSettings?.phone || SITE_MAP[siteParam]?.phone || null,
    socialLinks: siteSettings?.socialLinks || SITE_MAP[siteParam]?.socialLinks || {},
    appearance: siteSettings?.appearance || SITE_MAP[siteParam]?.appearance || { primaryColor: '#e11d48' },
    trendingTopics: siteSettings?.trendingTopics || [],
    devDomain: SITE_MAP[siteParam]?.devDomain || `${siteParam}.localhost:3000`
  }

  const { profile, stats, recentArticles } = profileData
  const roleLabel = ROLE_LABELS[profile.role] || 'Penulis'
  const bio = profile.bio || getFallbackBio(profile.name, profile.role, siteConfig.name)
  const joinedAt = formatJoinDate(profile.createdAt)
  const initials = getInitials(profile.name)
  const expertise = extractExpertise(recentArticles)
  const featuredArticle = recentArticles[0]
  const remainingArticles = recentArticles.slice(1)

  const sidebarCardClass = 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-5'
  const sidebarLabelClass = 'flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted'

  return (
    <PublicSiteLayout siteConfig={siteConfig}>
      <main className="min-h-screen">
        {/* ── HERO SECTION ────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-gray-100 bg-white pt-16 dark:border-white/5 dark:bg-slate-950 md:pt-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.1),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.03))] dark:bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]" />
          <Container>
            <div className="pb-10 md:pb-14">
              {/* Back link */}
              <Link
                href={`/${siteParam}/penulis`}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted transition-colors hover:text-brand-red"
              >
                <ArrowLeft size={14} />
                Kembali ke Halaman Penulis
              </Link>

              {/* Profile header */}
              <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8 md:gap-10">
                {/* Avatar — role-based gradient [Point 3] */}
                <div className="shrink-0 text-center sm:text-left">
                  <div className={cn(
                    'inline-flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-gradient-to-br text-3xl font-serif font-black text-white transition-transform duration-300 hover:scale-105 md:h-28 md:w-28 md:text-4xl',
                    getRoleGradient(profile.role)
                  )}>
                    {initials}
                  </div>
                  {/* Role badge — role-based color [Point 3] */}
                  <div className="mt-3">
                    <span className={cn(
                      'inline-block rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]',
                      getRoleBadgeClass(profile.role)
                    )}>
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Name + Bio + Social + Expertise */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-brand-red" />
                      Bergabung sejak {joinedAt}
                    </span>
                  </div>

                  <h1 className="mt-3 text-3xl font-serif font-black tracking-[-0.04em] text-brand-black dark:text-white sm:text-4xl lg:text-5xl xl:text-[3.25rem] xl:leading-[1.04]">
                    {profile.name}
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[0.95rem] md:leading-relaxed">
                    {bio}
                  </p>

                  {/* Social links [Point 4] */}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${siteConfig.contactEmail}`}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-text-muted transition-all hover:border-brand-red/30 hover:bg-brand-red hover:text-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-red/30 dark:hover:bg-brand-red dark:hover:text-white"
                    >
                      <Mail size={12} />
                      Hubungi
                    </a>
                    <Link
                      href={`/${siteParam}`}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-text-muted transition-all hover:border-brand-red/30 hover:bg-brand-red hover:text-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-red/30 dark:hover:bg-brand-red dark:hover:text-white"
                    >
                      <Globe size={12} />
                      {siteConfig.name}
                    </Link>
                  </div>

                  {/* Expertise tags [Point 10] */}
                  {expertise.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">Keahlian:</span>
                      {expertise.map(({ name, count }) => (
                        <Link
                          key={name}
                          href={`/${siteParam}?cat=${encodeURIComponent(name)}`}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] transition-colors hover:opacity-80',
                            getCategoryColor(name)
                          )}
                        >
                          {name}
                          <span className="opacity-60">({count})</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats strip */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:max-w-lg">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3.5 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-brand-text-muted">
                    <FileText size={11} className="text-brand-red" />
                    Artikel Terbit
                  </div>
                  <p className="mt-2 text-xl font-black text-brand-black dark:text-white">
                    {stats.publishedCount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3.5 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-brand-text-muted">
                    <Eye size={11} className="text-brand-red" />
                    Total Dilihat
                  </div>
                  <p className="mt-2 text-xl font-black text-brand-black dark:text-white">
                    {formatCompactNumber(stats.totalViews)}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3.5 dark:border-white/5 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-brand-text-muted">
                    <CalendarDays size={11} className="text-brand-red" />
                    Kanal
                  </div>
                  <p className="mt-2 text-base font-black text-brand-black dark:text-white">
                    {siteConfig.name}
                  </p>
                </div>
              </div>

              {/* Editorial note */}
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.02] sm:max-w-lg">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" />
                <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Seluruh artikel telah melalui proses kurasi, verifikasi, dan standar editorial jaringan BeritaKarya.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* ── ARTICLES + SIDEBAR SECTION [Point 1] ────────────────── */}
        <section className="py-14 md:py-20">
          <Container>
            {/* Section heading */}
            <div className="mb-8 max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
                Arsip Penulis
              </p>
              <h2 className="mt-3 text-3xl font-serif font-black tracking-[-0.04em] text-brand-black dark:text-white md:text-4xl">
                Tulisan terbaru dari {profile.name}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                Kumpulan artikel terbaru yang memperlihatkan fokus liputan, konsistensi publikasi, dan jejak editorial penulis di {siteConfig.name}.
              </p>
            </div>

            {/* Two-column layout */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Main content */}
              <div className="lg:col-span-8">
                {recentArticles.length > 0 ? (
                  <div className="space-y-8">
                    {/* Featured article — large hero card [Point 2] */}
                    {featuredArticle && (
                      <NewsCard article={featuredArticle} variant="large" site={siteParam} priority />
                    )}

                    {/* Remaining articles — medium grid with hover [Point 5] */}
                    {remainingArticles.length > 0 && (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                          <span className="text-[9px] font-black uppercase tracking-[0.22em] text-brand-text-muted">Publikasi Lainnya</span>
                          <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          {remainingArticles.map((article) => (
                            <div
                              key={article.id}
                              className="transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                            >
                              <NewsCard article={article} variant="medium" site={siteParam} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.02]">
                    <User2 size={34} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
                      Belum ada artikel terbit dari penulis ini.
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar [Point 1, 6, 7, 8] */}
              <aside className="mt-10 lg:col-span-4 lg:mt-0">
                <div className="sticky top-32 space-y-4">
                  {/* Artikel Populer [Point 6] */}
                  {recentArticles.length > 1 && (
                    <div className={cn(sidebarCardClass, 'space-y-3.5')}>
                      <div className={sidebarLabelClass}>
                        <Flame size={12} className="text-brand-red" />
                        Artikel dari {profile.name.split(' ')[0]}
                      </div>
                      <div className="space-y-3">
                        {recentArticles.slice(0, 4).map((article: any, idx: number) => (
                          <Link
                            key={article.id}
                            href={`/${siteParam}/artikel/${article.slug}`}
                            className="group flex items-start gap-3"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[11px] font-black text-brand-text-muted transition-colors group-hover:bg-brand-red group-hover:text-white dark:bg-white/5">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-[11px] font-bold leading-snug text-brand-black dark:text-white transition-colors group-hover:text-brand-red">
                                {article.title}
                              </p>
                              <p className="mt-1 text-[9px] font-semibold text-brand-text-muted">
                                {article.readingTimeMin || 3} min baca
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topik Keahlian [Point 7] */}
                  {expertise.length > 0 && (
                    <div className={cn(sidebarCardClass, 'space-y-3.5')}>
                      <div className={sidebarLabelClass}>
                        <Tags size={12} className="text-brand-red" />
                        Topik Keahlian
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {expertise.map(({ name, count }) => (
                          <Link
                            key={name}
                            href={`/${siteParam}?cat=${encodeURIComponent(name)}`}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] transition-colors hover:opacity-80',
                              getCategoryColor(name)
                            )}
                          >
                            {name}
                            <span className="opacity-60">({count})</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Penulis Lain [Point 8] */}
                  {otherAuthors.length > 0 && (
                    <div className={cn(sidebarCardClass, 'space-y-3.5')}>
                      <div className={sidebarLabelClass}>
                        <Users size={12} className="text-brand-red" />
                        Rekan Penulis
                      </div>
                      <div className="space-y-3">
                        {otherAuthors.map((author: any) => (
                          <Link
                            key={author.id}
                            href={`/${siteParam}/penulis/${author.id}`}
                            className="group flex items-center gap-3"
                          >
                            <div className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white transition-transform group-hover:scale-105',
                              getRoleGradient(author.role)
                            )}>
                              {getInitials(author.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-bold text-brand-black dark:text-white transition-colors group-hover:text-brand-red">
                                {author.name}
                              </p>
                              <p className="text-[9px] font-semibold text-brand-text-muted">
                                {ROLE_LABELS[author.role] || author.role} · {author.publishedCount || 0} artikel
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/${siteParam}/penulis`}
                        className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-brand-red transition-colors hover:text-brand-black dark:hover:text-white"
                      >
                        Lihat Semua Penulis
                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                      </Link>
                    </div>
                  )}

                  {/* Ad slot */}
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">
                      Ruang Iklan
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </main>
    </PublicSiteLayout>
  )
}
