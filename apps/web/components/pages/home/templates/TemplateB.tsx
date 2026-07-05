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

import AdSpace from '../../../ui/AdSpace'
import { HeroSection } from '../HeroSection'
import { FokusRedaksiAsymmetric } from '../FokusRedaksiAsymmetric'
import { TrendingSection } from '../TrendingSection'
import { FeedSection } from '../FeedSection'
import { EditorialExtras } from '../EditorialExtras'
import type { TemplateProps } from './types'

export function TemplateB(props: TemplateProps) {
  const {
    heroArticles, fokusRedaksi, trendingArticles, feedArticles,
    trending, popular, editorChoice, opinionArticles, photoJournal, videoStories,
    site, searchQuery, isCategoryFilter, categoryFilter, categoriesTree,
    showSavedFeed, whatsappUrl, telegramUrl, reportUrl, siteName,
    marketData, showPhotoSection, showVideoSection, showEditorChoice, showOpinionSection,
    siteSettings, siteConfigId, homeTopAds, resolveCategoryName, getVideoThumbnail,
    remainingArticles, excludeIds,
  } = props

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
        editorChoice={editorChoice}
        opinionArticles={opinionArticles}
        videoStories={videoStories}
        site={site}
        showEditorChoice={showEditorChoice}
        showOpinionSection={showOpinionSection}
        showVideoSection={showVideoSection}
        getVideoThumbnail={getVideoThumbnail}
      />
    </>
  )
}
