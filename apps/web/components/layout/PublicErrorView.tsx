'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Wifi, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

function classifyError(message: string) {
  const m = message.toLowerCase()
  if (m.includes('fetch') || m.includes('network') || m.includes('timeout')) {
    return { kind: 'network' as const }
  }
  if (m.includes('chunk') || m.includes('loading') || m.includes('module')) {
    return { kind: 'chunk' as const }
  }
  return { kind: 'generic' as const }
}

export function PublicErrorView({ error, reset, site }: ErrorProps & { site?: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error)
      console.error('[PublicErrorBoundary]', {
        message: error.message,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error('[PublicErrorBoundary]', error)
    }
  }, [error])

  const { kind } = classifyError(error.message)

  const homeHref = site ? `/${site}` : '/'

  const config = {
    network: {
      icon: Wifi,
      title: 'Koneksi Terganggu',
      description: 'Tidak dapat memuat halaman ini karena masalah jaringan. Periksa koneksi Anda dan coba lagi.',
      retry: 'Coba Lagi',
    },
    chunk: {
      icon: Sparkles,
      title: 'Versi Terbaru Tersedia',
      description: 'Halaman ini telah diperbarui. Muat ulang untuk mendapatkan versi paling baru.',
      retry: 'Muat Ulang',
    },
    generic: {
      icon: AlertTriangle,
      title: 'Halaman Tidak Dapat Dimuat',
      description: 'Terjadi kesalahan saat memuat halaman. Tim kami telah menerima laporan untuk segera ditindaklanjuti.',
      retry: 'Coba Lagi',
    },
  }[kind]

  const Icon = config.icon

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[var(--bg-main)] px-4 py-16 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-rose-500/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-0 h-[420px] w-[420px] rounded-full bg-slate-900/5 blur-[120px] dark:bg-white/[0.04]"
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
          <Icon size={28} strokeWidth={1.5} />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-600 dark:text-rose-400">
          Kesalahan Halaman
        </p>
        <h1 className="mt-3 font-serif text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {config.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
          {config.description}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-rose-600 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-rose-500 dark:hover:text-white"
          >
            <RefreshCw size={16} />
            {config.retry}
          </button>
          <Link
            href={homeHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
          >
            <Home size={16} />
            Halaman Utama
          </Link>
        </div>

        {error.digest && (
          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            ID Laporan: <span className="text-slate-500">{error.digest}</span>
          </p>
        )}

        {process.env.NODE_ENV !== 'production' && (
          <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Detail Error (Dev)
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-slate-600 dark:text-slate-300">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
