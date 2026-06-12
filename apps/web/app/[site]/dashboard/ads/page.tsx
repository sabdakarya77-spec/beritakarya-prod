'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { useParams } from 'next/navigation';
import {
  Layout,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  Upload,
  RefreshCw,
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  CreditCard,
  Wallet,
  Eye,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { AD_SLOT_DEFINITIONS, type AdSlotId } from '../../../../lib/constants';
import AdImageCropper from '../../../../components/ui/AdImageCropper';
import type { Ad, AdPackage, AdBooking } from '../../../../components/dashboard/ads/types';
import { AdSlotCard } from '../../../../components/dashboard/ads/AdSlotCard';
import { LeaderboardManager } from '../../../../components/dashboard/ads/LeaderboardManager';

export default function AdsDashboard() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Superadmin States
  const [activeTab, setActiveTab] = useState<'active_ads' | 'packages' | 'bookings'>('active_ads');
  const [ads, setAds] = useState<Ad[]>([]);
  const [savingAdId, setSavingAdId] = useState<string | null>(null);
  
  // Dynamic Ad Packages States
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [pkgName, setPkgName] = useState('');
  const [pkgSlot, setPkgSlot] = useState('leaderboard');
  const [pkgFormat, setPkgFormat] = useState('ALL');
  const [pkgDuration, setPkgDuration] = useState('7');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Booking States (Superadmin & Advertiser)
  const [bookings, setBookings] = useState<AdBooking[]>([]);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Advertiser Wizard States
  const [advTab, setAdvTab] = useState<'book' | 'history'>('book');
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [advImageUrl, setAdvImageUrl] = useState('');
  const [advLinkUrl, setAdvLinkUrl] = useState('');
  const [advStartDate, setAdvStartDate] = useState('');
  const [advEndDate, setAdvEndDate] = useState('');
  const [advPaymentProof, setAdvPaymentProof] = useState('');
  const [bookingStep, setBookingStep] = useState(1);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Cropper state
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const [cropperAspect, setCropperAspect] = useState(970 / 250);
  const cropperCallbackRef = useRef<((blob: Blob) => void) | null>(null);

  // Aspect ratio per slot type
  const SLOT_ASPECT_RATIOS: Record<AdSlotId, number> = {
    leaderboard: 970 / 250,
    rectangle: 300 / 250,
    rectangle_secondary: 300 / 250,
    in_feed: 300 / 250,
  };

  // Upload file with optional crop
  const uploadAdFile = async (file: File, slotId?: string): Promise<string> => {
    // If slot has an aspect ratio, show cropper first
    const typedSlotId = slotId as AdSlotId | undefined;
    if (typedSlotId && SLOT_ASPECT_RATIOS[typedSlotId]) {
      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        setCropperAspect(SLOT_ASPECT_RATIOS[typedSlotId]);
        setCropperFile(file);
        cropperCallbackRef.current = resolve;
        // onCancel will reject
        cropperCancelRef.current = reject;
      });
      // Upload the cropped blob
      const croppedFile = new File([croppedBlob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
      return doUpload(croppedFile);
    }
    return doUpload(file);
  };

  const doUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteId', site || 'pusat');
    const res = await api.post('/media/upload?purpose=ad', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data?.data?.url || res.data?.url || res.data?.filePath || '';
  };

  const cropperCancelRef = useRef<(() => void) | null>(null);

  const handleCropperComplete = (blob: Blob) => {
    setCropperFile(null);
    cropperCallbackRef.current?.(blob);
    cropperCallbackRef.current = null;
  };

  const handleCropperCancel = () => {
    setCropperFile(null);
    cropperCancelRef.current?.();
    cropperCancelRef.current = null;
  };

  // Initial Data Loaders
  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      if (user?.role === 'superadmin' || user?.role === 'wapimred') {
        const [adsRes, pkgsRes, bookingsRes] = await Promise.all([
          api.get('/ads', { signal }),
          api.get('/ads/packages', { signal }),
          api.get('/ads/bookings/all', { signal }).catch(() => ({ data: { data: [] } }))
        ]);
        if (signal?.aborted) return;
        setAds(adsRes.data.data || []);
        setPackages(pkgsRes.data.data || []);
        setBookings(bookingsRes.data.data || []);
      } else if (user?.role === 'advertiser') {
        const [pkgsRes, bookingsRes] = await Promise.all([
          api.get('/ads/packages', { signal }),
          api.get('/ads/bookings/my', { signal }).catch(() => ({ data: { data: [] } }))
        ]);
        if (signal?.aborted) return;
        setPackages(pkgsRes.data.data || []);
        setBookings(bookingsRes.data.data || []);
      }
    } catch (error: any) {
      if (error?.name !== 'CanceledError') console.error('Gagal mengambil data dashboard iklan', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => { controller.abort(); };
  }, [site, user]);

  // Auto-fill endDate when startDate or selected package changes
  useEffect(() => {
    if (advStartDate && selectedPkgId) {
      const pkg = packages.find(p => p.id === selectedPkgId);
      if (pkg) {
        const end = new Date(advStartDate);
        end.setDate(end.getDate() + pkg.durationDays);
        setAdvEndDate(end.toISOString().split('T')[0]);
      }
    }
  }, [advStartDate, selectedPkgId, packages]);

  // Handler: Save active static ad for single-banner slots (rectangle, etc.)
  const handleSaveActiveAd = async (slotId: string, payload: Partial<Ad>) => {
    setSavingAdId(slotId);
    try {
      const existing = ads.find(a => a.slot === slotId);
      if (existing) {
        await api.patch(`/ads/${existing.id}`, { slot: slotId, ...payload });
      } else {
        await api.post('/ads', { slot: slotId, ...payload });
      }
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menyimpan konfigurasi iklan');
    } finally {
      setSavingAdId(null);
    }
  };

  // Handler: Add new leaderboard banner
  const handleAddLeaderboardBanner = async () => {
    try {
      await api.post('/ads', { slot: 'leaderboard', isActive: true });
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menambah banner');
    }
  };

  // Handler: Update any ad by ID
  const handleUpdateAd = async (adId: string, payload: Partial<Ad>) => {
    setSavingAdId(adId);
    try {
      await api.patch(`/ads/${adId}`, payload);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menyimpan iklan');
    } finally {
      setSavingAdId(null);
    }
  };

  // Handler: Delete ad by ID
  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner iklan ini?')) return;
    try {
      await api.delete(`/ads/${adId}`);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menghapus iklan');
    }
  };

  // Handler: Reorder leaderboard banners
  const handleReorderAds = async (slotId: string, direction: 'up' | 'down', adIndex: number) => {
    const slotAds = ads.filter(a => a.slot === slotId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const targetIndex = direction === 'up' ? adIndex - 1 : adIndex + 1;
    if (targetIndex < 0 || targetIndex >= slotAds.length) return;

    const items = [...slotAds];
    [items[adIndex], items[targetIndex]] = [items[targetIndex], items[adIndex]];
    const reorderPayload = items.map((item, idx) => ({ id: item.id, order: idx }));

    try {
      await api.patch('/ads/reorder', { items: reorderPayload });
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal mengurutkan iklan');
    }
  };

  // Handler: Manage dynamic Packages (Superadmin Only)
  const handleCreateOrUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: pkgName,
        slot: pkgSlot,
        allowedFormat: pkgFormat,
        durationDays: parseInt(pkgDuration),
        price: parseFloat(pkgPrice),
        description: pkgDesc
      };

      if (editingPkgId) {
        await api.patch(`/ads/packages/${editingPkgId}`, payload);
      } else {
        await api.post('/ads/packages', payload);
      }

      setPkgName('');
      setPkgPrice('');
      setPkgDesc('');
      setPkgFormat('ALL');
      setEditingPkgId(null);
      setShowPkgForm(false);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menyimpan paket');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket iklan ini?')) return;
    try {
      await api.delete(`/ads/packages/${id}`);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menghapus paket');
    }
  };

  // Handler: Advertiser Booking
  const handleCreateBooking = async () => {
    if (!selectedPkgId || !advImageUrl || !advLinkUrl || !advStartDate) {
      alert('Harap isi semua form kampanye iklan Anda!');
      return;
    }
    setIsSubmittingBooking(true);
    try {
      const bookingRes = await api.post('/ads/bookings', {
        packageId: selectedPkgId,
        siteId: site,
        imageUrl: advImageUrl,
        linkUrl: advLinkUrl,
        startDate: advStartDate,
        endDate: advEndDate
      });

      const newBookingId = bookingRes.data.data.id;

      // Upload payment proof if provided
      if (advPaymentProof) {
        await api.post(`/ads/bookings/${newBookingId}/pay`, {
          paymentProof: advPaymentProof
        });
      }

      // Reset
      setSelectedPkgId('');
      setAdvImageUrl('');
      setAdvLinkUrl('');
      setAdvStartDate('');
      setAdvEndDate('');
      setAdvPaymentProof('');
      setBookingStep(1);
      setAdvTab('history');
      await fetchData();
      alert('Pengajuan pemesanan iklan regional Anda berhasil dikirim! Menunggu validasi Superadmin.');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal melakukan pemesanan iklan');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Handler: Superadmin Approval/Rejection
  const handleApproveBooking = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui iklan ini dan meluncurkannya ke website tujuan?')) return;
    try {
      await api.post(`/ads/bookings/${id}/approve`);
      await fetchData();
      alert('Sukses menyetujui iklan! Iklan kini telah disinkronkan dan aktif di website cabang.');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menyetujui iklan');
    }
  };

  const handleRejectBooking = async () => {
    if (!showRejectModal) return;
    try {
      await api.post(`/ads/bookings/${showRejectModal}/reject`, {
        rejectionNotes
      });
      setShowRejectModal(null);
      setRejectionNotes('');
      await fetchData();
      alert('Sukses menolak pengajuan iklan.');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menolak pengajuan iklan');
    }
  };

  // Check Role Access
  if (user?.role !== 'superadmin' && user?.role !== 'wapimred' && user?.role !== 'advertiser') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya dapat diakses oleh Pengiklan, Wapimred, dan Superadmin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      
      {/* ========================================================
          SECTION 1: HEADER & STATS
          ======================================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/20">
            <Layout size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight uppercase">Portal Iklan & Monetisasi</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Cabang Regional: <strong className="text-brand-red">{site}</strong> 
              {user?.role && <span className="ml-2 px-2.5 py-0.5 bg-brand-black dark:bg-white/10 text-brand-red rounded-full font-black text-[9px] uppercase tracking-wider">{user.role}</span>}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw size={32} className="animate-spin text-brand-red" />
        </div>
      ) : (
        <>
          {/* ========================================================
              SECTION 2: ADVERTISER VIEW
              ======================================================== */}
          {user?.role === 'advertiser' && (
            <div className="space-y-8">
              {/* Advertiser Cards */}
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
                <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-amber-500">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Eye size={20} /></div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Klik</p>
                    <p className="text-xl font-black text-brand-black dark:text-white">{bookings.reduce((acc, b) => acc + b.clicks, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-gray-100 dark:border-white/5 pb-px gap-6">
                <button 
                  onClick={() => setAdvTab('book')}
                  className={cn(
                    "pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative border-b-2",
                    advTab === 'book' ? "border-brand-red text-brand-red" : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  Pesan Iklan Regional Baru
                </button>
                <button 
                  onClick={() => setAdvTab('history')}
                  className={cn(
                    "pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative border-b-2",
                    advTab === 'history' ? "border-brand-red text-brand-red" : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  Riwayat Booking & Performa
                </button>
              </div>

              {/* TAB 1: Booking Wizard */}
              {advTab === 'book' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Form Wizard Column */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Wizard Steps Indicator */}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]", bookingStep === 1 ? "bg-brand-red text-white" : "bg-gray-200 dark:bg-white/10 text-gray-400")}>1</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white">Pilih Paket</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300" />
                      <div className="flex items-center gap-2">
                        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]", bookingStep === 2 ? "bg-brand-red text-white" : "bg-gray-200 dark:bg-white/10 text-gray-400")}>2</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white">Media Iklan</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300" />
                      <div className="flex items-center gap-2">
                        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px]", bookingStep === 3 ? "bg-brand-red text-white" : "bg-gray-200 dark:bg-white/10 text-gray-400")}>3</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white">Pembayaran</span>
                      </div>
                    </div>

                    {/* Step 1 Content: Package Selection */}
                    {bookingStep === 1 && (
                      <div className="space-y-6">
                        <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Langkah 1: Pilih Paket Iklan Regional Anda</h3>
                        {packages.length === 0 ? (
                          <div className="p-12 text-center dash-card">
                            <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-xs text-gray-400">Belum ada paket iklan aktif dari Superadmin Pusat saat ini.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {packages.map(pkg => (
                              <div 
                                key={pkg.id}
                                onClick={() => setSelectedPkgId(pkg.id)}
                                className={cn(
                                  "dash-card p-6 cursor-pointer transition-all border-2 relative overflow-hidden group hover:scale-[1.02]",
                                  selectedPkgId === pkg.id 
                                    ? "border-brand-red shadow-lg shadow-brand-red/10" 
                                    : "border-gray-100 dark:border-white/5 hover:border-brand-red/50"
                                )}
                              >
                                {selectedPkgId === pkg.id && (
                                  <div className="absolute top-0 right-0 w-8 h-8 bg-brand-red text-white flex items-center justify-center rounded-bl-xl font-bold">✓</div>
                                )}
                                <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-brand-red rounded-full uppercase tracking-wider mb-3 inline-block">Slot: {pkg.slot}</span>
                                <h4 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight group-hover:text-brand-red transition-colors">{pkg.name}</h4>
                                <p className="text-[10px] text-gray-400 mt-1">{pkg.description || 'Tidak ada deskripsi paket.'}</p>
                                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-white/5 flex justify-between items-baseline">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Durasi: {pkg.durationDays} Hari</span>
                                  <span className="text-sm font-black text-brand-black dark:text-white">Rp {parseFloat(pkg.price).toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-end pt-4">
                          <button 
                            disabled={!selectedPkgId}
                            onClick={() => setBookingStep(2)}
                            className={cn(
                              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                              selectedPkgId ? "bg-brand-red text-white hover:opacity-90 shadow-lg" : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                            )}
                          >
                            Lanjutkan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2 Content: Creative Media */}
                    {bookingStep === 2 && (
                      <div className="space-y-6">
                        <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Langkah 2: Materi & Tanggal Kampanye Iklan</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="dash-label mb-2 block">URL Banner Gambar (WebP/JPG)</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={advImageUrl}
                                  onChange={(e) => setAdvImageUrl(e.target.value)}
                                  placeholder="https://... (Gunakan file WebP/JPG terkompresi)"
                                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                                />
                                <button className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500 hover:text-brand-red transition-all"><Upload size={16} /></button>
                              </div>
                            </div>
                            <div>
                              <label className="dash-label mb-2 block">Tautan Tujuan (Saat Banner Diklik)</label>
                              <input 
                                type="text" 
                                value={advLinkUrl}
                                onChange={(e) => setAdvLinkUrl(e.target.value)}
                                placeholder="https://website-klien.com"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="dash-label mb-2 block">Tanggal Mulai</label>
                                <input 
                                  type="date" 
                                  value={advStartDate}
                                  onChange={(e) => setAdvStartDate(e.target.value)}
                                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                                />
                              </div>
                              <div>
                                <label className="dash-label mb-2 block">Tanggal Selesai (Otomatis)</label>
                                <input
                                  type="date"
                                  value={advEndDate}
                                  readOnly
                                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none text-gray-500 cursor-not-allowed"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Preview Creative */}
                          <div className="space-y-2">
                            <label className="dash-label">Live Preview Banner / Video</label>
                            <div className="aspect-[4/3] md:aspect-auto md:h-[210px] bg-gray-50 dark:bg-black/20 rounded-2xl border-2 border-dashed border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden relative">
                              {advImageUrl ? (
                                advImageUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i) || advImageUrl.toLowerCase().includes('video') ? (
                                  <video src={advImageUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                                ) : (
                                  <img src={advImageUrl} alt="Ad Preview" className="w-full h-full object-contain" />
                                )
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-300">
                                  <ImageIcon size={32} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Pratinjau Materi</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button onClick={() => setBookingStep(1)} className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest">Kembali</button>
                          <button
                            disabled={!advImageUrl || !advLinkUrl || !advStartDate}
                            onClick={() => setBookingStep(3)}
                            className={cn(
                              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                              (advImageUrl && advLinkUrl && advStartDate) ? "bg-brand-red text-white hover:opacity-90 shadow-lg" : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                            )}
                          >
                            Lanjutkan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3 Content: Payments */}
                    {bookingStep === 3 && (
                      <div className="space-y-6">
                        <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Langkah 3: Administrasi Pembayaran Satu Pintu Terpusat</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Payment Instructions Card */}
                          <div className="bg-brand-black text-white p-6 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
                            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-brand-red/10 rounded-full blur-2xl" />
                            <div className="flex items-center gap-2 mb-6">
                              <CreditCard size={18} className="text-brand-red" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">BANK TRANSFER TUJUAN PUSAT</span>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">BANK BCA NUSANTARA</h4>
                                <p className="text-base font-black tracking-widest text-white">829-0123-456</p>
                                <p className="text-[9px] font-bold text-brand-red uppercase tracking-widest">a/n PT Berita Karya Nusantara</p>
                              </div>
                              
                              <div className="border-t border-white/5 pt-3">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">BANK MANDIRI</h4>
                                <p className="text-base font-black tracking-widest text-white">137-00-1234567-8</p>
                                <p className="text-[9px] font-bold text-brand-red uppercase tracking-widest">a/n PT Berita Karya Nusantara</p>
                              </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 space-y-1 text-[9px] text-gray-400 uppercase tracking-widest leading-relaxed">
                              <p>• Nominal Transfer wajib pas sesuai paket</p>
                              <p>• Simpan struk / bukti transfer bank Anda</p>
                              <p>• Unggah bukti transfer pada kolom di samping</p>
                            </div>
                          </div>

                          {/* Upload Payment Proof Column */}
                          <div className="space-y-4">
                            <div>
                              <label className="dash-label mb-2 block">Bukti Transfer Bank (URL Gambar Resi / QRIS)</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={advPaymentProof}
                                  onChange={(e) => setAdvPaymentProof(e.target.value)}
                                  placeholder="https://... (Foto struk transfer ATM / Mobile Banking)"
                                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                                />
                                <button className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500 hover:text-brand-red transition-all"><Upload size={16} /></button>
                              </div>
                            </div>

                            {/* Bukti Bayar Preview */}
                            <div className="aspect-[4/2] bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
                              {advPaymentProof ? (
                                <img src={advPaymentProof} alt="Bukti Transfer" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Belum ada unggahan bukti bayar</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button onClick={() => setBookingStep(2)} className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest">Kembali</button>
                          <button 
                            disabled={isSubmittingBooking}
                            onClick={handleCreateBooking}
                            className="px-10 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 hover:opacity-90 transition-all flex items-center gap-2"
                          >
                            {isSubmittingBooking ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Kirim Kampanye Iklan
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Pricing Info Side Column */}
                  <div className="space-y-6">
                    <div className="dash-card p-6 bg-brand-red/5 border-brand-red/10">
                      <h4 className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-3">Rincian Paket Terpilih</h4>
                      {selectedPkgId ? (
                        (() => {
                          const pkg = packages.find(p => p.id === selectedPkgId);
                          if (!pkg) return null;
                          return (
                            <div className="space-y-4">
                              <div>
                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Nama Paket</p>
                                <p className="text-xs font-black text-brand-black dark:text-white uppercase mt-0.5">{pkg.name}</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Target Wilayah Penayangan</p>
                                <p className="text-xs font-black text-brand-red uppercase mt-0.5">{site}.beritakarya.co</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Durasi Sewa Iklan</p>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">{pkg.durationDays} Hari Kalender</p>
                              </div>
                              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-baseline">
                                <span className="text-[9px] text-brand-red font-black uppercase tracking-widest">TOTAL BIAYA:</span>
                                <span className="text-sm font-black text-brand-black dark:text-white">Rp {parseFloat(pkg.price).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">Harap pilih paket iklan terlebih dahulu di Langkah 1.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Booking History & Analytics */}
              {advTab === 'history' && (
                <div className="dash-card overflow-hidden">
                  <div className="p-6 border-b border-gray-50 dark:border-white/5">
                    <h3 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-widest">Riwayat Booking & Kinerja Penayangan Kampanye Iklan</h3>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="p-20 text-center">
                      <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-xs text-gray-400">Anda belum memiliki riwayat pengajuan pemesanan iklan.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-white/5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">
                            <th className="p-6">Informasi Kampanye / Paket</th>
                            <th className="p-6">Rentang Tanggal</th>
                            <th className="p-6">Status Pembayaran</th>
                            <th className="p-6">Status Penayangan</th>
                            <th className="p-6 text-right">Analitik (Imp / Clicks / CTR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                          {bookings.map(b => (
                            <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                              <td className="p-6">
                                <div className="font-bold text-brand-black dark:text-white uppercase text-[11px]">{b.package.name}</div>
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Slot: {b.package.slot} • Site: {b.siteId}</div>
                                {b.rejectionNotes && (
                                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 rounded-lg text-[9px] text-red-500 font-bold uppercase tracking-wider">
                                    Ditolak: {b.rejectionNotes}
                                  </div>
                                )}
                              </td>
                              <td className="p-6 text-[10px] text-gray-400 font-bold">
                                {new Date(b.startDate).toLocaleDateString('id-ID')} s.d {new Date(b.endDate).toLocaleDateString('id-ID')}
                              </td>
                              <td className="p-6">
                                <span className={cn(
                                  "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest",
                                  b.paymentStatus === 'PAID' ? "bg-emerald-500/10 text-emerald-500" :
                                  b.paymentStatus === 'VERIFYING' ? "bg-blue-500/10 text-blue-500" :
                                  b.paymentStatus === 'REJECTED' ? "bg-red-500/10 text-red-500" :
                                  "bg-amber-500/10 text-amber-500"
                                )}>
                                  {b.paymentStatus === 'PAID' ? 'LUNAS' :
                                   b.paymentStatus === 'VERIFYING' ? 'VERIFIKASI' :
                                   b.paymentStatus === 'REJECTED' ? 'DITOLAK' : 'PENDING'}
                                </span>
                              </td>
                              <td className="p-6">
                                <span className={cn(
                                  "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest",
                                  b.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 animate-pulse" :
                                  b.status === 'COMPLETED' ? "bg-slate-500/10 text-slate-400" :
                                  b.status === 'REJECTED' ? "bg-red-500/10 text-red-500" :
                                  "bg-amber-500/10 text-amber-500"
                                )}>
                                  {b.status === 'ACTIVE' ? 'TAYANG' :
                                   b.status === 'COMPLETED' ? 'SELESAI' :
                                   b.status === 'REJECTED' ? 'REJECTED' : 'MENUNGGU VERIFIKASI'}
                                </span>
                              </td>
                              <td className="p-6 text-right font-mono text-[11px] text-brand-black dark:text-white space-y-0.5">
                                <div>Impresi: {b.impressions.toLocaleString()}</div>
                                <div className="text-gray-400 text-[10px]">Klik: {b.clicks.toLocaleString()}</div>
                                <div className="text-emerald-500 font-bold text-[10px]">
                                  CTR: {b.impressions ? (b.clicks / b.impressions * 100).toFixed(2) : '0.00'}%
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              SECTION 3: SUPERADMIN / WAPIMRED VIEW
              ======================================================== */}
          {(user?.role === 'superadmin' || user?.role === 'wapimred') && (
            <div className="space-y-8">
              
              {/* Superadmin Tab Navigation */}
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
                {user.role === 'superadmin' && (
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

              {/* Tab Content A: Active static slots (existing code functionality) */}
              {activeTab === 'active_ads' && (
                <div className="grid grid-cols-1 gap-8">
                  {/* Leaderboard: Multi-banner carousel manager */}
                  <LeaderboardManager
                    ads={ads.filter(a => a.slot === 'leaderboard').sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
                    slotDef={AD_SLOT_DEFINITIONS.find(s => s.id === 'leaderboard')!}
                    onAdd={handleAddLeaderboardBanner}
                    onUpdate={handleUpdateAd}
                    onDelete={handleDeleteAd}
                    onReorder={handleReorderAds}
                    onUpload={uploadAdFile}
                    savingId={savingAdId}
                  />

                  {/* Other slots: Single AdSlotCard */}
                  {AD_SLOT_DEFINITIONS.filter(s => s.id !== 'leaderboard').map(slot => (
                    <AdSlotCard
                      key={slot.id}
                      slot={slot}
                      data={ads.find(a => a.slot === slot.id)}
                      onSave={(p) => handleSaveActiveAd(slot.id, p)}
                      onUpload={uploadAdFile}
                      isSaving={savingAdId === slot.id}
                    />
                  ))}
                </div>
              )}

              {/* Tab Content B: Packages Management (Superadmin Only) */}
              {user.role === 'superadmin' && activeTab === 'packages' && (
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
                          <input 
                            type="text" 
                            value={pkgName}
                            onChange={(e) => setPkgName(e.target.value)}
                            placeholder="Contoh: Premium Leaderboard Bulanan"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="dash-label mb-2 block">Penempatan Slot</label>
                          <select 
                            value={pkgSlot}
                            onChange={(e) => setPkgSlot(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                          >
                            {AD_SLOT_DEFINITIONS.map((slot) => (
                              <option key={slot.id} value={slot.id}>{slot.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="dash-label mb-2 block">Format Iklan</label>
                          <select 
                            value={pkgFormat}
                            onChange={(e) => setPkgFormat(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                          >
                            <option value="ALL">Semua (Banner & Video)</option>
                            <option value="IMAGE">Hanya Banner (Gambar)</option>
                            <option value="VIDEO">Hanya Video (.mp4/.webm)</option>
                          </select>
                        </div>
                        <div>
                          <label className="dash-label mb-2 block">Durasi (Hari)</label>
                          <input 
                            type="number" 
                            value={pkgDuration}
                            onChange={(e) => setPkgDuration(e.target.value)}
                            placeholder="7"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="dash-label mb-2 block">Harga Sewa Iklan (Rp)</label>
                          <input 
                            type="number" 
                            value={pkgPrice}
                            onChange={(e) => setPkgPrice(e.target.value)}
                            placeholder="250000"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="dash-label mb-2 block">Penjelasan / Deskripsi Paket</label>
                        <textarea 
                          value={pkgDesc}
                          onChange={(e) => setPkgDesc(e.target.value)}
                          placeholder="Jelaskan detail keuntungan yang didapatkan pengiklan pada paket ini..."
                          rows={3}
                          className="w-full p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                        />
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
                          <button 
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content C: Booking Approvals Queue (Superadmin Only) */}
              {user.role === 'superadmin' && activeTab === 'bookings' && (
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
                          <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">{b.package.name}</h4>
                                <span className="text-[8px] font-black px-2 py-0.5 bg-brand-red/10 text-brand-red rounded-full uppercase tracking-wider">{b.siteId} (Cabang)</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">Pemesan: <strong className="text-brand-black dark:text-white">{b.user?.name}</strong> ({b.user?.email})</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest",
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

                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Metadata */}
                            <div className="space-y-4 text-[11px] border-r border-gray-50 dark:border-white/5 pr-6">
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
                                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Nilai Transaksi (Pembayaran Terpusat)</span>
                                <div className="text-sm font-black text-brand-black dark:text-white">Rp {parseFloat(b.package.price).toLocaleString('id-ID')}</div>
                              </div>
                              {b.rejectionNotes && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 rounded-xl text-[9px] text-red-500 font-bold uppercase tracking-wider">
                                  Catatan Penolakan: {b.rejectionNotes}
                                </div>
                              )}
                            </div>

                            {/* Banner Preview */}
                            <div className="space-y-2 border-r border-gray-50 dark:border-white/5 pr-6">
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

                            {/* Bukti Bayar Preview */}
                            <div className="space-y-2">
                              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block">Bukti Transfer (Zoomable)</span>
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

                          {/* Approval Actions */}
                          {b.paymentStatus === 'VERIFYING' && (
                            <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
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
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* Guidelines */}
      <div className="dash-card p-6 bg-blue-50/50 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/10 rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><AlertCircle size={22} /></div>
          <div>
            <h4 className="text-[11px] font-black text-blue-950 dark:text-blue-300 uppercase tracking-widest mb-1.5">Ketentuan & Panduan Portal Iklan BeritaKarya</h4>
            <ul className="text-[10px] text-blue-800/80 dark:text-blue-400/80 space-y-2 list-disc pl-4 leading-relaxed font-bold uppercase tracking-wider">
              <li>Penyelarasan iklan regional berjalan otomatis seketika setelah Superadmin Pusat menyetujui pengajuan kampanye pengiklan.</li>
              <li>Untuk mengoptimalkan kecepatan muat halaman portal wilayah, semua file spanduk iklan disarankan dikompresi ke format **WebP** dengan batas maksimum ukuran file sebesar **200 KB**.</li>
              <li>Administrasi keuangan di portal wilayah dikendalikan sepenuhnya melalui sistem transfer satu pintu rekening terpusat.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: REJECTION NOTES
          ======================================================== */}
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
              placeholder="Contoh: Bukti transfer tidak terbaca karena buram, silakan upload bukti transfer ATM yang lebih jelas."
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

      {/* Image Cropper Modal */}
      {cropperFile && (
        <AdImageCropper
          file={cropperFile}
          aspectRatio={cropperAspect}
          onComplete={handleCropperComplete}
          onCancel={handleCropperCancel}
        />
      )}

    </div>
  );
}
