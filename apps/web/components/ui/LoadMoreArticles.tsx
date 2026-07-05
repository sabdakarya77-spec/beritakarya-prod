'use client';

import { useState } from 'react';
import NewsCard from './NewsCard';
import { Loader2, ChevronDown } from 'lucide-react';
import { API_URL } from '../../lib/api';
import Button from './Button';

interface LoadMoreArticleItem {
  id: string;
  slug: string;
  title: string;
  featuredImage?: string | null;
  featuredImageBlur?: string | null;
  featuredImageColor?: string | null;
  readingTimeMin?: number | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  category?: { name?: string | null } | null;
  author?: { name?: string | null; avatarUrl?: string | null } | null;
  blocks?: Array<{ type: string; content?: string; url?: string; embedType?: string; images?: Array<{ url?: string }> }>;
}

interface LoadMoreArticlesProps {
  siteId: string;
  category?: string;
  search?: string;
  initialPage?: number;
  /** Artikel sisa dari distribusi yang belum ditampilkan */
  remainingArticles?: LoadMoreArticleItem[];
}

export default function LoadMoreArticles({
  siteId,
  category,
  search,
  initialPage = 1,
  remainingArticles = [],
}: LoadMoreArticlesProps) {
  const [articles, setArticles] = useState<LoadMoreArticleItem[]>(remainingArticles);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    try {
      const nextPage = page + 1;
      let url = `${API_URL}/api/v1/articles/public?site=${siteId}&page=${nextPage}&limit=10`;

      if (category && category !== 'terbaru') {
        url += `&category=${encodeURIComponent(category)}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      const newArticles = json?.data?.articles || json?.data?.items || [];

      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        setArticles([...articles, ...newArticles]);
        setPage(nextPage);
        if (newArticles.length < 10) setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more articles:", err);
      setError("Gagal memuat artikel. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* List of newly loaded articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-16">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-brand-text-muted">{error}</p>
          <button
            onClick={loadMore}
            className="rounded-lg border border-brand-red/30 bg-brand-red/5 px-4 py-2 text-sm font-semibold text-brand-red transition-colors hover:bg-brand-red/10"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Load More Button or State */}
      {hasMore && !error && (
        <div className="flex justify-center mt-12 pb-20">
          <div className="group flex flex-col items-center gap-3">
            <Button
              variant="dark"
              size="lg"
              onClick={loadMore}
              loading={loading}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />
              )}
              {loading ? 'Menyelaraskan Data...' : 'Muat Lebih Banyak'}
            </Button>
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Eksplorasi Berita Lainnya
            </span>
          </div>
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="text-center py-20 border-t border-gray-50">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">
            Anda telah mencapai batas cakrawala berita
          </p>
        </div>
      )}
    </>
  );
}
