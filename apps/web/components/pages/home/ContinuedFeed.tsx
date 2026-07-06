import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { Container } from '../../layout/Container'
import { SmartImage } from '../../ui/SmartImage'
import { SectionEyebrow } from '../../ui/Typography'
import type { HomeArticle } from './utils/distribution'

interface ContinuedFeedProps {
  articles: HomeArticle[]
  site: string
}

const getImageUrl = (article: HomeArticle): string =>
  article.featuredImage ||
  (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'image')?.url ||
  '/placeholder.jpg'

const getCategoryName = (article: HomeArticle): string =>
  article.categories?.[0]?.category?.name || article.category?.name || 'Umum'

export function ContinuedFeed({ articles, site }: ContinuedFeedProps) {
  if (!articles || articles.length === 0) return null

  // Max 2 baris x 4 kolom = 8 artikel
  const displayArticles = articles.slice(0, 8)

  return (
    <Container className="border-t border-gray-100 pt-6 pb-6 dark:border-white/5 md:pt-8 md:pb-8">
      {/* Section Header */}
      <div className="mb-5 flex items-center gap-2">
        <Newspaper size={14} className="text-brand-red" />
        <SectionEyebrow as="h3" className="text-brand-black dark:text-white">
          Berita Lainnya
        </SectionEyebrow>
      </div>

      {/* Grid: 4 kolom, max 2 baris */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
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
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-white/[0.02]"
            >
              {/* Image 16:9 */}
              <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5">
                <SmartImage
                  src={imageUrl}
                  context="card"
                  alt={article.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1.5 p-4">
                <span className="inline-block w-fit rounded-sm bg-brand-red/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-brand-red">
                  {categoryName}
                </span>
                <h3 className="line-clamp-2 font-sans text-sm font-extrabold leading-[1.2] tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-brand-text-muted dark:text-brand-text-muted/80">
                    {article.excerpt}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-2 pt-2 text-[10px] text-brand-text-muted">
                  {article.author?.avatarUrl ? (
                    <img
                      src={article.author.avatarUrl}
                      alt={article.author.name || 'Redaksi'}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[8px] font-black text-white">
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
    </Container>
  )
}
