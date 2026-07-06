import PublicSiteLayout from '../../layout/PublicSiteLayout'
import { notFound } from 'next/navigation'
import { API_URL } from '../../../lib/api'
import { fetchSiteSettings, buildPublicSiteConfig } from '../../../lib/siteSettings'
import { fetchAdsForSlot } from '../../../lib/ads'
import { scoreAndDistribute } from './utils/distribution'
import type { HomeArticle, HeroMode } from './utils/distribution'
import {
  ClassicEditorialLayout,
  MagazineBoldLayout,
  DataDrivenLayout,
  CompactDenseLayout,
  VisualStorytellingLayout,
  HybridLayout,
} from '../../templates'

// ─────────────────────────────────────────────
// Template selector
// ─────────────────────────────────────────────
const TEMPLATES = {
  A: ClassicEditorialLayout,
  B: MagazineBoldLayout,
  C: DataDrivenLayout,
  D: CompactDenseLayout,
  E: VisualStorytellingLayout,
  F: HybridLayout,
} as const

type TemplateKey = keyof typeof TEMPLATES

interface HomepageConfigData {
  template: string
  heroMode: string
  feedLayout: string
  trendingStyle: string
  scoreFreshness: number
  scoreEngagement: number
  scoreEditorial: number
  opinionCategories: string[]
  photoCategories: string[]
  videoCategories: string[]
  technologyCategories: string[]
}

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
// Default category slugs (fallback jika config belum ada)
// ─────────────────────────────────────────────
const DEFAULT_OPINION_SLUGS = ['opini', 'kolom-esai', 'analisis', 'kolom']
const DEFAULT_PHOTO_SLUGS = ['foto-jurnalistik']
const DEFAULT_VIDEO_SLUGS = ['video', 'dokumenter-reportase', 'podcast-audio']
const DEFAULT_TECHNOLOGY_SLUGS = [
  'teknologi', 'techno',
  'gadget-review', 'smartphone', 'laptop-pc', 'aksesoris',
  'ai-inovasi',
  'startups-digital',
  'game-esports',
]

function hasCategorySlug(a: HomeArticle, slugs: string[]): boolean {
  if (a.categories?.some(c => slugs.includes(c.category?.slug?.toLowerCase() || ''))) return true
  const catSlug = a.category?.slug?.toLowerCase() || ''
  const parentSlug = a.category?.parentSlug?.toLowerCase() || a.category?.parent?.slug?.toLowerCase() || ''
  return slugs.includes(catSlug) || slugs.includes(parentSlug)
}

