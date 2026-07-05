import { Zap } from 'lucide-react'
import NewsCard from '../../ui/NewsCard'
import FadeInOnScroll from '../../ui/FadeInOnScroll'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'
import { sectionEyebrowClass } from './constants'

/**
 * FokusRedaksiTextHeavy — Template C (Data-Driven)
 *
 * Layout: 4 kartu horizontal, image kiri + teks kanan.
 * Cocok untuk site yang mengutamakan kecepatan akses konten.
 */

interface FokusRedaksiTextHeavyProps {
  articles: HomeArticle[]
  site: string
}

export function FokusRedaksiTextHeavy({ articles, site }: FokusRedaksiTextHeavyProps) {
  if (articles.length === 0) return null

  return (
    <Container className="pt-2 pb-6 md:pt-0 md:pb-8">
      <FadeInOnScroll>
        <div className="mb-5 flex items-center gap-2">
          <Zap size={14} className="text-brand-red" />
          <h2 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
            Fokus Redaksi
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {articles.slice(0, 4).map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              variant="horizontal"
              imagePosition="left"
              site={site}
            />
          ))}
        </div>
      </FadeInOnScroll>
    </Container>
  )
}
