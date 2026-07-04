import { Container } from '../../layout/Container'
import { MagazineCoverHero } from '../../berita/MagazineCoverHero'
import type { HomeArticle } from './utils/distribution'

interface HeroSectionProps {
  articles: HomeArticle[]
  site: string
}

export function HeroSection({ articles, site }: HeroSectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="overflow-hidden border-t border-black/5 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_72%)] dark:border-white/5 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,1)_72%)]">
      <Container className="pt-5 pb-6 md:pt-6 md:pb-8">
        <MagazineCoverHero articles={articles} site={site} />
      </Container>
    </section>
  )
}
