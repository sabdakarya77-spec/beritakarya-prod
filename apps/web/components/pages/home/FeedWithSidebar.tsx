import Link from 'next/link'
import { SectionTitle } from '../../ui/Typography'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'
import { PalingDibacaSidebar, AksesRedaksiSidebar } from './sidebar'
import { SmartImage } from '../../ui/SmartImage'
import { AdZone } from '../../templates/zones'

interface FeedWithSidebarProps {
  feedArticles: HomeArticle[]
  popular: HomeArticle[]

  site: string
  searchQuery: string
  isCategoryFilter: boolean
  categoryFilter: string
  categoriesTree: Array<{ id: string; name: string; slug: string; subCategories?: { name: string; slug: string }[] }>
  whatsappUrl: string | null
  telegramUrl: string | null
  reportUrl: string
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
  searchQuery, isCategoryFilter, categoryFilter, categoriesTree,
  whatsappUrl, telegramUrl, reportUrl, resolveCategoryName,
}: FeedWithSidebarProps) {
  const displayArticles = feedArticles.slice(0, 5)

  return (
    <Container className="border-t border-gray-100 pt-6 pb-6 dark:border-white/5 md:pt-8 md:pb-8">
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

      {/* 70% : 30% Layout — hanya untuk news cards + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Main Column — 70% (8 kolom) */}
        <div className="lg:col-span-8">
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
                        {article.author?.avatarUrl ? (
                          <img
                            src={article.author.avatarUrl}
                            alt={article.author.name || 'Redaksi'}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[8px] font-black text-white">
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
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-sm font-bold text-brand-black dark:text-white">
                Belum ada berita untuk konteks ini.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — 30% (4 kolom) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <PalingDibacaSidebar articles={popular} site={site} />
            
            {/* Opsi A: HOME_FEED_1 masuk ke sidebar di desktop & mobile */}
            <div className="mt-6">
              <AdZone type="HOME_FEED_1" />
            </div>

            {/* Akses Redaksi (Tetap disembunyikan di HP) */}
            <div className="hidden lg:block">
              <AksesRedaksiSidebar
                whatsappUrl={whatsappUrl}
                telegramUrl={telegramUrl}
                reportUrl={reportUrl}
              />
            </div>
          </div>
        </aside>
      </div>
    </Container>
  )
}
