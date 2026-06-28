import NewsCard from '../ui/NewsCard'
import PublicSiteLayout from '../layout/PublicSiteLayout'
import AdSpace from '../ui/AdSpace'
import Link from 'next/link'
import { TrendingUp, Zap, Star, Clock, Mail, ArrowRight, Play } from 'lucide-react'
import { SiTelegram, SiWhatsapp } from '../ui/SocialIcons'
import LoadMoreArticles from '../ui/LoadMoreArticles'
import SavedArticlesFeed from '../ui/SavedArticlesFeed'
import VideoWidget from '../ui/VideoWidget'
import { SmartImage } from '../ui/SmartImage'
import { MagazineBentoHero } from '../berita/MagazineBentoHero'
import { notFound } from 'next/navigation'
import ScrollAnimate from '../ui/ScrollAnimate'
import { Container } from '../layout/Container'
import MarketWidget from '../ui/MarketWidget'
import { API_URL } from '../../lib/api'
import { fetchSiteSettings, buildPublicSiteConfig } from '../../lib/siteSettings'

// ─────────────────────────────────────────────
// Types for API-fetched data
// ─────────────────────────────────────────────
interface ArticleBlock {
  type: string
  url?: string
  embedType?: string
  images?: { url: string; alt?: string; caption?: string }[]
  content?: string
}

interface HomeArticle {
  id: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: string
  contentType?: string
  publishedAt?: string
  createdAt?: string
  isFeatured?: boolean
  isExclusive?: boolean
  readingTimeMin?: number
  wordCount?: number
  author?: { name: string; avatarUrl?: string | null }
  category?: { name: string; slug?: string; parentSlug?: string } // legacy
  categories?: Array<{ category?: { name?: string; slug?: string } | null }> | null
  blocks?: ArticleBlock[]
}

interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  subCategories?: { name: string; slug: string }[]
}

// ─────────────────────────────────────────────
// Helper: resolve nama kategori dari slug
// ─────────────────────────────────────────────
function resolveCategoryName(slug: string, categoriesTree: CategoryTreeNode[] = []): string {
  if (slug === 'terbaru') return 'Terbaru'
  if (slug === 'tersimpan') return 'Tersimpan'
  for (const cat of categoriesTree) {
    if (cat.slug === slug) return cat.name
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        if (sub.slug === slug) return `${cat.name} / ${sub.name}`
      }
    }
  }
  return slug
}

// ─────────────────────────────────────────────
// Helpers for Fallback Article Thumbnails
// ─────────────────────────────────────────────
function getPhotoThumbnail(article: HomeArticle): string | null {
  if (article.featuredImage) return article.featuredImage

  if (Array.isArray(article.blocks)) {
    const galleryBlock = article.blocks.find((b: ArticleBlock) => b.type === 'gallery')
    if (galleryBlock?.images?.[0]?.url) {
      return galleryBlock.images[0].url
    }

    const imageBlock = article.blocks.find((b: ArticleBlock) => b.type === 'image')
    if (imageBlock?.url) {
      return imageBlock.url
    }

    const gridBlock = article.blocks.find((b: ArticleBlock) => b.type === 'imageGrid')
    if (gridBlock?.images?.[0]?.url) {
      return gridBlock.images[0].url
    }
  }

  return '/placeholder.jpg'
}

