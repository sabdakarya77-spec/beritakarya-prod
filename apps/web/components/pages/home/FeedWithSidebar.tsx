import Link from 'next/link'
import AdSpace from '../../ui/AdSpace'
import { SectionTitle } from '../../ui/Typography'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'
import { PalingDibacaSidebar, AksesRedaksiSidebar } from './sidebar'
import { SmartImage } from '../../ui/SmartImage'

interface FeedWithSidebarProps {
  feedArticles: HomeArticle[]
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
  siteConfigId: string
  resolveCategoryName: (slug: string, tree: FeedWithSidebarProps['categoriesTree']) => string
}

const getImageUrl = (article: HomeArticle): string =>
  article.featuredImage ||
  (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'image')?.url ||
  '/placeholder.jpg'

const getCategoryName = (article: HomeArticle): string =>
  article.categories?.[0]?.category?.name || article.category?.name || 'Umum'

export function FeedWithSidebar({
  feedArticles, popular, site,
  searchQuery, isCategoryFilter, categoryFilter, categoriesTree, showSavedFeed,
  whatsappUrl, telegramUrl, reportUrl, siteConfigId, resolveCategoryName,
}: FeedWithSidebarProps) {
  const { LoadMoreArticles } = require('../LazyWidgets')

  const displayArticles = feedArticles.slice(0, 5)

  return (
    <Container className="py-4 md:py-8">
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
        </div>
      </div>

      {/* 75% : 25% Layout — hanya untuk news cards + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Main Column — 75% (9 kolom) */}
        <div className="lg:col-span-9">
          {displayArticles.length > 0 ? (
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-white/5">
              {displayArticles.map((article) => {
                const imageUrl = getImageUrl(article)
                const categoryName = getCategoryName(article)
                const date = new Date(article.publishedAt || article.createdAt || '').toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                const readTime = article.readingTimeMin ? `${article.readingTimeMin} min baca` : '3 min baca'

                return (
                  <Link
                    key={article.id}
                    href={`/${site}/artikel/${article.slug}`}
                    className="group flex gap-4 py-5 first:pt-0 last:pb-0 md:gap-5"
                  >
                    {/* Text — 40% */}
                    <div className="flex min-w-0 flex-[2] flex-col justify-center gap-1.5">
                      <span className="inline-block w-fit rounded-sm bg-brand-red/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-brand-red">
                        {categoryName}
                      </span>
                      <h3 className="line-clamp-2 font-sans text-base font-extrabold leading-[1.2] tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-lg">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-brand-text-muted dark:text-brand-text-muted/80">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-brand-text-muted">
                        <span className="font-medium text-brand-black/70 dark:text-white/70">
                          {article.author?.name || 'Redaksi'}
                        </span>
                        <span className="opacity-30">·</span>
                        <span>{date}</span>
                        <span className="opacity-30">·</span>
                        <span>{readTime}</span>
                      </div>
                    </div>
                    {/* Image — 60% */}
                    <div className="relative aspect-[16/9] flex-[3] shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm dark:bg-white/5">
                      <SmartImage
                        src={imageUrl}
                        context="card_horizontal"
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 60vw, 40vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-sm font-bold text-brand-black dark:text-white">
                Belum ada berita untuk konteks ini.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — 25% (3 kolom) */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-4">
            <PalingDibacaSidebar articles={popular} site={site} />
            <AksesRedaksiSidebar
              whatsappUrl={whatsappUrl}
              telegramUrl={telegramUrl}
              reportUrl={reportUrl}
            />
          </div>
        </aside>
      </div>

      {/* Full-width sections — di luar grid */}
      {/* Ad: HOME_FEED_1 */}
      <div className="mt-6 md:mt-8">
        <AdSpace type="HOME_FEED_1" />
      </div>

      {/* Load More */}
      {!showSavedFeed && (
        <div className="mt-8 border-t border-black/5 pt-8 dark:border-white/5">
          <LoadMoreArticles siteId={siteConfigId} category={categoryFilter} search={searchQuery} initialPage={Math.ceil(feedArticles.length / 10)} />
        </div>
      )}
    </Container>
  )
}
