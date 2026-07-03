'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, ChevronLeft, ChevronRight, Share2, Type, X } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const fontPanelRef = useRef<HTMLDivElement | null>(null);
  const contentElRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const lastScrollY = useRef(0);

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

  // Handle smart collapse on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Auto-collapse if scrolling down and scrolled more than 150px
      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        setIsCollapsed(true);
        setIsFontPanelOpen(false);
        setIsShareSheetOpen(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    // Fallback: open side share sheet or share options
    setIsShareSheetOpen((prev) => !prev);
    setIsFontPanelOpen(false); // close font panel
  };

  return (
    <>
      {/* Share options panel (fallback when Web Share API is not supported) */}
      <AnimatePresence>
        {isShareSheetOpen && !isCollapsed && (
          <motion.div
            key="share-panel"
            ref={sheetRef}
            initial={{ x: -15, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -15, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed left-16 top-1/2 -translate-y-1/2 z-50 w-[13.5rem] rounded-[1.4rem] border border-white/10 bg-[rgba(7,15,33,0.95)] p-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl md:hidden"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-muted">
                Bagikan
              </p>
              <button
                type="button"
                onClick={() => setIsShareSheetOpen(false)}
                aria-label="Tutup panel berbagi"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-gray-300 transition-colors hover:bg-white/[0.12] hover:text-white"
              >
                <X size={10} />
              </button>
            </div>
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
        {isFontPanelOpen && !isCollapsed && (
          <motion.div
            key="font-panel"
            ref={fontPanelRef}
            initial={{ x: -15, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -15, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed left-16 top-1/2 -translate-y-1/2 z-50 w-[10.5rem] rounded-[1.4rem] border border-white/10 bg-[rgba(7,15,33,0.95)] p-3 shadow-[0_15px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl md:hidden"
          >
            <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted text-left">
              Ukuran Teks
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setFontSize(size.value)}
                  className={cn(
                    'rounded-2xl border py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all text-center',
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

      {/* Collapsed Tab handle stuck to the left edge */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            key="collapsed-tab"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-label="Tampilkan alat artikel"
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex h-12 w-5 items-center justify-center rounded-r-2xl border-y border-r border-white/10 bg-[rgba(7,15,33,0.85)] text-gray-300 shadow-md backdrop-blur-xl md:hidden"
          >
            <ChevronRight size={14} className="animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Vertical Floating Sidebar */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            key="expanded-bar"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-3 top-40 z-40 flex flex-col items-center gap-2 rounded-[1.5rem] border border-white/10 bg-[rgba(7,15,33,0.8)] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl md:hidden"
            role="toolbar"
            aria-label="Alat artikel"
          >
            {/* Collapse button */}
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(true);
                setIsFontPanelOpen(false);
                setIsShareSheetOpen(false);
              }}
              aria-label="Sembunyikan alat artikel"
              title="Sembunyikan"
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-gray-400 hover:text-white active:scale-95 transition-all"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Slim divider line */}
            <div className="w-6 h-px bg-white/[0.08]" />

            {/* Share button */}
            <button
              type="button"
              id="mobile-share-button"
              onClick={handleShare}
              aria-label="Bagikan artikel"
              title="Bagikan artikel"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-2xl border text-gray-300 transition-all',
                isShareSheetOpen
                  ? 'border-brand-red/40 bg-brand-red text-white'
                  : 'border-white/10 bg-white/[0.03] hover:border-brand-red/30 hover:text-white active:scale-95'
              )}
            >
              <Share2 size={14} />
            </button>

            {/* Font Size button */}
            <button
              type="button"
              id="mobile-font-button"
              onClick={() => {
                setIsFontPanelOpen((prev) => !prev);
                setIsShareSheetOpen(false); // close share panel
              }}
              aria-label="Atur ukuran teks"
              title="Atur ukuran teks"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-2xl border text-gray-300 transition-all',
                isFontPanelOpen
                  ? 'border-brand-red/40 bg-brand-red text-white'
                  : 'border-white/10 bg-white/[0.03] hover:border-brand-red/30 hover:text-white active:scale-95'
              )}
            >
              <Type size={14} />
            </button>

            {/* Bookmark button */}
            <button
              type="button"
              id="mobile-bookmark-button"
              onClick={handleBookmark}
              aria-label={isSaved ? 'Hapus dari artikel tersimpan' : 'Simpan artikel'}
              title={isSaved ? 'Tersimpan' : 'Simpan artikel'}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-2xl border text-gray-300 transition-all',
                isSaved
                  ? 'border-brand-red/40 bg-brand-red text-white'
                  : 'border-white/10 bg-white/[0.03] hover:border-brand-red/30 hover:text-white active:scale-95'
              )}
            >
              <Bookmark size={14} className={isSaved ? 'fill-current' : undefined} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
