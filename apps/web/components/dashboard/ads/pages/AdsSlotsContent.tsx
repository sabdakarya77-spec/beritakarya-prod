'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { useToastStore } from '../../../../store/toastStore';
import { RefreshCw, AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import { AD_SLOT_DEFINITIONS } from '../../../../lib/constants';
import type { Ad } from '../types';
import { LeaderboardManager } from '../LeaderboardManager';
import { AdSlotCard } from '../AdSlotCard';

export default function AdsSlotsContent() {
  const { site } = useParams() as { site: string };
  const pathname = usePathname();
  const backHref = pathname.includes('/dashboard/') ? `/${site}/dashboard/ads` : `/${site}/ads`;
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [savingAdId, setSavingAdId] = useState<string | null>(null);

  const fetchAds = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get('/ads', { signal });
      if (signal?.aborted) return;
      setAds(res.data.data || []);
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'CanceledError') console.error('Gagal mengambil data iklan', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAds(controller.signal);
    return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  // Leaderboard-specific handlers (multi-banner carousel)
  const handleAddLeaderboardBanner = async () => {
    try {
      await api.post('/ads', { slot: 'leaderboard', isActive: true });
      await fetchAds();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menambah banner', 'error');
    }
  };

  const handleUpdateAd = async (adId: string, payload: Partial<Ad>) => {
    setSavingAdId(adId);
    try {
      await api.patch(`/ads/${adId}`, payload);
      await fetchAds();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menyimpan iklan', 'error');
    } finally {
      setSavingAdId(null);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner iklan ini?')) return;
    try {
      await api.delete(`/ads/${adId}`);
      addToast('Banner iklan berhasil dihapus', 'success');
      await fetchAds();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menghapus iklan', 'error');
    }
  };

  const handleReorderAds = async (slotId: string, direction: 'up' | 'down', adIndex: number) => {
    const slotAds = ads.filter(a => a.slot === slotId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const targetIndex = direction === 'up' ? adIndex - 1 : adIndex + 1;
    if (targetIndex < 0 || targetIndex >= slotAds.length) return;

    const items = [...slotAds];
    [items[adIndex], items[targetIndex]] = [items[targetIndex], items[adIndex]];
    const reorderPayload = items.map((item, idx) => ({ id: item.id, order: idx }));

    try {
      await api.patch('/ads/reorder', { items: reorderPayload });
      await fetchAds();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal mengurutkan iklan', 'error');
    }
  };

  // Upload handler for LeaderboardManager (old-style single variant upload)
  const uploadAdFile = async (file: File, slotId?: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const slotParam = slotId ? `?slot=${slotId}` : '';
    try {
      const res = await api.post(`/media/upload-ad${slotParam}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data?.data?.desktop?.url || '';
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      throw new Error(axiosErr?.response?.data?.error?.message || 'Upload gagal');
    }
  };

  if (user?.role !== 'superadmin' && user?.role !== 'wapimred') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya dapat diakses oleh Wapimred dan Superadmin.</p>
      </div>
    );
  }

  const leaderboardAds = ads.filter(a => a.slot === 'leaderboard').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const nonLeaderboardSlots = AD_SLOT_DEFINITIONS.filter(s => s.id !== 'leaderboard');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={backHref} className="inline-flex items-center gap-2 text-[10px] font-bold text-brand-red uppercase tracking-widest hover:underline">
          <ArrowLeft size={14} /> Kembali
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw size={32} className="animate-spin text-brand-red" />
        </div>
      ) : (
        <>
          {/* Leaderboard — carousel manager (special layout) */}
          <LeaderboardManager
            ads={leaderboardAds}
            slotDef={AD_SLOT_DEFINITIONS.find(s => s.id === 'leaderboard')!}
            onAdd={handleAddLeaderboardBanner}
            onUpdate={handleUpdateAd}
            onDelete={handleDeleteAd}
            onReorder={handleReorderAds}
            onUpload={uploadAdFile}
            savingId={savingAdId}
          />

          {/* Card Grid — 3 kolom untuk slot non-leaderboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {nonLeaderboardSlots.map(slot => {
              const slotAds = ads.filter(a => a.slot === slot.id);
              return (
                <AdSlotCard
                  key={slot.id}
                  slot={slot}
                  ads={slotAds}
                  onRefresh={fetchAds}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