// ─────────────────────────────────────────────
// Data Fetchers
// ─────────────────────────────────────────────
async function getArticles(siteId: string, category?: string, search?: string) {
  try {
    let url = `${API_URL}/api/v1/articles/public?site=${siteId}&limit=100`
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
      sinceHours: '168',  // 7 hari (weekly)
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

async function getPopularArticles(siteId: string) {
  try {
    const params = new URLSearchParams({
      site: siteId,
      status: 'published',
      limit: '5',
      sort: 'views',
      order: 'desc',
      sinceHours: '720',  // 30 hari (monthly)
    })
    const res = await fetch(
      `${API_URL}/api/v1/articles/public?${params.toString()}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return json?.data?.articles || json?.data?.items || []
  } catch (e) {
    console.error('Error fetching popular articles:', e)
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

async function getHomepageConfig(siteId: string): Promise<HomepageConfigData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/sites/${siteId}/homepage-config`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch (e) {
    console.error('Error fetching homepage config:', e)
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

  const [articlesList, categoriesTree, marketData, trendingArticles, popularArticles, homeTopAds, homepageConfig] = await Promise.all([
    getArticles(siteConfig.id, categoryFilter, searchQuery),
    getCategories(siteConfig.id),
    getMarketSnapshot(),
    getTrendingArticles(siteConfig.id),
    getPopularArticles(siteConfig.id),
    fetchAdsForSlot(siteConfig.id, 'HOME_TOP'),
    getHomepageConfig(siteConfig.id),
  ])

  // Mode halaman
  const isHomepage = !searchQuery && categoryFilter === 'terbaru'
  const isCategoryFilter = categoryFilter && categoryFilter !== 'terbaru' && categoryFilter !== 'tersimpan'
  const showSavedFeed = categoryFilter === 'tersimpan'

  // ── Config dari HomepageConfig (atau default) ──
  const heroMode: HeroMode = (homepageConfig?.heroMode as HeroMode) || 'MAGAZINE_COVER_550'

  const configOpinion = homepageConfig?.opinionCategories as string[] | undefined
  const configPhoto = homepageConfig?.photoCategories as string[] | undefined
  const configVideo = homepageConfig?.videoCategories as string[] | undefined
  const configTechnology = homepageConfig?.technologyCategories as string[] | undefined

  const opinionSlugs = configOpinion?.length ? configOpinion : DEFAULT_OPINION_SLUGS
  const photoSlugs = configPhoto?.length ? configPhoto : DEFAULT_PHOTO_SLUGS
  const videoSlugs = configVideo?.length ? configVideo : DEFAULT_VIDEO_SLUGS
  const technologySlugs = configTechnology?.length ? configTechnology : DEFAULT_TECHNOLOGY_SLUGS

  // ── Distribusi artikel (homepage) — zone allocation ──
  // Artikel teknologi dikecualikan dari main pool supaya hanya tampil di grid Teknologi.
  // Trending & Paling Dibaca tetap bisa menampilkan teknologi (fetch terpisah by views).
  const techSlugsSet = new Set(technologySlugs.map((s: string) => s.toLowerCase()))
  const isTechArticle = (a: HomeArticle) => hasCategorySlug(a, [...techSlugsSet])

  const dist = isHomepage ? scoreAndDistribute({
    main: articlesList.filter((a: HomeArticle) => !isTechArticle(a)),
    trending: popularArticles as HomeArticle[],
    opinionPool: articlesList.filter((a: HomeArticle) => hasCategorySlug(a, opinionSlugs)),
    photoPool: articlesList.filter((a: HomeArticle) => a.contentType === 'photo_journalism' || hasCategorySlug(a, photoSlugs)),
    videoPool: articlesList.filter((a: HomeArticle) => a.contentType === 'video_exclusive' || hasCategorySlug(a, videoSlugs)),
    technologyPool: articlesList.filter((a: HomeArticle) => hasCategorySlug(a, technologySlugs)),
  }, {
    heroMode,
    scoreWeights: {
      freshness: homepageConfig?.scoreFreshness,
      engagement: homepageConfig?.scoreEngagement,
      editorial: homepageConfig?.scoreEditorial,
    },
  }) : null

  const heroArticles = dist?.hero || []
  const fokusRedaksi = dist?.fokusRedaksi || []
  const feedArticles = isHomepage
    ? (dist?.feed || [])
    : articlesList.slice(0, 8)
  const technologyArticles = dist?.technology || []
  const opinionArticles = dist?.opinion || []
  const photoJournal = dist?.photoJournal || []
  const videoStories = dist?.videoStories || []
  const sidebarPopular = dist?.popular || []
  const trending = dist?.trending || []
  const remainingArticles = dist?.remainingArticles || []

  // ── Popular untuk sidebar Paling Dibaca (monthly) ──
  const popular = isHomepage ? sidebarPopular : articlesList.slice(0, 5)

  // ── Fallback: jika trending weekly kosong, pakai popular monthly ──
  const effectiveTrending = trendingArticles.length > 0
    ? trendingArticles
    : popularArticles

  // ── Kumpulkan semua ID artikel yang sudah dipakai di beranda ──
  // Digunakan oleh LoadMoreArticles untuk menyaring duplikat dari hasil API
  const excludeIds = [
    ...heroArticles,
    ...fokusRedaksi,
    ...feedArticles,
    ...technologyArticles,
    ...opinionArticles,
    ...photoJournal,
    ...videoStories,
    ...(effectiveTrending as HomeArticle[]),
  ].map((a) => a.id)

  // ── Conditional flags ──
  const showHomepageHero = isHomepage && heroArticles.length > 0
  const showFokusRedaksi = isHomepage && fokusRedaksi.length > 0
  const showTrending = isHomepage && effectiveTrending.length > 0
  const showTechnologySection = isHomepage && technologyArticles.length >= 2
  const showOpinionSection = isHomepage && opinionArticles.length >= 2
  const showPhotoSection = isHomepage && photoJournal.length >= 1
  const showVideoSection = isHomepage && videoStories.length >= 1

  const whatsappUrl = buildWhatsAppUrl(siteConfig.phone, siteConfig.name)
  const telegramUrl = siteConfig.socialLinks?.telegram || null
  const reportUrl = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(`Laporan Warga untuk ${siteConfig.name}`)}`

  // ── Pilih template berdasarkan config ──
  const templateKey: TemplateKey = (homepageConfig?.template as TemplateKey) || 'F'
  const SelectedTemplate = TEMPLATES[templateKey] || HybridLayout

  return (
    <PublicSiteLayout siteConfig={siteConfig} initialCategory={categoryFilter}>
      <main id="main-content" className="pb-20 md:pb-6">
        {isHomepage ? (
          <SelectedTemplate
            heroArticles={heroArticles}
            fokusRedaksi={fokusRedaksi}
            trendingArticles={effectiveTrending as HomeArticle[]}
            feedArticles={feedArticles}
            trending={trending}
            popular={popular}
            opinionArticles={opinionArticles}
            photoJournal={photoJournal}
            videoStories={videoStories}
            technologyArticles={technologyArticles}
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
            showPhotoSection={showPhotoSection}
            showVideoSection={showVideoSection}
            showOpinionSection={showOpinionSection}
            showTechnologySection={showTechnologySection}
            siteSettings={siteSettings}
            siteConfigId={siteConfig.id}
            homeTopAds={homeTopAds}
            resolveCategoryName={resolveCategoryName}
            getVideoThumbnail={getVideoThumbnail}
            remainingArticles={remainingArticles}
            excludeIds={excludeIds}
          />
        ) : (
          // Category/search mode — tanpa hero/trending
          <SelectedTemplate
            heroArticles={[]}
            fokusRedaksi={[]}
            trendingArticles={[]}
            feedArticles={articlesList.slice(0, 10)}
            trending={[]}
            popular={articlesList.slice(0, 5)}
            opinionArticles={[]}
            photoJournal={[]}
            videoStories={[]}
            technologyArticles={[]}
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
            showPhotoSection={false}
            showVideoSection={false}
            showOpinionSection={false}
            showTechnologySection={false}
            siteSettings={siteSettings}
            siteConfigId={siteConfig.id}
            homeTopAds={homeTopAds}
            resolveCategoryName={resolveCategoryName}
            getVideoThumbnail={getVideoThumbnail}
            excludeIds={articlesList.slice(0, 10).map((a: HomeArticle) => a.id)}
          />
        )}
      </main>
    </PublicSiteLayout>
  )
}
