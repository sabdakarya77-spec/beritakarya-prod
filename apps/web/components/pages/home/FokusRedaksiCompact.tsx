import { Zap } from 'lucide-react'
import NewsCard from '../../ui/NewsCard'
import FadeInOnScroll from '../../ui/FadeInOnScroll'
import { SectionEyebrow } from '../../ui/Typography'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'

/**
 * FokusRedaksiCompact — Template D (Compact Dense)
 *
 * Layout: 4 kartu compact, image atas + teks bawah, tanpa excerpt.
 * Lebih padat dari FokusRedaksiSection biasa.
 */

interface FokusRedaksiCompactProps {
  articles: HomeArticle[]
  site: string
}

export function FokusRedaksiCompact({ articles, site }: FokusRedaksiCompactProps) {
  if (articles.length === 0) return null

  return (
    <Container className="pt-2 pb-4 md:pt-0 md:pb-6">
      <FadeInOnScroll>
        <div className="mb-4 flex items-center gap-2">
          <Zap size={14} className="text-brand-red" />
          <SectionEyebrow as="h2" className="text-brand-black dark:text-white">
            Fokus Redaksi
          </SectionEyebrow>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {articles.slice(0, 4).map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              variant="compact"
              site={site}
            />
          ))}
        </div>
      </FadeInOnScroll>
    </Container>
  )
}
