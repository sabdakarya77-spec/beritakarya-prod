import Skeleton from '../../components/ui/Skeleton'

export default function AuthLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-20 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[400px] w-[400px] rounded-full bg-rose-500/8 blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Skeleton variant="text" className="h-10 w-32" />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:border-white/5 dark:bg-white/[0.02]">
          <div className="mb-6 space-y-2 text-center">
            <Skeleton variant="text" className="h-7 w-48 mx-auto" />
            <Skeleton variant="text" className="h-4 w-64 mx-auto" />
          </div>

          <div className="space-y-4">
            <div>
              <Skeleton variant="text" className="h-3 w-20 mb-2" />
              <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton variant="text" className="h-3 w-24 mb-2" />
              <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton variant="text" className="h-11 w-full rounded-xl" />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Skeleton variant="text" className="h-px flex-1" />
            <Skeleton variant="text" className="h-3 w-12" />
            <Skeleton variant="text" className="h-px flex-1" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            <Skeleton variant="text" className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
