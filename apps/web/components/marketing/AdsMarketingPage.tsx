import Link from 'next/link'
import {
  ArrowRight,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Eye,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { PublicSiteConfig } from '../../lib/siteSettings'
import { ADS_PUBLIC_PAGE } from '../../lib/marketingPages'
import { AD_SLOT_MAP, type AdSlotId } from '../../lib/constants'
import { PublicInfoShell } from '../layout/PublicInfoShell'
import { LegalPageHeader } from '../legal/LegalPageHeader'
import { LegalDocumentBody } from '../legal/LegalDocumentBody'

export interface AdPackage {
  id: string
  name: string
  slot: string
  allowedFormat: string
  durationDays: number
  price: string
  description: string | null
  isActive: boolean
}

// Icon mapping per slot — visual only, not slot metadata.
// Slot name/size/desc come from AD_SLOT_DEFINITIONS (single source of truth).
const SLOT_ICONS: Record<AdSlotId, LucideIcon> = {
  leaderboard: TrendingUp,
  rectangle: Eye,
  rectangle_secondary: ChevronRight,
  in_feed: ImageIcon,
}

const VALUE_PROPS = [
  {
    icon: CheckCircle2,
    title: 'Trafik Regional Murni',
    desc: 'Iklan ditampilkan langsung kepada audiens lokal yang aktif mencari berita daerah di seluruh portal jaringan BeritaKarya.',
  },
  {
    icon: ImageIcon,
    title: 'Gambar & Video Banner',
    desc: 'Dukung format banner statis premium, GIF animasi dinamis, hingga pemutar klip video promosi interaktif.',
  },
  {
    icon: Video,
    title: 'Transparansi Performa',
    desc: 'Pantau grafik penayangan (impresi), jumlah klik, serta rasio CTR iklan secara real-time.',
  },
]

type AdsMarketingPageProps = {
  siteConfig: PublicSiteConfig
  siteParam: string
  adPackages: AdPackage[]
  termsContent: string | null | undefined
}

export function AdsMarketingPage({
  siteConfig,
  siteParam,
  adPackages,
  termsContent,
}: AdsMarketingPageProps) {
  const groupedPackages = adPackages.reduce(
    (acc, pkg) => {
      if (!acc[pkg.slot]) acc[pkg.slot] = []
      acc[pkg.slot].push(pkg)
      return acc
    },
    {} as Record<string, AdPackage[]>
  )

  const formatRupiah = (val: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(val));
  };

  return (
    <PublicInfoShell siteConfig={siteConfig} width="wide">
      <LegalPageHeader
        title={ADS_PUBLIC_PAGE.title}
        eyebrow={ADS_PUBLIC_PAGE.eyebrow}
        subtitle={`Skyrocket Bisnis Anda Melalui Jaringan Pembaca Lokal Terbesar dan Militan di Wilayah ${siteConfig.name}!`}
      />

      <div className="space-y-20 md:space-y-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {VALUE_PROPS.map((prop, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-11 h-11 bg-brand-red/10 rounded-xl flex items-center justify-center mb-5">
                <prop.icon size={20} className="text-brand-red" />
              </div>
              <h3 className="text-base font-black text-brand-black dark:text-white tracking-tight mb-2">
                {prop.title}
              </h3>
              <p className="text-sm text-brand-text-muted leading-relaxed">{prop.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-black/5 dark:border-white/5 pt-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-brand-red" aria-hidden />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-red">
                  Slot Iklan
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight">
                Pilihan Paket Iklan
              </h2>
              <p className="text-[11px] text-brand-text-muted font-semibold uppercase tracking-widest mt-2">
                Format standar Dewan Pers & IAB Indonesia
              </p>
            </div>
          </div>

          {Object.keys(groupedPackages).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {Object.entries(groupedPackages).map(([slot, packages]) => {
                const slotDef = AD_SLOT_MAP[slot as AdSlotId]
                const IconComponent = SLOT_ICONS[slot as AdSlotId] || ChevronRight
                const slotSize = slotDef?.publicSize || '-'
                const slotDesc = slotDef?.desc || '-'
                return packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-11 h-11 bg-brand-red/10 rounded-xl flex items-center justify-center">
                          <IconComponent size={20} className="text-brand-red" />
                        </div>
                        <span className="px-3 py-1 bg-brand-red/10 text-brand-red text-[10px] font-black uppercase tracking-wider rounded-full">
                          Paket
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-brand-black dark:text-white tracking-tight mb-2">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-brand-text-muted leading-relaxed mb-5">
                        {pkg.description || slotDesc}
                      </p>
                      <ul className="space-y-2 mb-6 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">
                        <li className="flex items-center gap-2">
                          <ChevronRight size={12} className="text-brand-red shrink-0" /> Ukuran:{' '}
                          {slotSize}
                        </li>
                        <li className="flex items-center gap-2">
                          <ChevronRight size={12} className="text-brand-red shrink-0" /> Format:{' '}
                          {pkg.allowedFormat === 'ALL' ? 'Gambar, GIF, Video' : pkg.allowedFormat}
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock size={12} className="text-brand-red shrink-0" /> Durasi:{' '}
                          {pkg.durationDays} Hari
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div className="h-[100px] w-full bg-brand-surface dark:bg-white/[0.03] border border-dashed border-black/5 dark:border-white/10 rounded-xl flex items-center justify-center">
                        <p className="text-[10px] text-brand-text-muted font-semibold uppercase tracking-widest">
                          Mockup: {slotSize}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
                            Tarif Iklan
                          </span>
                          <p className="text-lg font-black text-brand-red">
                            {formatRupiah(pkg.price)}
                          </p>
                        </div>
                        <Link
                          href={`/${siteParam}/dashboard/ads/order?package=${pkg.id}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-[10px] font-black uppercase tracking-[0.14em] rounded-xl hover:bg-brand-red/90 transition-colors shadow-lg shadow-brand-red/20"
                        >
                          Pesan Paket
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-12 text-center">
              <p className="text-brand-text-muted italic">
                Paket iklan belum tersedia. Silakan hubungi redaksi {siteConfig.name} untuk informasi
                lebih lanjut.
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#020617] border border-white/5 p-10 md:p-12 text-center rounded-3xl relative overflow-hidden shadow-[0_28px_56px_rgba(2,6,23,0.26)]">
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-brand-red/10 to-transparent pointer-events-none" />
          <h3 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-tight mb-4">
            Siap Meluncurkan Kampanye Iklan Anda?
          </h3>
          <p className="text-sm text-brand-text-muted max-w-xl mx-auto leading-relaxed mb-8">
            Bergabunglah bersama ribuan mitra pengiklan regional BeritaKarya. Proses pendaftaran
            instan dan pantau hasil secara transparan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register?role=advertiser"
              className="px-8 py-4 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-brand-black transition-all rounded-xl flex items-center gap-2 group shadow-lg shadow-brand-red/20 w-full sm:w-auto justify-center"
            >
              Daftar Sebagai Pengiklan
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-brand-black transition-all rounded-xl w-full sm:w-auto justify-center"
            >
              Masuk Portal Mitra
            </Link>
          </div>
        </div>

        <LegalDocumentBody
          pageTitle="Syarat & Ketentuan Umum Periklanan"
          sectionTitle="Syarat & Ketentuan Umum Periklanan"
          content={termsContent}
          siteName={siteConfig.name}
          eyebrow="Dokumen Portal"
          proseSize="compact"
          emptyMessage={`Ketentuan umum periklanan tertulis belum diunggah oleh redaksi regional ${siteConfig.name}. Hubungi admin kami untuk detail syarat lengkap.`}
        />
      </div>
    </PublicInfoShell>
  )
}
