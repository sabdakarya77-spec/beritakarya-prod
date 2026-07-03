'use client'

/**
 * LazyWidgets — client wrapper untuk code-splitting below-the-fold widgets.
 * framer-motion + data fetching di-defer sampai chunk ter-load di client.
 */

import dynamic from 'next/dynamic'

export const LoadMoreArticles = dynamic(() => import('../ui/LoadMoreArticles'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red/20 border-t-brand-red" />
    </div>
  ),
})

export const SavedArticlesFeed = dynamic(() => import('../ui/SavedArticlesFeed'), {
  ssr: false,
})

export const MarketWidget = dynamic(() => import('../ui/MarketWidget'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02] animate-pulse">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 mb-3" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5" />
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5" />
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5" />
      </div>
    </div>
  ),
})

export const PhotoJournalWidget = dynamic(() => import('../ui/PhotoJournalWidget'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02] animate-pulse">
      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-white/10 mb-3" />
      <div className="aspect-[4/3] rounded-xl bg-gray-100 dark:bg-white/5" />
    </div>
  ),
})

export const VideoWidget = dynamic(() => import('../ui/VideoWidget'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02] animate-pulse">
      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-white/10 mb-3" />
      <div className="aspect-video rounded-xl bg-gray-100 dark:bg-white/5" />
    </div>
  ),
})
