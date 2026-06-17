'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Share2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import ArticleShareActions from './ArticleShareActions';
import {
  createSavedArticlePayload,
  isArticleSaved,
  SAVED_ARTICLES_UPDATED_EVENT,
  toggleSavedArticle,
} from '../../lib/savedArticles';

type MobileArticleToolsProps = {
  title: string;
  url: string;
  article: {
    id?: string;
    slug: string;
    title: string;
    featuredImage?: string | null;
    featuredImageBlur?: string | null;
    featuredImageColor?: string | null;
    readingTimeMin?: number | null;
    publishedAt?: string | null;
    createdAt?: string | null;
    category?: { name?: string | null } | null;
    author?: { name?: string | null } | null;
    blocks?: Array<{ type: string; content?: string }>;
  };
  site: string;
};

export default function MobileArticleTools({
  title,
  url,
  article,
  site,
}: MobileArticleToolsProps) {
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Sync bookmark state
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

  // Close sheet on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setIsShareSheetOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsShareSheetOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleBookmark = () => {
    const payload = createSavedArticlePayload(article, site);
    const next = toggleSavedArticle(payload);
    setIsSaved(next);
  };

  const handleShare = async () => {
    // Use native Web Share API if available (all modern mobile browsers)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
      } catch {
        // Ignore cancelled share sheet
      }
      return;
    }
    // Fallback: open bottom sheet with share options
    setIsShareSheetOpen((prev) => !prev);
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isShareSheetOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet (fallback for browsers without Web Share API) */}
      <AnimatePresence>
        {isShareSheetOpen && (
          <motion.div
            key="sheet"
            ref={sheetRef}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-[2rem] border-t border-white/10 bg-[rgba(7,15,33,0.97)] px-5 pb-8 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl xl:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Bagikan artikel"
          >
            {/* Handle bar */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-muted">
                Bagikan Artikel
              </p>
              <button
                type="button"
                onClick={() => setIsShareSheetOpen(false)}
                aria-label="Tutup panel berbagi"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-gray-300 transition-colors hover:bg-white/[0.12] hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Share options */}
            <ArticleShareActions
              title={title}
              url={url}
              variant="panel"
              tone="floating"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed bottom bar — hidden at xl and above (floating sidebar takes over) */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 xl:hidden"
        role="toolbar"
        aria-label="Alat artikel"
      >
        {/* Safe area gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-full h-10 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="border-t border-white/[0.07] bg-[rgba(7,15,33,0.92)] px-4 pb-[env(safe-area-inset-bottom,12px)] pt-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center justify-around gap-2">

            {/* Share button */}
            <button
              type="button"
              id="mobile-share-button"
              onClick={handleShare}
              aria-label="Bagikan artikel"
              title="Bagikan artikel"
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 transition-all',
                isShareSheetOpen
                  ? 'bg-brand-red/10 text-brand-red'
                  : 'text-brand-text-muted hover:bg-white/[0.05] hover:text-white active:scale-95'
              )}
            >
              <Share2 size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.12em]">Bagikan</span>
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-white/[0.08]" />

            {/* Bookmark button */}
            <button
              type="button"
              id="mobile-bookmark-button"
              onClick={handleBookmark}
              aria-label={isSaved ? 'Hapus dari artikel tersimpan' : 'Simpan artikel'}
              aria-pressed={isSaved}
              title={isSaved ? 'Tersimpan' : 'Simpan artikel'}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 transition-all',
                isSaved
                  ? 'bg-brand-red/10 text-brand-red'
                  : 'text-brand-text-muted hover:bg-white/[0.05] hover:text-white active:scale-95'
              )}
            >
              <Bookmark size={20} className={isSaved ? 'fill-current' : undefined} />
              <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                {isSaved ? 'Tersimpan' : 'Simpan'}
              </span>
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
