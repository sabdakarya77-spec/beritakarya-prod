'use client';

import { Printer, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ArticleActionsProps = {
  iconOnly?: boolean;
};

export default function ArticleActions({ iconOnly = false }: ArticleActionsProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleScrollToComments = () => {
    if (typeof document !== 'undefined') {
      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrint}
        className={cn(
          "inline-flex rounded-full border border-gray-200/80 bg-white/90 text-[10px] font-black uppercase tracking-[0.16em] text-brand-text-muted shadow-sm transition-all hover:border-brand-red/30 hover:text-brand-red dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-brand-red/30 dark:hover:text-brand-red",
          iconOnly ? "h-10 w-10 items-center justify-center" : "items-center gap-2 px-3.5 py-2"
        )}
        aria-label="Cetak artikel"
        title="Cetak artikel"
      >
        <Printer size={14} />
        {!iconOnly && 'Cetak'}
      </button>
      <button
        onClick={handleScrollToComments}
        className={cn(
          "inline-flex rounded-full border border-gray-200/80 bg-white/90 text-[10px] font-black uppercase tracking-[0.16em] text-brand-text-muted shadow-sm transition-all hover:border-brand-red/30 hover:text-brand-red dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-brand-red/30 dark:hover:text-brand-red",
          iconOnly ? "h-10 w-10 items-center justify-center" : "items-center gap-2 px-3.5 py-2"
        )}
        aria-label="Lihat komentar"
        title="Lihat komentar"
      >
        <MessageCircle size={14} />
        {!iconOnly && 'Komentar'}
      </button>
    </div>
  );
}
