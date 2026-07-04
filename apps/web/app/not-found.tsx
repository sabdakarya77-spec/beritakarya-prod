import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Home, Newspaper } from 'lucide-react'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-main)] px-6 text-center transition-colors duration-500">
      <div className="mx-auto max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10 dark:bg-brand-red/20">
          <Newspaper size={36} className="text-brand-red" />
        </div>

        {/* Error code */}
        <p className="mb-2 text-6xl font-black tracking-tighter text-brand-red">404</p>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold text-brand-black dark:text-white">
          Halaman Tidak Ditemukan
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-brand-text-muted">
          Maaf, halaman yang Anda cari tidak tersedia, sudah dipindahkan, atau mungkin URL-nya salah ketik.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90"
          >
            <Home size={16} />
            Kembali ke Beranda
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-brand-black transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <Search size={16} />
            Cari Berita
          </Link>
        </div>
      </div>
    </div>
  )
}
