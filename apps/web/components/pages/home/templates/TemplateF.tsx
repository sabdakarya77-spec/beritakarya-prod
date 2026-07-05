/**
 * TemplateF — Best of (Hybrid) ⭐ DEFAULT
 *
 * Kombinasi kurasi elemen terbaik dari Design A, B, dan C.
 * Hero: MAGAZINE_COVER_550 | Feed: pattern_rotation | Trending: numbered_podium
 *
 * Reference: docs/design-grid.md — Design F
 */

import AdSpace from '../../../ui/AdSpace'
import { HeroSection } from '../HeroSection'
import { FokusRedaksiSection } from '../FokusRedaksiSection'
import { TrendingSection } from '../TrendingSection'
import { FeedSection } from '../FeedSection'
import { EditorialExtras } from '../EditorialExtras'
import type { TemplateProps } from './types'

export function TemplateF(props: TemplateProps) {
  const {
    heroArticles, fokusRedaksi, trendingArticles, feedArticles,
    trending, popular, editorChoice, opinionArticles, photoJournal, videoStories,
    site, searchQuery, isCategoryFilter, categoryFilter, categoriesTree,
    showSavedFeed, whatsappUrl, telegramUrl, reportUrl, siteName,
    marketData, showPhotoSection, showVideoSection, showEditorChoice, showOpinionSection,
    siteSettings, siteConfigId, homeTopAds, resolveCategoryName, getVideoThumbnail,
  } = props

  return (
    <>
      {/* ZONA 1 — HERO: MAGAZINE_COVER_550 */}
      {heroArticles.length > 0 && (
        <HeroSection articles={heroArticles} site={site} />
      )}

      {/* AD HOME_TOP */}
      <AdSpace type="HOME_TOP" initialAds={homeTopAds as never} />

      {/* ZONA 2 — FOKUS REDAKSI */}
      {fokusRedaksi.length > 0 && (
        <FokusRedaksiSection articles={fokusRedaksi} site={site} />
      )}

      {/* ZONA 3 — TRENDING: NUMBERED_PODIUM */}
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
