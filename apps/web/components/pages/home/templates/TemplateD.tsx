/**
 * TemplateD — Compact Dense
 *
 * Maksimal konten di atas fold. Hero kecil (3 kolom), trending sidebar sticky.
 * Feed + Trending side by side (8+4 grid).
 *
 * Perbedaan dari TemplateF:
 * - Hero: Bento3Hero (3 kartu sejajar, bukan MagazineCoverHero)
 * - Fokus Redaksi: Compact (4 kartu compact, bukan medium)
 * - Feed + Trending: side by side (8 kolom feed + 4 kolom sidebar sticky)
 *
 * Reference: docs/design-grid.md — Design D
 */

import AdSpace from '../../../ui/AdSpace'
import { Bento3Hero } from '../hero/Bento3Hero'
import { FokusRedaksiCompact } from '../FokusRedaksiCompact'
import { StickySidebar } from '../trending/StickySidebar'
import { FeedSection } from '../FeedSection'
import { EditorialExtras } from '../EditorialExtras'
import { Container } from '../../../layout/Container'
import type { TemplateProps } from './types'

export function TemplateD(props: TemplateProps) {
  const {
    heroArticles, fokusRedaksi, trendingArticles, feedArticles,
    trending, popular, editorChoice, opinionArticles, photoJournal, videoStories,
    site, searchQuery, isCategoryFilter, categoryFilter, categoriesTree,
    showSavedFeed, whatsappUrl, telegramUrl, reportUrl, siteName,
    marketData, showPhotoSection, showVideoSection, showEditorChoice, showOpinionSection,
    siteSettings, siteConfigId, homeTopAds, resolveCategoryName, getVideoThumbnail,
  } = props

  const trendingForSidebar = trendingArticles.length > 0 ? trendingArticles : popular

  return (
    <>
      {/* ZONA 1 — HERO: BENTO_3 (3 kartu sejajar) */}
      {heroArticles.length > 0 && (
        <section className="overflow-hidden border-t border-black/5 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_72%)] dark:border-white/5 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,1)_72%)]">
          <Container className="pt-5 pb-6 md:pt-6 md:pb-8">
            <Bento3Hero articles={heroArticles} site={site} />
          </Container>
        </section>
      )}

      {/* AD HOME_TOP */}
      <AdSpace type="HOME_TOP" initialAds={homeTopAds as never} />

      {/* ZONA 2 — FOKUS REDAKSI: COMPACT */}
      {fokusRedaksi.length > 0 && (
        <FokusRedaksiCompact articles={fokusRedaksi} site={site} />
      )}

      {/* ZONA 3+4 — FEED + TRENDING SIDEBAR (side by side) */}
      <Container className="py-4 md:py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
          {/* Feed — 8 kolom */}
          <div className="md:col-span-8">
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
          </div>

          {/* Trending Sidebar — 4 kolom, sticky */}
          <aside className="md:col-span-4">
            <StickySidebar articles={trendingForSidebar} site={site} />
          </aside>
        </div>
      </Container>

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
