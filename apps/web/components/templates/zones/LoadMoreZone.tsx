/**
 * LoadMoreZone — wrapper untuk LoadMoreArticles di homepage.
 * Dipakai oleh layout yang tidak menggunakan FeedSection (misal HybridLayout).
 */

import type { HomeArticle } from '../../pages/home/utils/distribution'

interface LoadMoreZoneProps {
  siteId: string
  category: string
  search: string
  remainingArticles?: HomeArticle[]
  excludeIds?: string[]
}

export function LoadMoreZone({
  siteId, category, search, remainingArticles, excludeIds,
}: LoadMoreZoneProps) {
  const { LoadMoreArticles } = require('../../pages/LazyWidgets')

  return (
    <div className="border-t border-gray-100 dark:border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadMoreArticles
          siteId={siteId}
          category={category}
          search={search}
          initialPage={1}
          remainingArticles={remainingArticles}
          excludeIds={excludeIds}
        />
      </div>
    </div>
  )
}
