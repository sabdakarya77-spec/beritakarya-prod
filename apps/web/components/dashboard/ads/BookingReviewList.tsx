'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AdBooking } from './types';

const REVIEW_ITEMS = [
  { key: 'content_ok', label: 'Konten tidak menyesatkan atau misleading' },
  { key: 'no_prohibited', label: 'Tidak mengandung SARA, pornografi, atau konten terlarang' },
  { key: 'size_ok', label: 'Materi kreatif sesuai ukuran slot (desktop & mobile)' },
  { key: 'url_ok', label: 'URL tujuan aktif dan relevan' },
  { key: 'no_copyright', label: 'Tidak melanggar hak cipta atau trademark' },
];

const BOOKING_PAGE_SIZE = 10;

interface BookingReviewListProps {
  bookings: AdBooking[];
  loading?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, notes: string) => void;
}

export default function BookingReviewList({ bookings, loading, onApprove, onReject }: BookingReviewListProps) {
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'VERIFYING' | 'PAID' | 'PENDING' | 'REJECTED'>('ALL');
  const [bookingSort, setBookingSort] = useState<'newest' | 'oldest'>('newest');
  const [visibleBookingCount, setVisibleBookingCount] = useState(BOOKING_PAGE_SIZE);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [reviewChecklist, setReviewChecklist] = useState<Record<string, Record<string, boolean>>>({});

  const isChecklistComplete = (bookingId: string) => {
    const checklist = reviewChecklist[bookingId];
    if (!checklist) return false;
    return REVIEW_ITEMS.every(item => checklist[item.key]);
  };

  const toggleChecklistItem = (bookingId: string, key: string) => {
    setReviewChecklist(prev => ({
      ...prev,
      [bookingId]: { ...(prev[bookingId] || {}), [key]: !prev[bookingId]?.[key] },
    }));
  };

  const filteredBookings = bookings
    .filter(b => bookingFilter === 'ALL' || b.paymentStatus === bookingFilter)
    .sort((a, b) => bookingSort === 'newest'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  const visibleBookings = filteredBookings.slice(0, visibleBookingCount);
  const hasMoreBookings = visibleBookingCount < filteredBookings.length;

  const handleReject = () => {
    if (!showRejectModal || !rejectionNotes.trim()) return;
    onReject(showRejectModal, rejectionNotes);
    setShowRejectModal(null);
    setRejectionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-widest">Antrean Validasi Pemesanan</h3>
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'VERIFYING', 'PAID', 'PENDING', 'REJECTED'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setBookingFilter(f); setVisibleBookingCount(BOOKING_PAGE_SIZE); }}
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
              ? 'Semua pengajuan iklan sudah diproses.'
              : `Tidak ada booking dengan status "${bookingFilter}".`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleBookings.map(b => (
            <div key={b.id} className="dash-card overflow-hidden border-t-4 border-t-brand-red">
              {/* Header */}
              <div className="p-4 md:p-6 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">{b.package?.name}</h4>
                    <span className="text-[8px] font-black px-2 py-0.5 bg-brand-red/10 text-brand-red rounded-full uppercase tracking-wider">{b.siteId} (Cabang)</span>
                  </div>
                  {b.campaignName && (
                    <p className="text-[10px] text-gray-400 mt-1">Kampanye: <strong className="text-brand-black dark:text-white">{b.campaignName}</strong></p>
                  )}
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

              {/* Body */}
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-4 text-[11px] md:border-r border-gray-50 dark:border-white/5 md:pr-6 pb-4 md:pb-0 border-b md:border-b-0">
                  <div className="space-y-1">
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Tanggal</span>
                    <div className="font-bold">{new Date(b.startDate).toLocaleDateString('id-ID')} s.d {new Date(b.endDate).toLocaleDateString('id-ID')}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Tautan Target</span>
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
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Materi Kreatif</span>
                  <div className="h-[120px] bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
                    {b.imageUrl ? (
                      b.imageUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i) || b.imageUrl.toLowerCase().includes('video') ? (
                        <video src={b.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={b.imageUrl} alt="Banner" className="w-full h-full object-cover" />
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

              {/* Review Checklist + Actions */}
              {b.paymentStatus === 'VERIFYING' && (
                <>
                  <div className="px-4 md:px-6 py-4 border-t border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted mb-3">Review Konten Iklan</p>
                    <div className="space-y-2">
                      {REVIEW_ITEMS.map(item => (
                        <label key={item.key} className="flex items-start gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={reviewChecklist[b.id]?.[item.key] || false}
                            onChange={() => toggleChecklistItem(b.id, item.key)}
                            className="mt-0.5 accent-brand-red w-3.5 h-3.5 rounded"
                          />
                          <span className={cn(
                            "text-[11px] transition-colors",
                            reviewChecklist[b.id]?.[item.key]
                              ? "text-brand-black dark:text-white font-semibold"
                              : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                          )}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 md:px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowRejectModal(b.id)}
                      className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-red-500/10"
                    >
                      <XCircle size={12} /> Tolak Pengajuan
                    </button>
                    <button
                      onClick={() => onApprove(b.id)}
                      disabled={!isChecklistComplete(b.id)}
                      className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 size={12} /> Setujui & Luncurkan!
                    </button>
                  </div>
                </>
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
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Berikan alasan penolakan secara jelas agar Advertiser dapat memperbaiki materi iklan mereka.</p>
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
              <button onClick={handleReject} className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/10">Kirim Penolakan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
