'use client';

import { useState } from 'react';
import { useToastStore } from '../../../store/toastStore';
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { api } from '../../../lib/api';
import { AD_SLOT_DEFINITIONS } from '../../../lib/constants';
import { AdSlotCard } from './AdSlotCard';
import { LeaderboardManager } from './LeaderboardManager';
import type { Ad, AdPackage, AdBooking } from './types';

interface Props {
  site: string;
  role: string;
  ads: Ad[];
  packages: AdPackage[];
  bookings: AdBooking[];
  savingAdId: string | null;
  onRefresh: () => void;
  onAddLeaderboardBanner: () => void;
  onUpdateAd: (id: string, data: Partial<Ad>) => void;
  onDeleteAd: (id: string) => void;
  onReorderAds: (slotId: string, direction: 'up' | 'down', index: number) => void;
  onUpload: (file: File, slotId?: string) => Promise<string>;
  onApproveBooking: (id: string) => void;
  onRejectBooking: (id: string, notes: string) => void;
}

export function SuperadminAdsView({
  site: _site,
  role,
  ads,
  packages,
  bookings,
  savingAdId,
  onRefresh,
  onAddLeaderboardBanner,
  onUpdateAd,
  onDeleteAd,
  onReorderAds,
  onUpload,
  onApproveBooking,
  onRejectBooking,
}: Props) {
  const [activeTab, setActiveTab] = useState<'active_ads' | 'packages' | 'bookings'>('active_ads');
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgSlot, setPkgSlot] = useState('leaderboard');
  const [pkgFormat, setPkgFormat] = useState('ALL');
  const [pkgDuration, setPkgDuration] = useState('7');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const isSuperadmin = role === 'superadmin';
  const { addToast } = useToastStore();

  const handleCreateOrUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: pkgName,
        slot: pkgSlot,
        allowedFormat: pkgFormat,
        durationDays: parseInt(pkgDuration, 10),
        price: parseFloat(pkgPrice),
        description: pkgDesc || null,
        isActive: true,
      };
      if (editingPkgId) {
        await api.patch(`/ads/packages/${editingPkgId}`, payload);
      } else {
        await api.post('/ads/packages', payload);
      }
      addToast(editingPkgId ? 'Paket iklan diperbarui' : 'Paket iklan dibuat', 'success');
      setShowPkgForm(false);
      setEditingPkgId(null);
      setPkgName('');
      setPkgPrice('');
      setPkgDesc('');
      onRefresh();
    } catch (err) {
      console.error('Gagal menyimpan paket:', err);
      addToast('Gagal menyimpan paket iklan', 'error');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Hapus paket ini?')) return;
    try {
      await api.delete(`/ads/packages/${id}`);
      addToast('Paket iklan dihapus', 'success');
      onRefresh();
    } catch (err) {
      console.error('Gagal menghapus paket:', err);
      addToast('Gagal menghapus paket iklan', 'error');
    }
  };

  const handleReject = () => {
    if (showRejectModal && rejectionNotes.trim()) {
      onRejectBooking(showRejectModal, rejectionNotes);
      setShowRejectModal(null);
      setRejectionNotes('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-100 dark:border-white/5 pb-px gap-6">
        <button
          onClick={() => setActiveTab('active_ads')}
          className={cn(
            "pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative border-b-2",
            activeTab === 'active_ads' ? "border-brand-red text-brand-red" : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          Slot Iklan Regional Aktif
        </button>
        {isSuperadmin && (
          <>
            <button
              onClick={() => setActiveTab('packages')}
              className={cn(
                "pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative border-b-2",
                activeTab === 'packages' ? "border-brand-red text-brand-red" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Katalog Paket Iklan (CRUD)
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={cn(
                "pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative border-b-2",
                activeTab === 'bookings' ? "border-brand-red text-brand-red" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Antrean Validasi Booking
              {bookings.filter(b => b.paymentStatus === 'VERIFYING').length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-brand-red text-white text-[8px] font-black rounded-full animate-pulse">
                  {bookings.filter(b => b.paymentStatus === 'VERIFYING').length} NEW
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Tab: Active Ads */}
      {activeTab === 'active_ads' && (
        <div className="grid grid-cols-1 gap-8">
          <LeaderboardManager
            ads={ads.filter(a => a.slot === 'leaderboard').sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
            slotDef={AD_SLOT_DEFINITIONS.find(s => s.id === 'leaderboard')!}
            onAdd={onAddLeaderboardBanner}
            onUpdate={onUpdateAd}
            onDelete={onDeleteAd}
            onReorder={onReorderAds}
            onUpload={onUpload}
            savingId={savingAdId}
          />
          {AD_SLOT_DEFINITIONS.filter(s => s.id !== 'leaderboard').map(slot => (
            <AdSlotCard
              key={slot.id}
              slot={slot}
              data={ads.find(a => a.slot === slot.id)}
              onSave={(_p) => {/* handled by parent */}}
              onUpload={onUpload}
              isSaving={savingAdId === slot.id}
            />
          ))}
        </div>
      )}

      {/* Tab: Packages */}
      {isSuperadmin && activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-widest">Katalog Paket Tarif Iklan Dinamis</h3>
            <button
              onClick={() => {
                setEditingPkgId(null);
                setPkgName('');
                setPkgSlot('leaderboard');
                setPkgFormat('ALL');
                setPkgDuration('7');
                setPkgPrice('');
                setPkgDesc('');
                setShowPkgForm(!showPkgForm);
              }}
              className="px-4 py-2.5 bg-brand-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-red/10"
            >
              <Plus size={14} /> {showPkgForm ? 'Tutup Form' : 'Tambah Paket Baru'}
            </button>
          </div>

          {showPkgForm && (
            <form onSubmit={handleCreateOrUpdatePackage} className="dash-card p-6 space-y-6 animate-fade-in">
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-red">{editingPkgId ? 'Ubah Paket Iklan' : 'Buat Paket Iklan Baru'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div>
                  <label className="dash-label mb-2 block">Nama Paket</label>
                  <input type="text" value={pkgName} onChange={(e) => setPkgName(e.target.value)} placeholder="Contoh: Premium Leaderboard Bulanan" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all" required />
                </div>
                <div>
                  <label className="dash-label mb-2 block">Penempatan Slot</label>
                  <select value={pkgSlot} onChange={(e) => setPkgSlot(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all">
                    {AD_SLOT_DEFINITIONS.map((slot) => (
                      <option key={slot.id} value={slot.id}>{slot.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="dash-label mb-2 block">Format Iklan</label>
                  <select value={pkgFormat} onChange={(e) => setPkgFormat(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all">
                    <option value="ALL">Semua (Banner & Video)</option>
                    <option value="IMAGE">Hanya Banner (Gambar)</option>
                    <option value="VIDEO">Hanya Video (.mp4/.webm)</option>
                  </select>
                </div>
                <div>
                  <label className="dash-label mb-2 block">Durasi (Hari)</label>
                  <input type="number" value={pkgDuration} onChange={(e) => setPkgDuration(e.target.value)} placeholder="7" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all" required />
                </div>
                <div>
                  <label className="dash-label mb-2 block">Harga Sewa Iklan (Rp)</label>
                  <input type="number" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} placeholder="250000" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all" required />
                </div>
              </div>
              <div>
                <label className="dash-label mb-2 block">Penjelasan / Deskripsi Paket</label>
                <textarea value={pkgDesc} onChange={(e) => setPkgDesc(e.target.value)} placeholder="Jelaskan detail keuntungan yang didapatkan pengiklan pada paket ini..." rows={3} className="w-full p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPkgForm(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">Batal</button>
                <button type="submit" className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10">Simpan Paket</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div key={pkg.id} className="dash-card p-6 flex flex-col justify-between group hover:border-brand-red/30 transition-all">
                <div>
                  <div className="flex justify-between items-start">
                    <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider", pkg.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-200 text-gray-400")}>
                      {pkg.isActive ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                    <span className="text-[9px] font-mono text-gray-400 font-bold uppercase">{pkg.slot}</span>
                  </div>
                  <h4 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight mt-3">{pkg.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1">{pkg.description || 'Tidak ada deskripsi.'}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Durasi: {pkg.durationDays} Hari</div>
                    <div className="text-[9px] font-bold text-brand-red uppercase tracking-widest border border-brand-red/20 px-2 py-0.5 rounded-md bg-brand-red/5">
                      {pkg.allowedFormat === 'VIDEO' ? '🎥 VIDEO ONLY' : pkg.allowedFormat === 'IMAGE' ? '📸 BANNER ONLY' : '🎥+📸 ALL FORMAT'}
                    </div>
                  </div>
                  <div className="text-base font-black text-brand-black dark:text-white mt-1">Rp {parseFloat(pkg.price).toLocaleString('id-ID')}</div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-white/5 flex gap-3 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingPkgId(pkg.id);
                      setPkgName(pkg.name);
                      setPkgSlot(pkg.slot);
                      setPkgFormat(pkg.allowedFormat || 'ALL');
                      setPkgDuration(pkg.durationDays.toString());
                      setPkgPrice(pkg.price);
                      setPkgDesc(pkg.description || '');
                      setShowPkgForm(true);
                    }}
                    className="p-2 bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-brand-red rounded-lg transition-colors"
                  >
                    Ubah
                  </button>
                  <button onClick={() => handleDeletePackage(pkg.id)} className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Booking Approvals */}
      {isSuperadmin && activeTab === 'bookings' && (
        <div className="space-y-6">
          <h3 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-widest">Antrean Validasi Pemesanan & Pembayaran Iklan Terpusat</h3>
          {bookings.length === 0 ? (
            <div className="p-20 text-center dash-card">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-xs text-gray-400">Antrean validasi kosong.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map(b => (
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
                        "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest",
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
                        onClick={() => onApproveBooking(b.id)}
                        className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                      >
                        <CheckCircle2 size={12} /> Setujui & Luncurkan!
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
              <button onClick={handleReject} className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/10">Kirim Penolakan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
