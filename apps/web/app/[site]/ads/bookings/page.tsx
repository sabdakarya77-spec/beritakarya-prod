'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { useToastStore } from '../../../../store/toastStore';
import { cn } from '../../../../lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  Copy,
  Building2,
  QrCode,
  CreditCard,
  Clock,
  ExternalLink,
  Smartphone,
} from 'lucide-react';

// Midtrans Snap JS types
declare global {
  interface Window {
    snap?: { pay: (token: string, options: Record<string, unknown>) => void }
  }
}
import type { AdBooking } from '../../../../components/dashboard/ads/types';
import { AD_BANK_ACCOUNTS } from '../../../../lib/constants';

export default function PaymentsPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<AdBooking[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Dynamic configurations
  const [midtransUrl, setMidtransUrl] = useState('');
  const [midtransClientKey, setMidtransClientKey] = useState('');
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [bankAccounts, setBankAccounts] = useState<readonly { bank: string; number: string; name: string }[]>(AD_BANK_ACCOUNTS);

  const fetchBookings = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get('/ads/bookings/my', { signal });
      if (signal?.aborted) return;
      setBookings(res.data.data || []);
    } catch {
      // silent
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const fetchPaymentConfig = async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/ads/payment-config', { params: { site }, signal });
      if (res.data?.success && res.data?.data) {
        const config = res.data.data;
        if (config.midtransUrl) setMidtransUrl(config.midtransUrl);
        if (config.midtransClientKey) setMidtransClientKey(config.midtransClientKey);
        if (config.qrisImageUrl) setQrisImageUrl(config.qrisImageUrl);
        if (config.bankAccounts) {
          const parsed = typeof config.bankAccounts === 'string'
            ? JSON.parse(config.bankAccounts)
            : config.bankAccounts;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBankAccounts(parsed);
          }
        }
      }
    } catch {
      // fallback to defaults
    }
  };

  // Load Midtrans Snap JS dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.snap) {
      const snapScriptUrl = midtransUrl || process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
      const clientKey = midtransClientKey || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';

      const script = document.createElement('script');
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, [midtransUrl, midtransClientKey]);

  useEffect(() => {
    const controller = new AbortController();
    fetchBookings(controller.signal);
    fetchPaymentConfig(controller.signal);
    return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text.replace(/-/g, ''));
    setCopiedAccount(label);
    addToast(`Nomor ${label} disalin`, 'success');
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleUploadReceipt = async (bookingId: string, file: File) => {
    setUploadingId(bookingId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('siteId', site || 'pusat');
      const uploadRes = await api.post('/media/upload?purpose=ad-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const receiptUrl = uploadRes.data?.data?.url || uploadRes.data?.url || uploadRes.data?.filePath || '';
      if (!receiptUrl) throw new Error('Gagal mengunggah file');

      await api.post(`/ads/bookings/${bookingId}/pay`, { paymentProof: receiptUrl });
      addToast('Bukti pembayaran berhasil diunggah', 'success');
      await fetchBookings();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal mengunggah bukti pembayaran', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const handlePayGateway = async (bookingId: string) => {
    setUploadingId(bookingId);
    try {
      const res = await api.post(`/ads/bookings/${bookingId}/pay-gateway`);
      const { snapToken } = res.data.data;
      if (!snapToken) throw new Error('Gagal mendapatkan token pembayaran');

      // Buka Midtrans Snap popup
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            addToast('Pembayaran berhasil!', 'success');
            await fetchBookings();
          },
          onPending: () => {
            addToast('Pembayaran sedang diproses', 'info');
          },
          onError: () => {
            addToast('Pembayaran gagal', 'error');
          },
          onClose: () => {
            addToast('Popup pembayaran ditutup', 'info');
          },
        });
      } else {
        addToast('Midtrans Snap belum dimuat. Coba refresh halaman.', 'error');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      addToast(msg || 'Gagal memproses pembayaran', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const formatRupiah = (val: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID': return { label: 'Diverifikasi', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 };
      case 'VERIFYING': return { label: 'Menunggu Verifikasi', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock };
      case 'REJECTED': return { label: 'Ditolak', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle };
      default: return { label: 'Menunggu Pembayaran', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: AlertCircle };
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Pembayaran</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Transfer ke rekening di bawah ini, lalu unggah bukti pembayaran</p>
      </div>

      {/* Bank Accounts & QRIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map(({ bank, number, name }) => (
          <div key={bank} className="dash-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                <Building2 size={16} className="text-brand-red" />
              </div>
              <span className="text-sm font-black text-brand-black dark:text-white uppercase">{bank}</span>
            </div>
            <div>
              <p className="text-lg font-black text-brand-red tracking-wider">{number}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">a/n {name}</p>
            </div>
            <button
              onClick={() => copyToClipboard(number, bank)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all w-full justify-center",
                copiedAccount === bank
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-gray-50 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10 hover:text-brand-red hover:border-brand-red/20"
              )}
            >
              {copiedAccount === bank ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copiedAccount === bank ? 'Tersalin!' : 'Salin Nomor'}
            </button>
          </div>
        ))}

        {/* QRIS */}
        <div className="dash-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <QrCode size={16} className="text-emerald-600" />
            </div>
            <span className="text-sm font-black text-brand-black dark:text-white uppercase">QRIS</span>
          </div>
          <div className="w-full aspect-square max-w-[160px] bg-white rounded-xl border border-gray-200 flex items-center justify-center mx-auto overflow-hidden">
            {qrisImageUrl ? (
              <img src={qrisImageUrl} alt="QRIS Merchant" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center p-4">
                <QrCode size={64} className="text-gray-300 mx-auto mb-2" />
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Scan untuk membayar</p>
              </div>
            )}
          </div>
          <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-wider">Semua bank & e-wallet</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-widest">Riwayat Pembayaran</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-brand-red" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="dash-card p-12 text-center">
            <CreditCard size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada pembayaran</p>
            <p className="text-[10px] text-gray-400 mt-1">Riwayat pembayaran iklan Anda akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const statusConfig = getStatusConfig(b.paymentStatus);
              const StatusIcon = statusConfig.icon;
              const isUploading = uploadingId === b.id;

              return (
                <div key={b.id} className="dash-card p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={18} className="text-brand-red" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-brand-black dark:text-white truncate">
                          {b.package?.name || 'Paket Iklan'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatRupiah(b.package?.price || '0')} • {b.siteId}
                        </p>
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        statusConfig.color
                      )}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>

                      {/* Pay online button */}
                      {(b.paymentStatus === 'PENDING' || b.paymentStatus === 'REJECTED') && (
                        <button
                          onClick={() => handlePayGateway(b.id)}
                          disabled={uploadingId === b.id}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all",
                            uploadingId === b.id
                              ? "bg-gray-100 dark:bg-white/5 text-gray-400"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                          )}
                        >
                          {uploadingId === b.id ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Smartphone size={12} />
                          )}
                          {uploadingId === b.id ? 'Memproses...' : 'Bayar Online'}
                        </button>
                      )}

                      {/* Upload receipt button */}
                      {(b.paymentStatus === 'PENDING' || b.paymentStatus === 'REJECTED') && (
                        <label className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all",
                          isUploading
                            ? "bg-gray-100 dark:bg-white/5 text-gray-400"
                            : "bg-brand-red text-white hover:bg-red-700 shadow-lg shadow-brand-red/20"
                        )}>
                          {isUploading ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Upload size={12} />
                          )}
                          {isUploading ? 'Mengunggah...' : b.paymentStatus === 'REJECTED' ? 'Ulangi Bukti' : 'Upload Bukti'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadReceipt(b.id, file);
                            }}
                          />
                        </label>
                      )}

                      {/* Cancel Booking button */}
                      {(b.paymentStatus === 'PENDING' || b.paymentStatus === 'REJECTED') && (
                        <button
                          onClick={async () => {
                            if (!confirm('Apakah Anda yakin ingin membatalkan pesanan iklan ini?')) return;
                            setUploadingId(b.id);
                            try {
                              await api.post(`/ads/bookings/${b.id}/cancel`);
                              addToast('Pesanan berhasil dibatalkan', 'success');
                              await fetchBookings();
                            } catch {
                              addToast('Gagal membatalkan pesanan', 'error');
                            } finally {
                              setUploadingId(null);
                            }
                          }}
                          disabled={uploadingId === b.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-red-500 hover:text-white"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection notes */}
                  {b.paymentStatus === 'REJECTED' && b.rejectionNotes && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 rounded-xl">
                      <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">
                        Alasan ditolak: {b.rejectionNotes}
                      </p>
                    </div>
                  )}

                  {/* Receipt preview */}
                  {b.paymentProof && (
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={b.paymentProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold text-brand-red uppercase tracking-wider flex items-center gap-1 hover:underline"
                      >
                        Lihat Bukti Transfer <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
