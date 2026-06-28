'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Building2,
  QrCode,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { getAdSlotDefinition } from '../../../../lib/constants';
import { SectionHeader } from './SectionHeader';
import { useStudio } from './StudioContext';
import type { SectionId } from './types';

export function StudioControls() {
  const { data, setData, packages, loadingPackages, submitting, error, isSuccess, handleSubmit, uploadAndProcess } = useStudio();
  const [expandedSection, setExpandedSection] = useState<SectionId>('package');

  useEffect(() => {
    if (isSuccess) return;
    if (!data.selectedPackage) setExpandedSection('package');
    else if (!data.campaignName || !data.linkUrl) setExpandedSection('campaign');
    else if (!data.adFile) setExpandedSection('creative');
    else if (!data.receiptFile) setExpandedSection('payment');
  }, [data.selectedPackage, data.campaignName, data.linkUrl, data.adFile, data.receiptFile, isSuccess]);

  const getSlotLabel = (slot: string) => getAdSlotDefinition(slot)?.name || slot.toUpperCase();
  const getSlotDimensions = (slot: string) => getAdSlotDefinition(slot)?.publicSize || 'Responsive';
  const formatRupiah = (val: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

  const toggleSection = (id: SectionId) => {
    setExpandedSection(expandedSection === id ? expandedSection : id);
  };

  const isPackageComplete = !!data.selectedPackage;
  const isCampaignComplete = !!data.campaignName && !!data.linkUrl;
  const isCreativeComplete = !!data.adFile;
  const isPaymentComplete = !!data.receiptFile;

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

  if (isSuccess) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Terkirim!</h3>
        <p className="text-[9px] text-gray-500 leading-relaxed">Menunggu verifikasi Superadmin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Error */}
      {error && (
        <div className="p-2 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-lg flex items-start gap-1.5 text-[9px]">
          <AlertCircle size={11} className="shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Section 1: Package */}
      <SectionHeader
        step={1}
        label="Pilih Paket"
        isComplete={isPackageComplete}
        isActive={!isPackageComplete}
        isExpanded={expandedSection === 'package'}
        summary={data.selectedPackage ? `${data.selectedPackage.name} • ${formatRupiah(data.selectedPackage.price)}` : undefined}
        onToggle={() => toggleSection('package')}
      />
      {expandedSection === 'package' && (
        <div className="space-y-1.5 pl-1">
          {loadingPackages ? (
            <div className="py-4 text-center">
              <RefreshCw size={14} className="animate-spin text-brand-red mx-auto" />
              <p className="text-[8px] text-gray-400 mt-1.5 uppercase tracking-wider">Memuat...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-[9px] text-gray-400">Belum ada paket</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {packages.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={cn(
                      "flex items-start gap-2 p-2 border rounded-lg cursor-pointer transition-all",
                      data.selectedPackage?.id === pkg.id
                        ? 'border-brand-red bg-brand-red/[0.03]'
                        : 'border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
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
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-black text-brand-black dark:text-white truncate">{pkg.name}</span>
                        <span className="text-[9px] font-black text-brand-red whitespace-nowrap">{formatRupiah(pkg.price)}</span>
                      </div>
                      <span className="text-[7px] text-gray-400 uppercase tracking-wider">
                        {getSlotLabel(pkg.slot)} • {pkg.durationDays}h
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Format */}
              <div className="pt-1 border-t border-gray-100 dark:border-white/5">
                <label className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mb-1">Format</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['image', 'video'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setData(prev => ({ ...prev, mediaType: type }))}
                      className={cn(
                        "p-1.5 border rounded-lg flex items-center gap-1 transition-all",
                        data.mediaType === type
                          ? 'border-brand-red bg-brand-red/[0.03]'
                          : 'border-gray-100 dark:border-white/5 text-gray-400'
                      )}
                    >
                      {type === 'image' ? <ImageIcon size={10} /> : <VideoIcon size={10} />}
                      <span className="text-[8px] font-black uppercase tracking-wider">{type === 'image' ? 'Gambar' : 'Video'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Section 2: Campaign */}
      <SectionHeader
        step={2}
        label="Detail Iklan"
        isComplete={isCampaignComplete}
        isActive={isPackageComplete && !isCampaignComplete}
        isExpanded={expandedSection === 'campaign'}
        summary={data.campaignName || undefined}
        onToggle={() => toggleSection('campaign')}
      />
      {expandedSection === 'campaign' && (
        <div className="space-y-2 pl-1">
          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Nama Kampanye</label>
            <input
              type="text"
              value={data.campaignName}
              onChange={(e) => setData(prev => ({ ...prev, campaignName: e.target.value }))}
              placeholder="Promo Kemerdekaan"
              className="w-full px-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[10px] text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">URL Tujuan</label>
            <input
              type="url"
              value={data.linkUrl}
              onChange={(e) => setData(prev => ({ ...prev, linkUrl: e.target.value }))}
              placeholder="https://brand.com/promo"
              className="w-full px-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[10px] text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div>
              <label className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Mulai</label>
              <input
                type="date"
                value={data.startDate}
                onChange={(e) => setData(prev => ({ ...prev, startDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[10px] text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
            <div>
              <label className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Berakhir</label>
              <input
                type="date"
                value={data.endDate}
                onChange={(e) => setData(prev => ({ ...prev, endDate: e.target.value }))}
                min={data.startDate}
                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[10px] text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Creative */}
      <SectionHeader
        step={3}
        label="Upload Materi"
        isComplete={isCreativeComplete}
        isActive={isCampaignComplete && !isCreativeComplete}
        isExpanded={expandedSection === 'creative'}
        summary={data.adFileName || undefined}
        onToggle={() => toggleSection('creative')}
      />
      {expandedSection === 'creative' && (
        <div className="space-y-2 pl-1">
          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
              Materi ({data.selectedPackage ? getSlotDimensions(data.selectedPackage.slot) : 'Responsive'})
            </label>
            <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-brand-red/50 transition-colors p-3 text-center rounded-lg bg-gray-50/50 dark:bg-white/[0.02]">
              <input
                type="file"
                accept={data.mediaType === 'image' ? 'image/*,image/gif' : 'video/mp4,video/webm'}
                onChange={(e) => handleAdFileChange(e)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Upload size={12} className="text-gray-400 mx-auto mb-1" />
              <p className="text-[9px] font-bold text-brand-black dark:text-white">
                {data.adFileName || 'Pilih file'}
              </p>
              <p className="text-[7px] text-gray-400 mt-0.5">
                {data.mediaType === 'image' ? 'WebP, JPG, PNG, GIF' : 'MP4, WebM'} • Max 10MB
              </p>
            </div>
          </div>

          {/* Server-processed preview */}
          {data.isProcessing && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
              <RefreshCw size={12} className="animate-spin text-blue-500" />
              <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400">Memproses gambar untuk semua ukuran...</span>
            </div>
          )}
          {data.processedVariants?.desktop && (
            <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-white/5">
              <label className="text-[7px] font-black uppercase tracking-widest text-gray-400">✅ Hasil Proses</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { name: 'Desktop', v: data.processedVariants.desktop },
                  { name: 'Tablet', v: data.processedVariants.tablet },
                  { name: 'Mobile', v: data.processedVariants.mobile },
                ].map(({ name, v }) => v && (
                  <div key={name} className="text-center">
                    <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 mb-0.5">
                      <img src={v.url} alt={name} className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[7px] font-bold text-gray-500">{name}</p>
                    <p className="text-[6px] font-mono text-gray-400">{v.width}×{v.height}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.processingWarnings.length > 0 && (
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
              {data.processingWarnings.map((w, i) => (
                <p key={i} className="text-[8px] text-amber-600 dark:text-amber-400 font-bold">⚠️ {w}</p>
              ))}
            </div>
          )}

          {/* Cross-slot preview */}
          {data.isLoadingCrossPreviews && (
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-lg">
              <RefreshCw size={10} className="animate-spin text-gray-400" />
              <span className="text-[7px] text-gray-400 font-bold">Cocok untuk slot lain...</span>
            </div>
          )}
          {data.crossSlotPreviews && data.crossSlotPreviews.length > 0 && (
            <div className="pt-1 border-t border-gray-100 dark:border-white/5">
              <label className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mb-1">📐 Juga Cocok Untuk</label>
              <div className="flex gap-1 overflow-x-auto">
                {data.crossSlotPreviews.map((p) => (
                  <div key={`${p.slot}-${p.variant || ''}`} className="flex-shrink-0 w-20 text-center">
                    <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 rounded-md overflow-hidden border border-gray-200 dark:border-white/10 mb-0.5">
                      <img src={p.url} alt={p.slot} className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[7px] font-bold text-gray-500 capitalize">{p.slot.replace('_', ' ')}</p>
                    <p className="text-[6px] font-mono text-gray-400">{p.width}×{p.height}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Section 4: Payment */}
      <SectionHeader
        step={4}
        label="Pembayaran"
        isComplete={isPaymentComplete}
        isActive={isCreativeComplete && !isPaymentComplete}
        isExpanded={expandedSection === 'payment'}
        summary={data.receiptFileName || undefined}
        onToggle={() => toggleSection('payment')}
      />
      {expandedSection === 'payment' && (
        <div className="space-y-2 pl-1">
          <div className="space-y-1">
            {[
              { bank: 'BCA', number: '829-0123-456' },
              { bank: 'Mandiri', number: '137-00-1234567-8' },
            ].map(({ bank, number }) => (
              <div key={bank} className="p-2 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-lg">
                <div className="flex items-center gap-1 mb-0.5">
                  <Building2 size={9} className="text-brand-red" />
                  <span className="text-[8px] font-black text-brand-black dark:text-white uppercase">{bank}</span>
                </div>
                <p className="text-[11px] font-black text-brand-red tracking-wider">{number}</p>
                <p className="text-[6px] text-gray-400 uppercase tracking-wider">a/n PT Berita Karya Nusantara</p>
              </div>
            ))}
            <div className="p-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center gap-1">
              <QrCode size={10} className="text-emerald-500" />
              <span className="text-[7px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">QRIS tersedia</span>
            </div>
          </div>

          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Bukti Transfer</label>
            <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-brand-red/50 transition-colors p-3 text-center rounded-lg bg-gray-50/50 dark:bg-white/[0.02]">
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Upload size={12} className="text-gray-400 mx-auto mb-1" />
              <p className="text-[9px] font-bold text-brand-black dark:text-white">
                {data.receiptFileName || 'Upload bukti'}
              </p>
            </div>
            {data.receiptPreviewUrl && (
              <div className="mt-1 p-1 border border-gray-100 dark:border-white/5 rounded-lg bg-gray-50 dark:bg-black/20 flex justify-center">
                <img src={data.receiptPreviewUrl} alt="Bukti" className="max-h-20 object-contain rounded" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="pt-1">
        <button
          type="button"
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
          disabled={submitting || !isPaymentComplete}
          className="w-full px-3 py-2.5 bg-brand-red hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-brand-red/20"
        >
          {submitting ? (
            <>
              <RefreshCw size={11} className="animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Sparkles size={11} />
              Kirim Pesanan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
