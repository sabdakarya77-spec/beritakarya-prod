'use client';

import { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  BarChart3,
  Eye,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { api } from '../../../lib/api';
import { getAdSlotDefinition } from '../../../lib/constants';
import type { AdPackage, AdBooking } from './types';

interface Props {
  site: string;
  packages: AdPackage[];
  bookings: AdBooking[];
  onRefresh: () => void;
}

export function AdvertiserAdsView({ site, packages, bookings, onRefresh }: Props) {
  const [advTab, setAdvTab] = useState<'book' | 'history'>('book');
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [advImageUrl, setAdvImageUrl] = useState('');
  const [advLinkUrl, setAdvLinkUrl] = useState('');
  const [advStartDate, setAdvStartDate] = useState('');
  const [advEndDate, setAdvEndDate] = useState('');
  const [advPaymentProof, setAdvPaymentProof] = useState('');
  const [bookingStep, setBookingStep] = useState(1);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const formatRupiah = (val: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

  const handleSubmitBooking = async () => {
    const selectedPkg = packages.find(p => p.id === selectedPkgId);
    if (!selectedPkg || !advImageUrl || !advLinkUrl || !advStartDate || !advEndDate) {
      alert('Lengkapi semua kolom yang wajib diisi.');
      return;
    }
    setIsSubmittingBooking(true);
    try {
      const bookingRes = await api.post('/ads/bookings', {
        packageId: selectedPkg.id,
        siteId: site || 'pusat',
        imageUrl: advImageUrl,
        linkUrl: advLinkUrl,
        startDate: new Date(advStartDate).toISOString(),
        endDate: new Date(advEndDate).toISOString(),
      });
      const bookingId = bookingRes.data?.data?.id;
      if (bookingId && advPaymentProof) {
        await api.post(`/ads/bookings/${bookingId}/pay`, { paymentProof: advPaymentProof });
      }
      alert('Booking berhasil diajukan! Menunggu verifikasi Superadmin.');
      setBookingStep(1);
      setSelectedPkgId('');
      setAdvImageUrl('');
      setAdvLinkUrl('');
      setAdvStartDate('');
      setAdvEndDate('');
      setAdvPaymentProof('');
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mengajukan booking');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-brand-red">
          <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl"><Wallet size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Kampanye</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.length}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Iklan Aktif</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.filter(b => b.status === 'ACTIVE').length}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><BarChart3 size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Impresi</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.reduce((acc, b) => acc + b.impressions, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-violet-500">
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl"><Eye size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Klik</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.reduce((acc, b) => acc + b.clicks, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex border-b border-gray-100 dark:border-white/5 pb-px gap-6">
        <button onClick={() => setAdvTab('book')} className={cn("pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative border-b-2", advTab === 'book' ? "border-brand-red text-brand-red" : "border-transparent text-gray-400")}>Pesan Iklan Regional Baru</button>
        <button onClick={() => setAdvTab('history')} className={cn("pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative border-b-2", advTab === 'history' ? "border-brand-red text-brand-red" : "border-transparent text-gray-400")}>Riwayat Booking & Performa</button>
      </div>

      {advTab === 'book' && (
        <div className="space-y-6">
          {bookingStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Pilih Paket Iklan</h3>
              {packages.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">Tidak ada paket tersedia.</div>
              ) : (
                <div className="grid gap-4">
                  {packages.map((pkg) => (
                    <label key={pkg.id} className={cn("flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all", selectedPkgId === pkg.id ? "border-brand-red bg-brand-red/5 shadow-md" : "border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5")}>
                      <input type="radio" name="pkg" value={pkg.id} checked={selectedPkgId === pkg.id} onChange={() => setSelectedPkgId(pkg.id)} className="mt-1 accent-brand-red" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="text-sm font-black text-brand-black dark:text-white">{pkg.name}</p>
                            <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mt-0.5">{getAdSlotDefinition(pkg.slot)?.name || pkg.slot} • {pkg.durationDays} Hari</p>
                          </div>
                          <p className="text-base font-black text-brand-red">{formatRupiah(pkg.price)}</p>
                        </div>
                        {pkg.description && <p className="text-xs text-gray-400 mt-2">{pkg.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={() => { if (selectedPkgId) setBookingStep(2); }} disabled={!selectedPkgId} className="px-6 py-3 bg-brand-red hover:bg-brand-black text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 rounded-lg flex items-center gap-2">
                  Lanjut <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="space-y-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Detail Kampanye & Materi</h3>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">URL Gambar Banner *</label>
                <input type="url" value={advImageUrl} onChange={e => setAdvImageUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:border-brand-red outline-none dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">URL Link Tujuan Klik *</label>
                <input type="url" value={advLinkUrl} onChange={e => setAdvLinkUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:border-brand-red outline-none dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tanggal Mulai *</label>
                  <input type="date" value={advStartDate} onChange={e => setAdvStartDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:border-brand-red outline-none dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tanggal Selesai *</label>
                  <input type="date" value={advEndDate} onChange={e => setAdvEndDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:border-brand-red outline-none dark:text-white" />
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setBookingStep(1)} className="px-6 py-3 border border-gray-200 dark:border-white/10 text-sm font-bold rounded-lg">Kembali</button>
                <button onClick={() => { if (advImageUrl && advLinkUrl && advStartDate && advEndDate) setBookingStep(3); }} disabled={!advImageUrl || !advLinkUrl || !advStartDate || !advEndDate} className="px-6 py-3 bg-brand-red hover:bg-brand-black text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 rounded-lg flex items-center gap-2">
                  Lanjut <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="space-y-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Bukti Pembayaran</h3>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">URL Bukti Transfer (Opsional)</label>
                <input type="url" value={advPaymentProof} onChange={e => setAdvPaymentProof(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:border-brand-red outline-none dark:text-white" />
              </div>
              <div className="flex justify-between">
                <button onClick={() => setBookingStep(2)} className="px-6 py-3 border border-gray-200 dark:border-white/10 text-sm font-bold rounded-lg">Kembali</button>
                <button onClick={handleSubmitBooking} disabled={isSubmittingBooking} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 rounded-lg flex items-center gap-2">
                  {isSubmittingBooking ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Kirim Booking
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {advTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Riwayat Booking</h3>
            <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-brand-red transition-colors"><RefreshCw size={14} /></button>
          </div>
          {bookings.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Belum ada booking.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Paket</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Slot</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Tanggal</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Impresi</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Klik</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-semibold text-brand-black dark:text-white">{b.package?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{b.package?.slot || '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(b.startDate).toLocaleDateString('id-ID')} — {new Date(b.endDate).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-1 rounded-full text-[9px] font-bold uppercase", b.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : b.status === 'PENDING_REVIEW' ? "bg-amber-100 text-amber-700" : b.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500")}>{b.status}</span>
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
      )}
    </div>
  );
}
