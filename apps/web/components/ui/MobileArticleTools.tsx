'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Share2, Type, X } from 'lucide-react';
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
  const [isFontPanelOpen, setIsFontPanelOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fontSize, setFontSize] = useState(1);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const fontPanelRef = useRef<HTMLDivElement | null>(null);
  const contentElRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const fontSizes = [
    { label: 'A-', value: 0.85 },
    { label: 'Normal', value: 1 },
    { label: 'A+', value: 1.15 },
    { label: 'A++', value: 1.3 },
  ];

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

  // Handle font size scaling on the article-content element
  useEffect(() => {
    const findContent = () => document.querySelector('.article-content') as HTMLElement | null;

    const applyFontSize = (el: HTMLElement | null) => {
      if (el) {
        el.style.setProperty('--article-font-scale', String(fontSize));
        contentElRef.current = el;
      }
    };

    const content = findContent();
    if (content) {
      applyFontSize(content);
      return;
    }

    observerRef.current = new MutationObserver(() => {
      const el = findContent();
      if (el && !contentElRef.current) {
        applyFontSize(el);
        observerRef.current?.disconnect();
      }
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [fontSize]);

  useEffect(() => {
    if (contentElRef.current) {
      contentElRef.current.style.setProperty('--article-font-scale', String(fontSize));
    }
  }, [fontSize]);

  // Close panels on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sheetRef.current && !sheetRef.current.contains(target)) {
        const shareBtn = document.getElementById('mobile-share-button');
        if (!shareBtn?.contains(target)) {
          setIsShareSheetOpen(false);
        }
      }
      if (fontPanelRef.current && !fontPanelRef.current.contains(target)) {
        const fontBtn = document.getElementById('mobile-font-button');
        if (!fontBtn?.contains(target)) {
          setIsFontPanelOpen(false);
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsShareSheetOpen(false);
        setIsFontPanelOpen(false);
      }
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
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
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
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-[2rem] border-t border-white/10 bg-[rgba(7,15,33,0.97)] px-5 pb-8 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl md:hidden"
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

      {/* Font options panel */}
      <AnimatePresence>
        {isFontPanelOpen && (
          <motion.div
            key="font-panel"
            ref={fontPanelRef}
            initial={{ y: 15, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 15, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,12px))] inset-x-4 z-40 mx-auto max-w-sm rounded-[1.6rem] border border-white/10 bg-[rgba(7,15,33,0.95)] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl md:hidden"
          >
            <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted text-center">
              Ukuran Teks
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setFontSize(size.value)}
                  className={cn(
                    'rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all flex-1 text-center',
                    fontSize === size.value
                      ? 'border-brand-red/40 bg-brand-red text-white'
                      : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-brand-red/30 hover:text-white'
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed bottom bar — hidden at xl and above (floating sidebar takes over) */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 md:hidden"
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

            {/* Font Size button */}
            <button
              type="button"
              id="mobile-font-button"
              onClick={() => {
                setIsFontPanelOpen((prev) => !prev);
                setIsShareSheetOpen(false); // close share sheet if open
              }}
              aria-label="Atur ukuran teks"
              title="Atur ukuran teks"
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 transition-all',
                isFontPanelOpen
                  ? 'bg-brand-red/10 text-brand-red'
                  : 'text-brand-text-muted hover:bg-white/[0.05] hover:text-white active:scale-95'
              )}
            >
              <Type size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.12em]">Teks</span>
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
