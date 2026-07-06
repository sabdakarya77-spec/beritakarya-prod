/**
 * TemplateC — Data-Driven
 *
 * Informasi padat, kategori grid. Hero split per kategori.
 * Ticker trending di atas hero. Feed text-heavy.
 *
 * Perbedaan dari TemplateF:
 * - Trending: Ticker (di atas hero, bukan di bawah fokus redaksi)
 * - Hero: SplitHero (gambar kiri + daftar kategori kanan)
 * - Fokus Redaksi: TextHeavy (4 kartu horizontal)
 *
 * Reference: docs/design-grid.md — Design C
 */

import AdSpace from '../../ui/AdSpace'
import { SplitHero } from '../../pages/home/hero/SplitHero'
import { FokusRedaksiTextHeavy } from '../../pages/home/FokusRedaksiTextHeavy'
import { Ticker } from '../../pages/home/trending/Ticker'
import { FeedSection } from '../../pages/home/FeedSection'
import { EditorialExtras } from '../../pages/home/EditorialExtras'
import { Container } from '../../layout/Container'
import type { TemplateProps } from '../types'

export function DataDrivenLayout(props: TemplateProps) {
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
      {/* ZONA 3 — TRENDING: TICKER (di atas hero, khas Design C) */}
      {trendingArticles.length > 0 && (
        <Container className="pt-4 pb-2">
          <Ticker articles={trendingArticles} site={site} />
        </Container>
      )}

      {/* ZONA 1 — HERO: SPLIT_HERO (gambar kiri + kategori kanan) */}
      {heroArticles.length > 0 && (
        <section className="overflow-hidden border-t border-black/5 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_72%)] dark:border-white/5 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,1)_72%)]">
          <Container className="pt-4 pb-6 md:pt-5 md:pb-8">
            <SplitHero articles={heroArticles} site={site} />
          </Container>
        </section>
      )}

      {/* AD HOME_TOP */}
      <AdSpace type="HOME_TOP" initialAds={homeTopAds as never} />

      {/* ZONA 2 — FOKUS REDAKSI: TEXT_HEAVY (4 kartu horizontal) */}
      {fokusRedaksi.length > 0 && (
        <FokusRedaksiTextHeavy articles={fokusRedaksi} site={site} />
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

      {/* ZONA 5+ — EDITORIAL EXTRAS (compact tab-based) */}
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
    </>
  )
}
