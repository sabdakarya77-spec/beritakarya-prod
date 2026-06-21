'use client';

import { AlertCircle, Plus, Eye } from 'lucide-react';
import type { Ad } from './types';
import type { AdSlotDefinition } from '../../../lib/constants';
import { LeaderboardBannerRow } from './LeaderboardBannerRow';

// Contoh kategori yang tampil di billboard showcase saat slot kosong (sinkron dengan BillboardShowcase.tsx)
const SHOWCASE_CATEGORIES = [
  { name: 'Kuliner & F&B', color: 'bg-amber-600' },
  { name: 'Teknologi', color: 'bg-blue-600' },
  { name: 'Edukasi', color: 'bg-violet-600' },
  { name: 'UMKM & Lokal', color: 'bg-emerald-600' },
];

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
        <div className="p-6 md:p-8">
          {/* Mini preview: apa yang visitor lihat */}
          <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 mb-5">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 md:p-5 relative">
              <span className="absolute left-3 top-2 z-10 rounded-sm bg-black/30 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/80">
                Iklan
              </span>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50 mb-0.5">Kategori</p>
                  <h4 className="text-sm md:text-base font-black text-white tracking-tight">Contoh Headline Iklan</h4>
                  <p className="text-[10px] text-white/50 mt-0.5">Visitor melihat contoh iklan kategori yang berputar otomatis</p>
                </div>
                <div className="flex gap-1.5">
                  {SHOWCASE_CATEGORIES.map((cat) => (
                    <div key={cat.name} className={`w-2 h-2 rounded-full ${cat.color} opacity-60`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 flex items-center gap-2">
              <Eye size={12} className="text-gray-400" />
              <p className="text-[10px] text-gray-400">
                <span className="font-bold text-brand-black dark:text-white">Billboard Showcase Aktif</span> — Visitor melihat 4 contoh iklan kategori (F&B, Tech, Edu, UMKM) hingga Anda menambahkan banner.
              </p>
            </div>
          </div>

          <div className="text-center">
            <AlertCircle size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">Belum ada banner aktif di slot ini.</p>
            <p className="text-[10px] text-gray-400 mt-1">Klik &quot;Tambah Banner&quot; untuk mengganti showcase dengan iklan Anda sendiri.</p>
          </div>
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
