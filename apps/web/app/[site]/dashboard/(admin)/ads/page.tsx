'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { useAuthStore } from '../../../../../store/authStore';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { Ad } from '../../../../../components/dashboard/ads/types';
import AdsOverviewContent from '../../../../../components/dashboard/ads/pages/AdsOverviewContent';

export default function AdminAdsOverviewPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get('/ads', { signal });
      if (signal?.aborted) return;
      setAds(res.data.data || []);
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'CanceledError') console.error('Gagal mengambil data', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  if (user?.role !== 'superadmin' && user?.role !== 'wapimred' && user?.role !== 'kaperwil' && user?.role !== 'korwil' && user?.role !== 'kabiro') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya dapat diakses oleh Wapimred dan Superadmin.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw size={32} className="animate-spin text-brand-red" />
      </div>
    );
  }

  // Superadmin/Wapimred view
  return (
    <AdsOverviewContent
      basePath={`/${site}/dashboard/ads`}
      ads={ads}
    />
  );
}