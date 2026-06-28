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
  Plus,
  ChevronUp,
  ChevronDown,
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
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetAdId, setTargetAdId] = useState<string | null>(null);

  // Dynamic aspect ratio per slot
  const aspectRatioClass: Record<string, string> = {
    HOME_TOP: 'aspect-[960/240]',
    HOME_FEED_1: 'aspect-[300/200]',
    ARTICLE_TOP: 'aspect-[300/200]',
    HOME_FEED_2: 'aspect-[300/150]',
    ARTICLE_MIDDLE: 'aspect-[300/150]',
    ARTICLE_BOTTOM: 'aspect-[300/150]',
  };

  // Total stats
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // Add new ad to this slot
  const handleAdd = async () => {
    try {
      await api.post('/ads', { slot: slot.id, isActive: true });
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setWarnings([msg || 'Gagal menambah iklan']);
    }
  };

  // Upload file for specific ad
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, adId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(adId || 'new');
    setProcessing(true);
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/media/upload-ad?slot=${slot.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const d = res.data.data;
        if (adId) {
          await api.patch(`/ads/${adId}`, {
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
      setUploadingId(null);
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle ad active state
  const handleToggle = async (adId: string) => {
    const ad = ads.find(a => a.id === adId);
    if (!ad) return;
    try {
      await api.patch(`/ads/${adId}`, { isActive: !ad.isActive });
      onRefresh();
    } catch { /* ignore */ }
  };

  // Delete ad
  const handleDelete = async (adId: string) => {
    if (!confirm(`Hapus iklan dari slot ${slot.name}?`)) return;
    try {
      await api.delete(`/ads/${adId}`);
      onRefresh();
    } catch { /* ignore */ }
  };

  // Reorder ads
  const handleReorder = async (direction: 'up' | 'down', index: number) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ads.length) return;

    const items = [...ads];
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    const reorderPayload = items.map((item, idx) => ({ id: item.id, order: idx }));

    try {
      await api.patch('/ads/reorder', { items: reorderPayload });
      onRefresh();
    } catch { /* ignore */ }
  };

  // Script mode
  const handleScriptMode = async (adId?: string) => {
    const code = prompt('Tempel kode script iklan (HTML/JS):');
    if (!code) return;
    try {
      if (adId) {
        await api.patch(`/ads/${adId}`, { code, imageUrl: null, linkUrl: null });
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
              <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full",
                slot.tier === 'PREMIUM' ? 'bg-amber-500/10 text-amber-600' :
                slot.tier === 'TINGGI' ? 'bg-blue-500/10 text-blue-600' :
                slot.tier === 'MENENGAH' ? 'bg-gray-100 dark:bg-white/10 text-gray-500' :
                'bg-gray-50 dark:bg-white/5 text-gray-400'
              )}>
                {slot.tier}
              </span>
              <span className="text-[8px] font-black px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-400 rounded-full font-mono">
                {slot.publicSize || slot.size}
              </span>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                {slot.format === 'VIDEO' ? '🎥 Video' : '🖼️ Banner'}
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 bg-brand-red/10 text-brand-red rounded-full">
                {ads.length} Iklan
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">{slot.desc}</p>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-brand-red text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-brand-red/10 hover:opacity-90 transition-all"
        >
          <Plus size={12} /> Tambah
        </button>
      </div>

      {/* Stats Summary */}
      {ads.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-50 dark:border-white/5 flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <BarChart3 size={12} className="text-gray-400" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Impresi</span>
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
        <div className="mx-5 mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
          {warnings.map((w, i) => (
            <p key={i} className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <AlertCircle size={10} /> {w}
            </p>
          ))}
        </div>
      )}

      {/* Ad List */}
      {ads.length === 0 ? (
        <div className="p-6 text-center">
          <ImageIcon size={28} className="text-gray-200 dark:text-white/10 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-wider">
            Belum Ada Iklan
          </p>
          <p className="text-[8px] text-gray-300 dark:text-gray-700 mt-1">
            Klik &quot;Tambah&quot; untuk menambah iklan ke slot ini
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-white/5">
          {ads.map((ad, index) => (
            <div key={ad.id} className="p-4 flex items-start gap-3">
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleReorder('up', index)}
                  disabled={index === 0}
                  className={cn("p-1 rounded transition-all", index === 0 ? 'text-gray-200 dark:text-white/10' : 'text-gray-400 hover:text-brand-black dark:hover:text-white')}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => handleReorder('down', index)}
                  disabled={index === ads.length - 1}
                  className={cn("p-1 rounded transition-all", index === ads.length - 1 ? 'text-gray-200 dark:text-white/10' : 'text-gray-400 hover:text-brand-black dark:hover:text-white')}
                >
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Preview */}
              <div className={cn("w-24 flex-shrink-0 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-100 dark:border-white/5 overflow-hidden", aspectRatioClass[slot.id] || 'aspect-[300/200]')}>
                {ad.code ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <CodeIcon size={16} className="text-gray-300" />
                  </div>
                ) : ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={slot.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={16} className="text-gray-200 dark:text-white/10" />
                  </div>
                )}
              </div>

              {/* Info & Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                    ad.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-100 dark:bg-white/5 text-gray-400"
                  )}>
                    {ad.isActive ? '● AKTIF' : '○ NONAKTIF'}
                  </span>
                  <span className="text-[8px] font-mono text-gray-400">
                    #{index + 1}
                  </span>
                </div>

                {/* Mini stats */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[8px] text-gray-400">
                    <span className="font-bold">{(ad.impressions || 0).toLocaleString()}</span> imp
                  </span>
                  <span className="text-[8px] text-gray-400">
                    <span className="font-bold">{(ad.clicks || 0).toLocaleString()}</span> click
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <input
                    ref={targetAdId === ad.id ? fileInputRef : undefined}
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    onChange={(e) => handleUpload(e, ad.id)}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      setTargetAdId(ad.id);
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }}
                    disabled={uploadingId === ad.id}
                    className="px-2 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-brand-black dark:hover:text-white rounded text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                  >
                    {uploadingId === ad.id ? <RefreshCw size={10} className="animate-spin" /> : <Upload size={10} />}
                    Upload
                  </button>
                  <button
                    onClick={() => handleToggle(ad.id)}
                    className={cn(
                      "p-1.5 rounded transition-all",
                      ad.isActive
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                        : "bg-gray-100 dark:bg-white/5 text-gray-400"
                    )}
                    title={ad.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {ad.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="p-1.5 rounded bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-red-500 transition-all"
                    title="Hapus"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button
                    onClick={() => handleScriptMode(ad.id)}
                    className="p-1.5 rounded bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-brand-red transition-all"
                    title="Script Mode"
                  >
                    <CodeIcon size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
  );
}
