'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Search, Home, ArrowRight, Newspaper } from 'lucide-react';

export function SiteNotFoundClient() {
  const router = useRouter();
  const params = useParams();
  const site = (params?.site as string) || 'pusat';
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${site}?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10 dark:bg-brand-red/20">
          <Newspaper size={28} className="text-brand-red" />
        </div>

        {/* Error code */}
        <p className="mb-2 text-5xl font-black tracking-tighter text-brand-red">404</p>

        {/* Title */}
        <h1 className="mb-2 text-xl font-bold text-brand-black dark:text-white">
          Halaman Tidak Ditemukan
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-brand-text-muted">
          Artikel yang Anda cari mungkin sudah diarsipkan atau URL-nya berubah.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berita atau topik..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-brand-black outline-none transition-all placeholder:text-gray-400 focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={`/${site}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90"
          >
            <Home size={15} />
            Kembali ke Beranda
          </Link>
          <Link
            href={`/${site}?cat=terbaru`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-black transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Berita Terbaru
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
