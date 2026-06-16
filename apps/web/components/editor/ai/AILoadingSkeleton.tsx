'use client'

interface AILoadingSkeletonProps {
  lines?: number
  label?: string
}

export function AILoadingSkeleton({ lines = 3, label }: AILoadingSkeletonProps) {
  return (
    <div className="space-y-2 animate-pulse">
      {label && (
        <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
      )}
      <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded"
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function AIButtonSkeleton() {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse">
      <div className="h-3.5 w-3.5 rounded-full bg-gray-300 dark:bg-slate-600" />
      <div className="h-3 w-16 bg-gray-300 dark:bg-slate-600 rounded" />
    </div>
  )
}
