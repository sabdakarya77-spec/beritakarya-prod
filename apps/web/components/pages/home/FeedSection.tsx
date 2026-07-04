import Link from 'next/link'
import AdSpace from '../../ui/AdSpace'
import { Container } from '../../layout/Container'
import { PhotoJournalWidget, VideoWidget } from '../LazyWidgets'
import type { HomeArticle } from './utils/distribution'
import { chunkIntoRows, DEFAULT_PATTERN_ROTATION } from './utils/feedPatterns'
import { FeedRow } from './FeedRow'
import { PalingDibaca, AksesRedaksi, InfoPasar } from './interstitials'
import { sectionTitleClass, sectionEyebrowClass } from './constants'

interface FeedSectionProps {
  feedArticles: HomeArticle[]
  trending: HomeArticle[]
  popular: HomeArticle[]
  site: string
  searchQuery: string
  isCategoryFilter: boolean
  categoryFilter: string
  categoriesTree: Array<{ id: string; name: string; slug: string; subCategories?: { name: string; slug: string }[] }>
  showSavedFeed: boolean
  whatsappUrl: string | null
  telegramUrl: string | null
  reportUrl: string
  siteName?: string
  marketData: Record<string, unknown> | null
  photoJournal: HomeArticle[]
  showPhotoSection: boolean
  siteSettings?: { featuredVideo?: { title: string; thumbnail: string; duration: string } }
  siteConfigId: string
  resolveCategoryName: (slug: string, tree: FeedSectionProps['categoriesTree']) => string
}

export function FeedSection({
  feedArticles, trending, popular, site,
  searchQuery, isCategoryFilter, categoryFilter, categoriesTree, showSavedFeed,
  whatsappUrl, telegramUrl, reportUrl, siteName, marketData, photoJournal, showPhotoSection, siteSettings,
  siteConfigId, resolveCategoryName,
}: FeedSectionProps) {
  const { LoadMoreArticles, SavedArticlesFeed } = require('../LazyWidgets')

  const rows = chunkIntoRows(feedArticles as (HomeArticle & { [key: string]: unknown })[], DEFAULT_PATTERN_ROTATION)
  const trendingForList = trending.length > 0 ? trending : popular

  return (
    <Container className="py-4 md:py-6">
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

      {/* DEBUG — hapus setelah selesai */}
      <div className="mb-4 rounded-lg bg-yellow-100 p-3 text-xs font-mono dark:bg-yellow-900/30">
        <strong>DEBUG FeedSection:</strong> feedArticles={feedArticles.length} | rows={rows.length} |
        trending={trending.length} | popular={popular.length} |
        rows: {rows.map((r, i) => `[${i}:${r.pattern}×${r.articles.length}]`).join(' ')}
      </div>
      {/* END DEBUG */}

      {showSavedFeed ? (
        <SavedArticlesFeed site={site} />
      ) : rows.length > 0 ? (
        <div className="space-y-6 md:space-y-8">
          {rows.map((row, i) => (
            <div key={`feed-row-${i}`}>
              {/* Feed Row */}
              <FeedRow
                articles={row.articles as HomeArticle[]}
                pattern={row.pattern}
                site={site}
                rowIndex={row.rowIndex}
              />

              {/* ═══ Interstitials inline sesuai index ═══ */}

              {/* HOME_FEED_1: setelah Row 2 (index 1) */}
              {i === 1 && <div className="mt-6 md:mt-8"><AdSpace type="HOME_FEED_1" /></div>}

              {/* Paling Dibaca: setelah Row 3 (index 2) */}
              {i === 2 && <PalingDibaca articles={trendingForList} site={site} />}

              {/* BERITA LAINNYA header: sebelum Row 4 (index 3) */}
              {i === 3 && (
                <div className="mb-2 mt-6 flex items-center gap-2 md:mt-8">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black dark:text-white">
                    Berita Lainnya
                  </h3>
                </div>
              )}

              {/* HOME_FEED_2: setelah Row 5 (index 4) */}
              {i === 4 && <div className="mt-6 md:mt-8"><AdSpace type="HOME_FEED_2" /></div>}
            </div>
          ))}

          {/* ═══ Interstitials setelah semua feed rows ═══ */}
          <AksesRedaksi whatsappUrl={whatsappUrl} telegramUrl={telegramUrl} reportUrl={reportUrl} siteName={siteName} />
          <InfoPasar data={marketData} />

          {/* Foto Jurnalistik */}
          {showPhotoSection && <PhotoJournalWidget articles={photoJournal} site={site} />}

          {/* Video Widget */}
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
        </div>
      ) : (
        <div className="mb-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm md:text-base font-sans font-bold text-brand-black dark:text-white">
            Belum ada berita untuk konteks ini.
          </p>
          <p className="mt-2 text-xs md:text-sm text-brand-text-muted">
            Coba kembali ke topik terbaru atau gunakan kata kunci yang lebih umum.
          </p>
          <div className="mt-5">
            <Link
              href={`/${site}`}
              className="inline-flex items-center justify-center rounded-full bg-brand-red px-4 py-2 md:px-5 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
            >
              Kembali Ke Berita Terbaru
            </Link>
          </div>
        </div>
      )}

      {/* Load More */}
      {!showSavedFeed && (
        <div className="mt-8 border-t border-black/5 pt-8 dark:border-white/5">
          <LoadMoreArticles siteId={siteConfigId} category={categoryFilter} search={searchQuery} initialPage={1} />
        </div>
      )}
    </Container>
  )
}
