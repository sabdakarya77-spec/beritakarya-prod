'use client';

import { Monitor, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { getAdSlotDefinition } from '../../../../lib/constants';
import { useStudio } from './StudioContext';

export function StudioPreview() {
  const { data, isSuccess } = useStudio();
  const { selectedPackage, adPreviewUrl, mediaType } = data;
  const site = (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'pusat');
  const slotDef = selectedPackage ? getAdSlotDefinition(selectedPackage.slot) : null;
  const slotName = slotDef?.name || 'Slot Iklan';
  const slotSize = slotDef?.publicSize || 'Responsive';

  const formatRupiah = (val: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

  if (isSuccess) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight">Pesanan Terkirim!</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Materi iklan dan bukti pembayaran telah diunggah. Menunggu verifikasi Superadmin (5-15 menit).
            </p>
          </div>
          {selectedPackage && (
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <span>{slotName}</span>
              <span className="w-px h-3 bg-gray-300 dark:bg-white/10" />
              <span>{selectedPackage.durationDays} hari</span>
              <span className="w-px h-3 bg-gray-300 dark:bg-white/10" />
              <span className="text-brand-red font-black">{formatRupiah(selectedPackage.price)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
            <Monitor size={24} className="text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400">Canvas Kosong</p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">Pilih paket di sidebar untuk mulai</p>
          </div>
        </div>
      </div>
    );
  }

  const isHeroBanner = selectedPackage.slot === 'HOME_TOP';
  const previewSrc = adPreviewUrl || null;

  return (
    <div className="h-full flex flex-col">
      {/* Canvas header */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 dark:border-white/5 flex-shrink-0 bg-white dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Monitor size={12} className="text-gray-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Preview</span>
        </div>
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
          data.adFile ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
        )}>
          {data.adFile ? '● Siap' : '○ Draft'}
        </span>
      </div>

      {/* Canvas body */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div className="w-full max-w-2xl space-y-4">
          {/* Browser Frame */}
          <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl shadow-black/10">
            {/* Chrome */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 mx-2">
                <div className="bg-gray-100 dark:bg-white/5 rounded-md px-3 py-1.5 text-[10px] text-gray-400 font-mono">
                  🌐 beritakarya.co/{site}
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="relative">
              {isHeroBanner && (
                <div className="p-3 bg-gray-50/80 dark:bg-white/[0.02]">
                  <AdSlotMockup slot="HOME_TOP" previewSrc={previewSrc} mediaType={mediaType} isEmpty={!adPreviewUrl} />
                </div>
              )}

              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                  <div className="w-7 h-7 bg-brand-red rounded-md text-white text-[8px] font-black flex items-center justify-center">BK</div>
                  <div className="flex-1 flex gap-4">
                    {['Beranda', 'Nasional', 'Daerah', 'Ekonomi', 'Olahraga'].map(t => (
                      <div key={t} className="h-2 bg-gray-200 dark:bg-white/10 rounded-full" style={{ width: `${t.length * 6 + 20}px` }} />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
                    </div>

                    {(selectedPackage?.slot === 'HOME_FEED_1' || selectedPackage?.slot === 'HOME_FEED_2' || selectedPackage?.slot === 'ARTICLE_MIDDLE') && (
                      <AdSlotMockup slot={selectedPackage.slot} previewSrc={previewSrc} mediaType={mediaType} isEmpty={!adPreviewUrl} />
                    )}

                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-5/6" />
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[1, 2].map(i => (
                        <div key={i} className="space-y-1.5">
                          <div className="h-16 bg-gray-100 dark:bg-white/5 rounded-lg" />
                          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
                          <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded w-3/5" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-36 flex-shrink-0 space-y-3">
                    {(selectedPackage?.slot === 'ARTICLE_TOP' || selectedPackage?.slot === 'ARTICLE_BOTTOM') && (
                      <AdSlotMockup slot={selectedPackage.slot} previewSrc={previewSrc} mediaType={mediaType} isEmpty={!adPreviewUrl} />
                    )}
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
                      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info bar */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">{slotName}</span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">{slotSize}</span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">{selectedPackage.durationDays} hari</span>
            <span className="px-2.5 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-red">{formatRupiah(selectedPackage.price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdSlotMockup({ slot, previewSrc, mediaType, isEmpty }: {
  slot: string; previewSrc: string | null; mediaType: 'image' | 'video'; isEmpty: boolean;
}) {
  const dimensions: Record<string, { h: string; label: string }> = {
    HOME_TOP: { h: 'h-12 sm:h-20 md:h-32', label: '970×250 / 728×100 / 320×100' },
    HOME_FEED_1: { h: 'h-20 md:h-36', label: '300×250' },
    HOME_FEED_2: { h: 'h-20 md:h-36', label: '300×250' },
    ARTICLE_TOP: { h: 'h-12 md:h-16', label: '728×90 / 300×250' },
    ARTICLE_MIDDLE: { h: 'h-20 md:h-28', label: '300×250' },
    ARTICLE_BOTTOM: { h: 'h-8 md:h-16', label: '970×90 / 320×50' },
  };
  const dim = dimensions[slot] || dimensions.HOME_TOP;

  return (
    <div className={cn(
      "relative w-full rounded-lg overflow-hidden border-2 border-dashed transition-all",
      dim.h,
      isEmpty ? 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]' : 'border-brand-red/30 bg-black shadow-lg shadow-brand-red/10'
    )}>
      {previewSrc ? (
        mediaType === 'video' ? (
          <video src={previewSrc} autoPlay loop muted playsInline className="w-full h-full object-contain" />
        ) : (
          <img src={previewSrc} alt="Preview" className="w-full h-full object-contain" />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="text-gray-300 dark:text-white/20 text-xs font-black uppercase tracking-wider">{dim.label}</div>
          <div className="text-gray-200 dark:text-white/10 text-[9px] uppercase tracking-wider">Upload materi iklan</div>
        </div>
      )}
    </div>
  );
}
