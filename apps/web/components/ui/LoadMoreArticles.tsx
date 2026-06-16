'use client';

import { useState } from 'react';
import NewsCard from './NewsCard';
import { Loader2, ChevronDown } from 'lucide-react';
import { API_URL } from '../../lib/api';

interface LoadMoreArticlesProps {
  siteId: string;
  category?: string;
  search?: string;
  initialPage?: number;
}

export default function LoadMoreArticles({ 
  siteId, 
  category, 
  search,
  initialPage = 1 
}: LoadMoreArticlesProps) {
  const [articles, setArticles] = useState<any[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      let url = `${API_URL}/api/v1/articles/public?site=${siteId}&page=${nextPage}&limit=10`;

      if (category && category !== 'Terbaru') {
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
    } catch (error) {
      console.error("Error loading more articles:", error);
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

      {/* Load More Button or State */}
      {hasMore && (
        <div className="flex justify-center mt-12 pb-20">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="group flex flex-col items-center gap-3 transition-all"
          >
            <div className="px-10 py-4 bg-brand-black text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] group-hover:bg-brand-red transition-all flex items-center gap-3 rounded-sm">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />
              )}
              {loading ? 'Menyelaraskan Data...' : 'Muat Lebih Banyak'}
            </div>
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Eksplorasi Berita Lainnya
            </span>
          </button>
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
