/**
 * TemplateF — Best of (Hybrid) ⭐ DEFAULT
 *
 * Layout: Hero → Fokus Redaksi → Trending → Berita Terbaru (75%:25% + Sidebar) → Editorial Extras
 *
 * Reference: docs/design-grid.md — Design F
 */

import AdSpace from '../../../ui/AdSpace'
import { HeroSection } from '../HeroSection'
import { FokusRedaksiSection } from '../FokusRedaksiSection'
import { TrendingSection } from '../TrendingSection'
import { FeedWithSidebar } from '../FeedWithSidebar'
import { EditorialExtras } from '../EditorialExtras'
import type { TemplateProps } from './types'

export function TemplateF(props: TemplateProps) {
  const {
    heroArticles, fokusRedaksi, trendingArticles, feedArticles,
    popular, editorChoice, opinionArticles, videoStories,
    site, searchQuery, isCategoryFilter, categoryFilter, categoriesTree,
    showSavedFeed, whatsappUrl, telegramUrl, reportUrl,
    showEditorChoice, showOpinionSection, showVideoSection,
    siteConfigId, homeTopAds, resolveCategoryName, getVideoThumbnail, remainingArticles,
    excludeIds,
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

      {/* ZONA 4 — BERITA TERBARU (75% + Sidebar 25%) */}
      <FeedWithSidebar
        feedArticles={feedArticles}
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
