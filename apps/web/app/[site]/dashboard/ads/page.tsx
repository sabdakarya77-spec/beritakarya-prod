'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { useParams } from 'next/navigation';
import {
  Layout,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { type AdSlotId } from '../../../../lib/constants';
import AdImageCropper from '../../../../components/ui/AdImageCropper';
import type { Ad, AdPackage, AdBooking } from '../../../../components/dashboard/ads/types';
import { AdvertiserAdsView } from '../../../../components/dashboard/ads/AdvertiserAdsView';
import { SuperadminAdsView } from '../../../../components/dashboard/ads/SuperadminAdsView';

function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { error?: { message?: string }; message?: string } }
    message?: string
  }
  return err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || fallback
}

export default function AdsDashboard() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Shared States
  const [ads, setAds] = useState<Ad[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [bookings, setBookings] = useState<AdBooking[]>([]);
  const [savingAdId, setSavingAdId] = useState<string | null>(null);

  // Cropper state
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const [cropperAspect, setCropperAspect] = useState(970 / 250);
  const cropperCallbackRef = useRef<((blob: Blob) => void) | null>(null);
  const cropperCancelRef = useRef<(() => void) | null>(null);

  // Aspect ratio per slot type
  const SLOT_ASPECT_RATIOS: Record<AdSlotId, number> = {
    leaderboard: 970 / 250,
    rectangle: 300 / 250,
    rectangle_secondary: 300 / 250,
    in_feed: 300 / 250,
  };

  // Upload file with optional crop
  const uploadAdFile = async (file: File, slotId?: string): Promise<string> => {
    const typedSlotId = slotId as AdSlotId | undefined;
    if (typedSlotId && SLOT_ASPECT_RATIOS[typedSlotId]) {
      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        setCropperAspect(SLOT_ASPECT_RATIOS[typedSlotId]);
        setCropperFile(file);
        cropperCallbackRef.current = resolve;
        cropperCancelRef.current = reject;
      });
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

  // Data Fetching
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
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'CanceledError') console.error('Gagal mengambil data dashboard iklan', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchData deps (site, user) already tracked; stable state setters excluded
  }, [site, user]);

  // Ad Management Handlers
  const handleAddLeaderboardBanner = async () => {
    try {
      await api.post('/ads', { slot: 'leaderboard', isActive: true });
      await fetchData();
    } catch (error: unknown) {
      alert(getApiErrorMessage(error, 'Gagal menambah banner'));
    }
  };

  const handleUpdateAd = async (adId: string, payload: Partial<Ad>) => {
    setSavingAdId(adId);
    try {
      await api.patch(`/ads/${adId}`, payload);
      await fetchData();
    } catch (error: unknown) {
      alert(getApiErrorMessage(error, 'Gagal menyimpan iklan'));
    } finally {
      setSavingAdId(null);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner iklan ini?')) return;
    try {
      await api.delete(`/ads/${adId}`);
      await fetchData();
    } catch (error: unknown) {
      alert(getApiErrorMessage(error, 'Gagal menghapus iklan'));
    }
  };

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
    } catch (error: unknown) {
      alert(getApiErrorMessage(error, 'Gagal mengurutkan iklan'));
    }
  };

  // Booking Handlers
  const handleApproveBooking = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui iklan ini dan meluncurkannya ke website tujuan?')) return;
    try {
      await api.post(`/ads/bookings/${id}/approve`);
      await fetchData();
      alert('Sukses menyetujui iklan! Iklan kini telah disinkronkan dan aktif di website cabang.');
    } catch (error: unknown) {
      alert(getApiErrorMessage(error, 'Gagal menyetujui iklan'));
    }
  };

  const handleRejectBooking = async (bookingId: string, notes: string) => {
    try {
      await api.post(`/ads/bookings/${bookingId}/reject`, { rejectionNotes: notes });
      await fetchData();
      alert('Sukses menolak pengajuan iklan.');
    } catch (error: unknown) {
      alert(getApiErrorMessage(error, 'Gagal menolak iklan'));
    }
  };

  // Role Check
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
      {/* Header */}
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
        <button onClick={() => fetchData()} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-brand-black dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw size={32} className="animate-spin text-brand-red" />
        </div>
      ) : (
        <>
          {/* ADVERTISER VIEW */}
          {user?.role === 'advertiser' && (
            <AdvertiserAdsView
              site={site}
              packages={packages}
              bookings={bookings}
              onRefresh={() => fetchData()}
            />
          )}

          {/* SUPERADMIN / WAPIMRED VIEW */}
          {(user?.role === 'superadmin' || user?.role === 'wapimred') && (
            <SuperadminAdsView
              site={site}
              role={user.role}
              ads={ads}
              packages={packages}
              bookings={bookings}
              savingAdId={savingAdId}
              onRefresh={() => fetchData()}
              onAddLeaderboardBanner={handleAddLeaderboardBanner}
              onUpdateAd={handleUpdateAd}
              onDeleteAd={handleDeleteAd}
              onReorderAds={handleReorderAds}
              onUpload={uploadAdFile}
              onApproveBooking={handleApproveBooking}
              onRejectBooking={handleRejectBooking}
            />
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
