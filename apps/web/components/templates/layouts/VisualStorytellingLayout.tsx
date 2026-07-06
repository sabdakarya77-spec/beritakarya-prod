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
import { FeedSection } from '../../pages/home/FeedSection'
import { EditorialExtras } from '../../pages/home/EditorialExtras'
import { Container } from '../../layout/Container'
import type { TemplateProps } from '../types'

export function VisualStorytellingLayout(props: TemplateProps) {
  const {
    heroArticles, fokusRedaksi, trendingArticles, feedArticles,
    trending, popular, opinionArticles, photoJournal, videoStories, technologyArticles,
    site, searchQuery, isCategoryFilter, categoryFilter, categoriesTree,
    showSavedFeed, whatsappUrl, telegramUrl, reportUrl, siteName,
    marketData, showPhotoSection, showVideoSection, showOpinionSection, showTechnologySection,
    siteSettings, siteConfigId, homeTopAds, resolveCategoryName, getVideoThumbnail,
    remainingArticles, excludeIds,
  } = props

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

      {/* ZONA 4 — FEED + INTERSTITIALS */}
      <FeedSection
        feedArticles={feedArticles}
        trending={trending}
        popular={popular}
        site={site}
        searchQuery={searchQuery}
        isCategoryFilter={isCategoryFilter}
        categoryFilter={categoryFilter}
        categoriesTree={categoriesTree}
        showSavedFeed={showSavedFeed}
        whatsappUrl={whatsappUrl}
        telegramUrl={telegramUrl}
        reportUrl={reportUrl}
        siteName={siteName}
        marketData={marketData}
        photoJournal={photoJournal}
        showPhotoSection={showPhotoSection}
        videoStories={videoStories}
        showVideoSection={showVideoSection}
        siteSettings={siteSettings as never}
        siteConfigId={siteConfigId}
        resolveCategoryName={resolveCategoryName}
        remainingArticles={remainingArticles}
        excludeIds={excludeIds}
      />

      {/* ZONA 5+ — EDITORIAL EXTRAS */}
      <EditorialExtras
        technologyArticles={technologyArticles}
        opinionArticles={opinionArticles}
        photoJournal={photoJournal}
        videoStories={videoStories}
        site={site}
        showTechnologySection={showTechnologySection}
        showOpinionSection={showOpinionSection}
        showPhotoSection={showPhotoSection}
        showVideoSection={showVideoSection}
        getVideoThumbnail={getVideoThumbnail}
      />
    </>
  )
}
