'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import type { AdPackage, StudioData, SectionId } from './types';

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

interface AvailabilityStatus {
  available: boolean;
  message?: string;
  conflictingEndDate?: string;
}

interface StudioContextValue {
  data: StudioData;
  setData: Dispatch<SetStateAction<StudioData>>;
  packages: AdPackage[];
  loadingPackages: boolean;
  submitting: boolean;
  error: string;
  isSuccess: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  activeStep: SectionId;
  setActiveStep: Dispatch<SetStateAction<SectionId>>;
  availability: AvailabilityStatus | null;
  checkingAvailability: boolean;
  checkAvailability: () => Promise<void>;
  completedBookingId: string | null;
  receiptUploadFailed: boolean;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const { site } = useParams() as { site: string };
  const searchParams = useSearchParams();

  const validSteps: SectionId[] = ['package', 'campaign', 'creative', 'payment'];
  const initialStep = (() => {
    const step = searchParams.get('step');
    return step && validSteps.includes(step as SectionId) ? (step as SectionId) : 'package';
  })();

  const [data, setData] = useState<StudioData>(initialData);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState<SectionId>(initialStep);
  // Semua slot mendukung rotasi — selalu tersedia
  const availability: AvailabilityStatus = { available: true };
  const checkingAvailability = false;
  const checkAvailability = async () => {};
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null);
  const [receiptUploadFailed, setReceiptUploadFailed] = useState(false);

  // Sync activeStep with URL query param on navigation
  useEffect(() => {
    const step = searchParams.get('step');
    if (step && validSteps.includes(step as SectionId)) {
      setActiveStep(step as SectionId);
    }
  }, [searchParams]);

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
    if (!data.selectedPackage || !data.adFile) {
      setError('Mohon lengkapi materi iklan.');
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
        campaignName: data.campaignName || null,
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

      // Upload receipt if provided (optional)
      if (data.receiptFile) {
        try {
          const uploadedReceiptUrl = await uploadFile(data.receiptFile);
          if (uploadedReceiptUrl) {
            await api.post(`/ads/bookings/${bookingId}/pay`, { paymentProof: uploadedReceiptUrl });
          } else {
            setReceiptUploadFailed(true);
          }
        } catch {
          setReceiptUploadFailed(true);
        }
      }

      setCompletedBookingId(bookingId);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudioContext.Provider value={{ data, setData, packages, loadingPackages, submitting, error, isSuccess, handleSubmit, activeStep, setActiveStep, availability, checkingAvailability, checkAvailability, completedBookingId, receiptUploadFailed }}>
      {children}
    </StudioContext.Provider>
  );
}
