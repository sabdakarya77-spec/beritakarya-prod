'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NewsCard from './NewsCard';
import ArticleBookmarkButton from './ArticleBookmarkButton';
import {
  getSavedArticles,
  SAVED_ARTICLES_UPDATED_EVENT,
  type SavedArticle,
} from '../../lib/savedArticles';

type SavedArticlesFeedProps = {
  site: string;
};

export default function SavedArticlesFeed({ site }: SavedArticlesFeedProps) {
  const [articles, setArticles] = useState<SavedArticle[]>([]);

  useEffect(() => {
    const syncSavedArticles = () => {
      const next = getSavedArticles().filter((item) => item.site === site);
      setArticles(next);
    };

    syncSavedArticles();
    window.addEventListener('storage', syncSavedArticles);
    window.addEventListener(SAVED_ARTICLES_UPDATED_EVENT, syncSavedArticles);

    return () => {
      window.removeEventListener('storage', syncSavedArticles);
      window.removeEventListener(SAVED_ARTICLES_UPDATED_EVENT, syncSavedArticles);
    };
  }, [site]);

  if (articles.length === 0) {
    return (
      <div className="mb-16 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] p-10 text-center">
        <p className="text-lg font-serif font-black text-brand-black dark:text-white">Belum ada artikel tersimpan.</p>
        <p className="mt-3 text-sm text-brand-text-muted">
          Gunakan tombol bookmark pada hero atau halaman artikel untuk menyimpan bacaan Anda.
        </p>
        <div className="mt-6">
          <Link
            href={`/${site}`}
            className="inline-flex items-center justify-center rounded-full bg-brand-red px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white hover:opacity-90 transition-opacity"
          >
            Jelajahi Berita
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <div className="mb-6 text-[10px] font-black uppercase tracking-[0.16em] text-brand-text-muted">
        {articles.length} artikel tersimpan
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {articles.map((article) => (
          <div key={`${article.site}-${article.slug}`} className="space-y-4">
            <NewsCard article={article} site={site} />
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-text-muted">
                Disimpan untuk dibaca lagi
              </span>
              <ArticleBookmarkButton
                article={article}
                site={site}
                className="rounded-full border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] dark:border-white/10"
                activeClassName="rounded-full border border-brand-red/30 bg-brand-red/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-brand-red"
                idleClassName="rounded-full border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-brand-text-muted hover:text-brand-red hover:border-brand-red/40 dark:border-white/10"
                iconSize={14}
                onToggle={(isSaved) => {
                  if (!isSaved) {
                    setArticles((current) => current.filter((item) => !(item.site === article.site && item.slug === article.slug)));
                  }
                }}
              >
                <span>{'Hapus'}</span>
              </ArticleBookmarkButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
