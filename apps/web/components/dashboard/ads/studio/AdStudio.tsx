'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import BackButton from '../../../ui/BackButton';
import { StudioControls } from './StudioControls';
import { StudioPreview } from './StudioPreview';
import type { AdPackage, StudioData } from './types';

const initialData: StudioData = {
  selectedPackage: null,
  mediaType: 'image',
  campaignName: '',
  linkUrl: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  adFile: null,
  adFileName: '',
  adPreviewUrl: '',
  adFileTablet: null,
  adFileNameTablet: '',
  adPreviewUrlTablet: '',
  adFileMobile: null,
  adFileNameMobile: '',
  adPreviewUrlMobile: '',
  animationEffect: 'ken_burns',
  receiptFile: null,
  receiptFileName: '',
  receiptPreviewUrl: '',
};

export function AdStudio() {
  const { site } = useParams() as { site: string };
  const [data, setData] = useState<StudioData>(initialData);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get('/ads/packages');
        const pkgList: AdPackage[] = res.data?.success ? res.data.data : [];
        setPackages(pkgList);
        if (pkgList.length > 0) {
          const pkg = pkgList[0];
          setData(prev => ({
            ...prev,
            selectedPackage: pkg,
            endDate: new Date(Date.now() + pkg.durationDays * 86400000).toISOString().split('T')[0],
          }));
        }
      } catch {
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  const uploadFile = async (file: File, variant?: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteId', site || 'pusat');
    const slotParam = data.selectedPackage?.slot ? `&slot=${data.selectedPackage.slot}` : '';
    const variantParam = variant ? `&variant=${variant}` : '';

    const res = await api.post(`/media/upload?purpose=ad${slotParam}${variantParam}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.url || res.data?.url || res.data?.filePath || res.data || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.selectedPackage || !data.adFile || !data.receiptFile) {
      setError('Mohon lengkapi seluruh materi iklan dan bukti transfer.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const isLeaderboard = data.selectedPackage.slot === 'leaderboard' && data.mediaType === 'image';
      const uploadedAdUrl = await uploadFile(data.adFile, 'desktop');
      if (!uploadedAdUrl) throw new Error('Gagal mengunggah materi kreatif.');

      let uploadedTabletUrl: string | null = null;
      let uploadedMobileUrl: string | null = null;
      if (isLeaderboard) {
        if (data.adFileTablet) uploadedTabletUrl = await uploadFile(data.adFileTablet, 'tablet');
        if (data.adFileMobile) uploadedMobileUrl = await uploadFile(data.adFileMobile, 'mobile');
      }

      const bookingRes = await api.post('/ads/bookings', {
        packageId: data.selectedPackage.id,
        siteId: site || 'pusat',
        imageUrl: uploadedAdUrl,
        imageUrlTablet: uploadedTabletUrl,
        imageUrlMobile: uploadedMobileUrl,
        linkUrl: data.linkUrl || '#',
        animationEffect: data.mediaType === 'image' ? data.animationEffect : null,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });

      if (!bookingRes.data?.success) throw new Error(bookingRes.data?.message || 'Gagal membuat pesanan.');
      const bookingId = bookingRes.data.data.id;

      const uploadedReceiptUrl = await uploadFile(data.receiptFile);
      if (!uploadedReceiptUrl) throw new Error('Gagal mengunggah bukti transfer.');

      const payRes = await api.post(`/ads/bookings/${bookingId}/pay`, { paymentProof: uploadedReceiptUrl });
      if (!payRes.data?.success) throw new Error(payRes.data?.message || 'Gagal memverifikasi pembayaran.');

      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <BackButton
          fallbackHref={`/${site}/dashboard`}
          label="Kembali"
          className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-brand-red uppercase tracking-widest transition-colors"
        />
        <h1 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-widest">
          {isSuccess ? '✓ Pesanan Terkirim' : 'Ad Studio'}
        </h1>
        <div className="w-16" />
      </div>

      {/* Main layout: sidebar + canvas */}
      <div className="flex-1 flex flex-row gap-0 min-h-0 rounded-xl overflow-hidden border border-gray-200 dark:border-white/5">
        {/* Sidebar — controls */}
        <div className="w-[320px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/5 overflow-y-auto">
          <StudioControls
            data={data}
            setData={setData}
            packages={packages}
            loadingPackages={loadingPackages}
            site={site}
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            isSuccess={isSuccess}
          />
        </div>

        {/* Canvas — preview */}
        <div className="flex-1 bg-gray-50 dark:bg-[#0a0f1a] overflow-hidden">
          <StudioPreview
            data={data}
            site={site}
            submitting={submitting}
            isSuccess={isSuccess}
          />
        </div>
      </div>
    </div>
  );
}
