'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Printer, Share2, Type } from 'lucide-react';
import { cn } from '../../lib/utils';
import ArticleShareActions from './ArticleShareActions';

type ArticleFloatingToolsProps = {
  title: string;
  url: string;
  className?: string;
};

const fontSizes = [
  { label: 'A-', value: 0.85 },
  { label: 'Normal', value: 1 },
  { label: 'A+', value: 1.15 },
  { label: 'A++', value: 1.3 },
];

export default function ArticleFloatingTools({ title, url, className }: ArticleFloatingToolsProps) {
  const [activePanel, setActivePanel] = useState<'share' | 'font' | null>(null);
  const [fontSize, setFontSize] = useState(1);
  const contentElRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setActivePanel(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePanel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleScrollToComments = () => {
    if (typeof document !== 'undefined') {
      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentFontLabel = fontSizes.find((item) => item.value === fontSize)?.label || 'Normal';

  // Detect if Web Share API is available (mobile)
  const canUseNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleMobileShare = async () => {
    if (canUseNativeShare) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Ignore cancelled share
      }
    } else {
      setActivePanel((current) => (current === 'share' ? null : 'share'));
    }
  };

  return (
    <div ref={rootRef} className={cn('relative hidden md:block', className)}>
      <div className="flex w-[4rem] flex-col items-center gap-2 rounded-[1.75rem] border border-white/10 bg-[rgba(7,15,33,0.78)] p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setActivePanel((current) => (current === 'font' ? null : 'font'))}
          aria-label="Atur ukuran teks"
          title={`Ukuran teks: ${currentFontLabel}`}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl border text-gray-300 transition-all',
            activePanel === 'font'
              ? 'border-brand-red/40 bg-brand-red/10 text-brand-red'
              : 'border-white/10 bg-white/[0.03] hover:border-brand-red/30 hover:text-white'
          )}
        >
          <Type size={16} />
        </button>

        <button
          type="button"
          onClick={handleScrollToComments}
          aria-label="Lihat komentar"
          title="Lihat komentar"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-gray-300 transition-all hover:border-brand-red/30 hover:text-white"
        >
          <MessageCircle size={16} />
        </button>

        <button
          type="button"
          onClick={handleMobileShare}
          aria-label="Bagikan artikel"
          title="Bagikan artikel"
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl border text-gray-300 transition-all',
            activePanel === 'share'
              ? 'border-brand-red/40 bg-brand-red/10 text-brand-red'
              : 'border-white/10 bg-white/[0.03] hover:border-brand-red/30 hover:text-white'
          )}
        >
          <Share2 size={16} />
        </button>

        <button
          type="button"
          onClick={handlePrint}
          aria-label="Cetak artikel"
          title="Cetak artikel"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-gray-300 transition-all hover:border-brand-red/30 hover:text-white"
        >
          <Printer size={16} />
        </button>
      </div>

      <AnimatePresence>
        {activePanel === 'font' && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute left-full top-0 z-30 ml-4 w-[12.25rem] rounded-[1.6rem] border border-white/10 bg-[rgba(7,15,33,0.95)] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
          >
            <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted">
              Ukuran Teks
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setFontSize(size.value)}
                  className={cn(
                    'rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all',
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

      <AnimatePresence>
        {activePanel === 'share' && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute left-full top-1/2 z-30 ml-4 w-[17rem] -translate-y-1/2 rounded-[1.6rem] border border-white/10 bg-[rgba(7,15,33,0.95)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
          >
            <div className="px-1 pb-2.5 pt-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted">
                Bagikan Artikel
              </p>
            </div>
            <ArticleShareActions title={title} url={url} variant="panel" tone="floating" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
