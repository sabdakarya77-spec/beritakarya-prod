/**
 * TemplateE — Visual Storytelling
 *
 * Foto-forward, immersive. Hero dual besar.
 * Feed didominasi hero_pair untuk visual impact.
 *
 * Perbedaan dari TemplateF:
 * - Hero: DualHero (2 gambar besar sejajar, bukan MagazineCoverHero)
 * - Fokus Redaksi: Asymmetric (1 besar + 3 kecil, sama dengan TemplateB)
 * - Trending: WithContext (kategori + views, bukan NumberedPodium)
 *
 * Reference: docs/design-grid.md — Design E
 */

import AdSpace from '../../ui/AdSpace'
import { DualHero } from '../../pages/home/hero/DualHero'
import { FokusRedaksiAsymmetric } from '../../pages/home/FokusRedaksiAsymmetric'
import { WithContext } from '../../pages/home/trending/WithContext'
import { StandardFeedAndExtras } from '../shared/StandardFeedAndExtras'
import { Container } from '../../layout/Container'
import type { TemplateProps } from '../types'

export function VisualStorytellingLayout(props: TemplateProps) {
  const { heroArticles, fokusRedaksi, trendingArticles, site, homeTopAds } = props

  return (
    <>
      {/* ZONA 1 — HERO: DUAL_HERO (2 gambar besar sejajar) */}
      {heroArticles.length > 0 && (
        <section className="overflow-hidden border-t border-black/5 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_72%)] dark:border-white/5 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,1)_72%)]">
          <Container className="pt-5 pb-6 md:pt-6 md:pb-8">
            <DualHero articles={heroArticles} site={site} />
          </Container>
        </section>
      )}

      {/* AD HOME_TOP */}
      <AdSpace type="HOME_TOP" initialAds={homeTopAds as never} />

      {/* ZONA 2 — FOKUS REDAKSI: ASYMMETRIC (1 besar + 3 kecil) */}
      {fokusRedaksi.length > 0 && (
        <FokusRedaksiAsymmetric articles={fokusRedaksi} site={site} />
      )}

      {/* ZONA 3 — TRENDING: WITH_CONTEXT (kategori + views + waktu) */}
      {trendingArticles.length > 0 && (
        <WithContext articles={trendingArticles} site={site} />
      )}

      {/* ZONA 4 + 5 — FEED + EDITORIAL EXTRAS */}
      <StandardFeedAndExtras {...props} />
    </>
  )
}
