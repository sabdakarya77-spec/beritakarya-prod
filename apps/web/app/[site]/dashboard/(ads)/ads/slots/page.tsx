'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../../../lib/api';
import { useAuthStore } from '../../../../../../store/authStore';
import { useToastStore } from '../../../../../../store/toastStore';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { type AdSlotId, AD_SLOT_DEFINITIONS } from '../../../../../../lib/constants';
import AdImageCropper from '../../../../../../components/ui/AdImageCropper';
import type { Ad } from '../../../../../../components/dashboard/ads/types';
import { LeaderboardManager } from '../../../../../../components/dashboard/ads/LeaderboardManager';
import { AdSlotCard } from '../../../../../../components/dashboard/ads/AdSlotCard';

export default function AdsSlotsPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [savingAdId, setSavingAdId] = useState<string | null>(null);

  // Cropper state
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const [cropperAspect, setCropperAspect] = useState(970 / 250);
  const [cropperMinWidth, setCropperMinWidth] = useState<number | undefined>(undefined);
  const [cropperMinHeight, setCropperMinHeight] = useState<number | undefined>(undefined);
  const cropperCallbackRef = useRef<((blob: Blob) => void) | null>(null);
  const cropperCancelRef = useRef<(() => void) | null>(null);

  const SLOT_ASPECT_RATIOS: Record<AdSlotId, number> = {
    leaderboard: 970 / 250,
    rectangle: 300 / 250,
    rectangle_secondary: 300 / 250,
    in_feed: 300 / 250,
  };

  // Minimum dimensions matching backend validation (media.controller.ts)
  const SLOT_MIN_DIMENSIONS: Record<AdSlotId, { width: number; height: number }> = {
    leaderboard: { width: 600, height: 150 },
    rectangle: { width: 200, height: 180 },
    rectangle_secondary: { width: 200, height: 180 },
    in_feed: { width: 200, height: 180 },
  };

  const uploadAdFile = async (file: File, slotId?: string): Promise<string> => {
    const isVideo = file.type.startsWith('video/');
    // Video: skip cropper, upload directly (backend stores as-is)
    if (isVideo) {
      return doUpload(file, slotId);
    }
    // Image: open cropper for manual adjustment, then upload
    const typedSlotId = slotId as AdSlotId | undefined;
    if (typedSlotId && SLOT_ASPECT_RATIOS[typedSlotId]) {
      try {
        const minDims = SLOT_MIN_DIMENSIONS[typedSlotId];
        const croppedBlob = await new Promise<Blob>((resolve, reject) => {
          setCropperAspect(SLOT_ASPECT_RATIOS[typedSlotId]);
          setCropperMinWidth(minDims?.width);
          setCropperMinHeight(minDims?.height);
          setCropperFile(file);
          cropperCallbackRef.current = resolve;
          cropperCancelRef.current = reject;
        });
        const croppedFile = new File([croppedBlob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
        return doUpload(croppedFile, slotId);
      } catch {
        // Cropper cancelled or failed — fallback: upload original file
        // Backend will handle resize/letterbox automatically
        addToast('Crop dibatalkan. Mengupload gambar asli — sistem akan menyesuaikan otomatis.', 'info');
        return doUpload(file, slotId);
      }
    }
    return doUpload(file, slotId);
  };

  const doUpload = async (file: File, slotId?: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteId', site || 'pusat');
    const slotParam = slotId ? `&slot=${slotId}` : '';
    try {
      const res = await api.post(`/media/upload?purpose=ad${slotParam}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data?.data?.url || res.data?.url || res.data?.filePath || '';
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const serverMsg = axiosErr?.response?.data?.error?.message;
      throw new Error(serverMsg || 'Gagal mengupload file. Periksa format dan ukuran file.');
    }
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

  const fetchAds = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get('/ads', { signal });
      if (signal?.aborted) return;
      setAds(res.data.data || []);
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'CanceledError') console.error('Gagal mengambil data iklan', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAds(controller.signal);
    return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  const handleAddLeaderboardBanner = async () => {
    try {
      await api.post('/ads', { slot: 'leaderboard', isActive: true });
      await fetchAds();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menambah banner', 'error');
    }
  };

  const handleUpdateAd = async (adId: string, payload: Partial<Ad>) => {
    setSavingAdId(adId);
    try {
      await api.patch(`/ads/${adId}`, payload);
      await fetchAds();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menyimpan iklan', 'error');
    } finally {
      setSavingAdId(null);
    }
  };

  const handleSaveSlot = async (slotId: string, existingAd: Ad | undefined, payload: Partial<Ad>) => {
    setSavingAdId(slotId);
    try {
      if (existingAd) {
        await api.patch(`/ads/${existingAd.id}`, payload);
      } else {
        await api.post('/ads', { slot: slotId, ...payload });
      }
      await fetchAds();
      addToast('Pengaturan iklan berhasil disimpan', 'success');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menyimpan iklan', 'error');
    } finally {
      setSavingAdId(null);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner iklan ini?')) return;
    try {
      await api.delete(`/ads/${adId}`);
      addToast('Banner iklan berhasil dihapus', 'success');
      await fetchAds();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal menghapus iklan', 'error');
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
      await fetchAds();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      addToast(msg || 'Gagal mengurutkan iklan', 'error');
    }
  };

  if (user?.role !== 'superadmin' && user?.role !== 'wapimred') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya dapat diakses oleh Wapimred dan Superadmin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw size={32} className="animate-spin text-brand-red" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
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
          {AD_SLOT_DEFINITIONS.filter(s => s.id !== 'leaderboard').map(slot => {
            const existingAd = ads.find(a => a.slot === slot.id);
            return (
              <AdSlotCard
                key={slot.id}
                slot={slot}
                data={existingAd}
                onSave={(payload) => handleSaveSlot(slot.id, existingAd, payload)}
                onUpload={uploadAdFile}
                isSaving={savingAdId === slot.id}
              />
            );
          })}
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropperFile && (
        <AdImageCropper
          file={cropperFile}
          aspectRatio={cropperAspect}
          minWidth={cropperMinWidth}
          minHeight={cropperMinHeight}
          onComplete={handleCropperComplete}
          onCancel={handleCropperCancel}
        />
      )}
    </div>
  );
}
