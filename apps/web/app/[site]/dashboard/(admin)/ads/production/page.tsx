'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../../../lib/api';
import { useAuthStore } from '../../../../../../store/authStore';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { AdBooking } from '../../../../../../components/dashboard/ads/types';
import { VideoProductionPage } from '../../../../../../components/dashboard/ads/production/VideoProductionPage';

export default function ProductionPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<AdBooking[]>([]);

  const fetchBookings = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      // Fetch HOME_TOP bookings yang sudah ACTIVE (menunggu produksi video)
      const res = await api.get('/ads/bookings/all', { signal });
      if (signal?.aborted) return;

      const allBookings: AdBooking[] = res.data.data || [];
      // Filter: HOME_TOP, status ACTIVE, belum ada video (imageUrl kosong)
      const pendingProduction = allBookings.filter(b =>
        b.package?.slot === 'HOME_TOP' &&
        b.status === 'ACTIVE' &&
        !b.imageUrl
      );
      setBookings(pendingProduction);
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'CanceledError') console.error('Gagal mengambil data', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchBookings(controller.signal);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw size={32} className="animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <VideoProductionPage
      site={site}
      bookings={bookings}
      onRefresh={() => fetchBookings()}
    />
  );
}
