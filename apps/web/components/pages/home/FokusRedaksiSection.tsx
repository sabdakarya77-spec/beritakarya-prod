import { Zap } from 'lucide-react'
import NewsCard from '../../ui/NewsCard'
import ScrollAnimate from '../../ui/ScrollAnimate'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'
import { sectionEyebrowClass } from './constants'

interface FokusRedaksiSectionProps {
  articles: HomeArticle[]
  site: string
}

export function FokusRedaksiSection({ articles, site }: FokusRedaksiSectionProps) {
  if (articles.length === 0) return null

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

        {/* Grid asimetris: 2 kolom kiri (besar) + 1 kolom kanan (2 stacked, balance) */}
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
          {/* Kartu Besar — artikel pertama, mengambil 2/3 lebar */}
          {articles[0] && (
            <div className="md:col-span-2 md:h-full">
              <NewsCard
                article={articles[0]}
                variant="large"
                site={site}
                priority
              />
            </div>
          )}

          {/* Kolom kanan — 2 artikel saja agar balance dengan kartu besar */}
          <div className="flex flex-col gap-3 md:h-full">
            {articles.slice(1, 3).map((article: HomeArticle) => (
              <NewsCard
                key={article.id}
                article={article}
                variant="horizontal"
                site={site}
              />
            ))}
          </div>
        </div>
      </ScrollAnimate>
    </Container>
  )
}
