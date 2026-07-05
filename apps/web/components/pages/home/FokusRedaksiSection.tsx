import { Zap } from 'lucide-react'
import NewsCard from '../../ui/NewsCard'
import FadeInOnScroll from '../../ui/FadeInOnScroll'
import { SectionEyebrow } from '../../ui/Typography'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'

interface FokusRedaksiSectionProps {
  articles: HomeArticle[]
  site: string
}

export function FokusRedaksiSection({ articles, site }: FokusRedaksiSectionProps) {
  if (articles.length === 0) return null

  return (
    <Container className="pt-2 pb-6 md:pt-0 md:pb-8">
      <FadeInOnScroll>
        {/* Section header */}
        <div className="mb-5 flex items-center gap-2">
          <Zap size={14} className="text-brand-red" />
          <SectionEyebrow as="h2" className="text-brand-black dark:text-white">
            Fokus Redaksi
          </SectionEyebrow>
        </div>

        {/* Grid: 4 kartu sejajar (Design F) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {articles.slice(0, 4).map((article: HomeArticle) => (
            <NewsCard
              key={article.id}
              article={article}
              variant="medium"
              site={site}
            />
          ))}
        </div>
      </FadeInOnScroll>
    </Container>
  )
}
