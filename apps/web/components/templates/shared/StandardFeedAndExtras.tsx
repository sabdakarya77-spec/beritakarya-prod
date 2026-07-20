/**
 * StandardFeedAndExtras
 *
 * Komponen shared yang menggabungkan <FeedSection> dan <EditorialExtras>
 * untuk layout-layout yang memakai keduanya secara berurutan di root (full-width),
 * tanpa pembungkus grid tambahan.
 *
 * Dipakai oleh: ClassicEditorialLayout, DataDrivenLayout,
 *               MagazineBoldLayout, VisualStorytellingLayout.
 *
 * TIDAK dipakai oleh:
 * - CompactDenseLayout — <FeedSection> ada di dalam grid 8-kolom,
 *   <EditorialExtras> di luar grid (membutuhkan pemisahan untuk menjaga layout).
 * - HybridLayout — memakai <FeedWithSidebar> + <ContinuedFeed>, bukan <FeedSection>.
 */

import { FeedSection } from '../../pages/home/FeedSection'
import { EditorialExtras } from '../../pages/home/EditorialExtras'
import type { TemplateProps } from '../types'

export function StandardFeedAndExtras(props: TemplateProps) {
  return (
    <>
      {/* ZONA 4 — FEED + INTERSTITIALS */}
      <FeedSection
        feedArticles={props.feedArticles}
        trending={props.trending}
        popular={props.popular}
        site={props.site}
        searchQuery={props.searchQuery}
        isCategoryFilter={props.isCategoryFilter}
        categoryFilter={props.categoryFilter}
        categoriesTree={props.categoriesTree}
        showSavedFeed={props.showSavedFeed}
        whatsappUrl={props.whatsappUrl}
        telegramUrl={props.telegramUrl}
        reportUrl={props.reportUrl}
        siteName={props.siteName}
        marketData={props.marketData}
        photoJournal={props.photoJournal}
        showPhotoSection={props.showPhotoSection}
        videoStories={props.videoStories}
        showVideoSection={props.showVideoSection}
        siteSettings={props.siteSettings as never}
        siteConfigId={props.siteConfigId}
        resolveCategoryName={props.resolveCategoryName}
        remainingArticles={props.remainingArticles}
        excludeIds={props.excludeIds}
      />

      {/* ZONA 5+ — EDITORIAL EXTRAS */}
      <EditorialExtras
        technologyArticles={props.technologyArticles}
        opinionArticles={props.opinionArticles}
        photoJournal={props.photoJournal}
        videoStories={props.videoStories}
        site={props.site}
        showTechnologySection={props.showTechnologySection}
        showOpinionSection={props.showOpinionSection}
        showPhotoSection={props.showPhotoSection}
        showVideoSection={props.showVideoSection}
        getVideoThumbnail={props.getVideoThumbnail}
      />
    </>
  )
}
