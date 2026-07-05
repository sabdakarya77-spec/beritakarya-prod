/**
 * TemplateA — Classic Editorial
 *
 * Terinspirasi NYT/Kompas.id. Bersih, hierarchical, whitespace cukup.
 * Hero: BENTO_4 | Feed: pattern_rotation | Trending: horizontal_strip
 *
 * Reference: docs/design-grid.md — Design A
 */

import AdSpace from '../../../ui/AdSpace'
import { Bento4Hero } from '../hero/Bento4Hero'
import { FokusRedaksiSection } from '../FokusRedaksiSection'
import { HorizontalStrip } from '../trending/HorizontalStrip'
import { FeedSection } from '../FeedSection'
import { EditorialExtras } from '../EditorialExtras'
import { Container } from '../../../layout/Container'
import type { TemplateProps } from './types'

export function TemplateA(props: TemplateProps) {
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
      {/* ZONA 1 — HERO: BENTO_4 (Classic Editorial) */}
      {heroArticles.length > 0 && (
        <section className="overflow-hidden border-t border-black/5 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_72%)] dark:border-white/5 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,1)_72%)]">
          <Container className="pt-5 pb-6 md:pt-6 md:pb-8">
            <Bento4Hero articles={heroArticles} site={site} />
          </Container>
        </section>
      )}

      {/* AD HOME_TOP */}
      <AdSpace type="HOME_TOP" initialAds={homeTopAds as never} />

      {/* ZONA 2 — FOKUS REDAKSI */}
      {fokusRedaksi.length > 0 && (
        <FokusRedaksiSection articles={fokusRedaksi} site={site} />
      )}

      {/* ZONA 3 — TRENDING: HORIZONTAL_STRIP (Classic) */}
      {trendingArticles.length > 0 && (
        <HorizontalStrip articles={trendingArticles} site={site} />
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
