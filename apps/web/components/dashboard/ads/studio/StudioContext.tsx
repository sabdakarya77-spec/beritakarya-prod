'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import type { AdPackage, StudioData, SectionId, CrossSlotPreview } from './types';

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
  processedVariants: null,
  processingWarnings: [],
  isProcessing: false,
  crossSlotPreviews: null,
  isLoadingCrossPreviews: false,
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
  uploadAndProcess: (file: File) => Promise<void>;
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

const VALID_STEPS: SectionId[] = ['package', 'campaign', 'creative', 'payment'];

export function StudioProvider({ children }: { children: ReactNode }) {
  const { site } = useParams() as { site: string };
  const searchParams = useSearchParams();
  const initialStep = (() => {
    const step = searchParams.get('step');
    return step && VALID_STEPS.includes(step as SectionId) ? (step as SectionId) : 'package';
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
    if (step && VALID_STEPS.includes(step as SectionId)) {
      setActiveStep(step as SectionId);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get('/ads/packages');
        const pkgList: AdPackage[] = res.data?.success ? res.data.data : [];
        setPackages(pkgList);

        // Cek package query param (dari marketing page "Pesan Paket")
        const packageId = searchParams.get('package');
        const preselectedPkg = packageId ? pkgList.find(p => p.id === packageId) : null;
        const defaultPkg = preselectedPkg || pkgList[0];

        if (defaultPkg) {
          setData(prev => ({
            ...prev,
            selectedPackage: defaultPkg,
            mediaType: defaultPkg.allowedFormat === 'VIDEO' ? 'video' : 'image',
            endDate: new Date(Date.now() + defaultPkg.durationDays * 86400000).toISOString().split('T')[0],
          }));
        }
      } catch {
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Single upload — backend auto-generates semua variant
  const uploadAndProcess = async (file: File): Promise<void> => {
    const slot = data.selectedPackage?.slot
    if (!slot) return

    setData(prev => ({ ...prev, isProcessing: true, processingWarnings: [], processedVariants: null, crossSlotPreviews: null }))
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/media/upload-ad?slot=${slot}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data?.success) {
        const d = res.data.data
        setData(prev => ({
          ...prev,
          processedVariants: {
            desktop: d.desktop || null,
            tablet: d.tablet || null,
            mobile: d.mobile || null,
          },
          processingWarnings: d.warnings || [],
          isProcessing: false,
        }))

        // Fetch cross-slot previews (background, non-blocking)
        fetchCrossSlotPreviews(file)
      } else {
        setData(prev => ({ ...prev, isProcessing: false, processingWarnings: ['Gagal memproses gambar'] }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar'
      setData(prev => ({ ...prev, isProcessing: false, processingWarnings: [msg] }))
    }
  }

  // Fetch previews for OTHER slots (how image looks everywhere)
  const fetchCrossSlotPreviews = async (file: File): Promise<void> => {
    setData(prev => ({ ...prev, isLoadingCrossPreviews: true }))
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/media/ad-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data?.success) {
        const previews: CrossSlotPreview[] = (res.data.data.previews || [])
          .filter((p: CrossSlotPreview) => p.slot !== data.selectedPackage?.slot) // exclude selected slot
          .filter((p: CrossSlotPreview) => !p.variant || p.variant === 'desktop') // show only desktop variant for simplicity
        setData(prev => ({ ...prev, crossSlotPreviews: previews, isLoadingCrossPreviews: false }))
      } else {
        setData(prev => ({ ...prev, isLoadingCrossPreviews: false }))
      }
    } catch {
      // Non-critical: cross-slot preview is informational only
      setData(prev => ({ ...prev, isLoadingCrossPreviews: false }))
    }
  }

  // Legacy upload for receipt (non-ad files)
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteId', site || 'pusat');
    const res = await api.post(`/media/upload?purpose=payment`, formData, {
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
    if (!data.processedVariants?.desktop) {
      setError('Materi iklan belum diproses. Tunggu hingga preview muncul.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const v = data.processedVariants;
      const isHomeTop = data.selectedPackage?.slot === 'HOME_TOP';

      // Untuk HOME_TOP: kirim logoUrl + fotoUrl (bukan imageUrl)
      // Untuk slot lain: kirim imageUrl (processed variants)
      const bookingPayload: Record<string, unknown> = {
        packageId: data.selectedPackage.id,
        siteId: site || 'pusat',
        campaignName: data.campaignName || null,
        linkUrl: data.linkUrl || '#',
        animationEffect: null,
        startDate: new Date(data.startDate).toISOString(),
        // endDate tidak perlu dikirim — API hitung dari startDate + durationDays
      };

      if (isHomeTop) {
        // HOME_TOP: upload file sebagai foto (logo diupload terpisah jika ada)
        bookingPayload.logoUrl = null; // TODO: upload logo terpisah
        bookingPayload.fotoUrl = v.desktop?.url || null;
      } else {
        bookingPayload.imageUrl = v.desktop?.url || null;
        bookingPayload.imageUrlTablet = v.tablet?.url || null;
        bookingPayload.imageUrlMobile = v.mobile?.url || null;
      }

      const bookingRes = await api.post('/ads/bookings', bookingPayload);
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
    <StudioContext.Provider value={{ data, setData, packages, loadingPackages, submitting, error, isSuccess, handleSubmit, uploadAndProcess, activeStep, setActiveStep, availability, checkingAvailability, checkAvailability, completedBookingId, receiptUploadFailed }}>
      {children}
    </StudioContext.Provider>
  );
}
