'use client';

import Link from 'next/link';
import {
  Monitor,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Building2,
  QrCode,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Package,
  FileText,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { getAdSlotDefinition } from '../../../../lib/constants';
import { useStudio } from './StudioContext';


export function StudioCanvas() {
  const { data, setData, packages, loadingPackages, submitting, error, isSuccess, handleSubmit, uploadAndProcess, activeStep, setActiveStep, availability, checkingAvailability: _checkingAvailability, completedBookingId: _completedBookingId, receiptUploadFailed } = useStudio();

  const formatRupiah = (val: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

  const getSlotLabel = (slot: string) => getAdSlotDefinition(slot)?.name || slot.toUpperCase();
  const getSlotDimensions = (slot: string) => getAdSlotDefinition(slot)?.publicSize || 'Responsive';

  const handleAdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (data.adPreviewUrl) URL.revokeObjectURL(data.adPreviewUrl);
    setData(prev => ({ ...prev, adFile: file, adFileName: file.name, adPreviewUrl: URL.createObjectURL(file) }));
    // Auto-process: backend generates semua variant
    uploadAndProcess(file);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (data.receiptPreviewUrl) URL.revokeObjectURL(data.receiptPreviewUrl);
    setData(prev => ({ ...prev, receiptFile: file, receiptFileName: file.name, receiptPreviewUrl: URL.createObjectURL(file) }));
  };

  const site = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'pusat';
  const selectedPackage = data.selectedPackage;
  const slotDef = selectedPackage ? getAdSlotDefinition(selectedPackage.slot) : null;
  const slotName = slotDef?.name || 'Slot Iklan';
  const slotSize = slotDef?.publicSize || 'Responsive';
  const previewSrc = data.adPreviewUrl || null;
  const _isHeroBanner = selectedPackage?.slot === 'HOME_TOP';

  // Success state
  if (isSuccess) {
    const hasReceipt = data.receiptFile !== null;
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight">Pesanan Berhasil Dibuat!</h2>
            {hasReceipt ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Materi iklan dan bukti pembayaran telah diunggah. Menunggu verifikasi Superadmin (5-15 menit).
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Materi iklan telah diunggah. Silakan lakukan pembayaran dan upload bukti transfer di halaman Pembayaran.
              </p>
            )}
          </div>
          {selectedPackage && (
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <span>{slotName}</span>
              <span className="w-px h-3 bg-gray-300 dark:bg-white/10" />
              <span>{selectedPackage.durationDays} hari</span>
              <span className="w-px h-3 bg-gray-300 dark:bg-white/10" />
              <span className="text-brand-red font-black">{formatRupiah(selectedPackage.price)}</span>
            </div>
          )}
          {receiptUploadFailed && (
            <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-left">
              <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Gagal mengunggah bukti transfer. Silakan upload ulang di halaman Pembayaran.
              </p>
            </div>
          )}
          {(!hasReceipt || receiptUploadFailed) && (
            <Link
              href={`/${site}/ads/bookings`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              Bayar Sekarang
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 dark:border-white/5 flex-shrink-0 bg-white dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Monitor size={12} className="text-gray-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
            {activeStep === 'package' && 'Pilih Paket'}
            {activeStep === 'campaign' && 'Detail Iklan'}
            {activeStep === 'creative' && 'Upload Materi'}
            {activeStep === 'payment' && 'Pembayaran'}
          </span>
        </div>
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
          data.adFile ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
        )}>
          {data.adFile ? '● Siap Draft' : '○ Draft'}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">

          {/* Error */}
          {error && (
            <div className="p-3 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Step: Package */}
          {activeStep === 'package' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <Package size={16} className="text-brand-red" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Pilih Paket Iklan</h3>
                  <p className="text-[10px] text-gray-400">Pilih paket dan format materi iklan</p>
                </div>
              </div>

              {loadingPackages ? (
                <div className="py-8 text-center">
                  <RefreshCw size={18} className="animate-spin text-brand-red mx-auto" />
                  <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Memuat paket...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-gray-400">Belum ada paket tersedia</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    {packages.map((pkg) => (
                      <label
                        key={pkg.id}
                        className={cn(
                          "flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all",
                          data.selectedPackage?.id === pkg.id
                            ? 'border-brand-red bg-brand-red/[0.03] shadow-sm'
                            : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                        )}
                      >
                        <input
                          type="radio"
                          name="ad_package"
                          checked={data.selectedPackage?.id === pkg.id}
                          onChange={() => {
                            setData(prev => ({ ...prev, selectedPackage: pkg }));
                            const end = new Date();
                            end.setDate(end.getDate() + pkg.durationDays);
                            setData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
                          }}
                          className="mt-1 accent-brand-red"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-black text-brand-black dark:text-white">{pkg.name}</span>
                            <span className="text-xs font-black text-brand-red whitespace-nowrap">{formatRupiah(pkg.price)}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                            {getSlotLabel(pkg.slot)} • {pkg.durationDays} hari
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Format */}
                  <div className="pt-3 border-t border-gray-100 dark:border-white/5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['image', 'video'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setData(prev => ({ ...prev, mediaType: type }))}
                          className={cn(
                            "p-3 border rounded-xl flex items-center gap-2 transition-all",
                            data.mediaType === type
                              ? 'border-brand-red bg-brand-red/[0.03]'
                              : 'border-gray-200 dark:border-white/10 text-gray-400'
                          )}
                        >
                          {type === 'image' ? <ImageIcon size={14} /> : <VideoIcon size={14} />}
                          <span className="text-[10px] font-black uppercase tracking-wider">{type === 'image' ? 'Gambar' : 'Video'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => data.selectedPackage && setActiveStep('campaign')}
                  disabled={!data.selectedPackage}
                  className="px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

          {/* Step: Campaign */}
          {activeStep === 'campaign' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <FileText size={16} className="text-brand-red" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Detail Iklan</h3>
                  <p className="text-[10px] text-gray-400">Isi nama kampanye dan URL tujuan</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Nama Kampanye</label>
                <input
                  type="text"
                  value={data.campaignName}
                  onChange={(e) => setData(prev => ({ ...prev, campaignName: e.target.value }))}
                  placeholder="Promo Kemerdekaan"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">URL Tujuan</label>
                <input
                  type="url"
                  value={data.linkUrl}
                  onChange={(e) => setData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="https://brand.com/promo"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Mulai</label>
                  <input
                    type="date"
                    value={data.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setData(prev => {
                        const end = new Date(newStart);
                        end.setDate(end.getDate() + (prev.selectedPackage?.durationDays || 7));
                        return { ...prev, startDate: newStart, endDate: end.toISOString().split('T')[0] };
                      });
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Berakhir</label>
                  <div className="w-full px-4 py-3 bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-500 dark:text-gray-400">
                    {data.endDate
                      ? new Date(data.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                    <span className="ml-2 text-[9px] text-gray-400">({data.selectedPackage?.durationDays || 7} hari)</span>
                  </div>
                </div>
              </div>

              {/* Info: semua slot mendukung rotasi */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                <span className="text-blue-500 text-sm">ℹ</span>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Semua slot mendukung rotasi multi-iklan</p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('package')}
                  className="px-5 py-2.5 border border-gray-200 dark:border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={() => data.campaignName && data.linkUrl && (!availability || availability.available) && setActiveStep('creative')}
                  disabled={!data.campaignName || !data.linkUrl || (availability?.available === false)}
                  className="px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

          {/* Step: Creative */}
          {activeStep === 'creative' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <Upload size={16} className="text-brand-red" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Upload Materi Iklan</h3>
                  <p className="text-[10px] text-gray-400">
                    {data.selectedPackage ? getSlotDimensions(data.selectedPackage.slot) : 'Responsive'}
                  </p>
                </div>
              </div>

              <div>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-brand-red/50 transition-colors p-6 text-center rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                  <input
                    type="file"
                    accept={data.mediaType === 'image' ? 'image/*,image/gif' : 'video/mp4,video/webm'}
                    onChange={(e) => handleAdFileChange(e)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload size={20} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-brand-black dark:text-white">
                    {data.adFileName || 'Pilih file'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {data.mediaType === 'image' ? 'WebP, JPG, PNG, GIF' : 'MP4, WebM'} • Max 10MB
                  </p>
                </div>
              </div>

              {/* Server-processed preview */}
              {data.isProcessing && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                  <RefreshCw size={14} className="animate-spin text-blue-500" />
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Memproses gambar untuk semua ukuran...</span>
                </div>
              )}
              {data.processedVariants?.desktop && (
                <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-white/5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">✅ Hasil Proses Otomatis</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Desktop', v: data.processedVariants.desktop },
                      { name: 'Tablet', v: data.processedVariants.tablet },
                      { name: 'Mobile', v: data.processedVariants.mobile },
                    ].map(({ name, v }) => v && (
                      <div key={name} className="text-center">
                        <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 mb-1">
                          <img src={v.url} alt={name} className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[9px] font-bold text-gray-500">{name}</p>
                        <p className="text-[8px] font-mono text-gray-400">{v.width}×{v.height}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.processingWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                  {data.processingWarnings.map((w, i) => (
                    <p key={i} className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">⚠️ {w}</p>
                  ))}
                </div>
              )}

              {/* Cross-slot preview */}
              {data.isLoadingCrossPreviews && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl">
                  <RefreshCw size={12} className="animate-spin text-gray-400" />
                  <span className="text-[9px] text-gray-400 font-bold">Mengecek cocok untuk slot lain...</span>
                </div>
              )}
              {data.crossSlotPreviews && data.crossSlotPreviews.length > 0 && (
                <div className="pt-3 border-t border-gray-100 dark:border-white/5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">📐 Juga Cocok Untuk Slot Lain</label>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {data.crossSlotPreviews.map((p) => (
                      <div key={`${p.slot}-${p.variant || ''}`} className="flex-shrink-0 w-28 text-center">
                        <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 mb-1">
                          <img src={p.url} alt={p.slot} className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[9px] font-bold text-gray-500 capitalize">{p.slot.replace('_', ' ')}</p>
                        <p className="text-[8px] font-mono text-gray-400">{p.width}×{p.height}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Animation */}
              {data.mediaType === 'image' && (
                <div className="pt-3 border-t border-gray-100 dark:border-white/5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Efek Animasi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'ken_burns', label: 'Ken Burns', icon: '🔍' },
                      { value: 'fade_slide', label: 'Fade Slide', icon: '↔️' },
                      { value: 'parallax', label: 'Parallax', icon: '📐' },
                      { value: 'pulse_scale', label: 'Pulse', icon: '💓' },
                    ].map((effect) => (
                      <button
                        key={effect.value}
                        type="button"
                        onClick={() => setData(prev => ({ ...prev, animationEffect: effect.value }))}
                        className={cn(
                          "p-3 border rounded-xl flex items-center gap-2 transition-all text-left",
                          data.animationEffect === effect.value
                            ? 'border-brand-red bg-brand-red/[0.03]'
                            : 'border-gray-200 dark:border-white/10 text-gray-400'
                        )}
                      >
                        <span className="text-sm">{effect.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{effect.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('campaign')}
                  className="px-5 py-2.5 border border-gray-200 dark:border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={() => data.adFile && setActiveStep('payment')}
                  disabled={!data.adFile}
                  className="px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

          {/* Step: Payment */}
          {activeStep === 'payment' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <CreditCard size={16} className="text-brand-red" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Pembayaran</h3>
                  <p className="text-[10px] text-gray-400">Transfer ke rekening berikut. Bukti bisa diupload sekarang atau nanti.</p>
                </div>
              </div>

              <div className="grid gap-2">
                {[
                  { bank: 'BCA', number: '829-0123-456' },
                  { bank: 'Mandiri', number: '137-00-1234567-8' },
                ].map(({ bank, number }) => (
                  <div key={bank} className="p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 size={12} className="text-brand-red" />
                      <span className="text-[10px] font-black text-brand-black dark:text-white uppercase">{bank}</span>
                    </div>
                    <p className="text-sm font-black text-brand-red tracking-wider">{number}</p>
                    <p className="text-[8px] text-gray-400 uppercase tracking-wider">a/n PT Berita Karya Nusantara</p>
                  </div>
                ))}
                <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-2">
                  <QrCode size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">QRIS tersedia</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Bukti Transfer <span className="font-normal text-gray-300">(Opsional — bisa diupload nanti)</span></label>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-brand-red/50 transition-colors p-6 text-center rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload size={20} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-brand-black dark:text-white">
                    {data.receiptFileName || 'Upload bukti'}
                  </p>
                </div>
                {data.receiptPreviewUrl && (
                  <div className="mt-2 p-2 border border-gray-100 dark:border-white/5 rounded-xl bg-gray-50 dark:bg-black/20 flex justify-center">
                    <img src={data.receiptPreviewUrl} alt="Bukti" className="max-h-32 object-contain rounded" />
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('creative')}
                  className="px-5 py-2.5 border border-gray-200 dark:border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-brand-red hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 shadow-lg shadow-brand-red/20"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Kirim Pesanan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {selectedPackage && (
            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Monitor size={12} className="text-gray-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Preview Penempatan</span>
                </div>
                <span className="px-2 py-0.5 bg-brand-red/10 border border-brand-red/20 rounded-full text-[8px] font-black uppercase tracking-widest text-brand-red">
                  {slotDef?.publicMockup || slotSize}
                </span>
              </div>

              {/* Browser Frame */}
              <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg shadow-black/5">
                {/* Chrome */}
                <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="bg-gray-100 dark:bg-white/5 rounded-md px-3 py-1 text-[9px] text-gray-400 font-mono">
                      🌐 beritakarya.co/{site}
                    </div>
                  </div>
                </div>

                {/* Page Layout — matches actual site structure */}
                <div className="p-4 space-y-3">
                  {/* Site Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
                    <div className="w-6 h-6 bg-brand-red rounded-md text-white text-[7px] font-black flex items-center justify-center">BK</div>
                    <div className="flex-1 flex gap-4">
                      {['Beranda', 'Nasional', 'Daerah', 'Ekonomi', 'Olahraga'].map(t => (
                        <div key={t} className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full" style={{ width: `${t.length * 5 + 14}px` }} />
                      ))}
                    </div>
                  </div>

                  {/* HOME_TOP — top of page, full width */}
                  {selectedPackage.slot === 'HOME_TOP' && (
                    <AdSlotPreview
                      slot="HOME_TOP"
                      previewSrc={previewSrc}
                      mediaType={data.mediaType}
                      aspectRatio={970 / 250}
                      label="Hero Banner"
                    />
                  )}

                  {/* Content + Sidebar layout */}
                  <div className="flex gap-4">
                    {/* Main Content */}
                    <div className="flex-1 space-y-2">
                      {/* Article title */}
                      <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded w-5/6" />

                      {/* ARTICLE_MIDDLE / HOME_FEED_1 — between content blocks */}
                      {(selectedPackage.slot === 'ARTICLE_MIDDLE' || selectedPackage.slot === 'HOME_FEED_1' || selectedPackage.slot === 'HOME_FEED_2') && (
                        <AdSlotPreview
                          slot={selectedPackage.slot}
                          previewSrc={previewSrc}
                          mediaType={data.mediaType}
                          aspectRatio={300 / 250}
                          label={slotName}
                        />
                      )}

                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded w-3/4" />

                      {/* Article cards */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[1, 2].map(i => (
                          <div key={i} className="space-y-1">
                            <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-lg" />
                            <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
                            <div className="h-1 bg-gray-100 dark:bg-white/5 rounded w-3/5" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-32 flex-shrink-0 space-y-2">
                      {/* ARTICLE_TOP / ARTICLE_BOTTOM — in-article slots */}
                      {(selectedPackage.slot === 'ARTICLE_TOP' || selectedPackage.slot === 'ARTICLE_BOTTOM') && (
                        <AdSlotPreview
                          slot={selectedPackage.slot}
                          previewSrc={previewSrc}
                          mediaType={data.mediaType}
                          aspectRatio={300 / 250}
                          label={slotName}
                        />
                      )}

                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
                      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-full" />
                      <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded w-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info bar */}
              <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
                <span className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">{slotName}</span>
                <span className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">{slotDef?.publicMockup || slotSize}</span>
                <span className="px-2.5 py-1 bg-brand-red/10 border border-brand-red/20 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-red">{formatRupiah(selectedPackage.price)}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function AdSlotPreview({ slot, previewSrc, mediaType, aspectRatio, label }: {
  slot: string; previewSrc: string | null; mediaType: 'image' | 'video'; aspectRatio: number; label: string;
}) {
  const sizeLabels: Record<string, string> = {
    HOME_TOP: '970×250 / 728×100 / 320×100',
    HOME_FEED_1: '300×250',
    HOME_FEED_2: '300×250',
    ARTICLE_TOP: '300×250',
    ARTICLE_MIDDLE: '300×200',
    ARTICLE_BOTTOM: '300×150',
  };
  const sizeLabel = sizeLabels[slot] || '300×250 / 300×100';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-[7px] font-mono text-gray-300 dark:text-gray-600">{sizeLabel}</span>
      </div>
      <div
        className={cn(
          "relative w-full rounded-lg overflow-hidden border-2 transition-all",
          !previewSrc
            ? 'border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]'
            : 'border-brand-red/30 bg-black shadow-md shadow-brand-red/10'
        )}
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        {previewSrc ? (
          mediaType === 'video' ? (
            <video src={previewSrc} autoPlay loop muted playsInline className="w-full h-full object-contain" />
          ) : (
            <img src={previewSrc} alt="Preview" className="w-full h-full object-contain" />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="text-gray-300 dark:text-white/20 text-[10px] font-black uppercase tracking-wider">{sizeLabel}</div>
            <div className="text-gray-200 dark:text-white/10 text-[8px] uppercase tracking-wider">Upload materi iklan</div>
          </div>
        )}
      </div>
    </div>
  );
}
