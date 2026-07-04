import PublicSiteLayout from '../../layout/PublicSiteLayout'
import AdSpace from '../../ui/AdSpace'
import { notFound } from 'next/navigation'
import { API_URL } from '../../../lib/api'
import { fetchSiteSettings, buildPublicSiteConfig } from '../../../lib/siteSettings'
import { fetchAdsForSlot } from '../../../lib/ads'
import { scoreAndDistribute } from './utils/distribution'
import type { HomeArticle } from './utils/distribution'
import { HeroSection } from './HeroSection'
import { FokusRedaksiSection } from './FokusRedaksiSection'
import { TrendingSection } from './TrendingSection'
import { FeedSection } from './FeedSection'
import { EditorialExtras } from './EditorialExtras'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ArticleBlock {
  type: string
  url?: string
  embedType?: string
  images?: { url: string; alt?: string; caption?: string }[]
  content?: string
}

interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  subCategories?: { name: string; slug: string }[]
}

type SearchParams = {
  cat?: string
  q?: string
}

type SiteHomePageProps = {
  siteParam: string
  searchParams: SearchParams
}

// ─────────────────────────────────────────────
// Helpers
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

function getVideoThumbnail(article: HomeArticle): string | null {
  if (article.featuredImage) return article.featuredImage
  if (Array.isArray(article.blocks)) {
    const embedBlock = (article.blocks as ArticleBlock[]).find((b) => b.type === 'embed' && b.embedType === 'youtube')
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
// Helpers for editorial pools
// ─────────────────────────────────────────────
const OPINION_SLUGS = ['opini', 'kolom-esai', 'analisis', 'kolom']
const PHOTO_SLUGS = ['foto-jurnalistik']
const VIDEO_SLUGS = ['video', 'dokumenter-reportase', 'podcast-audio']

function hasCategorySlug(a: HomeArticle, slugs: string[]): boolean {
  if (a.categories?.some(c => slugs.includes(c.category?.slug?.toLowerCase() || ''))) return true
  const catSlug = a.category?.slug?.toLowerCase() || ''
  const parentSlug = a.category?.parentSlug?.toLowerCase() || ''
  return slugs.includes(catSlug) || slugs.includes(parentSlug)
}

// ─────────────────────────────────────────────
// Data Fetchers
// ─────────────────────────────────────────────
async function getArticles(siteId: string, category?: string, search?: string) {
  try {
    let url = `${API_URL}/api/v1/articles/public?site=${siteId}&limit=35`
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

// ─────────────────────────────────────────────
// Main Component (Orchestrator)
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

  const [articlesList, categoriesTree, marketData, trendingArticles, homeTopAds] = await Promise.all([
    getArticles(siteConfig.id, categoryFilter, searchQuery),
    getCategories(siteConfig.id),
    getMarketSnapshot(),
    getTrendingArticles(siteConfig.id),
    fetchAdsForSlot(siteConfig.id, 'HOME_TOP'),
  ])

  // Mode halaman
  const isHomepage = !searchQuery && categoryFilter === 'terbaru'
  const isCategoryFilter = categoryFilter && categoryFilter !== 'terbaru' && categoryFilter !== 'tersimpan'
  const showSavedFeed = categoryFilter === 'tersimpan'

  // ── Distribusi artikel (homepage) — scoring engine ──
  const dist = isHomepage ? scoreAndDistribute({
    main: articlesList,
    trending: trendingArticles as HomeArticle[],
    editorChoicePool: articlesList.filter((a: HomeArticle) => a.isFeatured),
    opinionPool: articlesList.filter((a: HomeArticle) => hasCategorySlug(a, OPINION_SLUGS)),
    photoPool: articlesList.filter((a: HomeArticle) => a.contentType === 'photo_journalism' || hasCategorySlug(a, PHOTO_SLUGS)),
    videoPool: articlesList.filter((a: HomeArticle) => a.contentType === 'video_exclusive' || hasCategorySlug(a, VIDEO_SLUGS)),
  }, { heroMode: 'MAGAZINE_COVER_550' }) : null

  const heroArticles = dist?.hero || []
  const fokusRedaksi = dist?.fokusRedaksi || []
  const feedFeatured = dist?.feedFeatured || []
  const feedStream = dist?.feedStream || []
  const editorChoice = dist?.editorChoice || []
  const opinionArticles = dist?.opinion || []
  const photoJournal = dist?.photoJournal || []
  const videoStories = dist?.videoStories || []
  const sidebarPopular = dist?.popular || []
  const trending = dist?.trending || []

  // ── Feed: gabungkan featured + stream untuk pattern rotation ──
  const feedArticles = isHomepage
    ? [...feedFeatured, ...feedStream]
    : articlesList.slice(0, 8)

  // DEBUG — hapus setelah selesai debug
  // Cek: apakah articlesList benar2 punya semua artikel?
  const uniqueApiIds = new Set(articlesList.map((a: HomeArticle) => a.id)).size
  const debugInfo = {
    apiTotal: articlesList.length,
    uniqueApiIds,
    hero: heroArticles.length,
    fokus: fokusRedaksi.length,
    feedFeatured: feedFeatured.length,
    feedStream: feedStream.length,
    feedTotal: feedArticles.length,
    editorChoice: editorChoice.length,
    opinion: opinionArticles.length,
    photo: photoJournal.length,
    video: videoStories.length,
    trending: trending.length,
    // Hitung: sisa artikel yang tidak masuk zona manapun
    unaccounted: articlesList.length - heroArticles.length - fokusRedaksi.length - feedArticles.length - editorChoice.length - opinionArticles.length - photoJournal.length - videoStories.length,
  }

  // ── Popular untuk fallback trending interstitial ──
  const popular = isHomepage ? sidebarPopular : articlesList.slice(0, 5)

  // ── Conditional flags ──
  const showHomepageHero = isHomepage && heroArticles.length > 0
  const showFokusRedaksi = isHomepage && fokusRedaksi.length > 0
  const showTrending = isHomepage && trendingArticles.length > 0
  const showEditorChoice = isHomepage && editorChoice.length >= 2
  const showOpinionSection = isHomepage && opinionArticles.length >= 2
  const showPhotoSection = isHomepage && photoJournal.length >= 1
  const showVideoSection = isHomepage && videoStories.length >= 1

  const whatsappUrl = buildWhatsAppUrl(siteConfig.phone, siteConfig.name)
  const telegramUrl = siteConfig.socialLinks?.telegram || null
  const reportUrl = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(`Laporan Warga untuk ${siteConfig.name}`)}`

  return (
    <PublicSiteLayout siteConfig={siteConfig} initialCategory={categoryFilter}>
      <main id="main-content" className="pb-20 md:pb-6">

        {/* ZONA 1 — HERO */}
        {showHomepageHero && (
          <HeroSection articles={heroArticles} site={siteParam} />
        )}

        {/* AD HOME_TOP */}
        <AdSpace type="HOME_TOP" initialAds={homeTopAds} />

        {/* ZONA 2 — FOKUS REDAKSI */}
        {showFokusRedaksi && (
          <FokusRedaksiSection articles={fokusRedaksi} site={siteParam} />
        )}

        {/* ZONA 3 — TRENDING */}
        {showTrending && (
          <TrendingSection articles={trendingArticles as HomeArticle[]} site={siteParam} />
        )}

        {/* ZONA 4 — FEED (pattern rotation + interstitials) */}
        <FeedSection
          feedArticles={feedArticles}
          trending={trending}
          popular={popular}
          site={siteParam}
          searchQuery={searchQuery}
          isCategoryFilter={!!isCategoryFilter}
          categoryFilter={categoryFilter}
          categoriesTree={categoriesTree}
          showSavedFeed={showSavedFeed}
          whatsappUrl={whatsappUrl}
          telegramUrl={telegramUrl}
          reportUrl={reportUrl}
          siteName={siteConfig.name}
          marketData={marketData}
          photoJournal={photoJournal}
          showPhotoSection={showPhotoSection}
          siteSettings={siteSettings}
          siteConfigId={siteConfig.id}
          resolveCategoryName={resolveCategoryName}
          debugInfo={debugInfo}
        />

        {/* ZONA 5+ — EDITORIAL EXTRAS */}
        <EditorialExtras
          editorChoice={editorChoice}
          opinionArticles={opinionArticles}
          videoStories={videoStories}
          site={siteParam}
          showEditorChoice={showEditorChoice}
          showOpinionSection={showOpinionSection}
          showVideoSection={showVideoSection}
          getVideoThumbnail={getVideoThumbnail}
        />

      </main>
    </PublicSiteLayout>
  )
}
