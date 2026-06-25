'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../../../lib/api';
import { useAuthStore } from '../../../../../../store/authStore';
import { useToastStore } from '../../../../../../store/toastStore';
import { cn } from '../../../../../../lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import type { AdBooking } from '../../../../../../components/dashboard/ads/types';

export default function AdsBookingsPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<AdBooking[]>([]);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  // Filters
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'VERIFYING' | 'PAID' | 'PENDING' | 'REJECTED'>('ALL');
  const [bookingSort, setBookingSort] = useState<'newest' | 'oldest'>('newest');
  // Pagination
  const BOOKING_PAGE_SIZE = 10;
  const [visibleBookingCount, setVisibleBookingCount] = useState(BOOKING_PAGE_SIZE);

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

  useEffect(() => {
    setVisibleBookingCount(BOOKING_PAGE_SIZE);
  }, [bookingFilter, bookingSort]);

  const filteredBookings = bookings
    .filter(b => bookingFilter === 'ALL' || b.paymentStatus === bookingFilter)
    .sort((a, b) => bookingSort === 'newest'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  const visibleBookings = filteredBookings.slice(0, visibleBookingCount);
  const hasMoreBookings = visibleBookingCount < filteredBookings.length;

  const handleApproveBooking = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui iklan ini dan meluncurkannya ke website tujuan?')) return;
    try {
      await api.post(`/ads/bookings/${id}/approve`);
      await fetchBookings();
      addToast('Iklan disetujui & aktif di website cabang!', 'success');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menyetujui iklan', 'error');
    }
  };

  const handleRejectBooking = async () => {
    if (!showRejectModal || !rejectionNotes.trim()) return;
    try {
      await api.post(`/ads/bookings/${showRejectModal}/reject`, { rejectionNotes });
      await fetchBookings();
      addToast('Pengajuan iklan ditolak', 'info');
      setShowRejectModal(null);
      setRejectionNotes('');
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
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-widest">Antrean Validasi Pemesanan</h3>
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'VERIFYING', 'PAID', 'PENDING', 'REJECTED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setBookingFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border",
                bookingFilter === f
                  ? f === 'VERIFYING' ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                  : f === 'PAID' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : f === 'REJECTED' ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                  : "bg-brand-red/10 border-brand-red/30 text-brand-red"
                  : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600"
              )}
            >
              {f === 'ALL' ? 'Semua' : f}
              {f === 'VERIFYING' && bookings.filter(b => b.paymentStatus === 'VERIFYING').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[7px] rounded-full">{bookings.filter(b => b.paymentStatus === 'VERIFYING').length}</span>
              )}
            </button>
          ))}
          <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />
          <select
            value={bookingSort}
            onChange={e => setBookingSort(e.target.value as 'newest' | 'oldest')}
            className="px-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider text-gray-500 outline-none"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw size={32} className="animate-spin text-brand-red" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-16 text-center dash-card">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
            {bookingFilter === 'ALL' ? 'Antrean Validasi Kosong' : `Tidak Ada Booking "${bookingFilter}"`}
          </p>
          <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
            {bookingFilter === 'ALL'
              ? 'Semua pengajuan iklan sudah diproses. Pengajuan baru dari pengiklan akan muncul di sini.'
              : `Tidak ada booking dengan status "${bookingFilter}". Coba filter lain.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleBookings.map(b => (
            <div key={b.id} className="dash-card overflow-hidden border-t-4 border-t-brand-red">
              <div className="p-4 md:p-6 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">{b.package?.name}</h4>
                    <span className="text-[8px] font-black px-2 py-0.5 bg-brand-red/10 text-brand-red rounded-full uppercase tracking-wider">{b.siteId} (Cabang)</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Pemesan: <strong className="text-brand-black dark:text-white">{b.user?.name}</strong> ({b.user?.email})</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full font-black text-[8px] md:text-[9px] uppercase tracking-widest",
                    b.paymentStatus === 'PAID' ? "bg-emerald-500/10 text-emerald-500" :
                    b.paymentStatus === 'VERIFYING' ? "bg-blue-500/10 text-blue-500 animate-pulse" :
                    b.paymentStatus === 'REJECTED' ? "bg-red-500/10 text-red-500" :
                    "bg-amber-500/10 text-amber-500"
                  )}>
                    PEMBAYARAN: {b.paymentStatus}
                  </span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full font-black text-[8px] md:text-[9px] uppercase tracking-widest",
                    b.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500" :
                    b.status === 'COMPLETED' ? "bg-slate-500/10 text-slate-400" :
                    b.status === 'REJECTED' ? "bg-red-500/10 text-red-500" :
                    "bg-amber-500/10 text-amber-500"
                  )}>
                    PENAYANGAN: {b.status}
                  </span>
                </div>
              </div>

              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-4 text-[11px] md:border-r border-gray-50 dark:border-white/5 md:pr-6 pb-4 md:pb-0 border-b md:border-b-0">
                  <div className="space-y-1">
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Tanggal Mulai - Selesai</span>
                    <div className="font-bold">{new Date(b.startDate).toLocaleDateString('id-ID')} s.d {new Date(b.endDate).toLocaleDateString('id-ID')}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Tautan Target Iklan</span>
                    <a href={b.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-red flex items-center gap-1 hover:underline truncate">
                      {b.linkUrl} <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Nilai Transaksi</span>
                    <div className="text-sm font-black text-brand-black dark:text-white">Rp {parseFloat(b.package?.price || '0').toLocaleString('id-ID')}</div>
                  </div>
                  {b.rejectionNotes && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 rounded-xl text-[9px] text-red-500 font-bold uppercase tracking-wider">
                      Catatan Penolakan: {b.rejectionNotes}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:border-r border-gray-50 dark:border-white/5 md:pr-6 pb-4 md:pb-0 border-b md:border-b-0">
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Materi Kreatif Banner / Video</span>
                  <div className="h-[120px] bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
                    {b.imageUrl ? (
                      b.imageUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i) || b.imageUrl.toLowerCase().includes('video') ? (
                        <video src={b.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                      ) : (
                        <img src={b.imageUrl} alt="Banner" className="w-full h-full object-contain" />
                      )
                    ) : (
                      <span className="text-[9px] text-gray-400">Tidak ada materi</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Bukti Transfer</span>
                  <div className="h-[120px] bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden relative group">
                    {b.paymentProof ? (
                      <>
                        <img src={b.paymentProof} alt="Bukti Transfer" className="w-full h-full object-contain cursor-zoom-in" />
                        <a href={b.paymentProof} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 text-white flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black uppercase tracking-widest">
                          Lihat Penuh <ExternalLink size={12} />
                        </a>
                      </>
                    ) : (
                      <span className="text-[9px] text-gray-400 italic">Bukti transfer belum di-upload</span>
                    )}
                  </div>
                </div>
              </div>

              {b.paymentStatus === 'VERIFYING' && (
                <div className="px-4 md:px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowRejectModal(b.id)}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-red-500/10"
                  >
                    <XCircle size={12} /> Tolak Pengajuan
                  </button>
                  <button
                    onClick={() => handleApproveBooking(b.id)}
                    className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircle2 size={12} /> Setujui & Luncurkan!
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {filteredBookings.length > BOOKING_PAGE_SIZE && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                Menampilkan {visibleBookings.length} dari {filteredBookings.length} booking
              </p>
              {hasMoreBookings && (
                <button
                  onClick={() => setVisibleBookingCount(prev => prev + BOOKING_PAGE_SIZE)}
                  className="px-6 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  Muat Lebih Banyak
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 w-full max-w-md p-6 space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle size={20} />
              <h4 className="text-sm font-black uppercase tracking-widest">Catatan Penolakan Kampanye</h4>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Berikan alasan penolakan secara jelas agar Advertiser dapat memahami kesalahan materi iklan atau bukti pembayaran mereka.</p>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Contoh: Bukti transfer tidak terbaca karena buram."
              rows={4}
              className="w-full p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-2xl text-xs outline-none focus:border-brand-red transition-all"
              required
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowRejectModal(null); setRejectionNotes(''); }} className="px-6 py-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">Batal</button>
              <button onClick={handleRejectBooking} className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/10">Kirim Penolakan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
