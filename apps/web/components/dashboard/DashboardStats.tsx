'use client';

import { Target, BookOpen, Zap } from 'lucide-react';

interface DashboardStatsProps {
  published: number;
  drafts: number;
  totalViews: number;
}

export function DashboardStats({ published, drafts, totalViews }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="dash-card p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
          <Target size={18} className="text-violet-500" />
        </div>
        <div>
          <p className="dash-label">Target Hari Ini</p>
          <p className="text-lg font-black text-brand-black dark:text-white">{published} <span className="text-sm font-medium text-gray-400">/ 10</span></p>
          <div className="mt-1.5 h-1 w-32 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min((published/10)*100, 100)}%` }} />
          </div>
        </div>
      </div>
      <div className="dash-card p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
          <BookOpen size={18} className="text-orange-500" />
        </div>
        <div>
          <p className="dash-label">Draft Belum Selesai</p>
          <p className="text-lg font-black text-brand-black dark:text-white">{drafts}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Perlu diselesaikan</p>
        </div>
      </div>
      <div className="dash-card p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
          <Zap size={18} className="text-sky-500" />
        </div>
        <div>
          <p className="dash-label">Est. Total Views</p>
          <p className="text-lg font-black text-brand-black dark:text-white">
            {(totalViews / 1000).toFixed(1)}K
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Semua post</p>
        </div>
      </div>
    </div>
  );
}
