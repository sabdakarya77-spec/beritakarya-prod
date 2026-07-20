/**
 * TemplateB — Magazine Bold
 *
 * Visual-heavy, hero besar seperti sampul majalah.
 * Hero: MAGAZINE_COVER | Feed: asymmetric_heavy | Trending: numbered_podium
 *
 * Perbedaan dari TemplateF:
 * - Fokus Redaksi: asymmetric (1 besar + 3 kecil) bukan 4 sejajar
 * - Hero: MagazineCoverHero full-width (sama component, beda container)
 * - Trending: NumberedPodium (sama)
 *
 * Reference: docs/design-grid.md — Design B
 */

import AdSpace from '../../ui/AdSpace'
import { HeroSection } from '../../pages/home/HeroSection'
import { FokusRedaksiAsymmetric } from '../../pages/home/FokusRedaksiAsymmetric'
import { TrendingSection } from '../../pages/home/TrendingSection'
import { StandardFeedAndExtras } from '../shared/StandardFeedAndExtras'
import type { TemplateProps } from '../types'

export function MagazineBoldLayout(props: TemplateProps) {
  const { heroArticles, fokusRedaksi, trendingArticles, site, homeTopAds } = props

  return (
    <>
      {/* ZONA 1 — HERO: MAGAZINE_COVER (full-width, sama dengan F) */}
      {heroArticles.length > 0 && (
        <HeroSection articles={heroArticles} site={site} />
      )}

      {/* AD HOME_TOP */}
      <AdSpace type="HOME_TOP" initialAds={homeTopAds as never} />

      {/* ZONA 2 — FOKUS REDAKSI: ASYMMETRIC (1 besar + 3 kecil) */}
      {fokusRedaksi.length > 0 && (
        <FokusRedaksiAsymmetric articles={fokusRedaksi} site={site} />
      )}

      {/* ZONA 3 — TRENDING: NUMBERED_PODIUM (sama dengan F) */}
      {trendingArticles.length > 0 && (
        <TrendingSection articles={trendingArticles} site={site} />
      )}

      {/* ZONA 4 + 5 — FEED + EDITORIAL EXTRAS */}
      <StandardFeedAndExtras {...props} />
    </>
  )
}
