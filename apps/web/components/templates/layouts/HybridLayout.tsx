/**
 * HybridLayout — Best of (Hybrid) ⭐ DEFAULT
 *
 * Layout Final (log.txt):
 *   ZONA 1 — Hero: MAGAZINE_COVER (560px)
 *   AD: HOME_TOP
 *   ZONA 2 — Fokus Redaksi (4 kartu sejajar)
 *   ZONA 3 — Trending: NUMBERED_PODIUM
 *   ZONA 4 Row 1 — Berita Terbaru (8:4 sidebar)
 *   AD: HOME_FEED_1
 *   ZONA 4 Row 2 — Continued Feed (4 sejajar, full info)
 *   AD: HOME_FEED_2
 *   ZONA 5 — Editorial Extras (Editor · Opini · Foto · Video)
 *   [Load More Articles]
 */

import { HeroSection } from '../../pages/home/HeroSection'
import { FokusRedaksiSection } from '../../pages/home/FokusRedaksiSection'
import { TrendingSection } from '../../pages/home/TrendingSection'
import { FeedWithSidebar } from '../../pages/home/FeedWithSidebar'
import { ContinuedFeed } from '../../pages/home/ContinuedFeed'
import { EditorialExtras } from '../../pages/home/EditorialExtras'
import { AdZone, LoadMoreZone } from '../zones'
import type { TemplateProps } from '../types'

export function HybridLayout(props: TemplateProps) {
  const {
    heroArticles, fokusRedaksi, trendingArticles, feedArticles,
    popular, opinionArticles, photoJournal, videoStories, technologyArticles,
    site, searchQuery, isCategoryFilter, categoryFilter, categoriesTree,
    whatsappUrl, telegramUrl, reportUrl,
    showPhotoSection, showOpinionSection, showVideoSection, showTechnologySection,
    homeTopAds, resolveCategoryName, getVideoThumbnail, remainingArticles, excludeIds,
  } = props

  // Row 2: sisa dari feed (yang tidak tampil di Row 1) + remainingArticles
  // Dedup: tidak ada overlap dengan Row 1 karena feed.slice(4) mengambil setelah 4 pertama
  const feedRow1Ids = new Set(feedArticles.slice(0, 4).map((a) => a.id))
  const feedLeftover = feedArticles.slice(4).filter((a) => !feedRow1Ids.has(a.id))
  const row2Articles = [...feedLeftover, ...(remainingArticles || [])].slice(0, 8)

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
      <AdZone type="HOME_TOP" initialAds={homeTopAds} />

      {/* ZONA 2 — FOKUS REDAKSI (4 kartu sejajar) */}
      {fokusRedaksi.length > 0 && (
        <FokusRedaksiSection articles={fokusRedaksi} site={site} />
      )}

      {/* ZONA 3 — TRENDING: NUMBERED_PODIUM */}
      {trendingArticles.length > 0 && (
        <TrendingSection articles={trendingArticles} site={site} />
      )}

      {/* ZONA 4 Row 1 — BERITA TERBARU (8:4 sidebar) */}
      <FeedWithSidebar
        feedArticles={feedArticles}
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



      {/* ZONA 4 Row 2 — CONTINUED FEED (4 sejajar, full info) */}
      {row2Articles.length > 0 && (
        <ContinuedFeed articles={row2Articles} site={site} />
      )}

      {/* AD: HOME_FEED_2 */}
      <AdZone type="HOME_FEED_2" />

      {/* ZONA 5 — EDITORIAL EXTRAS (Teknologi · Opini · Foto · Video) */}
      <EditorialExtras
        technologyArticles={technologyArticles}
        opinionArticles={opinionArticles}
        photoJournal={photoJournal}
        videoStories={videoStories}
        popularArticles={popular}
        site={site}
        showTechnologySection={showTechnologySection}
        showOpinionSection={showOpinionSection}
        showPhotoSection={showPhotoSection}
        showVideoSection={showVideoSection}
        getVideoThumbnail={getVideoThumbnail}
      />

      {/* LOAD MORE ARTICLES */}
      <LoadMoreZone
        siteId={props.siteConfigId}
        category={categoryFilter}
        search={searchQuery}
        remainingArticles={remainingArticles}
        excludeIds={allExcludeIds}
      />
    </>
  )
}
