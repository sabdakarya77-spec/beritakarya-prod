'use client';

import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  CheckCircle2,
  Star,
  ExternalLink,
  ChevronDown,
  Zap,
  DollarSign,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { api } from '../../../../lib/api';
import { useToastStore } from '../../../../store/toastStore';
import type { AdBooking } from '../types';

interface ProviderInfo {
  id: string;
  name: string;
  tier: 'budget' | 'standard' | 'premium';
  costPerSecond: number;
  costEstimate10s: string;
  costEstimate15s: string;
  available: boolean;
}

interface Props {
  booking: AdBooking;
  site: string;
  isProcessing: boolean;
  setProcessingId: (id: string | null) => void;
  onRefresh: () => void;
}

const PROVIDER_BADGES: Record<string, { label: string; color: string }> = {
  seedance: { label: '⭐ Recommended', color: 'bg-amber-500/10 text-amber-600' },
  kling: { label: 'Alternatif', color: 'bg-blue-500/10 text-blue-600' },
  hailuo: { label: '💰 Budget', color: 'bg-emerald-500/10 text-emerald-600' },
  pika: { label: 'Alternatif', color: 'bg-violet-500/10 text-violet-600' },
  luma: { label: 'Alternatif', color: 'bg-cyan-500/10 text-cyan-600' },
  runway: { label: '💎 Premium', color: 'bg-rose-500/10 text-rose-600' },
};

export function ProductionCard({ booking, site, isProcessing, setProcessingId, onRefresh }: Props) {
  const { addToast } = useToastStore();
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [selectedProvider, setSelectedProvider] = useState<string>('seedance');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const startDate = new Date(booking.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const endDate = new Date(booking.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Fetch available providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await api.get('/ads/production/providers');
        if (res.data?.success) {
          setProviders(res.data.data);
        }
      } catch { /* ignore */ }
    };
    fetchProviders();
  }, []);

  const currentProvider = providers.find(p => p.id === selectedProvider);

  // Generate video with AI
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast('Masukkan prompt untuk generate video', 'error');
      return;
    }

    setProcessingId(booking.id);
    try {
      const res = await api.post(`/ads/production/${booking.id}/generate`, {
        prompt: prompt.trim(),
        provider: selectedProvider,
      });

      if (res.data?.success && res.data?.data?.videoUrl) {
        setVideoUrl(res.data.data.videoUrl);
        setShowPreview(true);
        addToast('Video berhasil di-generate!', 'success');
      } else {
        addToast(res.data?.message || 'Gagal generate video', 'error');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal generate video';
      addToast(msg, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Publish video to HOME_TOP slot
  const handlePublish = async () => {
    if (!videoUrl) return;

    setProcessingId(booking.id);
    try {
      const res = await api.post(`/ads/production/${booking.id}/publish`, {
        videoUrl,
        prompt,
        rating,
      });

      if (res.data?.success) {
        addToast('Video berhasil tayang di HOME TOP!', 'success');
        onRefresh();
      } else {
        addToast(res.data?.message || 'Gagal publish video', 'error');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal publish video';
      addToast(msg, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="dash-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 dark:border-white/5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-black text-brand-black dark:text-white">
              {booking.campaignName || 'Tanpa Nama Kampanye'}
            </h3>
            <span className="text-[8px] font-black px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full uppercase">
              HOME TOP
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>Pengiklan: <strong className="text-brand-black dark:text-white">{booking.user?.name || '-'}</strong></span>
            <span>•</span>
            <span>{startDate} — {endDate}</span>
          </div>
        </div>
        <span className="text-[9px] font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-full uppercase">
          ACTIVE
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Uploaded Files */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">
            File dari Pengiklan
          </label>
          <div className="flex gap-3">
            {/* Logo */}
            <div className="w-32 h-32 bg-gray-50 dark:bg-white/[0.03] border border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center overflow-hidden">
              {booking.logoUrl ? (
                <img src={booking.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <>
                  <ImageIcon size={20} className="text-gray-300 mb-1" />
                  <span className="text-[8px] text-gray-400 uppercase">Logo</span>
                </>
              )}
            </div>
            {/* Foto */}
            <div className="w-48 h-32 bg-gray-50 dark:bg-white/[0.03] border border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center overflow-hidden">
              {booking.fotoUrl ? (
                <img src={booking.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon size={20} className="text-gray-300 mb-1" />
                  <span className="text-[8px] text-gray-400 uppercase">Foto</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* AI Provider Selector */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
            AI Provider
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProviderDropdown(!showProviderDropdown)}
              className="w-full flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-left hover:border-brand-red/30 transition-all"
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-brand-red" />
                <span className="text-xs font-bold text-brand-black dark:text-white">
                  {providers.find(p => p.id === selectedProvider)?.name || 'Seedance'}
                </span>
                {currentProvider && (
                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full", PROVIDER_BADGES[selectedProvider]?.color)}>
                    {PROVIDER_BADGES[selectedProvider]?.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentProvider && (
                  <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                    <DollarSign size={10} />
                    {currentProvider.costEstimate10s}-{currentProvider.costEstimate15s}
                  </span>
                )}
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </button>

            {/* Dropdown */}
            {showProviderDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-20 overflow-hidden">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(p.id);
                      setShowProviderDropdown(false);
                    }}
                    disabled={!p.available}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 p-3 text-left transition-all",
                      p.available
                        ? "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        : "opacity-40 cursor-not-allowed",
                      selectedProvider === p.id && "bg-brand-red/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-black dark:text-white">{p.name}</span>
                      <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full", PROVIDER_BADGES[p.id]?.color)}>
                        {PROVIDER_BADGES[p.id]?.label}
                      </span>
                      {!p.available && (
                        <span className="text-[8px] text-red-400">No API Key</span>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-400">
                      {p.costEstimate10s}-{p.costEstimate15s}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
            Prompt Video
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: Slow zoom into product, warm lighting, professional food photography style, elegant restaurant setting..."
            className="w-full h-24 p-3 text-xs bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:border-brand-red/30 transition-all"
          />
          <p className="text-[9px] text-gray-400 mt-1">
            Deskripsikan gaya video yang diinginkan. Prompt yang baik menghasilkan video yang lebih baik.
          </p>
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !prompt.trim()}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              isProcessing || !prompt.trim()
                ? "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                : "bg-brand-red text-white shadow-lg shadow-brand-red/20 hover:opacity-90"
            )}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={14} />
                Produksi Video
              </>
            )}
          </button>

          {videoUrl && (
            <button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
          )}
        </div>

        {/* Video Preview */}
        {showPreview && videoUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Preview Video
              </label>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-bold text-brand-red uppercase tracking-widest flex items-center gap-1 hover:underline"
              >
                Buka di Tab Baru <ExternalLink size={10} />
              </a>
            </div>

            <div className="aspect-[960/240] bg-black rounded-xl overflow-hidden">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-contain"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Rating Hasil (opsional)
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star === rating ? 0 : star)}
                    className={cn(
                      "p-1 transition-all",
                      star <= rating ? "text-amber-500" : "text-gray-200 dark:text-white/10"
                    )}
                  >
                    <Star size={18} fill={star <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-[10px] text-gray-400 ml-2">{rating}/5</span>
                )}
              </div>
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={isProcessing}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                isProcessing
                  ? "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:opacity-90"
              )}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Tayangkan Video
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
