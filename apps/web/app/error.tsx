'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RootErrorBoundary]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  const isNetworkError =
    error.message.toLowerCase().includes('fetch') ||
    error.message.toLowerCase().includes('network')

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-[var(--bg-main)] px-4 py-20 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[400px] w-[400px] rounded-full bg-rose-500/8 blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
          <AlertTriangle size={26} strokeWidth={1.5} />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-600 dark:text-rose-400">
          Kesalahan Sistem
        </p>
        <h1 className="mt-3 font-serif text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {isNetworkError ? 'Gagal Memuat Halaman' : 'Terjadi Kesalahan Tak Terduga'}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-400">
          {isNetworkError
            ? 'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.'
            : 'Mohon maaf, halaman ini gagal dimuat. Tim teknis kami telah menerima laporan otomatis.'}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-rose-600 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-rose-500 dark:hover:text-white"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
          >
            <Home size={16} />
            Beranda
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            ID Laporan: <span className="text-slate-500">{error.digest}</span>
          </p>
        )}

        {process.env.NODE_ENV !== 'production' && (
          <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 text-left dark:border-white/10 dark:bg-white/[0.03]">
            <summary className="flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              <Bug size={12} />
              Detail Error
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-slate-600 dark:text-slate-300">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
