'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Palette, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { api } from '../../../../lib/api';

interface PreviewItem {
  slot: string;
  variant?: string;
  url: string;
  width: number;
  height: number;
  method: 'palette_gradient' | 'smart_crop';
  dominantColor: string;
}

interface AdSmartPreviewProps {
  file: File | null;
  previewUrl: string; // local blob URL for fallback
  mediaType: 'image' | 'video';
}

const SLOT_LABELS: Record<string, string> = {
  HOME_TOP: 'Hero Banner',
  HOME_TOP_desktop: 'Desktop',
  HOME_TOP_tablet: 'Tablet',
  HOME_TOP_mobile: 'Mobile',
  HOME_FEED_1: 'Feed Atas',
  HOME_FEED_1_desktop: 'Desktop',
  HOME_FEED_1_tablet: 'Tablet',
  HOME_FEED_1_mobile: 'Mobile',
  HOME_FEED_2: 'Feed Bawah',
  HOME_FEED_2_desktop: 'Desktop',
  HOME_FEED_2_tablet: 'Tablet',
  HOME_FEED_2_mobile: 'Mobile',
  ARTICLE_TOP: 'Artikel Atas',
  ARTICLE_TOP_desktop: 'Desktop',
  ARTICLE_TOP_tablet: 'Tablet',
  ARTICLE_TOP_mobile: 'Mobile',
  ARTICLE_MIDDLE: 'Artikel Tengah',
  ARTICLE_MIDDLE_desktop: 'Desktop',
  ARTICLE_MIDDLE_tablet: 'Tablet',
  ARTICLE_MIDDLE_mobile: 'Mobile',
  ARTICLE_BOTTOM: 'Artikel Bawah',
  ARTICLE_BOTTOM_desktop: 'Desktop',
  ARTICLE_BOTTOM_tablet: 'Tablet',
  ARTICLE_BOTTOM_mobile: 'Mobile',
};

const SLOT_SIZES: Record<string, string> = {
  HOME_TOP_desktop: '970×250',
  HOME_TOP_tablet: '728×100',
  HOME_TOP_mobile: '320×100',
  HOME_FEED_1_desktop: '300×250',
  HOME_FEED_1_tablet: '300×250',
  HOME_FEED_1_mobile: '300×250',
  HOME_FEED_2_desktop: '300×250',
  HOME_FEED_2_tablet: '300×250',
  HOME_FEED_2_mobile: '300×250',
  ARTICLE_TOP_desktop: '300×250',
  ARTICLE_TOP_tablet: '300×250',
  ARTICLE_TOP_mobile: '300×250',
  ARTICLE_MIDDLE_desktop: '300×250',
  ARTICLE_MIDDLE_tablet: '300×250',
  ARTICLE_MIDDLE_mobile: '300×250',
  ARTICLE_BOTTOM_desktop: '300×250',
  ARTICLE_BOTTOM_tablet: '300×250',
  ARTICLE_BOTTOM_mobile: '300×250',
};

