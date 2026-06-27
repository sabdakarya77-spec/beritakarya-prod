'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  BarChart3,
  MousePointerClick,
  Image as ImageIcon,
  Code as CodeIcon,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { api } from '../../../lib/api';
import type { Ad } from './types';
import type { AdSlotDefinition } from '../../../lib/constants';

interface AdSlotCardProps {
  slot: AdSlotDefinition;
  ads: Ad[];
  onRefresh: () => void;
}

export function AdSlotCard({ slot, ads, onRefresh }: AdSlotCardProps) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedVariants, setProcessedVariants] = useState<{
    desktop: { url: string; width: number; height: number } | null;
    tablet: { url: string; width: number; height: number } | null;
    mobile: { url: string; width: number; height: number } | null;
  } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primaryAd = ads[0]; // First active ad for this slot
  const isActive = primaryAd?.isActive ?? false;
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // Device coverage — semua slot tampil di semua device
  const isMobileVisible = true;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProcessing(true);
    setProcessedVariants(null);
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/media/upload-ad?slot=${slot.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const d = res.data.data;
        setProcessedVariants({
          desktop: d.desktop || null,
          tablet: d.tablet || null,
          mobile: d.mobile || null,
        });
        setWarnings(d.warnings || []);

        // Save to ad slot (create or update)
        if (primaryAd) {
          await api.patch(`/ads/${primaryAd.id}`, {
            imageUrl: d.desktop?.url || null,
            imageUrlTablet: d.tablet?.url || null,
            imageUrlMobile: d.mobile?.url || null,
          });
        } else {
          await api.post('/ads', {
            slot: slot.id,
            imageUrl: d.desktop?.url || null,
            imageUrlTablet: d.tablet?.url || null,
            imageUrlMobile: d.mobile?.url || null,
            isActive: true,
          });
        }
        onRefresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload gagal';
      setWarnings([msg]);
    } finally {
      setUploading(false);
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggle = async () => {
    if (!primaryAd) return;
    try {
      await api.patch(`/ads/${primaryAd.id}`, { isActive: !primaryAd.isActive });
      onRefresh();
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!primaryAd) return;
    if (!confirm(`Hapus iklan dari slot ${slot.name}?`)) return;
    try {
      await api.delete(`/ads/${primaryAd.id}`);
      setProcessedVariants(null);
      onRefresh();
    } catch { /* ignore */ }
  };

  const handleScriptMode = async () => {
    const code = prompt('Tempel kode script iklan (HTML/JS):');
    if (!code) return;
    try {
      if (primaryAd) {
        await api.patch(`/ads/${primaryAd.id}`, { code, imageUrl: null, linkUrl: null });
      } else {
        await api.post('/ads', { slot: slot.id, code, isActive: true });
      }
      onRefresh();
    } catch { /* ignore */ }
  };

  return (
    <div className="dash-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 dark:border-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
                {slot.name}
              </h3>
              <span className="text-[8px] font-black px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-400 rounded-full font-mono">
                {slot.publicSize || slot.size}
              </span>
              {isMobileVisible ? (
                <span className="text-[7px] font-black px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center gap-0.5">
                  <Monitor size={8} /> <Smartphone size={8} /> Desktop + Mobile
                </span>
              ) : (
                <span className="text-[7px] font-black px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-full flex items-center gap-0.5">
                  <Monitor size={8} /> Desktop Only
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">{slot.desc}</p>
          </div>
        </div>

        {/* Status badge */}
        <span className={cn(
          "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0",
          isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-100 dark:bg-white/5 text-gray-400"
        )}>
          {isActive ? '● AKTIF' : '○ KOSONG'}
        </span>
      </div>

      {/* Preview + Stats */}
      <div className="p-5">
        {/* Preview area */}
        <div className="relative aspect-[970/250] bg-gray-50 dark:bg-black/20 rounded-xl border-2 border-dashed border-gray-100 dark:border-white/5 overflow-hidden mb-4">
          {primaryAd?.code ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <CodeIcon size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-gray-400">Script HTML</p>
                <p className="text-[8px] text-gray-300 font-mono truncate max-w-[200px]">{primaryAd.code.slice(0, 60)}...</p>
              </div>
            </div>
          ) : primaryAd?.imageUrl ? (
            <img src={primaryAd.imageUrl} alt={slot.name} className="w-full h-full object-contain" />
          ) : processedVariants?.desktop ? (
            <div className="w-full h-full flex gap-1 p-2">
              {processedVariants.desktop && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <img src={processedVariants.desktop.url} alt="Desktop" className="max-h-full object-contain rounded" />
                  <span className="text-[7px] font-mono text-gray-400 mt-1">Desktop</span>
                </div>
              )}
              {processedVariants.tablet && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <img src={processedVariants.tablet.url} alt="Tablet" className="max-h-full object-contain rounded" />
                  <span className="text-[7px] font-mono text-gray-400 mt-1">Tablet</span>
                </div>
              )}
              {processedVariants.mobile && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <img src={processedVariants.mobile.url} alt="Mobile" className="max-h-full object-contain rounded" />
                  <span className="text-[7px] font-mono text-gray-400 mt-1">Mobile</span>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <ImageIcon size={28} className="text-gray-200 dark:text-white/10" />
              <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-wider">
                Belum Ada Iklan
              </p>
              <p className="text-[8px] text-gray-300 dark:text-gray-700">
                Upload 1 gambar, auto-generate semua ukuran
              </p>
            </div>
          )}

          {/* Processing overlay */}
          {processing && (
            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-10">
              <div className="text-center">
                <RefreshCw size={20} className="animate-spin text-brand-red mx-auto mb-2" />
                <p className="text-[10px] font-bold text-brand-black dark:text-white">Memproses...</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {primaryAd && (
          <div className="flex items-center gap-6 mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <BarChart3 size={12} className="text-gray-400" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Impresi</span>
              <span className="text-xs font-black text-brand-black dark:text-white">{totalImpressions.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MousePointerClick size={12} className="text-gray-400" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Klik</span>
              <span className="text-xs font-black text-brand-black dark:text-white">{totalClicks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">CTR</span>
              <span className="text-xs font-black text-emerald-600">{ctr}%</span>
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg mb-4">
            {warnings.map((w, i) => (
              <p key={i} className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle size={10} /> {w}
              </p>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              uploading
                ? "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                : "bg-brand-black dark:bg-white text-white dark:text-brand-black hover:opacity-90 shadow-lg"
            )}
          >
            {uploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? 'Memproses...' : 'Upload 1 File'}
          </button>

          {primaryAd && (
            <>
              <button
                onClick={handleToggle}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100"
                    : "bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-emerald-600"
                )}
                title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
              >
                {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={handleDelete}
                className="p-2.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                title="Hapus"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          <button
            onClick={handleScriptMode}
            className="p-2.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-brand-red transition-all"
            title="Script Mode"
          >
            <CodeIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
