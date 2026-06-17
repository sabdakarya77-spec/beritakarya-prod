'use client';

import { AlertCircle, Plus } from 'lucide-react';
import type { Ad } from './types';
import type { AdSlotDefinition } from '../../../lib/constants';
import { LeaderboardBannerRow } from './LeaderboardBannerRow';

export function LeaderboardManager({
  ads,
  slotDef,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onUpload,
  savingId
}: {
  ads: Ad[];
  slotDef: AdSlotDefinition;
  onAdd: () => void;
  onUpdate: (id: string, payload: Partial<Ad>) => void;
  onDelete: (id: string) => void;
  onReorder: (slotId: string, direction: 'up' | 'down', index: number) => void;
  onUpload: (file: File, slotId?: string) => Promise<string>;
  savingId: string | null;
}) {
  return (
    <div className="dash-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">{slotDef.name} — Carousel</h3>
            <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-400 rounded-full font-mono">{slotDef.size}</span>
            <span className="text-[9px] font-black px-2 py-0.5 bg-brand-red/10 text-brand-red rounded-full">{ads.length} Banner</span>
          </div>
          <p className="text-[10px] text-gray-400">{slotDef.desc}</p>
          <p className="text-[9px] text-brand-text-muted mt-1 italic">Banner berputar otomatis setiap 7 detik. Jeda saat hover.</p>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2.5 bg-brand-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-red/10 hover:opacity-90 transition-all"
        >
          <Plus size={14} /> Tambah Banner
        </button>
      </div>

      {/* Banner List */}
      {ads.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-xs text-gray-400">Belum ada banner di slot ini.</p>
          <p className="text-[10px] text-gray-400 mt-1">Klik &quot;Tambah Banner&quot; untuk menambahkan.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-white/5">
          {ads.map((ad, index) => (
            <LeaderboardBannerRow
              key={ad.id}
              ad={ad}
              index={index}
              total={ads.length}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReorder={onReorder}
              onUpload={onUpload}
              isSaving={savingId === ad.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
