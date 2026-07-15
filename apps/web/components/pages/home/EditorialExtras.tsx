import { Zap, Cpu, Play } from 'lucide-react'
import Link from 'next/link'
import { SmartImage } from '../../ui/SmartImage'
import FadeInOnScroll from '../../ui/FadeInOnScroll'
import { SectionEyebrow } from '../../ui/Typography'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'
import { sectionMetaClass, formatSidebarDate } from './constants'
import { InterstitialPhoto } from './interstitials/InterstitialPhoto'
import { PalingDibacaSidebar } from './sidebar'
import { AdZone } from '../../templates/zones'

interface ArticleBlock {
  type: string
  content?: string
}

interface EditorialExtrasProps {
  technologyArticles: HomeArticle[]
  opinionArticles: HomeArticle[]
  photoJournal: HomeArticle[]
  videoStories: HomeArticle[]
  popularArticles?: HomeArticle[]
  site: string
  showTechnologySection: boolean
  showOpinionSection: boolean
  showPhotoSection: boolean
  showVideoSection: boolean
  getVideoThumbnail: (article: HomeArticle) => string | null
}

const getImageUrl = (article: HomeArticle): string =>
  article.featuredImage ||
  (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'image')?.url ||
  '/placeholder.jpg'

const getCategoryName = (article: HomeArticle): string =>
  article.categories?.[0]?.category?.name || article.category?.name || 'Teknologi'

