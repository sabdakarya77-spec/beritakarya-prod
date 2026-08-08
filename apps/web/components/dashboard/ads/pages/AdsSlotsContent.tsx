'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { AD_SLOT_DEFINITIONS } from '../../../../lib/constants';
import type { Ad } from '../types';
import { AdSlotCard } from '../AdSlotCard';

export default function AdsSlotsContent() {
  const { site } = useParams() as { site: string };
  const pathname = usePathname();
  const backHref = pathname.includes('/dashboard/') ? `/${site}/dashboard/ads` : `/${site}/ads`;
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);

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

  if (user?.role !== 'superadmin' && user?.role !== 'wapimred') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya dapat diakses oleh Wapimred dan Superadmin.</p>
      </div>
    );
  }

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
          {/* Card Grid — semua slot (termasuk HOME_TOP) pakai AdSlotCard */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {AD_SLOT_DEFINITIONS.map(slot => {
              const slotAds = ads.filter(a => a.slot === slot.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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