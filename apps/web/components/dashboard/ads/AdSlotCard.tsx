'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Code as CodeIcon,
  Save,
  AlertCircle,
  ExternalLink,
  Upload,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Ad } from './types';
import type { AdSlotDefinition } from '../../../lib/constants';

export function AdSlotCard({ slot, data, onSave, onUpload, isSaving }: { slot: AdSlotDefinition, data: Ad | undefined, onSave: (p: Partial<Ad>) => void, onUpload: (file: File, slotId?: string) => Promise<string>, isSaving: boolean }) {
  const [mode, setMode] = useState<'image' | 'script'>(data?.imageUrl ? 'image' : 'script');
  const [imageUrl, setImageUrl] = useState(data?.imageUrl || '');
  const [linkUrl, setLinkUrl] = useState(data?.linkUrl || '');
  const [code, setCode] = useState(data?.code || '');
  const [isActive, setIsActive] = useState(data ? data.isActive : true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when data prop changes (e.g. after refetch)
  useEffect(() => {
    setMode(data?.imageUrl ? 'image' : 'script');
    setImageUrl(data?.imageUrl || '');
    setLinkUrl(data?.linkUrl || '');
    setCode(data?.code || '');
    setIsActive(data ? data.isActive : true);
  }, [data]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file, slot.id);
      if (url) setImageUrl(url);
    } catch {
      // User cancelled crop or upload failed
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hasChanges =
    imageUrl !== (data?.imageUrl || '') ||
    linkUrl !== (data?.linkUrl || '') ||
    code !== (data?.code || '') ||
    isActive !== (data ? data.isActive : true);

  const handleSave = () => {
    if (mode === 'image') {
      onSave({ imageUrl, linkUrl, code: null, isActive });
    } else {
      onSave({ code, imageUrl: null, linkUrl: null, isActive });
    }
  };

  return (
    <div className="dash-card overflow-hidden group">
      {/* Card Header with Status Toggle */}
      <div className="p-6 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">{slot.name}</h3>
            <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-400 rounded-full font-mono">{slot.size}</span>
            {(() => {
              const templateMap: Record<string, string> = {
                leaderboard: '/templates/leaderboard-970x250.svg',
                rectangle: '/templates/rectangle-300x250.svg',
                rectangle_secondary: '/templates/rectangle-300x250.svg',
                in_feed: '/templates/rectangle-300x250.svg',
              };
              const href = templateMap[slot.id];
              return href ? (
                <a href={href} download className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-brand-red/5 text-brand-red border border-brand-red/10 hover:bg-brand-red/10 transition-colors">
                  📐 Template
                </a>
              ) : null;
            })()}
            {slot.placementPages?.map(page => (
              <span
                key={page}
                className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {page === 'homepage' ? '🏠 Homepage' : '📄 Artikel'}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-gray-400">{slot.desc}</p>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest",
            isActive ? "text-emerald-500" : "text-gray-400"
          )}>
            {isActive ? 'Aktif' : 'Nonaktif'}
          </span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "w-10 h-5 rounded-full transition-all relative",
              isActive ? "bg-emerald-500" : "bg-gray-200 dark:bg-white/10"
            )}
          >
            <div className={cn(
              "w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm",
              isActive ? "left-6" : "left-1"
            )} />
          </button>
        </div>
      </div>

      {/* Analytics Mini Tracker (Only shown if data exists) */}
      {data && (
        <div className="px-6 py-4 bg-emerald-50/30 dark:bg-emerald-950/10 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-emerald-100/30 dark:border-emerald-900/10 gap-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <BarChart3 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Laporan Kinerja Spanduk Regional</span>
          </div>
          <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end font-mono">
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Impresi</p>
              <p className="text-sm font-black text-brand-black dark:text-white">{(data.impressions || 0).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Klik</p>
              <p className="text-sm font-black text-brand-black dark:text-white">{(data.clicks || 0).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">CTR</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {data.impressions ? ((data.clicks || 0) / data.impressions * 100).toFixed(2) : '0.00'}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex bg-gray-50/50 dark:bg-black/10 p-1 m-4 rounded-xl border border-gray-100 dark:border-white/5">
        <button
          onClick={() => setMode('image')}
          className={cn(
            "flex-1 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
            mode === 'image' ? "bg-white dark:bg-slate-800 text-brand-red shadow-sm" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <ImageIcon size={14} /> Banner Gambar
        </button>
        <button
          onClick={() => setMode('script')}
          className={cn(
            "flex-1 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
            mode === 'script' ? "bg-white dark:bg-slate-800 text-brand-red shadow-sm" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <CodeIcon size={14} /> Script Iklan (Advanced)
        </button>
      </div>

      <div className="p-6 pt-2">
        {mode === 'image' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="dash-label mb-2 block">Upload Banner / URL Gambar</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... (PNG/JPG/WebP)"
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                    />
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500 hover:text-brand-red transition-all disabled:opacity-50"
                    >
                      {uploading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="dash-label mb-2 block">Link Tujuan (Saat Diklik)</label>
                  <div className="relative">
                    <ExternalLink size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://website-klien.com"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Area */}
              <div className="space-y-2">
                <label className="dash-label">Live Preview Banner / Video</label>
                <div className="aspect-[4/1] bg-gray-50 dark:bg-black/20 rounded-xl border-2 border-dashed border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden relative group">
                  {imageUrl ? (
                    imageUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i) || imageUrl.toLowerCase().includes('video') ? (
                      <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                    ) : (
                      <img src={imageUrl} alt="Ad Preview" className="w-full h-full object-contain" />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <ImageIcon size={24} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Preview Materi</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="dash-label flex items-center gap-2">
              <CodeIcon size={12} className="text-brand-red" /> Kode Script (AdSense / Script Pihak Ke-3)
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={6}
              placeholder="<!-- Tempel kode script iklan di sini -->"
              className="w-full p-6 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl outline-none border border-slate-900 focus:border-brand-red transition-all shadow-inner"
            />
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/10 rounded-xl flex items-start gap-3">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-relaxed font-bold uppercase tracking-wider">
                Perhatian: Kesalahan penulisan kode script dapat menyebabkan tampilan website berantakan. Pastikan Anda hanya menyalin kode dari sumber resmi.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex justify-end items-center gap-4 border-t border-gray-50 dark:border-white/5 pt-6">
        {hasChanges && !isSaving && (
          <span className="text-[10px] font-bold text-brand-red animate-pulse italic">Ada perubahan belum disimpan...</span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={cn(
            "px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
            hasChanges
              ? "bg-brand-black dark:bg-white text-white dark:text-brand-black shadow-xl hover:opacity-90"
              : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
          )}
        >
          {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}
