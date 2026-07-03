import React from 'react'
import { notFound } from 'next/navigation'
import { SmartImage } from '../../../../components/ui/SmartImage'
import Link from 'next/link'
import type { Block } from '@beritakarya/types'
import { sanitizeHtml } from '../../../../lib/sanitize'
import PublicSiteLayout from '../../../../components/layout/PublicSiteLayout'
import { SITE_MAP } from '@beritakarya/config'
import NewsCard from '../../../../components/ui/NewsCard'
import ReadingProgress from '../../../../components/ui/ReadingProgress'
import AdSpace from '../../../../components/ui/AdSpace'
import EditorialBadge from '../../../../components/ui/EditorialBadge'
import { resolveArticleBadge } from '../../../../lib/resolveArticleBadge'
import { getCategoryColor } from '../../../../lib/constants'
import { BookOpen, CalendarDays, Flame, Printer, Sparkles, Tags, User2 } from 'lucide-react'
import { Metadata } from 'next'
import CommentSection from '../../../../components/ui/CommentSection'
import ImageLightboxWrapper from '../../../../components/ui/ImageLightboxWrapper'
import { Container } from '../../../../components/layout/Container'
import ArticleShareActions from '../../../../components/ui/ArticleShareActions'
import ArticleBookmarkButton from '../../../../components/ui/ArticleBookmarkButton'
import ArticleFloatingTools from '../../../../components/ui/ArticleFloatingTools'
import MobileArticleTools from '../../../../components/ui/MobileArticleTools'
import FadeInOnScroll from '../../../../components/ui/FadeInOnScroll'
import { YouTubeEmbed } from '../../../../components/ui/YouTubeEmbed'

interface Props {
  params: { site: string; slug: string }
}

interface RelatedArticle {
  id: string
  slug: string
  title: string
  featuredImage?: string
  readingTimeMin?: number
  category?: { name?: string } // legacy
  categories?: Array<{ category?: { name?: string; slug?: string } | null }> | null
  author?: { id?: string; name?: string }
  blocks?: Block[]
}

import { constructMetadata } from '../../../../lib/metadata'
import { cn } from '../../../../lib/utils'
import { JsonLd } from '../../../../components/ui/JsonLd'
import { buildArticle, buildBreadcrumb } from '../../../../lib/structuredData'
import { API_URL } from '../../../../lib/api'
import { fetchSiteSettings, buildPublicSiteConfig } from '../../../../lib/siteSettings'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const slugParam = resolvedParams?.slug;

  const [article, siteSettings] = await Promise.all([
    getArticle(siteParam, slugParam),
    fetchSiteSettings(siteParam)
  ])

  if (!article) return { title: 'Post Tidak Ditemukan' }

  const fallbackConfig = SITE_MAP[siteParam] || SITE_MAP['pusat']
  const siteName = siteSettings?.name || fallbackConfig?.name || (siteParam.charAt(0).toUpperCase() + siteParam.slice(1));
  const faviconUrl = siteSettings?.faviconUrl || '/favicon.ico';

  const blocks = Array.isArray(article.blocks) ? article.blocks : []
  const excerpt = blocks.find((b: Block) => b.type === 'paragraph')?.content || ''

  // Robust OG image fallback logic:
  // 1. Featured image (set by author)
  // 2. First image block in content
  // 3. First image from mediaText block
  // 4. Dynamic OG generation API (generates branded image with title)
  const coverImage = article.featuredImage
    || blocks.find((b: Block) => b.type === 'image')?.url
    || blocks.find((b: Block) => b.type === 'mediaText')?.url
    || `/api/og?title=${encodeURIComponent(article.title)}&site=${encodeURIComponent(siteName)}`

  return constructMetadata({
    title: article.metaTitle || `${article.title} - ${siteName}`,
    description: article.metaDescription || excerpt.substring(0, 160),
    image: coverImage,
    icons: faviconUrl,
    siteParam,
    slug: slugParam
  })
}

