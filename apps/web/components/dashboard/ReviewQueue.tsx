'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight, Clock3, Eye, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

interface Article {
  id: string;
  title: string;
  status: string;
  category?: { name: string };
  author?: { name: string };
  createdAt: string;
  updatedAt?: string;
  isBreaking?: boolean;
}

const ReviewQueueItem = React.memo(function ReviewQueueItem({ article, site, index }: { article: Article; site: string; index: number }) {
  const [currentTimestamp] = useState(() => Date.now());

  const queueHours = useMemo(() => {
    const queueDate = new Date(article.updatedAt || article.createdAt).getTime();
    return Math.max(1, Math.floor((currentTimestamp - queueDate) / (1000 * 60 * 60)));
  }, [article.updatedAt, article.createdAt, currentTimestamp]);
  const isLongQueue = queueHours >= 24;
  const queueAgeLabel = queueHours >= 48
    ? `${Math.floor(queueHours / 24)} hari antre`
    : queueHours >= 24
      ? '24+ jam antre'
      : `${queueHours} jam antre`;
  const actionHint = article.isBreaking
    ? 'Prioritas tertinggi: ambil keputusan cepat.'
    : isLongQueue
      ? 'Prioritas tinggi: artikel sudah lama di antrean.'
      : 'Lanjutkan review sesuai urutan prioritas.';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="border-b border-gray-50 dark:border-white/5 last:border-0 group py-3.5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={16} className="text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                <Zap size={10} /> Breaking
              </span>
            )}
            {isLongQueue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                <Clock3 size={10} /> Antre Lama
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">
              {article.category?.name || 'Umum'}
            </span>
          </div>
          <p className="text-xs font-bold text-brand-black dark:text-white line-clamp-1 group-hover:text-brand-red transition-colors">
            {article.title}
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap text-[10px] text-gray-400">
            <span>oleh {article.author?.name || 'Redaksi'}</span>
            <span className="text-gray-300 dark:text-white/10">•</span>
            <span>{queueAgeLabel}</span>
          </div>
          <p className={cn(
            'mt-2 text-[10px] font-bold',
            article.isBreaking
              ? 'text-red-600 dark:text-red-400'
              : isLongQueue
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-500 dark:text-gray-400'
          )}>
            {actionHint}
          </p>
        </div>
        <div className="md:self-stretch flex items-start">
          <Link
            href={`/${site}/dashboard/articles/${article.id}`}
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Eye size={11} />
            Review
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

interface ReviewQueueProps {
  articles: Article[];
  site: string;
  count: number;
}

export function ReviewQueue({ articles, site, count }: ReviewQueueProps) {
  const [now] = useState(() => Date.now());
  if (articles.length === 0) return null;

  const breakingCount = articles.filter((article) => article.isBreaking).length;
  const longQueueCount = articles.filter((article) => {
    const queueDate = new Date(article.updatedAt || article.createdAt).getTime();
    const queueHours = Math.max(1, Math.floor((now - queueDate) / (1000 * 60 * 60)));
    return queueHours >= 24;
  }).length;

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-violet-500" />
          <h3 className="dash-label text-violet-600 dark:text-violet-400">Antrian Review</h3>
          {count > 0 && (
            <span className="px-1.5 py-0.5 bg-violet-600 text-white text-[10px] font-black rounded-full">{count}</span>
          )}
        </div>
        <Link href={`/${site}/dashboard/review`} className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline flex items-center gap-1">
          Semua <ChevronRight size={12} />
        </Link>
      </div>
      <div className="px-6 pt-4 pb-2 border-b border-gray-50 dark:border-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Prioritas</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-[10px] font-black text-red-600 dark:text-red-400">
            <Zap size={11} /> {breakingCount} breaking
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-[10px] font-black text-amber-600 dark:text-amber-400">
            <Clock3 size={11} /> {longQueueCount} antre lama
          </span>
        </div>
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">
          Urutan widget ini mengikuti prioritas yang sama dengan halaman review penuh: breaking lebih dulu, lalu artikel dengan antrean terlama.
        </p>
      </div>
      <div className="dash-card-body py-2">
        {articles.map((a, i) => <ReviewQueueItem key={a.id} article={a} site={site} index={i} />)}
      </div>
    </div>
  );
}
