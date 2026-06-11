'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Error tracking hook - integrate Sentry/GlitchTip in production
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error)
      console.error('[GlobalErrorBoundary]', {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error('[GlobalErrorBoundary]', error)
    }
  }, [error])

  const isNetworkError =
    error.message.toLowerCase().includes('fetch') ||
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('timeout')

  const isChunkError =
    error.message.toLowerCase().includes('chunk') ||
    error.message.toLowerCase().includes('loading')

  const title = isNetworkError
    ? 'Koneksi Terganggu'
    : isChunkError
    ? 'Versi Aplikasi Kedaluwarsa'
    : 'Terjadi Kesalahan Sistem'

  const description = isNetworkError
    ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba beberapa saat lagi.'
    : isChunkError
    ? 'Aplikasi telah diperbarui. Muat ulang halaman untuk mendapatkan versi terbaru.'
    : 'Mohon maaf, terjadi kesalahan tak terduga. Tim teknis kami telah otomatis menerima laporan untuk ditindaklanjuti.'

  return (
    <html lang="id">
      <body>
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-16 dark:bg-slate-950">
          {/* Decorative gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-rose-500/10 blur-[120px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 left-0 h-[480px] w-[480px] rounded-full bg-slate-900/5 blur-[120px] dark:bg-white/5"
          />

          <div className="relative z-10 w-full max-w-xl text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
              <AlertTriangle size={36} strokeWidth={1.5} />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-rose-600 dark:text-rose-400">
              Aplikasi BeritaKarya
            </p>
            <h1 className="mt-3 font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
              {description}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => reset()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-rose-600 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-rose-500 dark:hover:text-white"
              >
                <RefreshCw size={16} />
                Coba Lagi
              </button>
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
              >
                <Home size={16} />
                Kembali ke Beranda
              </Link>
            </div>

            {error.digest && (
              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                ID Referensi: <span className="text-slate-500">{error.digest}</span>
              </p>
            )}

            {process.env.NODE_ENV !== 'production' && (
              <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <summary className="flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  <Bug size={12} />
                  Detail Teknis (Dev Only)
                </summary>
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
