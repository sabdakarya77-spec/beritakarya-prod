import { ArrowRight, Clock, Mail } from 'lucide-react'
import Link from 'next/link'
import NewsCard from '../../ui/NewsCard'
import AdSpace from '../../ui/AdSpace'
import { Container } from '../../layout/Container'
import { MarketWidget, PhotoJournalWidget, VideoWidget } from '../LazyWidgets'
import { SiTelegram, SiWhatsapp } from '../../ui/SocialIcons'
import type { HomeArticle } from './utils/distribution'
import { sectionEyebrowClass, sectionMetaClass, sectionTitleClass, formatSidebarDate } from './constants'

interface FeedSectionProps {
  // Feed data
  feedFeatured: HomeArticle[]
  feedStream: HomeArticle[]
  popular: HomeArticle[]
  site: string

  // Search/filter state
  searchQuery: string
  isCategoryFilter: boolean
  categoryFilter: string
  categoriesTree: Array<{ id: string; name: string; slug: string; subCategories?: { name: string; slug: string }[] }>
  showSavedFeed: boolean
  showInlineSponsor: boolean

  // Sidebar data
  whatsappUrl: string | null
  telegramUrl: string | null
  reportUrl: string
  marketData: Record<string, unknown> | null
  photoJournal: HomeArticle[]
  showPhotoSection: boolean
  siteSettings?: { featuredVideo?: { title: string; thumbnail: string; duration: string } }

  // For LoadMore & SavedFeed
  siteConfigId: string

  // Helper
  resolveCategoryName: (slug: string, tree: FeedSectionProps['categoriesTree']) => string
}

export function FeedSection({
  feedFeatured, feedStream, popular, site,
  searchQuery, isCategoryFilter, categoryFilter, categoriesTree, showSavedFeed, showInlineSponsor,
  whatsappUrl, telegramUrl, reportUrl, marketData, photoJournal, showPhotoSection, siteSettings,
  siteConfigId, resolveCategoryName,
}: FeedSectionProps) {
  // Lazy-loaded client components
  const { LoadMoreArticles, SavedArticlesFeed } = require('../LazyWidgets')

  return (
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
            <SavedArticlesFeed site={site} />
          ) : (feedFeatured.length > 0 || feedStream.length > 0) ? (
            <div className="space-y-8 md:space-y-10">

              {/* 2 Kartu Horizontal Besar */}
              {feedFeatured.length > 0 && (
                <div className="flex flex-col gap-5">
                  {feedFeatured.map((article: HomeArticle) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      variant="horizontal"
                      site={site}
                      priority
                    />
                  ))}
                </div>
              )}

              {/* Inline Ad — HOME_FEED_1 */}
              {showInlineSponsor && (
                <AdSpace type="HOME_FEED_1" />
              )}

              {/* 6 Kartu Medium Grid 2-Kolom */}
              {feedStream.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className={`${sectionEyebrowClass} text-brand-red`}>
                      Berita Lainnya
                    </span>
                    <Link
                      href={`/${site}`}
                      className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:text-brand-red dark:text-white md:inline-flex"
                    >
                      Lihat Arsip
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6 2xl:gap-8">
                    {feedStream.map((article: HomeArticle) => (
                      <NewsCard
                        key={article.id}
                        article={article}
                        variant="medium"
                        site={site}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* HOME_FEED_2 */}
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
                initialPage={1}
              />
            </div>
          )}
        </div>

        {/* ── SIDEBAR (4 kolom) ── */}
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
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 transition-colors hover:bg-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <SiWhatsapp size={16} />
                    </span>
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300/90">WhatsApp</span>
                      <span className="mt-0.5 block text-xs font-bold text-brand-black dark:text-white">WhatsApp Redaksi</span>
                    </span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-emerald-600 dark:text-emerald-300 transition-transform group-hover:translate-x-0.5" />
                </a>
              )}
              {telegramUrl && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-sky-400/20 bg-sky-400/5 px-3 py-2.5 transition-colors hover:bg-sky-400/10 dark:border-sky-400/20 dark:bg-sky-400/10 dark:hover:bg-sky-400/15">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-600 dark:bg-sky-300/10 dark:text-sky-200">
                      <SiTelegram size={16} />
                    </span>
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-sky-600 dark:text-sky-200/90">Telegram</span>
                      <span className="mt-0.5 block text-xs font-bold text-brand-black dark:text-white">Ikuti Kanal</span>
                    </span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-sky-600 dark:text-sky-200 transition-transform group-hover:translate-x-0.5" />
                </a>
              )}
              <a href={reportUrl}
                className="group flex items-center justify-between rounded-xl border border-black/5 bg-black/5 px-3 py-2.5 transition-colors hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-black/10 text-brand-black dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <Mail size={16} />
                  </span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-brand-text-muted dark:text-white/75">Email</span>
                    <span className="mt-0.5 block text-xs font-bold text-brand-black dark:text-white">Kirim Email</span>
                  </span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-brand-black dark:text-white transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          {/* Terbaru */}
          {popular.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-4">
              <div className="mb-4 flex items-center gap-3">
                <Clock size={15} className="text-brand-red" />
                <h4 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>Terbaru</h4>
              </div>
              <div className="flex flex-col">
                {popular.map((article: HomeArticle, index: number) => (
                  <Link key={article.id} href={`/${site}/artikel/${article.slug}`}
                    className="group flex items-start gap-2.5 border-b border-black/5 py-2 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/5">
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
                        <span className="font-bold uppercase tracking-[0.1em] text-brand-black transition-colors group-hover:text-brand-red dark:text-white">Baca</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Info Pasar */}
          <MarketWidget initialData={marketData as never} />

          {/* Foto Jurnalistik */}
          {showPhotoSection && (
            <PhotoJournalWidget articles={photoJournal} site={site} />
          )}

          {/* Video / Partner Placement */}
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
  )
}
