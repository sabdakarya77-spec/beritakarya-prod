'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AuthErrorBoundary]', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-20 dark:bg-slate-950">
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
          <AlertTriangle size={26} strokeWidth={1.5} />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-600 dark:text-rose-400">
          Kesalahan Autentikasi
        </p>
        <h1 className="mt-3 font-serif text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Gagal Memuat Halaman Login
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-400">
          Terjadi kesalahan saat memuat halaman autentikasi. Silakan coba lagi atau refresh browser Anda.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-rose-600 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-rose-500 dark:hover:text-white"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
          <a
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
          >
            Buka Ulang Login
          </a>
        </div>
      </div>
    </div>
  )
}