export function AdSmartPreview({ file, previewUrl: _previewUrl, mediaType }: AdSmartPreviewProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const fetchPreviews = useCallback(async () => {
    if (!file || mediaType !== 'image') {
      setPreviews([]);
      return;
    }

    setLoading(true);
    setError('');
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/media/ad-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setPreviews(res.data.data.previews || []);
        setWarnings(res.data.data.warnings || []);
        // Auto-select first preview
        if (res.data.data.previews?.length > 0) {
          setSelectedPreview(res.data.data.previews[0].slot + (res.data.data.previews[0].variant || ''));
        }
      } else {
        setError('Gagal memuat preview');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat preview';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [file, mediaType]);

  useEffect(() => {
    if (file && mediaType === 'image') {
      fetchPreviews();
    } else {
      setPreviews([]);
    }
  }, [file, mediaType, fetchPreviews]);

  // Don't render anything for video
  if (mediaType === 'video') return null;

  // No file uploaded yet
  if (!file) return null;

  return (
    <div className="pt-4 border-t border-gray-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Palette size={12} className="text-brand-red" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
            Smart Preview
          </span>
        </div>
        {previews.length > 0 && (
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-600">
            {previews.length} slot
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-gray-200 dark:border-white/10">
          <Loader2 size={16} className="animate-spin text-brand-red" />
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Memproses gambar...
          </span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} className="text-red-500" />
            <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">{error}</span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && !loading && (
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl mb-3">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle size={10} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-[9px] text-amber-700 dark:text-amber-400">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preview Grid */}
      {previews.length > 0 && !loading && (
        <div className="space-y-3">
          {/* Dominant Color */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Warna Dominan:</span>
            <div
              className="w-4 h-4 rounded-full border border-gray-200 dark:border-white/10 shadow-sm"
              style={{ backgroundColor: previews[0]?.dominantColor || '#ccc' }}
            />
            <span className="text-[9px] font-mono text-gray-400">{previews[0]?.dominantColor}</span>
          </div>

          {/* Group by slot */}
          {previews.some(p => p.slot === 'HOME_TOP') && (
            <PreviewGroup
              title="Hero Banner"
              previews={previews.filter(p => p.slot === 'HOME_TOP')}
              selectedKey={selectedPreview}
              onSelect={setSelectedPreview}
            />
          )}

          {previews.some(p => p.slot === 'HOME_FEED_1') && (
            <PreviewGroup
              title="Feed Atas"
              previews={previews.filter(p => p.slot === 'HOME_FEED_1')}
              selectedKey={selectedPreview}
              onSelect={setSelectedPreview}
            />
          )}

          {previews.some(p => p.slot === 'HOME_FEED_2') && (
            <PreviewGroup
              title="Feed Bawah"
              previews={previews.filter(p => p.slot === 'HOME_FEED_2')}
              selectedKey={selectedPreview}
              onSelect={setSelectedPreview}
            />
          )}

          {previews.some(p => p.slot === 'ARTICLE_TOP') && (
            <PreviewGroup
              title="Artikel Atas"
              previews={previews.filter(p => p.slot === 'ARTICLE_TOP')}
              selectedKey={selectedPreview}
              onSelect={setSelectedPreview}
            />
          )}

          {previews.some(p => p.slot === 'ARTICLE_MIDDLE') && (
            <PreviewGroup
              title="Artikel Tengah"
              previews={previews.filter(p => p.slot === 'ARTICLE_MIDDLE')}
              selectedKey={selectedPreview}
              onSelect={setSelectedPreview}
            />
          )}

          {previews.some(p => p.slot === 'ARTICLE_BOTTOM') && (
            <PreviewGroup
              title="Artikel Bawah"
              previews={previews.filter(p => p.slot === 'ARTICLE_BOTTOM')}
              selectedKey={selectedPreview}
              onSelect={setSelectedPreview}
            />
          )}

          {/* Detail View */}
          {selectedPreview && (() => {
            const p = previews.find(pr => (pr.slot + (pr.variant || '')) === selectedPreview);
            if (!p) return null;
            return (
              <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-brand-black dark:text-white">
                      {SLOT_LABELS[p.slot + (p.variant ? `_${p.variant}` : '')] || SLOT_LABELS[p.slot] || p.slot}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-gray-400">{p.width}×{p.height}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider",
                      p.method === 'palette_gradient'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-emerald-500/10 text-emerald-600'
                    )}>
                      {p.method === 'palette_gradient' ? 'Gradient' : 'Crop'}
                    </span>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5">
                  <img
                    src={p.url}
                    alt={`Preview ${p.slot}`}
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
            <span className="text-blue-500 text-sm">✨</span>
            <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
              Gambar Anda akan otomatis di-resize dengan background gradient dari warna brand. Tidak perlu menyiapkan ukuran manual.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview Group ───────────────────────────────────────────────────────────

function PreviewGroup({
  title,
  previews,
  selectedKey,
  onSelect,
}: {
  title: string;
  previews: PreviewItem[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div>
      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
        {title}
      </span>
      <div className="grid grid-cols-3 gap-2">
        {previews.map((p) => {
          const key = p.slot + (p.variant || '');
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "relative rounded-lg overflow-hidden border-2 transition-all text-left",
                isSelected
                  ? 'border-brand-red shadow-md shadow-brand-red/10'
                  : 'border-gray-200 dark:border-white/10 hover:border-brand-red/30'
              )}
            >
              <div className="aspect-[4/3] bg-gray-50 dark:bg-white/[0.02]">
                <img
                  src={p.url}
                  alt={SLOT_LABELS[p.slot + (p.variant ? `_${p.variant}` : '')] || p.slot}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="px-1.5 py-1 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5">
                <span className="text-[7px] font-bold text-gray-500 uppercase tracking-wider block">
                  {SLOT_LABELS[p.variant ? `${p.slot}_${p.variant}` : p.slot] || p.variant || p.slot}
                </span>
                <span className="text-[7px] font-mono text-gray-300 dark:text-gray-600">
                  {SLOT_SIZES[p.variant ? `${p.slot}_${p.variant}` : p.slot] || `${p.width}×${p.height}`}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 size={12} className="text-brand-red drop-shadow-sm" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