async function getArticle(site: string, slug: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/articles/slug/${slug}?site=${site}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch (e) {
    console.error('Failed to get article:', e)
    return null
  }
}

async function getRelatedArticles(site: string, currentSlug: string, category?: string) {
  try {
    const params = new URLSearchParams({
      site,
      status: 'published',
      limit: '6',
      ...(category && { category })
    })
    const res = await fetch(
      `${API_URL}/api/v1/articles/public?${params.toString()}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    const articles = json.data?.articles || json.data?.items || []
    return articles.filter((a: { slug: string }) => a.slug !== currentSlug).slice(0, 6)
  } catch {
    return []
  }
}

async function getPopularArticles(site: string, currentSlug: string) {
  try {
    const params = new URLSearchParams({
      site,
      status: 'published',
      limit: '5',
      sort: 'views',
      order: 'desc'
    })
    const res = await fetch(
      `${API_URL}/api/v1/articles/public?${params.toString()}`,
      { next: { revalidate: 120 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    const articles = json.data?.articles || json.data?.items || []
    return articles.filter((a: { slug: string }) => a.slug !== currentSlug).slice(0, 4)
  } catch {
    return []
  }
}

export default async function ArticlePage({ params }: Props) {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const slugParam = resolvedParams?.slug;

  const siteSettings = await fetchSiteSettings(siteParam)

  if (!siteSettings && siteParam !== 'pusat') {
    notFound()
  }

  const siteConfig = buildPublicSiteConfig(siteParam, siteSettings)

  const article = await getArticle(siteParam, slugParam)
  if (!article || article.status !== 'published') notFound()

  // Primary category: categories[0] (baru) atau category (legacy)
  const primaryCategoryName = article.categories?.[0]?.category?.name || article.category?.name || null
  const primaryCategorySlug = article.categories?.[0]?.category?.slug || article.category?.slug || null

  const [relatedArticles, popularArticles] = await Promise.all([
    getRelatedArticles(siteParam, slugParam, primaryCategoryName || undefined),
    getPopularArticles(siteParam, slugParam)
  ])
  const coverImage = article.featuredImage || (Array.isArray(article.blocks) ? article.blocks : []).find((b: Block) => b.type === 'image')?.url || '/placeholder.jpg'
  const coverImageBlock = (Array.isArray(article.blocks) ? article.blocks : []).find((b: Block) => b.type === 'image' && b.url === coverImage)
    || (Array.isArray(article.blocks) ? article.blocks : []).find((b: Block) => b.type === 'image')
  const coverImageCaption = coverImageBlock?.caption || null
  const excerpt = (Array.isArray(article.blocks) ? article.blocks : []).find((b: Block) => b.type === 'paragraph')?.content || ''
  const articleUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/${siteParam}/artikel/${slugParam}`
  const authorProfileUrl = article.author?.id
    ? `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/${siteParam}/penulis/${article.author.id}`
    : `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/${siteParam}`
  const authorProfilePath = article.author?.id ? `/${siteParam}/penulis/${article.author.id}` : null
  const sidebarRelatedArticles = relatedArticles.slice(0, 2)

  const articleSchema = buildArticle({
    title: article.title,
    description: excerpt,
    image: coverImage,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    authorName: article.author?.name || 'Redaksi',
    authorUrl: authorProfileUrl,
    siteName: siteConfig.name || 'BeritaKarya',
    siteUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/${siteParam}`,
    articleUrl,
    category: primaryCategoryName,
    keywords: article.tags,
    wordCount: article.wordCount,
  })
  const breadcrumbSchema = buildBreadcrumb([
    { name: 'Beranda', url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/${siteParam}` },
    ...(primaryCategoryName
      ? [{ name: primaryCategoryName, url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/${siteParam}?cat=${encodeURIComponent(primaryCategoryName)}` }]
      : []),
    { name: article.title, url: articleUrl },
  ])

  const badgeVariant = resolveArticleBadge(article);
  const readingTime = article.readingTimeMin || Math.max(1, Math.ceil((article.wordCount || 0) / 200)) || 3;
  const articleRailClassName = 'xl:grid xl:grid-cols-[minmax(0,1.75fr)_20rem] 2xl:grid-cols-[minmax(0,1.75fr)_22.5rem] xl:justify-between xl:gap-12 2xl:gap-16'
  const sidebarCardClass = 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02]'
  const sidebarLabelClass = 'flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted'

  return (
    <PublicSiteLayout siteConfig={siteConfig} initialCategory={primaryCategorySlug || 'terbaru'} hideTicker={true}>
      <JsonLd id="ld-article" data={articleSchema} />
      <JsonLd id="ld-breadcrumb" data={breadcrumbSchema} />
      <ReadingProgress />
      <main id="main-content">
      <ImageLightboxWrapper>
        <article className="min-h-screen">
          {/* --- RESPONSIVE HERO --- */}
          <section className="relative w-full">
            {/* Image Container: Aspect-video on all viewports */}
            <div className="relative w-full aspect-video">
              <SmartImage
                src={coverImage}
                blur={article.featuredImageBlur}
                dominantColor={article.featuredImageColor}
                context="hero_lead"
                alt={article.title}
                fill
                priority
                className="object-cover animate-fade-in"
              />
              <div className="hidden md:block pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              <div className="hidden md:block pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
            </div>

            {/* Text Overlay / Metadata Container */}
            {/* Absolute positioning on desktop, relative flow with background on mobile */}
            <div className="relative md:absolute md:inset-0 md:flex md:items-end bg-[#020617] md:bg-transparent pt-6 pb-8 md:py-0">
              <Container>
                <div className="max-w-4xl md:pb-12">
                  <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    {badgeVariant && (
                      <EditorialBadge
                        variant={badgeVariant}
                        size="sm"
                        className="rounded-full px-2.5 py-0.5 shadow-sm shadow-black/10"
                      />
                    )}
                    <span className={`rounded-sm px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${getCategoryColor(primaryCategoryName)}`}>
                      {primaryCategoryName || 'NASIONAL'}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span className="text-[10px] font-semibold text-white/70">
                      {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-sans font-extrabold text-white leading-[1.1] tracking-tight mb-5 md:mb-6 drop-shadow-lg">
                    {article.title}
                  </h1>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 backdrop-blur-sm text-sm font-sans font-bold text-white">
                        {article.author?.avatarUrl ? (
                          <img
                            src={article.author.avatarUrl}
                            alt={article.author?.name || 'Author'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          article.author?.name?.[0] || 'R'
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-white">{article.author?.name || 'Redaksi'}</div>
                        <div className="text-[9px] font-medium text-white/60">Staf Redaksi BeritaKarya</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-[9px] font-bold text-white/90">
                        <BookOpen size={10} />
                        {readingTime} menit baca
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-[9px] font-bold text-white/90">
                        <Printer size={10} />
                        {(article.wordCount || 0).toLocaleString('id-ID')} kata
                      </div>
                      <ArticleBookmarkButton
                        article={article}
                        site={siteParam}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm text-white/80 transition-all hover:bg-white/25"
                        activeClassName="bg-brand-red/80 text-white"
                        idleClassName="text-white/80 hover:text-white"
                        iconSize={14}
                      />
                    </div>
                  </div>
                </div>
              </Container>
            </div>
          </section>

          {/* --- HERO CAPTION --- */}
          {coverImageCaption && (
            <div className="border-b border-gray-100 dark:border-white/5">
              <Container>
                <div className="py-3 flex items-center justify-between gap-4 max-w-5xl">
                  <p className="text-[11px] text-brand-text-muted italic leading-relaxed">
                    {coverImageCaption}
                  </p>
                  <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-brand-text-muted shrink-0">
                    Foto / Dokumentasi Redaksi
                  </span>
                </div>
              </Container>
            </div>
          )}

          {/* --- CONTENT SECTION --- */}
          <Container>
            <div className={cn(articleRailClassName, 'mb-12 md:mb-16')}>
              {/* Main Content */}
              <div className="min-w-0 xl:grid xl:grid-cols-[4.25rem_minmax(0,40rem)] xl:gap-8 2xl:grid-cols-[4.5rem_minmax(0,42rem)]">
                <div className="hidden xl:block relative z-30">
                  <div className="-mt-[0.75rem]">
                    <div className="sticky top-32">
                      <ArticleFloatingTools title={article.title} url={articleUrl} />
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <FadeInOnScroll>
                    <div className="space-y-8">
                      <div className="article-content max-w-content space-y-8 text-left transition-all duration-300 xl:max-w-none 2xl:max-w-none">
                        {(() => {
                          const blocks = (Array.isArray(article.blocks) ? article.blocks : []) as Block[];
                          let paragraphCount = 0;
                          const elements: React.ReactNode[] = [];

                          for (let i = 0; i < blocks.length; i++) {
                            const block = blocks[i];
                            elements.push(<PublicBlock key={`block-${i}`} block={block} index={i} />);

                            if (block.type === 'paragraph') {
                              paragraphCount++;

                              // After 3rd paragraph: insert pull quote highlight
                              if (paragraphCount === 3) {
                                const quoteBlock = blocks.find((b: Block) => b.type === 'quote');
                                if (quoteBlock && quoteBlock.type === 'quote') {
                                  elements.push(
                                    <div key="visual-break-quote" className="relative my-10 py-8 px-8 md:px-12 border-y-2 border-brand-red/10 bg-brand-red/[0.02] rounded-xl">
                                      <span className="absolute -top-3 left-6 text-7xl font-serif text-brand-red opacity-10 leading-none select-none">&ldquo;</span>
                                      <blockquote className="relative z-10 font-serif text-xl md:text-2xl italic leading-relaxed text-brand-black dark:text-white/90">
                                        <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(quoteBlock.content || '') }} />
                                      </blockquote>
                                      {quoteBlock.attribution && (
                                        <footer className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red">
                                          — {quoteBlock.attribution}
                                        </footer>
                                      )}
                                    </div>
                                  );
                                }
                              }

                              // After 5th paragraph: insert inline related article
                              if (paragraphCount === 5 && relatedArticles.length > 0) {
                                const rel = relatedArticles[0];
                                elements.push(
                                  <div key="visual-break-related" className="my-10 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-5">
                                    <div className="flex items-center gap-1.5 mb-3">
                                      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-red">Baca Juga</span>
                                    </div>
                                    <Link href={`/${siteParam}/artikel/${rel.slug}`} className="group flex gap-4">
                                      <div className="relative w-28 h-20 md:w-36 md:h-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
                                        <SmartImage
                                          src={rel.featuredImage || (Array.isArray(rel.blocks) ? rel.blocks : []).find((b: Block) => b.type === 'image')?.url}
                                          context="card"
                                          alt={rel.title}
                                          fill
                                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                      </div>
                                      <div className="min-w-0 flex flex-col justify-center">
                                        <span className={`inline-block w-fit rounded-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] mb-1.5 ${getCategoryColor(rel.categories?.[0]?.category?.name || rel.category?.name)}`}>
                                          {rel.categories?.[0]?.category?.name || rel.category?.name || 'Umum'}
                                        </span>
                                        <h4 className="line-clamp-2 font-sans text-sm font-extrabold leading-snug tracking-tight text-brand-black dark:text-white group-hover:text-brand-red transition-colors">
                                          {rel.title}
                                        </h4>
                                        <span className="mt-1.5 text-[9px] font-semibold text-brand-text-muted">
                                          {rel.author?.name || 'Redaksi'} · {rel.readingTimeMin || 3} min baca
                                        </span>
                                      </div>
                                    </Link>
                                  </div>
                                );
                              }

                              // After 3rd paragraph: insert ARTICLE_TOP ad (after pull quote)
                              if (paragraphCount === 3) {
                                elements.push(
                                  <div key="visual-break-articletop-ad" className="my-10">
                                    <AdSpace type="ARTICLE_TOP" label="Iklan" />
                                  </div>
                                );
                              }

                              // After 8th paragraph: insert ARTICLE_MIDDLE ad
                              if (paragraphCount === 8) {
                                elements.push(
                                  <div key="visual-break-articlemiddle-ad" className="my-10">
                                    <AdSpace type="ARTICLE_MIDDLE" label="Iklan" />
                                  </div>
                                );
                              }
                            }
                          }
                          return elements;
                        })()}
                      </div>
                    </div>
                  </FadeInOnScroll>

                  {/* Share & Save Section (Inline at the end of article) */}
                  <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-y border-gray-100 py-4 dark:border-white/5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted">Bagikan:</span>
                      <ArticleShareActions title={article.title} url={articleUrl} variant="inline" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted">Simpan:</span>
                      <ArticleBookmarkButton
                        article={article}
                        site={siteParam}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.06] bg-white shadow-sm transition-all hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none"
                        activeClassName="border-brand-red/40 bg-brand-red/10 text-brand-red"
                        idleClassName="text-brand-text-muted hover:text-brand-red hover:border-brand-red/30"
                        iconSize={14}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-5 flex flex-wrap gap-2 pt-2">
                    {(article.tags || ['Investigasi', 'KaryaNyata', 'Nusantara', 'Politik']).map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/${siteParam}?q=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center rounded-full border border-black/5 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-brand-text-muted transition-colors hover:border-brand-red/40 hover:text-brand-red dark:border-white/5 dark:bg-white/[0.03] dark:text-brand-text-muted"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>

                  {/* Comment Section */}
                  <div id="comments">
                    <CommentSection articleId={article.id} />
                  </div>

                  {/* ARTICLE_BOTTOM — before recommendations */}
                  <div className="my-10">
                    <AdSpace type="ARTICLE_BOTTOM" label="Iklan" />
                  </div>

                  {/* Recommended Articles */}
                  <FadeInOnScroll>
                    <section className="mt-10 border-t border-gray-100 pt-8 dark:border-white/5 md:mt-12 md:pt-10">
                      <div className="mb-6 flex items-center gap-2.5">
                        <div className="h-5 w-0.75 bg-brand-red" />
                        <div>
                          <h3 className="text-lg md:text-xl font-sans font-extrabold tracking-tight text-brand-black dark:text-white">
                            Rekomendasi Artikel
                          </h3>
                          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                            Lanjutkan bacaan terkait topik ini
                          </p>
                        </div>
                      </div>

                      {relatedArticles.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {relatedArticles.map((rel: RelatedArticle) => (
                            <NewsCard key={rel.id} article={rel} variant="medium" site={siteParam} />
                          ))}
                        </div>
                      ) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-white/10">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">
                            Belum ada rekomendasi artikel terkait.
                          </p>
                        </div>
                      )}
                    </section>
                  </FadeInOnScroll>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="hidden xl:block">
                <div className="pt-[0.35rem]">
                  <div className="sticky top-32 space-y-4">
                  <div className={cn(sidebarCardClass, 'space-y-3.5')}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
                      Bagikan & Simpan
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <ArticleShareActions title={article.title} url={articleUrl} />
                      <ArticleBookmarkButton
                        article={article}
                        site={siteParam}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                        activeClassName="border-brand-red/40 bg-brand-red/5 text-brand-red"
                        idleClassName="text-brand-text-muted hover:text-brand-red hover:border-brand-red/40"
                        iconSize={14}
                      />
                    </div>
                  </div>

                  <div className={cn(sidebarCardClass, 'space-y-3.5')}>
                    <div className={sidebarLabelClass}>
                      <Sparkles size={12} className="text-brand-red" />
                      Info Artikel
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-red text-xs font-sans font-bold text-white shadow-md shadow-brand-red/10">
                          {article.author?.avatarUrl ? (
                            <img
                              src={article.author.avatarUrl}
                              alt={article.author?.name || 'Author'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            article.author?.name?.[0] || 'R'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-brand-text-muted">
                            Penulis
                          </p>
                          <p className="mt-1 text-xs font-bold leading-snug text-brand-black dark:text-white">
                            {article.author?.name || 'Redaksi'}
                          </p>
                          {authorProfilePath && (
                            <Link
                              href={authorProfilePath}
                              className="mt-1.5 inline-flex items-center rounded-md bg-brand-red/8 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-brand-red transition-colors hover:bg-brand-red hover:text-white dark:bg-brand-red/12"
                            >
                              Lihat Profil
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]">
                        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
                          <BookOpen size={10} className="text-brand-red" />
                          Baca
                        </div>
                        <p className="mt-2 text-xs font-bold text-brand-black dark:text-white">
                          {readingTime} menit
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]">
                        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
                          <Printer size={10} className="text-brand-red" />
                          Kata
                        </div>
                        <p className="mt-2 text-xs font-bold text-brand-black dark:text-white">
                          {(article.wordCount || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]">
                        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
                          <CalendarDays size={10} className="text-brand-red" />
                          Terbit
                        </div>
                        <p className="mt-2 text-xs font-bold text-brand-black dark:text-white">
                          {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]">
                        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
                          <User2 size={10} className="text-brand-red" />
                          Kanal
                        </div>
                        <p className="mt-2 text-xs font-bold text-brand-black dark:text-white">
                          {primaryCategoryName || 'Umum'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={cn(sidebarCardClass, 'space-y-4')}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
                      Kategori Terkait
                    </p>
                    <div className="space-y-4">
                      {sidebarRelatedArticles.length > 0 ? (
                        sidebarRelatedArticles.map((rel: RelatedArticle) => (
                          <NewsCard key={rel.id} article={rel} variant="minimal" site={siteParam} />
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-5 text-center dark:border-white/10 dark:bg-white/[0.03]">
                          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-brand-red/8 text-brand-red dark:bg-brand-red/12">
                            <BookOpen size={14} />
                          </div>
                          <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
                            Belum Ada Artikel Lain
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">
                            Jelajahi berita terbaru untuk menemukan artikel lain dari kategori ini.
                          </p>
                          <Link
                            href={`/${siteParam}${primaryCategoryName ? `?cat=${encodeURIComponent(primaryCategoryName)}` : ''}`}
                            className="mt-3 inline-flex rounded-md bg-brand-red px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-brand-red/90"
                          >
                            Lihat Kategori Ini
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {popularArticles.length > 0 && (
                    <div className={cn(sidebarCardClass, 'space-y-3.5')}>
                      <div className={sidebarLabelClass}>
                        <Flame size={12} className="text-brand-red" />
                        Paling Populer
                      </div>
                      <div className="space-y-3">
                        {popularArticles.map((pop: RelatedArticle, idx: number) => (
                          <Link
                            key={pop.id}
                            href={`/${siteParam}/artikel/${pop.slug}`}
                            className="group flex items-start gap-3"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[11px] font-black text-brand-text-muted group-hover:bg-brand-red group-hover:text-white transition-colors dark:bg-white/5 dark:text-brand-text-muted dark:group-hover:bg-brand-red">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-[11px] font-bold leading-snug text-brand-black dark:text-white group-hover:text-brand-red transition-colors">
                                {pop.title}
                              </p>
                              <p className="mt-1 text-[9px] font-semibold text-brand-text-muted">
                                {pop.author?.name || 'Redaksi'} · {pop.readingTimeMin || 3} min
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {(article.tags || []).length > 0 && (
                    <div className={cn(sidebarCardClass, 'space-y-3.5')}>
                      <div className={sidebarLabelClass}>
                        <Tags size={12} className="text-brand-red" />
                        Topik Terkait
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(article.tags || []).slice(0, 8).map((tag: string) => (
                          <Link
                            key={tag}
                            href={`/${siteParam}?q=${encodeURIComponent(tag)}`}
                            className="inline-flex items-center rounded-full border border-black/5 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-brand-text-muted transition-colors hover:border-brand-red/40 hover:text-brand-red dark:border-white/5 dark:bg-white/[0.03] dark:text-brand-text-muted"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </article>

        {/* Mobile bottom bar — Share & Bookmark, only visible on < md */}
        <MobileArticleTools
          title={article.title}
          url={articleUrl}
          article={article}
          site={siteParam}
        />
      </ImageLightboxWrapper>
      </main>

    </PublicSiteLayout>
  )
}
function PublicBlock({ block, index = 0 }: { block: Block; index?: number }) {
  const bodyTextClass =
    'font-sans text-[calc(1rem*var(--article-font-scale))] leading-[calc(1.75rem*var(--article-font-scale))] antialiased text-left md:text-[calc(1.05rem*var(--article-font-scale))] md:leading-[calc(1.85rem*var(--article-font-scale))]';

  const leadTextClass =
    'font-sans text-[calc(1.125rem*var(--article-font-scale))] leading-relaxed font-medium text-brand-black/90 dark:text-white/90 antialiased md:text-[calc(1.25rem*var(--article-font-scale))]';

  switch (block.type) {
    case 'paragraph':
      const isLeadParagraph = index === 0
      return (
        <p
          className={isLeadParagraph ? leadTextClass : bodyTextClass}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }}
        />
      )
    case 'heading':
      const Tag = `h${block.level}` as keyof JSX.IntrinsicElements
      const headingSizeClass =
        block.level === 2
          ? 'text-[calc(1.35rem*var(--article-font-scale))] md:text-[calc(1.75rem*var(--article-font-scale))]'
          : block.level === 3
            ? 'text-[calc(1.15rem*var(--article-font-scale))] md:text-[calc(1.45rem*var(--article-font-scale))]'
            : 'text-[calc(1rem*var(--article-font-scale))] md:text-[calc(1.25rem*var(--article-font-scale))]'
      return (
        <Tag
          className={cn(
            'mt-10 mb-5 font-serif font-extrabold leading-tight tracking-tight text-balance text-brand-black dark:text-white md:mt-12 md:mb-6',
            headingSizeClass
          )}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }}
        />
      )
    case 'quote':
      return (
        <div className="relative my-10 rounded-r-xl border-l-4 border-brand-red bg-gray-50 px-5 py-8 dark:bg-white/[0.03] md:px-8 md:py-10 lg:px-12">
          <span className="absolute left-4 top-4 text-6xl font-serif leading-none text-brand-red opacity-10 select-none md:left-6 md:top-5 md:text-7xl">“</span>
          <blockquote className="relative z-10 font-sans text-[calc(1.1rem*var(--article-font-scale))] italic leading-[calc(1.7rem*var(--article-font-scale))] text-brand-black dark:text-white md:text-[calc(1.35rem*var(--article-font-scale))] md:leading-[calc(2.1rem*var(--article-font-scale))]">
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }} />
            {block.attribution && (
              <footer className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mt-4">— {block.attribution}</footer>
            )}
          </blockquote>
        </div>
      )
    case 'image':
      return (
        <figure className="my-10">
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-white/5">
            <SmartImage
              src={block.url}
              context="article_block"
              alt={block.alt || 'Post image'}
              fill
              className="object-cover"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-4 flex justify-between items-start border-b border-gray-100 dark:border-white/5 pb-4">
              <span className="text-xs text-brand-text-muted italic leading-relaxed max-w-[80%]">{block.caption}</span>
              <span className="text-[8px] text-brand-text-muted uppercase tracking-widest font-bold shrink-0">Foto / BeritaKarya</span>
            </figcaption>
          )}
        </figure>
      )
    case 'imageGrid':
      return (
        <div className={cn(
          "grid gap-4 my-10",
          block.columns === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
        )}>
          {block.images.map((img, i) => (
            <figure key={i} className="m-0">
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-white/5">
                <SmartImage
                  src={img.url}
                  context="article_block"
                  alt={img.alt || `Grid image ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {img.caption && (
                <figcaption className="mt-2 text-xs text-brand-text-muted italic text-center">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )
    case 'gallery':
      return (
        <div className="my-10 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {block.images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 dark:border-white/5">
                <SmartImage
                  src={img.url}
                  context="gallery_thumb"
                  alt={img.alt || `Gallery image ${i + 1}`}
                  fill
                  className="object-cover cursor-pointer hover:scale-110 transition-transform"
                />
              </div>
            ))}
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted text-center italic">
            Klik gambar untuk memperbesar galeri
          </p>
        </div>
      )
    case 'list':
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag className={cn(
          "my-8 space-y-3 pl-6",
          block.ordered ? "list-decimal" : "list-disc"
        )}>
          {block.items.map((item, i) => (
            <li
              key={i}
              className={bodyTextClass}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item || '') }}
            />
          ))}
        </ListTag>
      )
    case 'callout':
      const variants = {
        info: 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-300',
        warning: 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-300',
        error: 'bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300',
        success: 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-300',
        editorial: 'bg-brand-surface border-gray-100 text-brand-black dark:bg-white/[0.03] dark:border-white/10 dark:text-white'
      }
      return (
        <div
          className={cn(
            "my-10 rounded-xl border-l-4 p-5 font-sans text-[calc(1rem*var(--article-font-scale))] leading-[calc(1.75rem*var(--article-font-scale))] antialiased text-left md:p-8 md:text-[calc(1.1rem*var(--article-font-scale))] md:leading-[calc(1.9rem*var(--article-font-scale))] shadow-sm",
            variants[block.variant as keyof typeof variants] || variants.editorial
          )}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }}
        />
      )
    case 'embed':
      return (
        <div className="my-10">
          {block.embedType === 'youtube' ? (
            <YouTubeEmbed
              url={block.url}
              title={block.title}
            />
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 p-6 flex items-center justify-center">
              <a href={block.url} target="_blank" rel="noopener noreferrer" className="text-brand-red font-bold underline">
                Buka konten eksternal: {block.title || block.url}
              </a>
            </div>
          )}
        </div>
      )
    case 'mediaText':
      return (
        <div
          className={cn(
            "flex flex-col gap-6 my-10 items-center w-full",
            block.align === 'right' ? "md:flex-row-reverse" : "md:flex-row"
          )}
        >
          {/* Image Column */}
          <div className="w-full md:w-1/2 min-w-0">
            <figure className="m-0">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-white/5">
                <SmartImage
                  src={block.url || '/placeholder.jpg'}
                  context="media_text"
                  alt={block.alt || 'Post image'}
                  fill
                  className="object-cover"
                />
              </div>
              {block.caption && (
                <figcaption className="mt-2.5 text-xs text-brand-text-muted italic text-center">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          </div>
          {/* Text Column */}
          <div
            className={cn(bodyTextClass, 'w-full md:w-1/2 min-w-0 max-w-full overflow-hidden whitespace-pre-wrap break-words [&_blockquote]:border-l-4 [&_blockquote]:border-brand-red [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 dark:[&_blockquote]:text-brand-text-muted [&_p]:m-0 [&_p]:mb-2 [&_p:last-child]:mb-0')}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content || '') }}
          />
        </div>
      )
    default:
      return null
  }
}
