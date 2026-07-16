'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ChevronDown } from 'lucide-react';
import { API_URL } from '../../lib/api';
import { SmartImage } from './SmartImage';
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
  category?: { name?: string | null; slug?: string | null } | null;
  categories?: Array<{ category?: { name?: string | null; slug?: string | null } }>;
  author?: { name?: string | null; avatarUrl?: string | null } | null;
  blocks?: Array<{ type: string; content?: string; url?: string; embedType?: string; images?: Array<{ url?: string }> }>;
  excerpt?: string | null;
}

interface LoadMoreArticlesProps {
  siteId: string;
  category?: string;
  search?: string;
  initialPage?: number;
  /** Artikel sisa dari distribusi yang belum ditampilkan */
  remainingArticles?: LoadMoreArticleItem[];
  /** ID artikel yang sudah ditampilkan di beranda untuk disaring keluar */
  excludeIds?: string[];
}

function getImageUrl(article: LoadMoreArticleItem): string {
  if (article.featuredImage) return article.featuredImage;
  if (Array.isArray(article.blocks)) {
    const img = article.blocks.find((b) => b.type === 'image');
    if (img?.url) return img.url;
    const gallery = article.blocks.find((b) => b.type === 'gallery');
    if (gallery?.images?.[0]?.url) return gallery.images[0].url;
  }
  return '/placeholder.jpg';
}

function getCategoryName(article: LoadMoreArticleItem): string {
  return (
    article.categories?.[0]?.category?.name ||
    article.category?.name ||
    'Berita'
  );
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/** List card horizontal: gambar kecil kiri (16:9), teks kanan */
function ArticleListCard({ article, site }: { article: LoadMoreArticleItem; site?: string }) {
  const imageUrl = getImageUrl(article);
  const categoryName = getCategoryName(article);
  const date = formatDate(article.publishedAt || article.createdAt);
  const href = site ? `/${site}/artikel/${article.slug}` : `/artikel/${article.slug}`;

  return (
    <Link href={href} className="group flex gap-3 py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
      {/* Gambar kecil 16:9 */}
      <div className="relative aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5 sm:w-36">
        <SmartImage
          src={imageUrl}
          context="card_horizontal"
          alt={article.title}
          fill
          sizes="144px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Teks */}
      <div className="flex min-w-0 flex-col justify-center gap-1">
        <span className="inline-block w-fit text-[9px] font-black uppercase tracking-[0.14em] text-brand-red">
          {categoryName}
        </span>
        <h4 className="line-clamp-2 font-sans text-[13px] font-bold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white sm:text-sm">
          {article.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px] text-brand-text-muted">
          {article.author?.name && (
            <>
              <span className="font-medium text-brand-black/60 dark:text-white/60 truncate max-w-[80px]">
                {article.author.name}
              </span>
              <span className="opacity-30">·</span>
            </>
          )}
          {date && <span>{date}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function LoadMoreArticles({
  siteId,
  category,
  search,
  initialPage = 1,
  remainingArticles = [],
  excludeIds = [],
}: LoadMoreArticlesProps) {
  // Artikel TIDAK langsung tampil — disimpan, baru muncul setelah tombol diklik
  const [pendingArticles] = useState<LoadMoreArticleItem[]>(remainingArticles);
  const [articles, setArticles] = useState<LoadMoreArticleItem[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    // Klik pertama: tampilkan remainingArticles dulu tanpa fetch
    if (!hasLoaded && pendingArticles.length > 0) {
      const excludeSet = new Set(excludeIds);
      const filtered = pendingArticles.filter((a) => !excludeSet.has(a.id));
      setArticles(filtered);
      setHasLoaded(true);
      setLoading(false);
      return;
    }

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
        const excludeSet = new Set([...excludeIds, ...articles.map((a) => a.id)]);
        const filtered = (newArticles as LoadMoreArticleItem[]).filter(
          (art) => !excludeSet.has(art.id)
        );
        setArticles((prev) => [...prev, ...filtered]);
        setPage(nextPage);
        if (newArticles.length < 10) setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more articles:', err);
      setError('Gagal memuat artikel. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-white/5 pt-8">
      {/* Tombol Muat Lebih Banyak — selalu di atas, sebelum artikel */}
      {hasMore && !error && (
        <div className="flex justify-center mb-8">
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
              {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
            </Button>
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Eksplorasi Berita Lainnya
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-brand-text-muted">{error}</p>
          <button
            onClick={loadMore}
            className="rounded-lg border border-brand-red/30 bg-brand-red/5 px-4 py-2 text-sm font-semibold text-brand-red transition-colors hover:bg-brand-red/10"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Artikel yang sudah dimuat — list card horizontal, 2 kolom desktop */}
      {articles.length > 0 && (
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleListCard key={article.id} article={article} site={siteId} />
          ))}
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="text-center py-12 mt-4 border-t border-gray-100 dark:border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 dark:text-white/30">
            Anda telah mencapai batas cakrawala berita
          </p>
        </div>
      )}
    </div>
  );
}
