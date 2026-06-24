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
import type { AdPackage, StudioData, SectionId } from './types';

interface StudioControlsProps {
  data: StudioData;
  setData: React.Dispatch<React.SetStateAction<StudioData>>;
  packages: AdPackage[];
  loadingPackages: boolean;
  site: string;
  submitting: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  isSuccess: boolean;
}

export function StudioControls({
  data, setData, packages, loadingPackages, site, submitting, error, onSubmit, isSuccess
}: StudioControlsProps) {
  const [expandedSection, setExpandedSection] = useState<SectionId>('package');

  // Auto-advance sections
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

  const handleAdFileChange = (e: React.ChangeEvent<HTMLInputElement>, variant?: 'tablet' | 'mobile') => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    if (variant === 'tablet') {
      if (data.adPreviewUrlTablet) URL.revokeObjectURL(data.adPreviewUrlTablet);
      setData(prev => ({ ...prev, adFileTablet: file, adFileNameTablet: file.name, adPreviewUrlTablet: URL.createObjectURL(file) }));
    } else if (variant === 'mobile') {
      if (data.adPreviewUrlMobile) URL.revokeObjectURL(data.adPreviewUrlMobile);
      setData(prev => ({ ...prev, adFileMobile: file, adFileNameMobile: file.name, adPreviewUrlMobile: URL.createObjectURL(file) }));
    } else {
      if (data.adPreviewUrl) URL.revokeObjectURL(data.adPreviewUrl);
      setData(prev => ({ ...prev, adFile: file, adFileName: file.name, adPreviewUrl: URL.createObjectURL(file) }));
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (data.receiptPreviewUrl) URL.revokeObjectURL(data.receiptPreviewUrl);
    setData(prev => ({ ...prev, receiptFile: file, receiptFileName: file.name, receiptPreviewUrl: URL.createObjectURL(file) }));
  };

  if (isSuccess) {
    return null; // Hide controls on success
  }

  return (
    <div className="space-y-3">
      {/* Error */}
      {error && (
        <div className="p-3 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-lg flex items-start gap-2 text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Section 1: Package */}
      <div>
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
          <div className="mt-2 px-1 space-y-3">
            {loadingPackages ? (
              <div className="py-8 text-center">
                <RefreshCw size={20} className="animate-spin text-brand-red mx-auto" />
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Memuat paket...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle size={20} className="text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Belum ada paket tersedia</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {packages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={cn(
                        "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                        data.selectedPackage?.id === pkg.id
                          ? 'border-brand-red bg-brand-red/[0.03]'
                          : 'border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                      )}
                    >
                      <input
                        type="radio"
                        name="ad_package"
                        value={pkg.id}
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
                          <div>
                            <span className="text-xs font-black text-brand-black dark:text-white block">{pkg.name}</span>
                            <span className="text-[9px] text-brand-red font-black uppercase tracking-wider">
                              {getSlotLabel(pkg.slot)} • {pkg.durationDays} hari
                            </span>
                          </div>
                          <span className="text-xs font-black text-brand-red whitespace-nowrap">{formatRupiah(pkg.price)}</span>
                        </div>
                        {pkg.description && (
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{pkg.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Format selector */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['image', 'video'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setData(prev => ({ ...prev, mediaType: type }))}
                        className={cn(
                          "p-2.5 border rounded-lg flex items-center gap-2 transition-all text-left",
                          data.mediaType === type
                            ? 'border-brand-red bg-brand-red/[0.03]'
                            : 'border-gray-100 dark:border-white/5 text-gray-400'
                        )}
                      >
                        {type === 'image' ? <ImageIcon size={14} /> : <VideoIcon size={14} />}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {type === 'image' ? 'Gambar' : 'Video'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Campaign */}
      <div>
        <SectionHeader
          step={2}
          label="Detail Kampanye"
          isComplete={isCampaignComplete}
          isActive={isPackageComplete && !isCampaignComplete}
          isExpanded={expandedSection === 'campaign'}
          summary={data.campaignName || undefined}
          onToggle={() => toggleSection('campaign')}
        />
        {expandedSection === 'campaign' && (
          <div className="mt-2 px-1 space-y-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Nama Kampanye</label>
              <input
                type="text"
                value={data.campaignName}
                onChange={(e) => setData(prev => ({ ...prev, campaignName: e.target.value }))}
                placeholder="Promo Kemerdekaan Brand XYZ"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">URL Tujuan</label>
              <input
                type="url"
                value={data.linkUrl}
                onChange={(e) => setData(prev => ({ ...prev, linkUrl: e.target.value }))}
                placeholder="https://brand-anda.com/promo"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Mulai</label>
                <input
                  type="date"
                  value={data.startDate}
                  onChange={(e) => setData(prev => ({ ...prev, startDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Berakhir</label>
                <input
                  type="date"
                  value={data.endDate}
                  onChange={(e) => setData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={data.startDate}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Creative */}
      <div>
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
          <div className="mt-2 px-1 space-y-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                Materi Iklan ({data.selectedPackage ? getSlotDimensions(data.selectedPackage.slot) : 'Responsive'})
              </label>
              <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-brand-red/50 transition-colors p-6 text-center rounded-lg bg-gray-50/50 dark:bg-white/[0.02]">
                <input
                  type="file"
                  accept={data.mediaType === 'image' ? 'image/*,image/gif' : 'video/mp4,video/webm'}
                  onChange={(e) => handleAdFileChange(e)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload size={18} className="text-gray-400 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-brand-black dark:text-white">
                  {data.adFileName || `Pilih file ${data.mediaType === 'image' ? 'gambar' : 'video'}`}
                </p>
                <p className="text-[8px] text-gray-400 mt-1">
                  {data.mediaType === 'image' ? 'WebP, JPG, PNG, GIF' : 'MP4, WebM'} • Maks 10MB
                </p>
              </div>
            </div>

            {/* Multi-size for leaderboard */}
            {data.selectedPackage?.slot === 'leaderboard' && data.mediaType === 'image' && (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">
                  📱 Versi Tambahan (Opsional)
                </label>
                {[
                  { variant: 'tablet' as const, label: 'Tablet (728×90)', file: data.adFileTablet, name: data.adFileNameTablet },
                  { variant: 'mobile' as const, label: 'Mobile (320×50)', file: data.adFileMobile, name: data.adFileNameMobile },
                ].map(({ variant, label, file, name }) => (
                  <div key={variant} className="relative border border-dashed border-gray-200 dark:border-white/10 hover:border-brand-red/30 transition-colors p-3 text-center rounded-lg bg-gray-50/50 dark:bg-white/[0.02]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAdFileChange(e, variant)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <p className="text-[10px] font-bold text-brand-black dark:text-white">
                      {name || label}
                    </p>
                    {file && <CheckCircle2 size={12} className="text-emerald-500 mx-auto mt-1" />}
                  </div>
                ))}
              </div>
            )}

            {/* Animation effect for images */}
            {data.mediaType === 'image' && (
              <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">Efek Animasi</label>
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
                        "p-2 border rounded-lg flex items-center gap-2 transition-all text-left",
                        data.animationEffect === effect.value
                          ? 'border-brand-red bg-brand-red/[0.03]'
                          : 'border-gray-100 dark:border-white/5 text-gray-400'
                      )}
                    >
                      <span>{effect.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{effect.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Payment */}
      <div>
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
          <div className="mt-2 px-1 space-y-3">
            {/* Bank accounts */}
            <div className="space-y-2">
              {[
                { bank: 'BCA', number: '829-0123-456' },
                { bank: 'Mandiri', number: '137-00-1234567-8' },
              ].map(({ bank, number }) => (
                <div key={bank} className="p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={12} className="text-brand-red" />
                    <span className="text-[10px] font-black text-brand-black dark:text-white uppercase">{bank}</span>
                  </div>
                  <p className="text-sm font-black text-brand-red tracking-wider">{number}</p>
                  <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5">a/n PT Berita Karya Nusantara</p>
                </div>
              ))}
              <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center gap-2">
                <QrCode size={14} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">QRIS tersedia</span>
              </div>
            </div>

            {/* Receipt upload */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Bukti Transfer</label>
              <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-brand-red/50 transition-colors p-6 text-center rounded-lg bg-gray-50/50 dark:bg-white/[0.02]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload size={18} className="text-gray-400 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-brand-black dark:text-white">
                  {data.receiptFileName || 'Upload bukti transfer'}
                </p>
                <p className="text-[8px] text-gray-400 mt-1">PNG, JPG • Maks 10MB</p>
              </div>
              {data.receiptPreviewUrl && (
                <div className="mt-2 p-2 border border-gray-100 dark:border-white/5 rounded-lg bg-gray-50 dark:bg-black/20 flex justify-center">
                  <img src={data.receiptPreviewUrl} alt="Bukti transfer" className="max-h-32 object-contain rounded" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-3">
        <button
          type="button"
          onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
          disabled={submitting || !isPaymentComplete}
          className="w-full px-6 py-3.5 bg-brand-red hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-red/20"
        >
          {submitting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Kirim Pesanan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
