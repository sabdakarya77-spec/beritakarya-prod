'use client';

import { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Code as CodeIcon,
  Save,
  Trash2,
  RefreshCw,
  Upload,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Ad } from './types';

export function HeroBannerRow({
  ad,
  index,
  total,
  onUpdate,
  onDelete,
  onReorder,
  onUpload,
  isSaving
}: {
  ad: Ad;
  index: number;
  total: number;
  onUpdate: (id: string, payload: Partial<Ad>) => void;
  onDelete: (id: string) => void;
  onReorder: (slotId: string, direction: 'up' | 'down', index: number) => void;
  onUpload: (file: File, slotId?: string) => Promise<string>;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState(ad.imageUrl || '');
  const [linkUrl, setLinkUrl] = useState(ad.linkUrl || '');
  const [code, setCode] = useState(ad.code || '');
  const [mode, setMode] = useState<'image' | 'script'>(ad.imageUrl ? 'image' : 'script');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file, ad.slot);
      if (url) setImageUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload gagal';
      alert(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (mode === 'image') {
      onUpdate(ad.id, { imageUrl, linkUrl, code: null, isActive: ad.isActive });
    } else {
      onUpdate(ad.id, { code, imageUrl: null, linkUrl: null, isActive: ad.isActive });
    }
    setEditing(false);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-4">
        {/* Order controls */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onReorder('HOME_TOP', 'up', index)}
            disabled={index === 0}
            className={cn("p-1 rounded text-gray-400 hover:text-brand-red transition-colors", index === 0 && "opacity-30 cursor-not-allowed")}
          >
            <ArrowRight size={12} className="-rotate-90" />
          </button>
          <span className="text-[9px] font-mono text-gray-400 text-center">{index + 1}</span>
          <button
            onClick={() => onReorder('HOME_TOP', 'down', index)}
            disabled={index === total - 1}
            className={cn("p-1 rounded text-gray-400 hover:text-brand-red transition-colors", index === total - 1 && "opacity-30 cursor-not-allowed")}
          >
            <ArrowRight size={12} className="rotate-90" />
          </button>
        </div>

        {/* Thumbnail preview */}
        <div className="w-32 h-16 md:w-48 md:h-20 rounded-lg overflow-hidden bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex-shrink-0">
          {ad.imageUrl ? (
            ad.imageUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video src={ad.imageUrl} muted className="w-full h-full object-cover" />
            ) : (
              <img src={ad.imageUrl} alt="Banner" className="w-full h-full object-cover" />
            )
          ) : ad.code ? (
            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400 font-mono">SCRIPT</div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">KOSONG</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider", ad.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-200 text-gray-400")}>
              {ad.isActive ? 'AKTIF' : 'NONAKTIF'}
            </span>
            <span className="text-[9px] font-mono text-gray-400">#{index + 1}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 truncate">
            {ad.imageUrl ? ad.imageUrl : ad.code ? 'Script HTML' : 'Belum diatur'}
          </p>
          {ad.impressions !== undefined && (
            <div className="flex gap-4 mt-1 text-[9px] font-mono text-gray-400">
              <span>Imp: {(ad.impressions || 0).toLocaleString()}</span>
              <span>Click: {(ad.clicks || 0).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle active */}
          <button
            onClick={() => onUpdate(ad.id, { isActive: !ad.isActive })}
            className={cn("w-10 h-5 rounded-full transition-all relative", ad.isActive ? "bg-emerald-500" : "bg-gray-200 dark:bg-white/10")}
          >
            <div className={cn("w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm", ad.isActive ? "left-6" : "left-1")} />
          </button>

          <button
            onClick={() => setEditing(!editing)}
            className="p-2 bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-brand-red rounded-lg transition-colors"
          >
            {editing ? <XCircle size={14} /> : <ImageIcon size={14} />}
          </button>

          <button
            onClick={() => onDelete(ad.id)}
            className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Edit form (expandable) */}
      {editing && (
        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 space-y-4 animate-fade-in">
          {/* Mode switcher */}
          <div className="flex bg-gray-50/50 dark:bg-black/10 p-1 rounded-xl border border-gray-100 dark:border-white/5">
            <button
              onClick={() => setMode('image')}
              className={cn("flex-1 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", mode === 'image' ? "bg-white dark:bg-slate-800 text-brand-red shadow-sm" : "text-gray-400")}
            >
              <ImageIcon size={14} /> Banner Gambar
            </button>
            <button
              onClick={() => setMode('script')}
              className={cn("flex-1 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", mode === 'script' ? "bg-white dark:bg-slate-800 text-brand-red shadow-sm" : "text-gray-400")}
            >
              <CodeIcon size={14} /> Script Iklan
            </button>
          </div>

          {mode === 'image' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="dash-label mb-1 block">Upload Banner / URL Gambar</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... (WebP/JPG/PNG)"
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                    />
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500 hover:text-brand-red transition-all disabled:opacity-50"
                    >
                      {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="dash-label mb-1 block">Link Tujuan</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://website-klien.com"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                  />
                </div>
              </div>
              <div className="aspect-[4/1] bg-gray-50 dark:bg-black/20 rounded-xl border border-dashed border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[9px] text-gray-400">Preview</span>
                )}
              </div>
            </div>
          ) : (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={4}
              placeholder="<!-- Tempel kode script iklan -->"
              className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl outline-none border border-slate-900 focus:border-brand-red transition-all"
            />
          )}

          <div className="flex justify-end gap-3">
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">Batal</button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-brand-black dark:bg-white text-white dark:text-brand-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
            >
              {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
