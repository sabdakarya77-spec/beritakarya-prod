import Link from 'next/link'
import AdSpace from '../../ui/AdSpace'
import { SectionTitle, SectionEyebrow } from '../../ui/Typography'
import { Container } from '../../layout/Container'
import { VideoWidget } from '../LazyWidgets'
import type { HomeArticle } from './utils/distribution'
import { chunkIntoRows, DEFAULT_PATTERN_ROTATION } from './utils/feedPatterns'
import { FeedRow } from './FeedRow'
import { PalingDibaca, AksesRedaksi, InfoPasar, InterstitialPhoto, InterstitialVideo } from './interstitials'

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
  videoStories: HomeArticle[]
  showVideoSection: boolean
  siteSettings?: { featuredVideo?: { title: string; thumbnail: string; duration: string } }
  siteConfigId: string
  resolveCategoryName: (slug: string, tree: FeedSectionProps['categoriesTree']) => string
  /** Artikel sisa dari distribusi — untuk Load More */
  remainingArticles?: HomeArticle[]
  /** ID artikel yang sudah dirender di beranda — untuk disaring dari hasil Load More */
  excludeIds?: string[]
  /** Jika true, komponen dipakai di dalam grid berkolom sehingga pembungkus Container dihilangkan */
  isNestedInGrid?: boolean
}

export function FeedSection({
  feedArticles, trending: _trending, popular, site,
  searchQuery, isCategoryFilter, categoryFilter, categoriesTree, showSavedFeed,
  whatsappUrl, telegramUrl, reportUrl, siteName, marketData, photoJournal, showPhotoSection, videoStories, showVideoSection, siteSettings,
  siteConfigId, resolveCategoryName,
  remainingArticles = [], excludeIds = [], isNestedInGrid = false,
}: FeedSectionProps) {
  const { LoadMoreArticles, SavedArticlesFeed } = require('../LazyWidgets')

  const rows = chunkIntoRows(feedArticles as (HomeArticle & { [key: string]: unknown })[], DEFAULT_PATTERN_ROTATION)
  
  const content = (
    <>
      {/* Section Header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-black/10 pb-4 dark:border-white/5 md:flex-row md:items-end md:justify-between">
        <SectionTitle as="h3" className="flex items-center gap-3 uppercase md:!text-xl">
          <span className="h-4.5 w-4.5 bg-brand-red shadow-lg shadow-brand-red/20" />
          {searchQuery
            ? `Hasil Pencarian: ${searchQuery}`
            : isCategoryFilter
              ? `Berita ${resolveCategoryName(categoryFilter, categoriesTree)}`
              : 'Berita Terbaru'}
        </SectionTitle>
        <div className="hidden items-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-text-muted md:flex">
          <span className="inline-flex items-center gap-2 text-brand-red">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
            Update Langsung
          </span>
          <span className="text-gray-300 dark:text-white/10">|</span>
          <span>{feedArticles.length} Berita</span>
        </div>
      </div>

      {showSavedFeed ? (
        <SavedArticlesFeed site={site} />
      ) : rows.length > 0 ? (
        <div className="space-y-6 md:space-y-8">
          {rows.map((row, rowIndex) => {
            const rowArticles = row.items
            const currentPattern = row.pattern

            // Cari tempat menyisipkan widget/iklan
            const isFirstRow = rowIndex === 0
            const isSecondRow = rowIndex === 1
            const isThirdRow = rowIndex === 2

            return (
              <div key={rowIndex} className="space-y-6 md:space-y-8">
                {/* 1. Baris Utama Grid */}
                <FeedRow articles={rowArticles} pattern={currentPattern} site={site} />

                {/* 2. Sisipan Iklan di antara baris 1 dan 2 */}
                {isFirstRow && (
                  <div className="my-6 md:my-8">
                    <AdSpace type="HOME_FEED_1" />
                  </div>
                )}

                {/* 3. Interstitial Paling Dibaca di bawah baris ke-2 */}
                {isSecondRow && popular.length > 0 && (
                  <div className="my-6 md:my-8">
                    <PalingDibaca articles={popular} site={site} />
                  </div>
                )}

                {/* 4. Interstitial Akses Redaksi & Info Pasar di bawah baris ke-3 */}
                {isThirdRow && (
                  <div className="grid grid-cols-1 gap-6 my-6 md:grid-cols-12 md:gap-8 md:my-8">
                    <div className="md:col-span-8">
                      <AksesRedaksi
                        whatsappUrl={whatsappUrl}
                        telegramUrl={telegramUrl}
                        reportUrl={reportUrl}
                        siteName={siteName}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <InfoPasar initialData={marketData} />
                    </div>
                  </div>
                )}

                {/* 5. Sisipan multimedia lainnya: Foto (setelah baris ke-4) & Video (setelah baris ke-5) */}
                {rowIndex === 3 && showPhotoSection && photoJournal.length > 0 && (
                  <div className="my-6 md:my-8">
                    <InterstitialPhoto articles={photoJournal} site={site} />
                  </div>
                )}

                {rowIndex === 4 && showVideoSection && videoStories.length > 0 && (
                  <div className="my-6 md:my-8">
                    <InterstitialVideo articles={videoStories} site={site} />
                  </div>
                )}
              </div>
            )
          })}
          
          {/* Featured Video Widget (siteSettings) */}
          {siteSettings?.featuredVideo && (
            <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-4">
              <div className="mb-4">
                <SectionEyebrow className="text-brand-red">Pilihan Visual</SectionEyebrow>
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-semibold text-brand-black dark:text-white md:text-base">
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
          <LoadMoreArticles
            siteId={siteConfigId}
            category={categoryFilter}
            search={searchQuery}
            initialPage={Math.ceil(feedArticles.length / 10)}
            remainingArticles={remainingArticles as never[]}
            excludeIds={excludeIds}
          />
        </div>
      )}
    </>
  );

  if (isNestedInGrid) {
    return <div className="py-4 md:py-8">{content}</div>;
  }
  return <Container className="py-4 md:py-8">{content}</Container>;
}
