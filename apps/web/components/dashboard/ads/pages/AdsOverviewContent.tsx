'use client';

import Link from 'next/link';
import {
  BarChart3,
  Eye,
  ArrowRight,
  Target,
  MousePointerClick,
  Image as ImageIcon,
} from 'lucide-react';
import { getAdSlotDefinition } from '../../../../lib/constants';
import type { Ad } from '../types';

interface AdsOverviewContentProps {
  basePath: string; // e.g. '/pusat/dashboard/ads'
  ads: Ad[];
}

export default function AdsOverviewContent({ basePath, ads }: AdsOverviewContentProps) {
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const activeAds = ads.filter(a => a.isActive);
  const slots = Array.from(new Set(ads.map(a => a.slot)));

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="dash-card p-5 flex items-center gap-3 border-l-4 border-l-brand-red">
          <div className="p-2.5 bg-brand-red/10 text-brand-red rounded-lg"><ImageIcon size={18} /></div>
          <div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Total Iklan</p>
            <p className="text-lg font-black text-brand-black dark:text-white">{ads.length}</p>
          </div>
        </div>
        <div className="dash-card p-5 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg"><Eye size={18} /></div>
          <div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Aktif</p>
            <p className="text-lg font-black text-brand-black dark:text-white">{activeAds.length}</p>
          </div>
        </div>
        <div className="dash-card p-5 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg"><BarChart3 size={18} /></div>
          <div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Impresi</p>
            <p className="text-lg font-black text-brand-black dark:text-white">{totalImpressions.toLocaleString()}</p>
          </div>
        </div>
        <div className="dash-card p-5 flex items-center gap-3 border-l-4 border-l-violet-500">
          <div className="p-2.5 bg-violet-500/10 text-violet-500 rounded-lg"><MousePointerClick size={18} /></div>
          <div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Klik</p>
            <p className="text-lg font-black text-brand-black dark:text-white">{totalClicks.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Link
          href={`${basePath}/slots`}
          className="dash-card p-5 flex items-center gap-4 group hover:border-brand-red/30 transition-all"
        >
          <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl"><Target size={20} /></div>
          <div className="flex-1">
            <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Kelola Slot Iklan</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Upload banner, kelola slot aktif</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-red transition-colors" />
        </Link>
      </div>

      {/* Slot Overview */}
      {slots.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Slot Terisi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {slots.map(slot => {
              const slotDef = getAdSlotDefinition(slot);
              const slotAds = ads.filter(a => a.slot === slot);
              const slotImpressions = slotAds.reduce((s, a) => s + (a.impressions || 0), 0);
              const slotClicks = slotAds.reduce((s, a) => s + (a.clicks || 0), 0);
              return (
                <div key={slot} className="dash-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-brand-black dark:text-white uppercase tracking-widest">{slotDef?.name || slot}</p>
                    <span className="text-[8px] px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 rounded-full font-mono">{slotAds.length} iklan</span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {slotImpressions.toLocaleString()} imp · {slotClicks.toLocaleString()} klik
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}