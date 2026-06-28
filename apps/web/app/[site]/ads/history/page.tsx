'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { cn } from '../../../../lib/utils';
import {
  BarChart3,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import type { AdBooking } from '../../../../components/dashboard/ads/types';

export default function AdsHistoryPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<AdBooking[]>([]);

  const fetchBookings = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'advertiser' ? '/ads/bookings/my' : '/ads/bookings/all';
      const res = await api.get(endpoint, { signal });
      if (signal?.aborted) return;
      setBookings(res.data.data || []);
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'CanceledError') console.error('Gagal mengambil booking', error);
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

  if (user?.role !== 'advertiser' && user?.role !== 'superadmin' && user?.role !== 'wapimred') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart3 size={48} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya untuk pengiklan dan admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Riwayat Booking & Performa</h3>
        <button onClick={() => fetchBookings()} className="p-2 text-gray-400 hover:text-brand-red transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw size={32} className="animate-spin text-brand-red" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <BarChart3 size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Belum Ada Riwayat Kampanye</p>
          <p className="text-[10px] text-gray-400 max-w-xs mx-auto mb-4">Mulai pasang iklan regional untuk menjangkau ribuan pembaca di portal BeritaKarya.</p>
          <Link
            href={`/${site}/ads/order`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-black transition-colors"
          >
            <Megaphone size={14} /> Pesan Iklan Pertama
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Paket</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Kampanye</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Slot</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Tanggal</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Pembayaran</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Impresi</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Klik</th>
                <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">CTR</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-brand-black dark:text-white">{b.package?.name || '-'}</td>
                  <td className="py-3 px-4 text-gray-500">{b.campaignName || '-'}</td>
                  <td className="py-3 px-4 text-gray-500">{b.package?.slot || '-'}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(b.startDate).toLocaleDateString('id-ID')} — {new Date(b.endDate).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[9px] font-bold uppercase",
                      b.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" :
                      b.status === 'PENDING_REVIEW' ? "bg-amber-100 text-amber-700" :
                      b.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-500"
                    )}>{b.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[9px] font-bold uppercase",
                      b.paymentStatus === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                      b.paymentStatus === 'VERIFYING' ? "bg-blue-100 text-blue-700" :
                      b.paymentStatus === 'REJECTED' ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    )}>{b.paymentStatus}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">{b.impressions.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono">{b.clicks.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono">{b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(2) + '%' : '0%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
