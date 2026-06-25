'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { AdBooking, AdPackage } from '../../../components/dashboard/ads/types';
import { AdvertiserAdsView } from '../../../components/dashboard/ads/AdvertiserAdsView';
import AdsOverviewContent from '../../../components/dashboard/ads/pages/AdsOverviewContent';

export default function AdsOverviewPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<AdBooking[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      if (user?.role === 'superadmin' || user?.role === 'wapimred') {
        const [bookingsRes, pkgsRes] = await Promise.all([
          api.get('/ads/bookings/all', { signal }).catch(() => ({ data: { data: [] } })),
          api.get('/ads/packages', { signal }),
        ]);
        if (signal?.aborted) return;
        setBookings(bookingsRes.data.data || []);
        setPackages(pkgsRes.data.data || []);
      } else if (user?.role === 'advertiser') {
        const [bookingsRes, pkgsRes] = await Promise.all([
          api.get('/ads/bookings/my', { signal }).catch(() => ({ data: { data: [] } })),
          api.get('/ads/packages', { signal }),
        ]);
        if (signal?.aborted) return;
        setBookings(bookingsRes.data.data || []);
        setPackages(pkgsRes.data.data || []);
      }
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
  }, [site, user]);

  if (user?.role !== 'superadmin' && user?.role !== 'wapimred' && user?.role !== 'advertiser') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya dapat diakses oleh Pengiklan, Wapimred, dan Superadmin.</p>
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

  // Advertiser view: stats + CTA + chart + history
  if (user?.role === 'advertiser') {
    return (
      <AdvertiserAdsView
        site={site}
        bookings={bookings}
      />
    );
  }

  // Superadmin/Wapimred view
  return (
    <AdsOverviewContent
      basePath={`/${site}/ads`}
      bookings={bookings}
      packages={packages}
    />
  );
}
