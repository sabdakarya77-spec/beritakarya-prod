'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Video,
  RefreshCw,
  Clock,
  Settings,
  X,
  Save,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { api } from '../../../../lib/api';
import { useToastStore } from '../../../../store/toastStore';
import type { AdBooking } from '../types';
import { ProductionCard } from './ProductionCard';

interface ProviderConfig {
  id: string;
  name: string;
  tier: string;
  available: boolean;
}

interface Props {
  site: string;
  bookings: AdBooking[];
  onRefresh: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  seedance: 'Seedance (Recommended)',
  kling: 'Kling',
  hailuo: 'Hailuo AI (Budget)',
  pika: 'Pika',
  luma: 'Luma Dream Machine',
  runway: 'Runway (Premium)',
};

export function VideoProductionPage({ site, bookings, onRefresh }: Props) {
  const { addToast } = useToastStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  // Fetch providers
  const fetchProviders = async () => {
    try {
      const res = await api.get('/ads/production/providers');
      if (res.data?.success) {
        setProviders(res.data.data);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Save API key
  const handleSaveKey = async (provider: string) => {
    const key = apiKeyInputs[provider];
    if (!key?.trim()) {
      addToast('Masukkan API key', 'error');
      return;
    }

    setSavingProvider(provider);
    try {
      const res = await api.post('/ads/production/providers', {
        provider,
        apiKey: key.trim(),
      });
      if (res.data?.success) {
        addToast(`API key ${provider} berhasil disimpan`, 'success');
        setApiKeyInputs(prev => ({ ...prev, [provider]: '' }));
        await fetchProviders();
      } else {
        addToast(res.data?.message || 'Gagal simpan API key', 'error');
      }
    } catch {
      addToast('Gagal simpan API key', 'error');
    } finally {
      setSavingProvider(null);
    }
  };

  // Delete API key
  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`Hapus API key ${provider}?`)) return;

    try {
      const res = await api.delete(`/ads/production/providers/${provider}`);
      if (res.data?.success) {
        addToast(`API key ${provider} berhasil dihapus`, 'success');
        await fetchProviders();
      }
    } catch {
      addToast('Gagal hapus API key', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/${site}/dashboard/ads`} className="inline-flex items-center gap-2 text-[10px] font-bold text-brand-red uppercase tracking-widest hover:underline">
          <ArrowLeft size={14} /> Kembali
        </Link>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          <Settings size={14} />
          Pengaturan API Key
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="dash-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
                Pengaturan API Key
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Masukkan API key untuk setiap provider. Kosongkan jika tidak dipakai.
              </p>
            </div>
            <button onClick={() => setShowSettings(false)} className="p-2 text-gray-400 hover:text-brand-black dark:hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {['seedance', 'kling', 'hailuo', 'pika', 'luma', 'runway'].map(provider => {
              const config = providers.find(p => p.id === provider);
              const isConfigured = config?.available;

              return (
                <div key={provider} className="flex items-center gap-3">
                  <div className="w-40 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-black dark:text-white">
                        {PROVIDER_LABELS[provider]}
                      </span>
                      {isConfigured ? (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={12} className="text-gray-300" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKeys[provider] ? 'text' : 'password'}
                        value={apiKeyInputs[provider] || ''}
                        onChange={(e) => setApiKeyInputs(prev => ({ ...prev, [provider]: e.target.value }))}
                        placeholder={isConfigured ? '••••••••••••••••' : 'Masukkan API key...'}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-red/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys[provider] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleSaveKey(provider)}
                      disabled={savingProvider === provider || !apiKeyInputs[provider]?.trim()}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        savingProvider === provider || !apiKeyInputs[provider]?.trim()
                          ? "bg-gray-100 text-gray-300"
                          : "bg-brand-red text-white hover:opacity-90"
                      )}
                    >
                      {savingProvider === provider ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                    </button>
                    {isConfigured && (
                      <button
                        onClick={() => handleDeleteKey(provider)}
                        className="p-2 bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl">
            <Video size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight">
              Produksi Video
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Produksi video iklan untuk booking HOME TOP
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dash-card p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Menunggu Produksi</p>
            <p className="text-2xl font-black text-brand-black dark:text-white mt-1">{bookings.length}</p>
          </div>
        </div>
      </div>

      {/* Production Cards */}
      {bookings.length === 0 ? (
        <div className="dash-card p-12 text-center">
          <Video size={48} className="text-gray-200 dark:text-white/10 mx-auto mb-4" />
          <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">
            Tidak Ada Booking Menunggu
          </h3>
          <p className="text-[11px] text-gray-400 max-w-md mx-auto">
            Semua booking HOME TOP sudah diproduksi. Booking baru akan muncul di sini setelah di-approve oleh admin.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map(booking => (
            <ProductionCard
              key={booking.id}
              booking={booking}
              site={site}
              isProcessing={processingId === booking.id}
              setProcessingId={setProcessingId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
