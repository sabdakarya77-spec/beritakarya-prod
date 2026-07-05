import { Zap } from 'lucide-react'
import NewsCard from '../../ui/NewsCard'
import ScrollAnimate from '../../ui/ScrollAnimate'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'
import { sectionEyebrowClass } from './constants'

/**
 * FokusRedaksiAsymmetric — Template B (Magazine Bold)
 *
 * Layout: 1 kartu besar (2/3) + 3 kartu kecil stacked (1/3).
 * Berbeda dari FokusRedaksiSection yang 4 kartu sejajar.
 */

interface FokusRedaksiAsymmetricProps {
  articles: HomeArticle[]
  site: string
}

export function FokusRedaksiAsymmetric({ articles, site }: FokusRedaksiAsymmetricProps) {
  if (articles.length === 0) return null

  const main = articles[0]
  const side = articles.slice(1, 4)

  return (
    <Container className="pt-2 pb-6 md:pt-0 md:pb-8">
      <ScrollAnimate>
        {/* Section header */}
        <div className="mb-5 flex items-center gap-2">
          <Zap size={14} className="text-brand-red" />
          <h2 className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
            Fokus Redaksi
          </h2>
        </div>

        {/* Grid: 1 besar + 3 kecil stacked */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Main card — col-span-8 */}
          <div className="md:col-span-8">
            <NewsCard
              article={main}
              variant="medium"
              imagePosition="background"
              site={site}
            />
          </div>

          {/* Side cards — col-span-4, stacked */}
          <div className="flex flex-col gap-3 md:col-span-4">
            {side.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                variant="horizontal"
                imagePosition="left"
                site={site}
              />
            ))}
          </div>
        </div>
      </ScrollAnimate>
    </Container>
  )
}
