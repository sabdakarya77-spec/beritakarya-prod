'use client';

import { TrendingUp, Eye } from 'lucide-react';
import Link from 'next/link';

interface TopContentProps {
  topContent: any[];
  site: string;
}

export function TopContent({ topContent, site }: TopContentProps) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-red" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Konten Terpopuler</h3>
        </div>
        <Link href={`/${site}/dashboard/articles`} className="text-[10px] font-black text-brand-red uppercase tracking-widest hover:underline">Semua</Link>
      </div>
      <div className="p-2">
        {topContent.length > 0 ? (
          topContent.map((item, i) => (
            <Link key={item.id} href={`/${site}/dashboard/articles/${item.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all group">
              <span className="text-sm font-black text-gray-300 group-hover:text-brand-red transition-colors w-4">0{i+1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand-black dark:text-white line-clamp-1">{item.title}</p>
                <p className="text-[10px] text-brand-red font-bold uppercase tracking-widest mt-0.5">{item.category?.name || 'NASIONAL'}</p>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Eye size={12} />
                <span className="text-[11px] font-black tabular-nums">{(item.viewCount || 0).toLocaleString('id-ID')}</span>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-center py-10 text-xs text-gray-400">Belum ada data populer</p>
        )}
      </div>
    </div>
  );
}
