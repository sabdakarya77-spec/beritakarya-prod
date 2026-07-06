/**
 * TemplateF — Best of (Hybrid) ⭐ DEFAULT
 *
 * Layout Final (log.txt):
 *   ZONA 1 — Hero: MAGAZINE_COVER (560px)
 *   AD: HOME_TOP
 *   ZONA 2 — Fokus Redaksi (4 kartu sejajar)
 *   ZONA 3 — Trending: NUMBERED_PODIUM
 *   ZONA 4 Row 1 — Berita Terbaru (70:30 sidebar)
 *   AD: HOME_FEED_1
 *   ZONA 4 Row 2 — Continued Feed (4 sejajar, full info)
 *   AD: HOME_FEED_2
 *   ZONA 5 — Editorial Extras (Editor · Opini · Foto · Video)
 *   [Load More Articles]
 */

import AdSpace from '../../../ui/AdSpace'
import { HeroSection } from '../HeroSection'
import { FokusRedaksiSection } from '../FokusRedaksiSection'
import { TrendingSection } from '../TrendingSection'
import { FeedWithSidebar } from '../FeedWithSidebar'
import { ContinuedFeed } from '../ContinuedFeed'
import { EditorialExtras } from '../EditorialExtras'
import type { TemplateProps } from './types'

export function TemplateF(props: TemplateProps) {
  const {
    heroArticles, fokusRedaksi, trendingArticles, feedArticles,
    popular, editorChoice, opinionArticles, photoJournal, videoStories,
    site, searchQuery, isCategoryFilter, categoryFilter, categoriesTree,
    whatsappUrl, telegramUrl, reportUrl,
    showPhotoSection, showEditorChoice, showOpinionSection, showVideoSection,
    homeTopAds, resolveCategoryName, getVideoThumbnail, remainingArticles, excludeIds,
  } = props

  const { LoadMoreArticles } = require('../../LazyWidgets')

  // Row 2: sisa artikel setelah Row 1 (max 8 artikel = 4 kolom × 2 baris)
  const row2Articles = remainingArticles?.slice(0, 8) || []

  // ID untuk exclude dari Load More (semua yang sudah tampil)
  const allExcludeIds = [
    ...(excludeIds || []),
    ...row2Articles.map((a) => a.id),
  ]

  return (
    <>
      {/* ZONA 1 — HERO: MAGAZINE_COVER (560px) */}
      {heroArticles.length > 0 && (
        <HeroSection articles={heroArticles} site={site} />
      )}

      {/* AD: HOME_TOP */}
      <AdSpace type="HOME_TOP" initialAds={homeTopAds as never} />

      {/* ZONA 2 — FOKUS REDAKSI (4 kartu sejajar) */}
      {fokusRedaksi.length > 0 && (
        <FokusRedaksiSection articles={fokusRedaksi} site={site} />
      )}

      {/* ZONA 3 — TRENDING: NUMBERED_PODIUM */}
      {trendingArticles.length > 0 && (
        <TrendingSection articles={trendingArticles} site={site} />
      )}

      {/* ZONA 4 Row 1 — BERITA TERBARU (70:30 sidebar) */}
      <FeedWithSidebar
        feedArticles={feedArticles}
        popular={popular}
        site={site}
        searchQuery={searchQuery}
        isCategoryFilter={isCategoryFilter}
        categoryFilter={categoryFilter}
        categoriesTree={categoriesTree}
        whatsappUrl={whatsappUrl}
        telegramUrl={telegramUrl}
        reportUrl={reportUrl}
        resolveCategoryName={resolveCategoryName}
      />

      {/* AD: HOME_FEED_1 */}
      <AdSpace type="HOME_FEED_1" />

      {/* ZONA 4 Row 2 — CONTINUED FEED (4 sejajar, full info) */}
      {row2Articles.length > 0 && (
        <ContinuedFeed articles={row2Articles} site={site} />
      )}

      {/* AD: HOME_FEED_2 */}
      <AdSpace type="HOME_FEED_2" />

      {/* ZONA 5 — EDITORIAL EXTRAS (Editor · Opini · Foto · Video) */}
      <EditorialExtras
        editorChoice={editorChoice}
        opinionArticles={opinionArticles}
        photoJournal={photoJournal}
        videoStories={videoStories}
        site={site}
        showEditorChoice={showEditorChoice}
        showOpinionSection={showOpinionSection}
        showPhotoSection={showPhotoSection}
        showVideoSection={showVideoSection}
        getVideoThumbnail={getVideoThumbnail}
      />

      {/* LOAD MORE ARTICLES */}
      <div className="border-t border-gray-100 dark:border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadMoreArticles
            siteId={props.siteConfigId}
            category={categoryFilter}
            search={searchQuery}
            initialPage={1}
            remainingArticles={remainingArticles}
            excludeIds={allExcludeIds}
          />
        </div>
      </div>
    </>
  )
}
