'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../../../lib/api';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Video as VideoIcon,
  AlertCircle,
  QrCode,
  Building2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import BackButton from '../../../../../components/ui/BackButton';
import { cn } from '../../../../../lib/utils';
import { getAdSlotDefinition } from '../../../../../lib/constants';

interface AdPackage {
  id: string;
  name: string;
  slot: string;
  durationDays: number;
  price: number | string;
  description: string | null;
  isActive: boolean;
}

export default function OrderAdPage() {
  const { site } = useParams() as { site: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('package');
  
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<AdPackage | null>(null);
  
  const [campaignName, setCampaignName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [animationEffect, setAnimationEffect] = useState('ken_burns');
  
  const [adFile, setAdFile] = useState<File | null>(null);
  const [adFileName, setAdFileName] = useState('');
  const [adPreviewUrl, setAdPreviewUrl] = useState<string>('');
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string>('');
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invoiceNumber] = useState(() => Math.floor(100000 + Math.random() * 900000));

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get('/ads/packages');
        const pkgList: AdPackage[] = (res.data && res.data.success && res.data.data) ? res.data.data : [];
        setPackages(pkgList);

        // Auto-select package matching the query param
        if (pkgList.length > 0) {
          const matchingPkg = pkgList.find((p: AdPackage) => p.id === packageId);
          const selected = matchingPkg || pkgList[0];
          setSelectedPackage(selected);
          const end = new Date();
          end.setDate(end.getDate() + selected.durationDays);
          setEndDate(end.toISOString().split('T')[0]);
        }
      } catch (e) {
        console.error('Gagal mengambil paket iklan:', e);
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, [packageId]);

  const handleAdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdFile(file);
      setAdFileName(file.name);
      
      // Release old object URL if exists to avoid memory leak
      if (adPreviewUrl) URL.revokeObjectURL(adPreviewUrl);
      setAdPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setReceiptFileName(file.name);

      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteId', site || 'pusat');
    const slotParam = selectedPackage?.slot ? `&slot=${selectedPackage.slot}` : '';

    try {
      const res = await api.post(`/media/upload?purpose=ad${slotParam}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data?.data?.url || res.data?.url || res.data?.filePath || res.data || '';
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const serverMsg = axiosErr?.response?.data?.error?.message;
      throw new Error(serverMsg || 'Gagal mengupload file. Periksa format dan ukuran file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !adFile || !receiptFile) {
      setError('Mohon lengkapi seluruh materi iklan dan bukti transfer.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Upload creative banner file (image or video)
      const uploadedAdUrl = await uploadFile(adFile);
      if (!uploadedAdUrl) {
        throw new Error('Gagal mengunggah materi kreatif iklan. Silakan coba kembali.');
      }

      // 2. Use user-selected date range
      const start = new Date(startDate);
      const end = new Date(endDate);

      // 3. Create booking transaction
      const bookingRes = await api.post('/ads/bookings', {
        packageId: selectedPackage.id,
        siteId: site || 'pusat',
        imageUrl: uploadedAdUrl,
        linkUrl: linkUrl || '#',
        animationEffect: mediaType === 'image' ? animationEffect : null,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      if (!bookingRes.data || !bookingRes.data.success || !bookingRes.data.data) {
        throw new Error(bookingRes.data?.message || 'Gagal memproses pemesanan iklan.');
      }

      const bookingId = bookingRes.data.data.id;

      // 4. Upload payment transfer receipt
      const uploadedReceiptUrl = await uploadFile(receiptFile);
      if (!uploadedReceiptUrl) {
        throw new Error('Gagal mengunggah resi bukti transfer.');
      }

      // 5. Submit payment confirmation
      const payRes = await api.post(`/ads/bookings/${bookingId}/pay`, {
        paymentProof: uploadedReceiptUrl
      });

      if (!payRes.data || !payRes.data.success) {
        throw new Error(payRes.data?.message || 'Gagal memverifikasi resi pembayaran.');
      }

      // Done! Success step
      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem, silakan hubungi pusat bantuan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSlotLabel = (slot: string) => {
    return getAdSlotDefinition(slot)?.name || slot.toUpperCase();
  };

  const getSlotDimensions = (slot: string) => {
    return getAdSlotDefinition(slot)?.publicSize || '100% Responsive';
  };

  const formatRupiah = (val: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(val));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <BackButton
          fallbackHref={`/${site}/dashboard`}
          label="Kembali ke Dasbor"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-red uppercase tracking-widest transition-colors"
        />
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: 'Pilih Paket' },
          { num: 2, label: 'Materi Iklan' },
          { num: 3, label: 'Unggah Resi' },
          { num: 4, label: 'Selesai' }
        ].map((s) => (
          <div 
            key={s.num}
            className={`border-t-2 pt-3 transition-colors ${step >= s.num ? 'border-brand-red' : 'border-gray-200 dark:border-white/5'}`}
          >
            <p className={`text-[9px] font-black uppercase tracking-widest ${step >= s.num ? 'text-brand-red' : 'text-gray-400'}`}>
              Langkah {s.num}
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${step === s.num ? 'text-brand-black dark:text-white' : 'text-gray-400'}`}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-sm flex items-center gap-3 text-xs">
          <AlertCircle size={16} className="shrink-0 animate-bounce" />
          <span className="font-semibold uppercase tracking-wider">{error}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form / Wizard Content */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-8 rounded-sm shadow-2xl shadow-black/5 relative overflow-hidden">
          
          {/* STEP 1: SELECT DYNAMIC PACKAGES & FORMAT */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-base font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">Pilih Paket & Format Iklan</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tentukan paket tarif sewa yang sesuai dengan budget promosi Anda</p>
              </div>

              {loadingPackages ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw size={24} className="animate-spin text-brand-red mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Memuat Katalog Tarif Regional...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <AlertCircle size={24} className="text-gray-300 mx-auto" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum Ada Paket Iklan Tersedia</p>
                  <p className="text-[10px] text-gray-400">Hubungi admin untuk membuat paket iklan baru.</p>
                  <BackButton
                    fallbackHref={`/${site}/dashboard`}
                    label="Kembali ke Dashboard"
                    className="inline-flex items-center gap-2 mt-4 px-6 py-3 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 text-brand-black dark:text-white text-[10px] font-black uppercase tracking-widest transition-all rounded-sm"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Packages grid */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300 block">
                      Paket Iklan Regional Aktif
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {packages.map((pkg) => (
                        <label 
                          key={pkg.id}
                          className={cn(
                            "flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all relative overflow-hidden",
                            selectedPackage?.id === pkg.id 
                              ? 'border-brand-red bg-brand-red/[0.03] shadow-md' 
                              : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                          )}
                        >
                          <input
                            type="radio"
                            name="ad_package"
                            value={pkg.id}
                            checked={selectedPackage?.id === pkg.id}
                            onChange={() => {
                              setSelectedPackage(pkg);
                              const end = new Date();
                              end.setDate(end.getDate() + pkg.durationDays);
                              setEndDate(end.toISOString().split('T')[0]);
                            }}
                            className="mt-1.5 accent-brand-red"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <span className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight block">
                                  {pkg.name}
                                </span>
                                <span className="text-[9px] font-black text-brand-red uppercase tracking-wider mt-0.5 inline-block">
                                  {getSlotLabel(pkg.slot)} • {pkg.durationDays} Hari
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-serif font-black text-brand-red block">
                                  {formatRupiah(pkg.price)}
                                </span>
                                <span className="text-[8px] font-black text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-sm uppercase tracking-widest inline-block mt-1">
                                  {getSlotDimensions(pkg.slot)}
                                </span>
                              </div>
                            </div>
                            {pkg.description && (
                              <p className="text-[10px] text-brand-text-muted mt-2 leading-relaxed">{pkg.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Format Selector */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300 block">
                      Pilih Format Kreatif Iklan
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setMediaType('image')}
                        className={cn(
                          "p-4 border rounded-sm flex flex-col items-center gap-2 transition-all",
                          mediaType === 'image'
                            ? 'border-brand-red bg-brand-red/[0.02] text-brand-black dark:text-white shadow-sm'
                            : 'border-gray-100 dark:border-slate-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                        )}
                      >
                        <ImageIcon size={20} className={mediaType === 'image' ? 'text-brand-red' : 'text-gray-400'} />
                        <span className="text-xs font-black uppercase tracking-wider">📸 Gambar / GIF</span>
                        <span className="text-[8px] text-gray-400 uppercase">Mendukung format WebP, JPG, PNG, GIF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaType('video')}
                        className={cn(
                          "p-4 border rounded-sm flex flex-col items-center gap-2 transition-all",
                          mediaType === 'video'
                            ? 'border-brand-red bg-brand-red/[0.02] text-brand-black dark:text-white shadow-sm'
                            : 'border-gray-100 dark:border-slate-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                        )}
                      >
                        <VideoIcon size={20} className={mediaType === 'video' ? 'text-brand-red' : 'text-gray-400'} />
                        <span className="text-xs font-black uppercase tracking-wider">🎥 Video Autoplay</span>
                        <span className="text-[8px] text-gray-400 uppercase">Mendukung format MP4, WebM (Loop & Muted)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedPackage}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-brand-red hover:bg-brand-black text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center gap-2 group"
                >
                  Lanjut ke Materi Iklan
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FILL CAMPAIGN DETAIL & UPLOAD MATERIAL */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">Materi & Target Kampanye</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Masukkan detail promosi produk dan pasang banner Anda</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                    Nama Kampanye Iklan
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Contoh: Promo Kemerdekaan Brand XYZ"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors rounded-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                    Target Link URL (Tautan Klik)
                  </label>
                  <input
                    type="url"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Contoh: https://brand-anda.com/promo atau WhatsApp Link"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors rounded-sm"
                  />
                  <p className="text-[9px] text-gray-400">
                    * Alamat tujuan website atau link WhatsApp yang akan dituju saat audiens mengklik banner iklan Anda.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                      Tanggal Mulai Tayang
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors rounded-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                      Tanggal Berakhir
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors rounded-sm"
                    />
                    <p className="text-[9px] text-gray-400">
                      * Durasi otomatis sesuai paket ({selectedPackage?.durationDays || '...'} hari). Anda bisa sesuaikan.
                    </p>
                  </div>
                </div>

                {/* File Upload with Smart Local Preview */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                      Unggah Kreatif Iklan ({selectedPackage ? getSlotDimensions(selectedPackage.slot) : 'Responsive'})
                    </label>
                    {selectedPackage?.slot && (() => {
                      const templateMap: Record<string, string> = {
                        leaderboard: '/templates/leaderboard-970x250.svg',
                        rectangle: '/templates/rectangle-300x250.svg',
                        rectangle_secondary: '/templates/rectangle-300x250.svg',
                        in_feed: '/templates/rectangle-300x250.svg',
                      };
                      const href = templateMap[selectedPackage.slot];
                      return href ? (
                        <a href={href} download className="text-[9px] font-bold text-brand-red uppercase tracking-widest hover:underline">
                          📐 Download Template
                        </a>
                      ) : null;
                    })()}
                  </div>
                  
                  <div className="relative border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-brand-red/50 transition-colors p-8 text-center rounded-sm bg-gray-50/50 dark:bg-slate-800/10">
                    <input
                      type="file"
                      required
                      accept={mediaType === 'image' ? 'image/*,image/gif' : 'video/mp4,video/webm'}
                      onChange={handleAdFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload size={24} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight mb-1">
                      {adFileName ? `Berkas Terpilih: ${adFileName}` : `Pilih Berkas Media ${mediaType === 'image' ? 'Gambar/GIF' : 'Video'}`}
                    </p>
                    <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-wider">
                      Seret & letakkan berkas di sini atau klik untuk membuka folder.<br />
                      Format yang didukung: {mediaType === 'image' ? 'WebP, JPG, PNG, GIF' : 'MP4, WebM'}. Maksimal: 10MB.
                    </p>
                  </div>

                  {/* Dynamic Premium Preview Panel */}
                  {adPreviewUrl && (
                    <div className="mt-4 p-4 border border-gray-100 dark:border-slate-800 rounded-sm bg-gray-50 dark:bg-black/20">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block">
                        👁️ Live Interactive Preview (Tampilan Spanduk)
                      </p>
                      <div className="relative w-full overflow-hidden border border-gray-100 dark:border-white/5 rounded-sm flex items-center justify-center bg-black">
                        {mediaType === 'video' ? (
                          <video 
                            src={adPreviewUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full max-h-56 object-contain"
                          />
                        ) : (
                          <img 
                            src={adPreviewUrl} 
                            alt="Pratinjau Gambar" 
                            className="w-full max-h-56 object-contain"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Animation Effect Selector — only for static images */}
              {mediaType === 'image' && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300 block">
                    Efek Animasi Billboard
                  </label>
                  <p className="text-[9px] text-gray-400 leading-relaxed">
                    Pilih efek gerak otomatis yang akan ditampilkan pada banner gambar statis Anda di slot leaderboard. Efek ini membuat iklan terlihat lebih dinamis tanpa perlu video.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'ken_burns', label: 'Ken Burns', desc: 'Zoom perlahan masuk-keluar', icon: '🔍' },
                      { value: 'fade_slide', label: 'Fade Slide', desc: 'Geser perlahan kiri-kanan', icon: '↔️' },
                      { value: 'parallax', label: 'Parallax', desc: 'Efek kedalaman vertikal', icon: '📐' },
                      { value: 'pulse_scale', label: 'Pulse', desc: 'Membesar-mengecil perlahan', icon: '💓' },
                    ].map((effect) => (
                      <button
                        key={effect.value}
                        type="button"
                        onClick={() => setAnimationEffect(effect.value)}
                        className={cn(
                          "p-3 border rounded-sm flex items-start gap-3 text-left transition-all",
                          animationEffect === effect.value
                            ? 'border-brand-red bg-brand-red/[0.03] shadow-sm'
                            : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                        )}
                      >
                        <span className="text-lg mt-0.5">{effect.icon}</span>
                        <div>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-wider block",
                            animationEffect === effect.value ? 'text-brand-red' : 'text-brand-black dark:text-white'
                          )}>
                            {effect.label}
                          </span>
                          <span className="text-[8px] text-gray-400 mt-0.5 block">{effect.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 text-brand-black dark:text-white text-[10px] font-black uppercase tracking-widest transition-all rounded-sm flex items-center gap-2"
                >
                  <ArrowLeft size={14} /> Kembali
                </button>
                <button
                  type="button"
                  disabled={!campaignName || !linkUrl || !adFile}
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-brand-red hover:bg-brand-black text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center gap-2 group"
                >
                  Lanjut ke Pembayaran
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CENTRAL PAYMENT RECEIPT UPLOAD */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="text-base font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">Unggah Resi Bukti Pembayaran</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selesaikan pembayaran administrasi ke rekening kas terpusat PT Berita Karya</p>
              </div>

              {/* Payment Methods Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-[0.2em] mb-4">Informasi Rekening Pusat (Satu Pintu)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank BCA */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={16} className="text-brand-red" />
                        <span className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Bank BCA Nusantara</span>
                      </div>
                      <p className="text-[14px] font-black text-brand-black dark:text-white tracking-widest text-brand-red">829-0123-456</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">a/n PT Berita Karya Nusantara</p>
                    </div>

                    {/* Bank Mandiri */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={16} className="text-brand-red" />
                        <span className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Bank Mandiri</span>
                      </div>
                      <p className="text-[14px] font-black text-brand-black dark:text-white tracking-widest text-brand-red">137-00-1234567-8</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">a/n PT Berita Karya Nusantara</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-sm flex items-center gap-3">
                    <QrCode size={20} className="text-emerald-500 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">Mendukung Scan QRIS Terpusat</p>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-500/80 leading-normal uppercase tracking-wider font-semibold">
                        Pindai kode QRIS resmi BeritaKarya Nusantara untuk memproses validasi super cepat dari pihak Superadmin Keuangan Pusat.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Receipt File */}
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300 block">
                    Unggah Bukti Transfer / Resi ATM (.png / .jpg)
                  </label>
                  <div className="relative border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-brand-red/50 transition-colors p-8 text-center rounded-sm bg-gray-50/50 dark:bg-slate-800/10">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleReceiptFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload size={24} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight mb-1">
                      {receiptFileName ? `Resi Terpilih: ${receiptFileName}` : 'Pilih Berkas Foto Resi Transaksi'}
                    </p>
                    <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-wider">
                      Mendukung format PNG atau JPG. Pastikan jam transaksi dan nama pengirim terbaca jelas untuk validasi instan.
                    </p>
                  </div>

                  {/* Receipt Local Preview */}
                  {receiptPreviewUrl && (
                    <div className="mt-4 p-4 border border-gray-100 dark:border-slate-800 rounded-sm bg-gray-50 dark:bg-black/20 flex justify-center">
                      <img 
                        src={receiptPreviewUrl} 
                        alt="Bukti Transfer" 
                        className="max-h-48 object-contain rounded-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 text-brand-black dark:text-white text-[10px] font-black uppercase tracking-widest transition-all rounded-sm flex items-center gap-2"
                >
                  <ArrowLeft size={14} /> Kembali
                </button>
                <button
                  type="submit"
                  disabled={submitting || !receiptFile}
                  className="px-8 py-3 bg-brand-red hover:bg-brand-black text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center gap-2 group shadow-lg shadow-brand-red/20"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Memproses Transaksi Riil...
                    </>
                  ) : (
                    <>
                      Kirim Bukti Bayar & Selesaikan
                      <CheckCircle2 size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS PAGE */}
          {step === 4 && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight">Pesanan Iklan Sukses Dibuat!</h2>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">Status: Menunggu Pencocokan Mutasi (Superadmin)</p>
              </div>

              <div className="max-w-md mx-auto bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800/80 p-6 rounded-sm text-left space-y-4 shadow-sm">
                <div className="flex justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>Rincian Pembelian</span>
                  <span>Invoice #BK-{invoiceNumber}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold"><span className="text-gray-400">Nama Kampanye:</span> <span className="text-brand-black dark:text-white">{campaignName}</span></div>
                  <div className="flex justify-between font-semibold"><span className="text-gray-400">Penempatan Slot:</span> <span className="text-brand-black dark:text-white">{selectedPackage ? getSlotLabel(selectedPackage.slot) : ''}</span></div>
                  <div className="flex justify-between font-semibold"><span className="text-gray-400">Durasi Sewa:</span> <span className="text-brand-black dark:text-white">{selectedPackage?.durationDays} Hari</span></div>
                  <div className="flex justify-between font-semibold"><span className="text-gray-400">Metode Bayar:</span> <span className="text-brand-black dark:text-white">Transfer Terpusat</span></div>
                  <div className="flex justify-between font-black text-brand-red pt-2 border-t border-gray-200 dark:border-slate-800 text-sm"><span>Total Pembayaran:</span> <span>{selectedPackage ? formatRupiah(selectedPackage.price) : ''}</span></div>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed max-w-md mx-auto uppercase tracking-wider">
                Materi iklan (.mp4/gambar) dan resi transfer bukti pembayaran telah sukses diunggah ke server PT Berita Karya Nusantara. Validasi persetujuan di sisi Superadmin Pusat membutuhkan waktu 5-15 menit untuk penayangan instan.
              </p>

              <div className="pt-4">
                <BackButton
                  fallbackHref={`/${site}/dashboard`}
                  label="Kembali ke Dashboard Anda"
                  className="px-8 py-4 bg-brand-black dark:bg-white text-white dark:text-brand-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-red dark:hover:bg-brand-red dark:hover:text-white transition-all rounded-sm shadow-md"
                />
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR ORDER SUMMARY */}
        <div className="space-y-6">
          <div className="bg-brand-black dark:bg-[#080d18] border border-white/5 p-6 rounded-sm text-white shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-red mb-4">Ringkasan Pesanan</h3>
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Subdomain Regional</p>
                <p className="text-xs font-black uppercase tracking-tight mt-0.5">{site === 'pusat' ? 'BeritaKarya Pusat' : `BeritaKarya Regional ${site}`}</p>
              </div>

              {selectedPackage && (
                <>
                  <div className="border-b border-white/10 pb-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paket Pilihan</p>
                    <p className="text-xs font-black uppercase tracking-tight mt-0.5">{selectedPackage.name}</p>
                  </div>

                  <div className="border-b border-white/10 pb-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Slot Penempatan</p>
                    <p className="text-xs font-black uppercase tracking-tight mt-0.5">{getSlotLabel(selectedPackage.slot)}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Dimensi: {getSlotDimensions(selectedPackage.slot)}</p>
                  </div>

                  <div className="border-b border-white/10 pb-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Durasi Sewa</p>
                    <p className="text-xs font-black uppercase tracking-tight mt-0.5">{selectedPackage.durationDays} Hari</p>
                  </div>
                </>
              )}

              <div className="border-b border-white/10 pb-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Format Banner</p>
                <p className="text-xs font-black uppercase tracking-tight mt-0.5">{mediaType === 'video' ? '🎥 Video MP4 (Autoplay)' : '📸 Gambar Banner'}</p>
              </div>

              {mediaType === 'image' && (
                <div className="border-b border-white/10 pb-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Efek Animasi</p>
                  <p className="text-xs font-black uppercase tracking-tight mt-0.5">
                    {animationEffect === 'ken_burns' ? '🔍 Ken Burns' :
                     animationEffect === 'fade_slide' ? '↔️ Fade Slide' :
                     animationEffect === 'parallax' ? '📐 Parallax' :
                     animationEffect === 'pulse_scale' ? '💓 Pulse' : animationEffect}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-between items-baseline">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Biaya:</span>
                <span className="text-base font-serif font-black text-brand-red">
                  {selectedPackage ? formatRupiah(selectedPackage.price) : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-sm">
            <div className="flex gap-3 items-start">
              <Sparkles size={16} className="text-brand-red shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-[10px] font-black text-brand-black dark:text-white uppercase tracking-wider mb-1">Mendukung Migrasi Otomatis</h4>
                <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-wider">
                  Sistem pemesanan ini diintegrasikan secara dinamis ke database pusat. Spanduk video looping/gambar yang disetujui akan tayang **seketika secara otomatis** di sub-portal Anda!
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
