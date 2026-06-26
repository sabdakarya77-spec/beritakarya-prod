'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../../../lib/api';
import { useAuthStore } from '../../../../../../store/authStore';
import { useToastStore } from '../../../../../../store/toastStore';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import type { AdBooking } from '../../../../../../components/dashboard/ads/types';
import BookingReviewList from '../../../../../../components/dashboard/ads/BookingReviewList';

export default function AdsBookingsPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<AdBooking[]>([]);

  const fetchBookings = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get('/ads/bookings/all', { signal });
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
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui iklan ini?')) return;
    try {
      await api.post(`/ads/bookings/${id}/approve`);
      await fetchBookings();
      addToast('Iklan disetujui & aktif!', 'success');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menyetujui iklan', 'error');
    }
  };

  const handleReject = async (id: string, notes: string) => {
    try {
      await api.post(`/ads/bookings/${id}/reject`, { rejectionNotes: notes });
      await fetchBookings();
      addToast('Pengajuan iklan ditolak', 'info');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menolak iklan', 'error');
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya dapat diakses oleh Superadmin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/${site}/dashboard/ads`} className="inline-flex items-center gap-2 text-[10px] font-bold text-brand-red uppercase tracking-widest hover:underline">
        <ArrowLeft size={14} /> Kembali ke Iklan & Banner
      </Link>
      <BookingReviewList
        bookings={bookings}
        loading={loading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
