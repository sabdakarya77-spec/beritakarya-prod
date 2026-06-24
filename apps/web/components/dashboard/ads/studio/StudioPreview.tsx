'use client';

import { Monitor, Smartphone, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { getAdSlotDefinition } from '../../../../lib/constants';
import type { StudioData } from './types';

interface StudioPreviewProps {
  data: StudioData;
  site: string;
  submitting: boolean;
  isSuccess: boolean;
}

export function StudioPreview({ data, site, submitting, isSuccess }: StudioPreviewProps) {
  const { selectedPackage, adPreviewUrl, mediaType } = data;
  const slotDef = selectedPackage ? getAdSlotDefinition(selectedPackage.slot) : null;
  const slotName = slotDef?.name || 'Slot Iklan';
  const slotSize = slotDef?.publicSize || 'Responsive';

  const formatRupiah = (val: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

  // Success state
  if (isSuccess) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Pesanan Terkirim!</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Materi iklan dan bukti pembayaran telah diunggah. Menunggu verifikasi Superadmin (5-15 menit).
          </p>
        </div>
      </div>
    );
  }

  // Determine which preview image to show
  const previewSrc = adPreviewUrl || null;
  const isLeaderboard = selectedPackage?.slot === 'leaderboard';

  return (
    <div className="h-full flex flex-col">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-gray-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preview</span>
        </div>
        {selectedPackage && (
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
            data.adFile
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-gray-100 dark:bg-white/5 text-gray-400'
          )}>
            {data.adFile ? 'Siap' : 'Draft'}
          </span>
        )}
      </div>

      {/* Mockup Browser */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {!selectedPackage ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto">
                <Monitor size={20} className="text-gray-300" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pilih paket untuk melihat preview</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Browser Frame */}
            <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                </div>
                <div className="flex-1 mx-2">
                  <div className="bg-gray-100 dark:bg-white/5 rounded px-2.5 py-1 text-[9px] text-gray-400 font-mono">
                    🌐 beritakarya.co/{site}
                  </div>
                </div>
              </div>

              {/* Page Content Mockup */}
              <div className="relative">
                {/* Leaderboard slot — top of page */}
                {isLeaderboard && (
                  <div className="p-3 bg-gray-50 dark:bg-white/[0.02]">
                    <AdSlotMockup
                      slot="leaderboard"
                      previewSrc={previewSrc}
                      mediaType={mediaType}
                      isEmpty={!adPreviewUrl}
                    />
                  </div>
                )}

                {/* Fake page content */}
                <div className="p-4 space-y-3">
                  {/* Header mockup */}
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                    <div className="w-6 h-6 bg-brand-red rounded text-white text-[7px] font-black flex items-center justify-center">BK</div>
                    <div className="flex-1 flex gap-3">
                      {['Beranda', 'Nasional', 'Daerah', 'Ekonomi'].map(t => (
                        <div key={t} className="h-2 bg-gray-200 dark:bg-white/10 rounded-full w-12" />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {/* Main content area */}
                    <div className="flex-1 space-y-3">
                      {/* Headline mockup */}
                      <div className="space-y-1.5">
                        <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
                      </div>

                      {/* In-Feed slot */}
                      {selectedPackage?.slot === 'in_feed' && (
                        <AdSlotMockup
                          slot="in_feed"
                          previewSrc={previewSrc}
                          mediaType={mediaType}
                          isEmpty={!adPreviewUrl}
                        />
                      )}

                      {/* More content mockup */}
                      <div className="space-y-1.5">
                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-4/5" />
                      </div>
                    </div>

                    {/* Sidebar — rectangle slots */}
                    {(selectedPackage?.slot === 'rectangle' || selectedPackage?.slot === 'rectangle_secondary') && (
                      <div className="w-36 flex-shrink-0 space-y-3">
                        <AdSlotMockup
                          slot={selectedPackage.slot}
                          previewSrc={previewSrc}
                          mediaType={mediaType}
                          isEmpty={!adPreviewUrl}
                        />
                        {/* Fake sidebar content */}
                        <div className="space-y-1.5">
                          <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                          <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
                        </div>
                      </div>
                    )}

                    {/* Default sidebar if not rectangle */}
                    {selectedPackage?.slot !== 'rectangle' && selectedPackage?.slot !== 'rectangle_secondary' && (
                      <div className="w-36 flex-shrink-0 space-y-2 hidden md:block">
                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Bar */}
            <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">
              <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded">{slotName}</span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded">{slotSize}</span>
              {selectedPackage && (
                <>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded">{selectedPackage.durationDays} hari</span>
                  <span className="px-2 py-1 bg-brand-red/10 text-brand-red rounded font-black">{formatRupiah(selectedPackage.price)}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Ad Slot Mockup Component
function AdSlotMockup({
  slot,
  previewSrc,
  mediaType,
  isEmpty,
}: {
  slot: string;
  previewSrc: string | null;
  mediaType: 'image' | 'video';
  isEmpty: boolean;
}) {
  const dimensions: Record<string, { w: string; h: string; label: string }> = {
    leaderboard: { w: 'w-full', h: 'h-20 md:h-28', label: '970 × 250' },
    rectangle: { w: 'w-full', h: 'h-32', label: '300 × 250' },
    rectangle_secondary: { w: 'w-full', h: 'h-32', label: '300 × 250' },
    in_feed: { w: 'w-full', h: 'h-24', label: '300 × 250' },
  };

  const dim = dimensions[slot] || dimensions.rectangle;

  return (
    <div className={cn(
      "relative rounded overflow-hidden border-2 border-dashed transition-colors",
      dim.w, dim.h,
      isEmpty
        ? 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]'
        : 'border-brand-red/30 bg-black'
    )}>
      {previewSrc ? (
        mediaType === 'video' ? (
          <video
            src={previewSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={previewSrc}
            alt="Preview iklan"
            className="w-full h-full object-contain"
          />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="text-gray-300 dark:text-white/20 text-[10px] font-black uppercase tracking-wider">
            {dim.label}
          </div>
          <div className="text-gray-300 dark:text-white/10 text-[8px] uppercase tracking-wider">
            Upload materi iklan
          </div>
        </div>
      )}
    </div>
  );
}
