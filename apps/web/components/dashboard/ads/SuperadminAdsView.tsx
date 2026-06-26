'use client';

import { useState } from 'react';
import { useToastStore } from '../../../store/toastStore';
import {
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { api } from '../../../lib/api';
import { AD_SLOT_DEFINITIONS } from '../../../lib/constants';
import { AdSlotCard } from './AdSlotCard';
import { LeaderboardManager } from './LeaderboardManager';
import type { Ad, AdPackage, AdBooking } from './types';
import BookingReviewList from './BookingReviewList';

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
  const [pkgSlotFilter, setPkgSlotFilter] = useState<string>('ALL');

  const isSuperadmin = role === 'superadmin';
  const { addToast } = useToastStore();

  // Filtered packages
  const filteredPackages = packages.filter(p => pkgSlotFilter === 'ALL' || p.slot === pkgSlotFilter);

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-widest">Katalog Paket Tarif Iklan Dinamis</h3>
              <select
                value={pkgSlotFilter}
                onChange={e => setPkgSlotFilter(e.target.value)}
                className="px-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider text-gray-500 outline-none"
              >
                <option value="ALL">Semua Slot</option>
                {AD_SLOT_DEFINITIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
            {filteredPackages.map(pkg => (
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
          {filteredPackages.length === 0 && (
            <div className="p-16 text-center dash-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <Plus size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                {pkgSlotFilter === 'ALL' ? 'Belum Ada Paket Iklan' : `Tidak Ada Paket untuk Slot Ini`}
              </p>
              <p className="text-[10px] text-gray-400 max-w-xs mx-auto mb-4">
                {pkgSlotFilter === 'ALL'
                  ? 'Buat paket iklan pertama untuk mulai menerima pesanan dari pengiklan.'
                  : `Belum ada paket untuk slot "${pkgSlotFilter}". Buat paket baru atau coba slot lain.`
                }
              </p>
              {pkgSlotFilter === 'ALL' && (
                <button
                  onClick={() => { setEditingPkgId(null); setPkgName(''); setPkgSlot('leaderboard'); setPkgFormat('ALL'); setPkgDuration('7'); setPkgPrice(''); setPkgDesc(''); setShowPkgForm(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-black transition-colors"
                >
                  <Plus size={14} /> Buat Paket Pertama
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {isSuperadmin && activeTab === 'bookings' && (
        <BookingReviewList
          bookings={bookings}
          onApprove={onApproveBooking}
          onReject={onRejectBooking}
        />
      )}
    </div>
  );
}
