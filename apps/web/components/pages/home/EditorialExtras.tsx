import { Zap, Star, Play } from 'lucide-react'
import Link from 'next/link'
import { SmartImage } from '../../ui/SmartImage'
import FadeInOnScroll from '../../ui/FadeInOnScroll'
import { SectionEyebrow } from '../../ui/Typography'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'
import { sectionMetaClass, formatSidebarDate } from './constants'

interface ArticleBlock {
  type: string
  content?: string
}

interface EditorialExtrasProps {
  editorChoice: HomeArticle[]
  opinionArticles: HomeArticle[]
  videoStories: HomeArticle[]
  site: string
  showEditorChoice: boolean
  showOpinionSection: boolean
  showVideoSection: boolean
  getVideoThumbnail: (article: HomeArticle) => string | null
}

export function EditorialExtras({
  editorChoice, opinionArticles, videoStories, site,
  showEditorChoice, showOpinionSection, showVideoSection,
  getVideoThumbnail,
}: EditorialExtrasProps) {
  if (!showEditorChoice && !showOpinionSection && !showVideoSection) return null

  return (
    <div className="border-t border-black/5 dark:border-white/5">
      <Container className="py-8 space-y-8 md:space-y-10">

        {/* Pilihan Editor — portrait cards (3:4) */}
        {showEditorChoice && (
          <FadeInOnScroll>
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-2">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <SectionEyebrow as="h3" className="text-brand-black dark:text-white">
                  Pilihan Editor
                </SectionEyebrow>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 2xl:grid-cols-4">
              {editorChoice.map((article: HomeArticle) => (
                <div key={article.id} className="group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-md">
                  {article.featuredImage && (
                    <SmartImage
                      src={article.featuredImage}
                      context="gallery_full"
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 z-10 w-full p-5 md:p-6">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-brand-red">
                      {article.categories?.[0]?.category?.name || article.category?.name || 'Pilihan Editor'}
                    </span>
                    <Link href={`/${site}/artikel/${article.slug}`}>
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
          </FadeInOnScroll>
        )}

        {/* Opini & Analisis */}
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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 2xl:grid-cols-4">
              {opinionArticles.map((article: HomeArticle) => (
                <div key={article.id} className="flex h-full flex-col justify-between gap-3">
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

      </Container>
    </div>
  )
}