function getVideoThumbnail(article: HomeArticle): string | null {
  if (article.featuredImage) return article.featuredImage

  if (Array.isArray(article.blocks)) {
    const embedBlock = article.blocks.find((b: ArticleBlock) => b.type === 'embed' && b.embedType === 'youtube')
    if (embedBlock?.url) {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
      const match = embedBlock.url.match(regExp)
      if (match && match[2].length === 11) {
        return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`
      }
    }
  }

  return '/placeholder.jpg'
}

// ─────────────────────────────────────────────
// Helper: build URL WhatsApp redaksi
// ─────────────────────────────────────────────
function buildWhatsAppUrl(phone?: string | null, siteName?: string) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const normalizedNumber = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
      ? `62${digits}`
      : digits
  const intro = encodeURIComponent(`Halo ${siteName || 'BeritaKarya'}, saya ingin menghubungi WhatsApp Redaksi.`)
  return `https://wa.me/${normalizedNumber}?text=${intro}`
}

// ─────────────────────────────────────────────
// Utility class constants
// ─────────────────────────────────────────────
const sectionEyebrowClass = 'text-[10px] font-black uppercase tracking-[0.16em]'
const sectionEyebrowMutedClass = `${sectionEyebrowClass} text-brand-text-muted`
const sectionMetaClass = 'text-[10px] font-semibold text-brand-text-muted'
const sectionTitleClass = 'text-base md:text-xl font-sans font-extrabold tracking-tight text-brand-black dark:text-white'

function formatSidebarDate(dateValue?: string | Date) {
  if (!dateValue) return ''
  return new Date(dateValue).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type SearchParams = {
  cat?: string
  q?: string
}

type SiteHomePageProps = {
  siteParam: string
  searchParams: SearchParams
}

// ─────────────────────────────────────────────
// Data Fetchers
// ─────────────────────────────────────────────
async function getArticles(siteId: string, category?: string, search?: string) {
  try {
    let url = `${API_URL}/api/v1/articles/public?site=${siteId}&limit=25`
    if (category && category !== 'terbaru' && category !== 'tersimpan') {
      url += `&category=${encodeURIComponent(category)}`
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data?.articles || json?.data?.items || []
  } catch (e) {
    console.error('Error fetching articles:', e)
    return []
  }
}

async function getTrendingArticles(siteId: string) {
  try {
    const params = new URLSearchParams({
      site: siteId,
      status: 'published',
      limit: '5',
      sort: 'views',
      order: 'desc',
    })
    const res = await fetch(
      `${API_URL}/api/v1/articles/public?${params.toString()}`,
      { next: { revalidate: 120 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return json?.data?.articles || json?.data?.items || []
  } catch (e) {
    console.error('Error fetching trending articles:', e)
    return []
  }
}

async function getCategories(siteId: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/categories/tree?site=${siteId}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data || []
  } catch (e) {
    console.error('Error fetching categories tree:', e)
    return []
  }
}

async function getMarketSnapshot() {
  try {
    const res = await fetch(`${API_URL}/api/v1/market/snapshot`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch (e) {
    console.error('Error fetching market snapshot:', e)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────
// distributeArticles
// Mendistribusikan artikel ke slot section yang terpisah secara deterministik.
// Tidak ada artikel yang bisa muncul di dua section berbeda.
//
// Slot:
//  hero          [0..3]   — 4 artikel terbaru → MagazineBentoHero
//  fokusRedaksi  [4..7]   — prioritas isFeatured/isExclusive, grid asimetris
//  feedFeatured  [8..9]   — 2 kartu horizontal besar (Berita Terbaru atas)
//  feedStream    [10..15] — 6 kartu medium 2-kolom (Berita Lainnya)
//  editorChoice           — dari sisa: filter isFeatured, maks 3
//  opinion                — dari sisa: maks 3
//  photoJournal           — dari sisa: maks 3
//  videoStories           — dari sisa: maks 3
//  popular                — 5 artikel non-hero (boleh overlap, untuk sidebar)
// ─────────────────────────────────────────────────────────────────────────
function distributeArticles(articles: HomeArticle[], trendingIds: Set<string> = new Set()) {
  const empty = {
    hero: [], fokusRedaksi: [], feedFeatured: [], feedStream: [],
    editorChoice: [], opinion: [], photoJournal: [], videoStories: [], popular: []
  }
  if (!articles || articles.length === 0) return empty

  // Filter berdasarkan kategori — Opini, Foto Jurnalistik, Video
  const opinionSlugs = ['opini', 'kolom-esai', 'analisis', 'kolom']
  const photoSlugs = ['foto-jurnalistik']
  const videoSlugs = ['video', 'dokumenter-reportase', 'podcast-audio']

  // Helper: cek apakah artikel punya kategori dengan slug tertentu (multi-category aware)
  const hasCategorySlug = (a: HomeArticle, slugs: string[]): boolean => {
    // Cek di categories array (baru)
    if (a.categories?.some(c => slugs.includes(c.category?.slug?.toLowerCase() || ''))) return true
    // Fallback: cek di category (legacy)
    const catSlug = a.category?.slug?.toLowerCase() || ''
    const parentSlug = a.category?.parentSlug?.toLowerCase() || ''
    return slugs.includes(catSlug) || slugs.includes(parentSlug)
  }

  // 1. Ekstrak Foto Jurnalistik dari seluruh artikel (tidak terbatas dari afterFeed)
  const photoJournal = articles.filter((a: HomeArticle) => {
    return a.contentType === 'photo_journalism' || hasCategorySlug(a, photoSlugs)
  }).slice(0, 3)
  const photoJournalIds = new Set(photoJournal.map((a: HomeArticle) => a.id))

  // 2. Ekstrak Video dari seluruh artikel (tidak terbatas dari afterFeed)
  const videoStories = articles.filter((a: HomeArticle) => {
    return a.contentType === 'video_exclusive' || hasCategorySlug(a, videoSlugs)
  }).slice(0, 3)
  const videoStoriesIds = new Set(videoStories.map((a: HomeArticle) => a.id))

  // 3. Saring artikel umum (non-foto dan non-video) untuk masuk ke feed utama (Hero, Fokus, dll.)
  const generalArticles = articles.filter((a: HomeArticle) => !photoJournalIds.has(a.id) && !videoStoriesIds.has(a.id))

  // Adaptive allocation: jika artikel sedikit, kurangi hero/fokusRedaksi
  // agar feed "Berita Terbaru" tetap terisi
  const heroCount = generalArticles.length <= 15 ? 2 : 4
  const fokusMax = generalArticles.length <= 15 ? 2 : 4

  // Zona 1 — Hero
  const hero = generalArticles.slice(0, heroCount)
  const heroIds = new Set(hero.map((a: HomeArticle) => a.id))

  // Zona 2 — Fokus Redaksi: prioritaskan isFeatured/isExclusive yang belum di hero
  const featuredPool = generalArticles
    .slice(heroCount)
    .filter((a: HomeArticle) => a.isFeatured || a.isExclusive)
    .slice(0, fokusMax)
  // Fallback ke urutan biasa jika featured tidak cukup
  const fokusRedaksi = featuredPool.length >= 2 ? featuredPool : generalArticles.slice(heroCount, heroCount + fokusMax)

  // Kumpulkan semua ID yang sudah dipakai
  const usedIds = new Set([
    ...hero.map((a: HomeArticle) => a.id),
    ...fokusRedaksi.map((a: HomeArticle) => a.id),
  ])

  // Artikel sisa yang belum dipakai di hero atau fokusRedaksi
  const remaining = generalArticles.filter((a: HomeArticle) => !usedIds.has(a.id))

  // Zona 4 — Feed utama: 2 horizontal + sisa untuk grid
  const feedFeatured = remaining.slice(0, 2)
  const feedStream = remaining.slice(2, 8)

  // Zona 5+ — Editorial extras (full-width, di bawah zona sidebar)
  const afterFeed = remaining.slice(8)
  const editorChoice = afterFeed.filter((a: HomeArticle) => a.isFeatured).slice(0, 3)

  // Opinion: ambil dari artikel dengan kategori opini/analisis
  const opinion = afterFeed.filter((a: HomeArticle) => {
    return hasCategorySlug(a, opinionSlugs)
  }).slice(0, 3)

  // Sidebar Terbaru: artikel terbaru yang tidak ada di hero maupun trending
  // Sengaja berbeda dari TRENDING section (yang by views) agar tidak ada duplikasi
  const popular = articles
    .filter((a: HomeArticle) => !heroIds.has(a.id) && !trendingIds.has(a.id))
    .slice(0, 5)

  return { hero, fokusRedaksi, feedFeatured, feedStream, editorChoice, opinion, photoJournal, videoStories, popular }
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export async function SiteHomePage({ siteParam, searchParams }: SiteHomePageProps) {
  const resolvedSearchParams = await searchParams
  const categoryFilter = resolvedSearchParams?.cat || 'terbaru'
  const searchQuery = resolvedSearchParams?.q || ''

  const siteSettings = await fetchSiteSettings(siteParam)

  if (!siteSettings && siteParam !== 'pusat') {
    notFound()
  }

  const siteConfig = buildPublicSiteConfig(siteParam, siteSettings)

  const [articlesList, categoriesTree, marketData, trendingArticles] = await Promise.all([
    getArticles(siteConfig.id, categoryFilter, searchQuery),
    getCategories(siteConfig.id),
    getMarketSnapshot(),
    getTrendingArticles(siteConfig.id),
  ])

  // Mode halaman
  const isHomepage = !searchQuery && categoryFilter === 'terbaru'
  const isCategoryFilter = categoryFilter && categoryFilter !== 'terbaru' && categoryFilter !== 'tersimpan'
  const showSavedFeed = categoryFilter === 'tersimpan'

  // ── Distribusi artikel (homepage) ──
  // Teruskan trendingIds agar sidebar tidak menampilkan artikel yang sama dengan TRENDING
  const trendingIds = new Set<string>(trendingArticles.map((a: HomeArticle) => a.id))
  const dist = isHomepage ? distributeArticles(articlesList, trendingIds) : null

  const heroArticles = dist?.hero || []
  const fokusRedaksi = dist?.fokusRedaksi || []
  const feedFeatured = dist?.feedFeatured || []
  const feedStream = dist?.feedStream || []
  const editorChoice = dist?.editorChoice || []
  const opinionArticles = dist?.opinion || []
  const photoJournal = dist?.photoJournal || []
  const videoStories = dist?.videoStories || []
  const sidebarPopular = dist?.popular || []

  // ── Feed untuk halaman kategori/pencarian ──
  const catFeedFeatured = articlesList.slice(0, 2)
  const catFeedStream = articlesList.slice(2, 8)
  const catPopular = articlesList.slice(0, 5)

  // Pilih antara homepage feed atau kategori/cari feed
  const mainFeedFeatured = isHomepage ? feedFeatured : catFeedFeatured
  const mainFeedStream = isHomepage ? feedStream : catFeedStream
  const popular = isHomepage ? sidebarPopular : catPopular

  // ── Conditional flags ──
  const showHomepageHero = isHomepage && heroArticles.length > 0
  const showFokusRedaksi = isHomepage && fokusRedaksi.length > 0
  const showTrending = isHomepage && trendingArticles.length > 0
  const showInlineSponsor = mainFeedFeatured.length > 0 || mainFeedStream.length > 0
  const showEditorChoice = isHomepage && editorChoice.length >= 2
  const showOpinionSection = isHomepage && opinionArticles.length >= 2
  const showPhotoSection = isHomepage && photoJournal.length >= 1
  const showVideoSection = isHomepage && videoStories.length >= 1
  const showEditorialExtras = isHomepage && (showEditorChoice || showOpinionSection || showPhotoSection || showVideoSection)

  const whatsappUrl = buildWhatsAppUrl(siteConfig.phone, siteConfig.name)
  const telegramUrl = siteConfig.socialLinks?.telegram || null
  const reportUrl = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(`Laporan Warga untuk ${siteConfig.name}`)}`

  return (
    <PublicSiteLayout siteConfig={siteConfig} initialCategory={categoryFilter}>
      <main id="main-content" className="pb-20 md:pb-6">

        {/* ════════════════════════════════════════════════════════
            ZONA 1 — HERO  (Full Width)
            Artikel: [0..3] — 4 berita paling baru
            Komponen: MagazineBentoHero (slider otomatis 5 detik)
        ════════════════════════════════════════════════════════ */}
        {showHomepageHero && (
          <section className="border-y border-black/5 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_72%)] dark:border-white/5 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,1)_72%)]">
            <Container className="py-5 md:py-6">
              <MagazineBentoHero articles={heroArticles} site={siteParam} />
            </Container>
          </section>
        )}

        {/* ─── AD HOME_TOP — setelah hero agar user disambut konten terlebih dahulu ─── */}
        <Container className="py-4 md:py-5">
          <AdSpace type="HOME_TOP" />
        </Container>

        {/* ════════════════════════════════════════════════════════
            ZONA 2 — FOKUS REDAKSI  (Full Width, Grid Asimetris)
            Artikel: [4..7] — prioritas isFeatured/isExclusive
            Layout desktop: 1 kartu besar (col-2) + 3 kartu stacked (col-1)
            Sidebar: TIDAK ADA — butuh ruang penuh untuk dampak visual
        ════════════════════════════════════════════════════════ */}
        {showFokusRedaksi && (
          <Container className="py-4 md:py-6">
            <ScrollAnimate>
              {/* Section header */}
              <div className="mb-5 flex items-center gap-2">
                <Zap size={14} className="text-brand-red" />
                <h2 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
                  Fokus Redaksi
                </h2>
              </div>

              {/* Grid asimetris: 2 kolom kiri (besar) + 1 kolom kanan (2 stacked, balance) */}
              <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
                {/* Kartu Besar — artikel pertama, mengambil 2/3 lebar, tinggi mengikuti kolom kanan */}
                {fokusRedaksi[0] && (
                  <div className="md:col-span-2 md:h-full">
                    <NewsCard
                      article={fokusRedaksi[0]}
                      variant="large"
                      site={siteParam}
                      priority
                    />
                  </div>
                )}

                {/* Kolom kanan — 2 artikel saja agar balance dengan kartu besar */}
                <div className="flex flex-col gap-3 md:h-full">
                  {fokusRedaksi.slice(1, 3).map((article: HomeArticle) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      variant="horizontal"
                      site={siteParam}
                    />
                  ))}
                </div>
              </div>
            </ScrollAnimate>
          </Container>
        )}

        {/* ════════════════════════════════════════════════════════
            ZONA 3 — TRENDING TOPICS  (Full Width)
            Sumber: trendingTopics dari site settings atau default tags
            Sidebar: TIDAK ADA — strip horizontal sederhana
        ════════════════════════════════════════════════════════ */}
        {showTrending && trendingArticles.length > 0 && (
          <Container className="pb-4 md:pb-6">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-brand-red" />
                <span className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
                  Trending
                </span>
              </div>
              <div className="grid grid-cols-1 gap-0 divide-y divide-black/5 dark:divide-white/5 md:grid-cols-5 md:divide-x md:divide-y-0">
                {trendingArticles.map((article: HomeArticle, index: number) => (
                  <Link
                    key={article.id}
                    href={`/${siteParam}/artikel/${article.slug}`}
                    className="group flex items-start gap-3 py-3 md:px-4 md:py-0 md:pb-3 first:pt-0 last:pb-0"
                  >
                    <span className="tabular-nums font-sans text-2xl font-bold leading-none tracking-tight text-gray-100 transition-colors group-hover:text-brand-red dark:text-white/5 md:text-3xl">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 font-sans text-xs font-bold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-[13px]">
                        {article.title}
                      </h4>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-brand-text-muted">
                        <span className="truncate">{article.author?.name || 'Redaksi'}</span>
                        <span className="opacity-30">·</span>
                        <span>{article.readingTimeMin || 3} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </Container>
        )}

        {/* ════════════════════════════════════════════════════════
            ZONA 4 — BERITA TERBARU (8-kol) + SIDEBAR (4-kol)
            Feed:
              • 2 kartu horizontal besar — artikel[8..9]
              • Inline ad
              • 6 kartu medium 2-kolom — artikel[10..15]
              • Load More (mulai page 2)
            Sidebar (HANYA ada di zona ini):
              • Akses Redaksi (WA / Telegram / Email)
              • Paling Populer
              • Info Pasar
              • Video / Partner Placement
        ════════════════════════════════════════════════════════ */}
        <Container className="py-4 md:py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6 2xl:gap-8">

            {/* ── Kolom Utama (8 kolom) ── */}
            <div className="lg:col-span-8">

              {/* Section Header */}
              <div className="mb-6 flex flex-col gap-4 border-b border-black/10 pb-4 dark:border-white/5 md:flex-row md:items-end md:justify-between">
                <h3 className={`${sectionTitleClass} flex items-center gap-3 uppercase md:!text-xl`}>
                  <span className="h-4.5 w-4.5 bg-brand-red shadow-lg shadow-brand-red/20" />
                  {searchQuery
                    ? `Hasil Pencarian: ${searchQuery}`
                    : isCategoryFilter
                      ? `Berita ${resolveCategoryName(categoryFilter, categoriesTree)}`
                      : 'Berita Terbaru'}
                </h3>
                <div className="hidden items-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-text-muted md:flex">
                  <span className="inline-flex items-center gap-2 text-brand-red">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                    Update Langsung
                  </span>
                </div>
              </div>

              {/* Konten Feed */}
              {showSavedFeed ? (
                <SavedArticlesFeed site={siteParam} />
              ) : (mainFeedFeatured.length > 0 || mainFeedStream.length > 0) ? (
                <div className="space-y-8 md:space-y-10">

                  {/* 2 Kartu Horizontal Besar (artikel[8..9]) */}
                  {mainFeedFeatured.length > 0 && (
                    <div className="flex flex-col gap-5">
                      {mainFeedFeatured.map((article: HomeArticle) => (
                        <NewsCard
                          key={article.id}
                          article={article}
                          variant="horizontal"
                          site={siteParam}
                          priority
                        />
                      ))}
                    </div>
                  )}

                  {/* Inline Ad — HOME_FEED_1 */}
                  {showInlineSponsor && (
                    <AdSpace type="HOME_FEED_1" />
                  )}

                  {/* 6 Kartu Medium Grid 2-Kolom (artikel[10..15]) */}
                  {mainFeedStream.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className={`${sectionEyebrowClass} text-brand-red`}>
                          Berita Lainnya
                        </span>
                        <Link
                          href={`/${siteParam}`}
                          className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:text-brand-red dark:text-white md:inline-flex"
                        >
                          Lihat Arsip
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6 2xl:gap-8">
                        {mainFeedStream.map((article: HomeArticle) => (
                          <NewsCard
                            key={article.id}
                            article={article}
                            variant="medium"
                            site={siteParam}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* HOME_FEED_2 — setelah Berita Lainnya */}
                  <AdSpace type="HOME_FEED_2" />
                </div>
              ) : (
                /* Empty state */
                <div className="mb-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
                  <p className="text-sm md:text-base font-sans font-bold text-brand-black dark:text-white">
                    Belum ada berita untuk konteks ini.
                  </p>
                  <p className="mt-2 text-xs md:text-sm text-brand-text-muted">
                    Coba kembali ke topik terbaru atau gunakan kata kunci yang lebih umum.
                  </p>
                  <div className="mt-5">
                    <Link
                      href={`/${siteParam}`}
                      className="inline-flex items-center justify-center rounded-full bg-brand-red px-4 py-2 md:px-5 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
                    >
                      Kembali Ke Berita Terbaru
                    </Link>
                  </div>
                </div>
              )}

              {/* Load More — mulai dari page 2 */}
              {!showSavedFeed && (
                <div className="mt-8 border-t border-black/5 pt-8 dark:border-white/5">
                  <LoadMoreArticles
                    siteId={siteConfig.id}
                    category={categoryFilter}
                    search={searchQuery}
                    initialPage={1}
                  />
                </div>
              )}
            </div>

            {/* ── SIDEBAR (4 kolom) — hanya aktif di Zona 4 ── */}
            <aside className="space-y-4 lg:col-span-4">

              {/* Akses Redaksi */}
              <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-4">
                <div className="pb-2">
                  <span className={`${sectionEyebrowClass} text-brand-red`}>Akses Redaksi</span>
                  <h4 className="mt-2 text-lg md:text-xl font-sans font-bold leading-snug text-brand-black dark:text-white">
                    Pilih jalur tercepat ke redaksi.
                  </h4>
                </div>
                <div className="mt-4 grid gap-3">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 transition-colors hover:bg-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                          <SiWhatsapp size={16} />
                        </span>
                        <span>
                          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300/90">
                            WhatsApp
                          </span>
                          <span className="mt-0.5 block text-xs font-bold text-brand-black dark:text-white">WhatsApp Redaksi</span>
                        </span>
                      </span>
                      <ArrowRight size={14} className="shrink-0 text-emerald-600 dark:text-emerald-300 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  )}
                  {telegramUrl && (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-sky-400/20 bg-sky-400/5 px-3 py-2.5 transition-colors hover:bg-sky-400/10 dark:border-sky-400/20 dark:bg-sky-400/10 dark:hover:bg-sky-400/15"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-600 dark:bg-sky-300/10 dark:text-sky-200">
                          <SiTelegram size={16} />
                        </span>
                        <span>
                          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-sky-600 dark:text-sky-200/90">
                            Telegram
                          </span>
                          <span className="mt-0.5 block text-xs font-bold text-brand-black dark:text-white">Ikuti Kanal</span>
                        </span>
                      </span>
                      <ArrowRight size={14} className="shrink-0 text-sky-600 dark:text-sky-200 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  )}
                  <a
                    href={reportUrl}
                    className="group flex items-center justify-between rounded-xl border border-black/5 bg-black/5 px-3 py-2.5 transition-colors hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-black/10 text-brand-black dark:border-white/10 dark:bg-white/10 dark:text-white">
                        <Mail size={16} />
                      </span>
                      <span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-brand-text-muted dark:text-white/75">
                          Email
                        </span>
                        <span className="mt-0.5 block text-xs font-bold text-brand-black dark:text-white">Kirim Email</span>
                      </span>
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-brand-black dark:text-white transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>

              {/* Terbaru — artikel non-hero, berbeda dari TRENDING section */}
              {popular.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Clock size={15} className="text-brand-red" />
                    <h4 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
                      Terbaru
                    </h4>
                  </div>
                  <div className="flex flex-col">
                    {popular.map((article: HomeArticle, index: number) => (
                      <Link
                        key={article.id}
                        href={`/${siteParam}/artikel/${article.slug}`}
                        className="group flex items-start gap-2.5 border-b border-black/5 py-2 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/5"
                      >
                        <span className="tabular-nums font-sans text-xl font-bold leading-none tracking-tight text-gray-100 transition-colors group-hover:text-brand-red dark:text-white/5">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className="rounded-full bg-brand-red/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-brand-red">
                              {index === 0 ? 'Top Story' : 'Terbaru'}
                            </span>
                            <span className={sectionMetaClass}>
                              {formatSidebarDate(article.publishedAt || article.createdAt)}
                            </span>
                          </div>
                          <h5 className="line-clamp-2 font-sans text-xs font-semibold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                            {article.title}
                          </h5>
                          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-brand-text-muted">
                            <span className="truncate">{article.author?.name || 'Redaksi'}</span>
                            <span className="font-bold uppercase tracking-[0.1em] text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                              Baca
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Pasar */}
              <MarketWidget initialData={marketData} />

              {/* Video / Partner Placement — tanpa iklan sidebar */}
              {siteSettings?.featuredVideo && (
                <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-4">
                  <div className="mb-4">
                    <span className={`${sectionEyebrowClass} text-brand-red`}>Pilihan Visual</span>
                  </div>
                  <VideoWidget
                    title={siteSettings.featuredVideo.title}
                    thumbnail={siteSettings.featuredVideo.thumbnail}
                    duration={siteSettings.featuredVideo.duration}
                  />
                </div>
              )}
            </aside>
          </div>
        </Container>

        {/* ════════════════════════════════════════════════════════
            ZONA 5+ — EDITORIAL EXTRAS  (Full Width)
            SIDEBAR BERHENTI DI SINI — semua section di bawah ini
            menggunakan lebar penuh container tanpa pembagian kolom.

            • Pilihan Editor  — 3 kartu portrait aspect-[3/4]
            • Opini & Analisis — 3 kolom teks dominan
            • Foto Jurnalistik — 3 kolom portrait aspect-[4/5]
            • Video Eksklusif — 3 kolom aspect-video, bg gelap
        ════════════════════════════════════════════════════════ */}
        {showEditorialExtras && (
          <div className="border-t border-black/5 dark:border-white/5">
            <Container className="py-6 space-y-8 md:space-y-10">

              {/* Pilihan Editor — portrait cards (3:4) */}
              {showEditorChoice && (
                <ScrollAnimate>
                  <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-2">
                      <Star size={14} className="fill-amber-500 text-amber-500" />
                      <h3 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
                        Pilihan Editor
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 2xl:grid-cols-4">
                    {editorChoice.map((article: HomeArticle) => (
                      <div
                        key={article.id}
                        className="group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-md"
                      >
                        {article.featuredImage && (
                          <SmartImage
                            src={article.featuredImage}
                            context="gallery_full"
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 z-10 w-full p-5 md:p-6">
                          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-brand-red">
                            {article.categories?.[0]?.category?.name || article.category?.name || 'Pilihan Editor'}
                          </span>
                          <Link href={`/${siteParam}/artikel/${article.slug}`}>
                            <h4 className="line-clamp-3 font-sans text-base font-extrabold leading-snug tracking-tight text-white transition-colors hover:text-white/85 md:text-lg">
                              {article.title}
                            </h4>
                          </Link>
                          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[10px] text-white/60">
                            <span className="truncate">{article.author?.name || 'Redaksi'}</span>
                            <span className="opacity-40">•</span>
                            <span>{formatSidebarDate(article.publishedAt || article.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollAnimate>
              )}

              {/* Opini & Analisis */}
              {showOpinionSection && (
                <ScrollAnimate>
                  <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                      <h3 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
                        Opini &amp; Analisis
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 2xl:grid-cols-4">
                    {opinionArticles.map((article: HomeArticle) => (
                      <div key={article.id} className="flex h-full flex-col justify-between gap-3">
                        <div>
                          <span className={`${sectionMetaClass} mb-1.5 block uppercase tracking-[0.12em]`}>
                            Kolom Analisis
                          </span>
                          <Link href={`/${siteParam}/artikel/${article.slug}`}>
                            <h4 className="mb-2 line-clamp-3 text-md font-sans font-bold leading-snug tracking-tight text-brand-black transition-colors hover:text-brand-red dark:text-white md:text-lg">
                              &ldquo;{article.title}&rdquo;
                            </h4>
                          </Link>
                          <p className="line-clamp-3 text-xs leading-relaxed text-brand-text-muted">
                            {article.excerpt || (Array.isArray(article.blocks) ? article.blocks : []).find((b: ArticleBlock) => b.type === 'paragraph')?.content || ''}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                          {article.author?.avatarUrl ? (
                            <img src={article.author.avatarUrl} alt={article.author?.name || 'Penulis'} className="h-5 w-5 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red/10 text-[10px] font-black text-brand-red">
                              {article.author?.name?.charAt(0) || 'S'}
                            </div>
                          )}
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-black dark:text-white">
                            {article.author?.name || 'Redaksi'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollAnimate>
              )}

              {/* Foto Jurnalistik — portrait (4:5) */}
              {showPhotoSection && (
                <ScrollAnimate>
                  <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                      <h3 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
                        Foto Jurnalistik
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {photoJournal.map((article: HomeArticle) => {
                      const photoImg = getPhotoThumbnail(article)
                      return (
                        <Link
                          key={article.id}
                          href={`/${siteParam}/artikel/${article.slug}`}
                          className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-md block"
                        >
                          {photoImg && (
                            <SmartImage
                              src={photoImg}
                              context="gallery_full"
                              alt={article.title}
                              fill
                              className="object-cover transition-transform duration-[5s] group-hover:scale-110"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                          <div className="absolute bottom-0 left-0 z-10 w-full p-5">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-red">
                              Jurnal Foto
                            </span>
                            <h4 className="line-clamp-3 text-sm font-sans font-semibold leading-snug text-white">
                              {article.title}
                            </h4>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </ScrollAnimate>
              )}

              {/* Video Eksklusif — dark-mode/light-mode consistent bg, aspect-video */}
              {showVideoSection && (
                <ScrollAnimate className="rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:px-6 md:py-8">
                  <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="fill-brand-red text-brand-red" />
                      <h3 className={`${sectionEyebrowClass} tracking-[0.14em] text-brand-black dark:text-white`}>
                        Laporan Video Eksklusif
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 2xl:grid-cols-4">
                    {videoStories.map((article: HomeArticle) => {
                      const videoImg = getVideoThumbnail(article)
                      return (
                        <Link
                          key={article.id}
                          href={`/${siteParam}/artikel/${article.slug}`}
                          className="group relative aspect-video overflow-hidden rounded-xl bg-black shadow-md block"
                        >
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-md transition-transform group-hover:scale-110 group-hover:border-transparent group-hover:bg-brand-red">
                              <Play size={20} className="ml-0.5 fill-white text-white" />
                            </div>
                          </div>
                          {videoImg && (
                            <SmartImage
                              src={videoImg}
                              context="card"
                              alt={article.title}
                              fill
                              className="object-cover transition-transform duration-[4s] group-hover:scale-105"
                            />
                          )}
                          <div className="absolute bottom-0 left-0 z-20 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                            <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-red">
                                Video Report
                            </span>
                            <h4 className="line-clamp-2 text-sm font-semibold text-white">{article.title}</h4>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </ScrollAnimate>
              )}

            </Container>
          </div>
        )}

      </main>
    </PublicSiteLayout>
  )
}
