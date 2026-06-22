'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '../ui/StatusBadge';

interface Article {
  id: string;
  title: string;
  status: string;
  category?: { name: string };
  categories?: Array<{ category?: { name?: string; slug?: string } | null }> | null;
  createdAt: string;
}

const ActivityItem = React.memo(function ActivityItem({ article, site, index }: { article: Article; site: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 * index }}
    >
      <Link
        href={`/${site}/dashboard/articles/${article.id}`}
        className="flex items-center gap-3 py-3.5 border-b border-gray-50 dark:border-white/5 last:border-0 group cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg bg-brand-surface dark:bg-white/5 flex items-center justify-center font-serif font-bold text-brand-red text-sm flex-shrink-0 group-hover:bg-brand-red group-hover:text-white transition-all">
          {(article.categories?.[0]?.category?.name?.[0]) || article.category?.name?.[0] || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-brand-black dark:text-white line-clamp-1 group-hover:text-brand-red transition-colors">
            {article.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={article.status} />
            <span className="text-[10px] text-gray-400 font-medium">
              {new Date(article.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
            </span>
          </div>
        </div>
        <ChevronRight size={14} className="text-gray-200 group-hover:text-brand-red transition-all group-hover:translate-x-0.5 flex-shrink-0" />
      </Link>
    </motion.div>
  );
});

interface RecentActivityProps {
  articles: Article[];
  site: string;
}

export function RecentActivity({ articles, site }: RecentActivityProps) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-brand-red" />
          <h3 className="dash-label">Aktivitas Terakhir</h3>
        </div>
        <Link href={`/${site}/dashboard/articles`} className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline flex items-center gap-1">
          Lihat Semua <ChevronRight size={12} />
        </Link>
      </div>
      <div className="dash-card-body py-2">
        {articles.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-gray-200 dark:text-white/10">
            <FileText size={40} strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Belum ada post</p>
          </div>
        ) : (
          articles.map((a, i) => <ActivityItem key={a.id} article={a} site={site} index={i} />)
        )}
      </div>
    </div>
  );
}