export function EditorialExtras({
  technologyArticles, opinionArticles, photoJournal, videoStories, popularArticles, site,
  showTechnologySection, showOpinionSection, showPhotoSection, showVideoSection,
  getVideoThumbnail,
}: EditorialExtrasProps) {
  if (!showTechnologySection && !showOpinionSection && !showPhotoSection && !showVideoSection) return null

  const hasSidebar = !!(popularArticles && popularArticles.length > 0)

  const row1Content = (
    <>
      {/* Teknologi — 3 list articles (similar to Berita Terbaru) */}
      {showTechnologySection && (
        <FadeInOnScroll>
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-blue-600" />
              <SectionEyebrow as="h3" className="text-brand-black dark:text-white">
                Teknologi
              </SectionEyebrow>
            </div>
          </div>
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-white/5">
            {technologyArticles.slice(0, 3).map((article) => {
              const imageUrl = getImageUrl(article)
              const categoryName = getCategoryName(article)
              const date = formatSidebarDate(article.publishedAt || article.createdAt)
              const readTime = article.readingTimeMin ? `${article.readingTimeMin} min baca` : '3 min baca'

              return (
                <Link
                  key={article.id}
                  href={`/${site}/artikel/${article.slug}`}
                  className="group flex flex-col gap-3 py-5 first:pt-0 last:pb-0 md:flex-row md:gap-5"
                >
                  {/* Image — stacked mobile, right desktop */}
                  <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-sm dark:bg-white/5 md:order-2 md:w-auto md:flex-[11]">
                    <SmartImage
                      src={imageUrl}
                      context="card_horizontal"
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {/* Text — below mobile, left desktop */}
                  <div className="flex min-w-0 flex-col gap-1.5 md:order-1 md:flex-[9]">
                    <span className="inline-block w-fit rounded-sm bg-blue-600/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                      {categoryName}
                    </span>
                    <h3 className="line-clamp-2 font-sans text-base font-extrabold leading-[1.2] tracking-tight text-brand-black transition-colors group-hover:text-blue-600 dark:text-white md:text-lg">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-brand-text-muted dark:text-brand-text-muted/80">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-brand-text-muted">
                      {article.author?.avatarUrl ? (
                        <img
                          src={article.author.avatarUrl}
                          alt={article.author.name || 'Redaksi'}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/10 text-[8px] font-black text-blue-600">
                          {(article.author?.name || 'R')[0]}
                        </div>
                      )}
                      <span className="font-medium text-brand-black/70 dark:text-white/70">
                        {article.author?.name || 'Redaksi'}
                      </span>
                      <span className="opacity-30">·</span>
                      <span>{date}</span>
                      <span className="opacity-30">·</span>
                      <span>{readTime}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </FadeInOnScroll>
      )}
    </>
  )

  const row2Content = (
    <>
      {/* Opini & Analisis (Full Width 12-kolom) */}
      {showOpinionSection && (
        <FadeInOnScroll>
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
              <SectionEyebrow as="h3" className="text-brand-black dark:text-white">
                Opini &amp; Analisis
              </SectionEyebrow>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {opinionArticles.map((article: HomeArticle) => (
              <div key={article.id} className="flex h-full flex-col justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm dark:bg-white/[0.02] dark:border-white/5">
                <div>
                  <span className={`${sectionMetaClass} mb-1.5 block uppercase tracking-[0.12em]`}>Kolom Analisis</span>
                  <Link href={`/${site}/artikel/${article.slug}`}>
                    <h4 className="mb-2 line-clamp-3 text-md font-sans font-bold leading-snug tracking-tight text-brand-black transition-colors hover:text-brand-red dark:text-white md:text-lg">
                      &ldquo;{article.title}&rdquo;
                    </h4>
                  </Link>
                  <p className="line-clamp-3 text-xs leading-relaxed text-brand-text-muted">
                    {article.excerpt || (Array.isArray(article.blocks) ? (article.blocks as ArticleBlock[]).find((b) => b.type === 'paragraph')?.content || '' : '')}
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
        </FadeInOnScroll>
      )}

      {/* Foto Jurnalistik */}
      {showPhotoSection && photoJournal.length > 0 && (
        <FadeInOnScroll>
          <InterstitialPhoto articles={photoJournal} site={site} />
        </FadeInOnScroll>
      )}

      {/* Video Eksklusif */}
      {showVideoSection && (
        <FadeInOnScroll className="rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:px-6 md:py-8">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="fill-brand-red text-brand-red" />
              <SectionEyebrow as="h3" className="tracking-[0.14em] text-brand-black dark:text-white">
                Laporan Video Eksklusif
              </SectionEyebrow>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 2xl:grid-cols-4">
            {videoStories.map((article: HomeArticle) => {
              const videoImg = getVideoThumbnail(article)
              return (
                <Link key={article.id} href={`/${site}/artikel/${article.slug}`}
                  className="group relative aspect-video overflow-hidden rounded-xl bg-black shadow-md block">
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/60">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-md transition-transform group-hover:scale-110 group-hover:border-transparent group-hover:bg-brand-red">
                      <Play size={20} className="ml-0.5 fill-white text-white" />
                    </div>
                  </div>
                  {videoImg && (
                    <SmartImage src={videoImg} context="card" alt={article.title} fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[4s] group-hover:scale-105" />
                  )}
                  <div className="absolute bottom-0 left-0 z-20 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                    <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-red">Video Report</span>
                    <h4 className="line-clamp-2 text-sm font-semibold text-white">{article.title}</h4>
                  </div>
                </Link>
              )
            })}
          </div>
        </FadeInOnScroll>
      )}
    </>
  )

  return (
    <div className="border-t border-gray-100 dark:border-white/5">
      <Container className="pt-6 pb-6 md:pt-8 md:pb-8 space-y-8 md:space-y-10">
        {hasSidebar ? (
          <>
            {/* ROW 1: 8:4 Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 md:gap-8">
              {/* Left Column — 8 kolom (Teknologi) */}
              <div className="lg:col-span-8 space-y-8 md:space-y-10">
                {row1Content}
              </div>

              {/* Right Column — 4 kolom (Paling Dibaca & Iklan HOME_FEED_2) */}
              <aside className="lg:col-span-4 self-start">
                <div className="sticky top-24 space-y-6">
                  <PalingDibacaSidebar articles={popularArticles!} site={site} />
                  <div className="pt-2">
                    <AdZone type="HOME_FEED_2" />
                  </div>
                </div>
              </aside>
            </div>

            {/* ROW 2: Full Width (Opini, Foto & Video) */}
            <div className="space-y-8 md:space-y-10 border-t border-gray-100 pt-8 dark:border-white/5">
              {row2Content}
            </div>
          </>
        ) : (
          <div className="space-y-8 md:space-y-10">
            {row1Content}
            {row2Content}
          </div>
        )}
      </Container>
    </div>
  )
}
