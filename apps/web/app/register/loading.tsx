import Skeleton from '../../components/ui/Skeleton'

export default function RegisterLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-20 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[400px] w-[400px] rounded-full bg-rose-500/8 blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Skeleton variant="text" className="h-10 w-32" />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:border-white/5 dark:bg-white/[0.02]">
          <div className="mb-6 space-y-2 text-center">
            <Skeleton variant="text" className="h-7 w-56 mx-auto" />
            <Skeleton variant="text" className="h-4 w-72 mx-auto" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Skeleton variant="text" className="h-3 w-20 mb-2" />
              <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton variant="text" className="h-3 w-20 mb-2" />
              <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Skeleton variant="text" className="h-3 w-16 mb-2" />
              <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton variant="text" className="h-3 w-16 mb-2" />
              <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton variant="text" className="h-3 w-16 mb-2" />
              <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Skeleton variant="text" className="h-3 w-20 mb-2" />
              <Skeleton variant="text" className="h-20 w-full rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Skeleton variant="text" className="h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
