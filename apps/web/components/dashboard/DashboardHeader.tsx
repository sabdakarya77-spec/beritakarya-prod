'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { RealTimePulse } from './RealTimePulse';

interface DashboardHeaderProps {
  greeting: string;
  roleLabel: string;
  userName: string;
  site: string;
  currentDate: string;
  roleFocus?: string;
}

export function DashboardHeader({ greeting, roleLabel, userName, site, currentDate, roleFocus }: DashboardHeaderProps) {
  return (
    <div className="dash-card p-5 md:p-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-red/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-brand-red">
              {greeting}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-brand-black dark:text-white">
              {site}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-white/5 px-2.5 py-1 text-[10px] font-bold text-gray-500 dark:text-gray-300">
              {currentDate}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              {roleLabel}
            </p>
            <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">
              {userName}
            </h1>
          </div>

          {roleFocus && (
            <div className="max-w-3xl rounded-xl border border-brand-red/10 bg-brand-red/5 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-red mb-1">
                Fokus Hari Ini
              </p>
              <p className="text-sm text-brand-black dark:text-white leading-relaxed">
                {roleFocus}
              </p>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[240px]">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Status Dashboard
              </p>
              <p className="text-sm font-bold text-brand-black dark:text-white mt-1">
                Pantau operasional secara real-time
              </p>
            </div>
            <RealTimePulse />
          </div>

          <Link 
            href={`/${site}/dashboard/articles/new`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-brand-red/20"
          >
            <Plus size={15} /> Post Berita
          </Link>
        </div>
      </div>
    </div>
  );
}
