'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  createSavedArticlePayload,
  isArticleSaved,
  SAVED_ARTICLES_UPDATED_EVENT,
  toggleSavedArticle,
} from '../../lib/savedArticles';

type ArticleBookmarkButtonProps = {
  article: any;
  site: string;
  className?: string;
  activeClassName?: string;
  idleClassName?: string;
  iconSize?: number;
  onToggle?: (isSaved: boolean) => void;
  children?: ReactNode;
};

export default function ArticleBookmarkButton({
  article,
  site,
  className,
  activeClassName = 'text-brand-red',
  idleClassName = 'text-brand-text-muted hover:text-brand-red',
  iconSize = 18,
  onToggle,
  children,
}: ArticleBookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const savedArticlePayload = useMemo(() => createSavedArticlePayload(article, site), [article, site]);

  useEffect(() => {
    const syncSavedState = () => {
      setIsSaved(isArticleSaved(site, article.slug));
    };

    syncSavedState();
    window.addEventListener('storage', syncSavedState);
    window.addEventListener(SAVED_ARTICLES_UPDATED_EVENT, syncSavedState);

    return () => {
      window.removeEventListener('storage', syncSavedState);
      window.removeEventListener(SAVED_ARTICLES_UPDATED_EVENT, syncSavedState);
    };
  }, [site, article.slug]);

  const handleBookmark = () => {
    const nextSavedState = toggleSavedArticle(savedArticlePayload);
    setIsSaved(nextSavedState);
    onToggle?.(nextSavedState);
  };

  return (
    <button
      type="button"
      onClick={handleBookmark}
      aria-label={isSaved ? 'Hapus dari artikel tersimpan' : 'Simpan artikel'}
      aria-pressed={isSaved}
      title={isSaved ? 'Tersimpan' : 'Simpan artikel'}
      className={cn('transition-colors inline-flex items-center gap-2', isSaved ? activeClassName : idleClassName, className)}
    >
      <Bookmark size={iconSize} className={isSaved ? 'fill-current' : undefined} />
      {children}
    </button>
  );
}
