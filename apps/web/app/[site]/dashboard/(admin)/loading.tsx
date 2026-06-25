import { Container } from '../../../../components/layout/Container'
import Skeleton from '../../../../components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] dark:bg-slate-950">
      {/* Top Bar Skeleton */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/80">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Skeleton variant="text" className="h-8 w-8 rounded-full" />
            <Skeleton variant="text" className="h-5 w-28 hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="text" className="h-9 w-9 rounded-full" />
            <Skeleton variant="text" className="h-9 w-9 rounded-full" />
            <Skeleton variant="text" className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Sidebar Skeleton */}
        <aside className="hidden border-r border-gray-100 bg-white px-4 py-6 dark:border-white/5 dark:bg-slate-950 lg:block">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <Skeleton variant="text" className="h-5 w-5 rounded" />
                <Skeleton variant="text" className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="min-w-0">
          <Container className="py-8">
            {/* Page Header */}
            <div className="mb-8 space-y-3">
              <Skeleton variant="text" className="h-3 w-32" />
              <Skeleton variant="text" className="h-9 w-64" />
              <Skeleton variant="text" className="h-4 w-80 max-w-full" />
            </div>

            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <Skeleton variant="text" className="h-3 w-20 mb-3" />
                  <Skeleton variant="text" className="h-8 w-16 mb-3" />
                  <Skeleton variant="text" className="h-2 w-full" />
                </div>
              ))}
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2 space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-white/[0.02]">
                  <Skeleton variant="text" className="h-5 w-40 mb-5" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4 py-2">
                        <Skeleton variant="text" className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton variant="text" className="h-4 w-3/4" />
                          <Skeleton variant="text" className="h-3 w-1/2" />
                        </div>
                        <Skeleton variant="text" className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-white/[0.02]">
                  <Skeleton variant="text" className="h-5 w-32 mb-5" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton variant="text" className="h-4 w-full" />
                        <Skeleton variant="text" className="h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </main>
      </div>
    </div>
  )
}
