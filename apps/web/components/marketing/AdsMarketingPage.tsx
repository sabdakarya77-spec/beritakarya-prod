'use client';

import Link from 'next/link'
import {
  ArrowRight,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Eye,
  Mail,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import type { PublicSiteConfig } from '../../lib/siteSettings'
import { ADS_PUBLIC_PAGE } from '../../lib/marketingPages'
import { AD_SLOT_MAP, type AdSlotId } from '../../lib/constants'
import { PublicInfoShell } from '../layout/PublicInfoShell'
import { LegalDocumentBody } from '../legal/LegalDocumentBody'

const SLOT_ICONS: Record<AdSlotId, LucideIcon> = {
  HOME_TOP: TrendingUp,
  HOME_FEED_1: Eye,
  HOME_FEED_2: Eye,
  ARTICLE_TOP: ChevronRight,
  ARTICLE_MIDDLE: ImageIcon,
  ARTICLE_BOTTOM: ChevronRight,
}

const VALUE_PROPS = [
  {
    icon: CheckCircle2,
    title: 'Trafik Regional Murni',
    desc: 'Iklan ditampilkan langsung kepada audiens lokal yang aktif mencari berita daerah di seluruh portal jaringan BeritaKarya.',
  },
  {
    icon: ImageIcon,
    title: 'Banner Berkualitas',
    desc: 'Format banner statis premium dengan ukuran standar Google AdSense untuk visibilitas terbaik.',
  },
  {
    icon: Eye,
    title: 'Transparansi Performa',
    desc: 'Pantau grafik penayangan (impresi), jumlah klik, serta rasio CTR iklan secara real-time.',
  },
]

type AdsMarketingPageProps = {
  siteConfig: PublicSiteConfig
  siteParam: string
  termsContent: string | null | undefined
}

export function AdsMarketingPage({
  siteConfig,
  siteParam,
  termsContent,
}: AdsMarketingPageProps) {
  const contactEmail = siteConfig.contactEmail
  const phone = siteConfig.phone
  const whatsappLink = phone
    ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
    : undefined

  const allSlots = Object.values(AD_SLOT_MAP)

  return (
    <PublicInfoShell
      siteConfig={siteConfig}
      width="wide"
    >
      <div className="space-y-10">
        {/* Hero */}
        <section className="text-center py-6">
          <h1 className="text-3xl md:text-4xl font-black text-brand-black dark:text-white tracking-tight">
            Pasang Iklan di <span className="text-brand-red">BeritaKarya</span>
          </h1>
          <p className="mt-4 text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Jangkau audiens regional dengan banner berkualitas tinggi di seluruh jaringan portal BeritaKarya.
          </p>
        </section>

        {/* Value Props */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {VALUE_PROPS.map((vp) => {
            const Icon = vp.icon
            return (
              <div key={vp.title} className="dash-card p-6">
                <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl w-fit">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
                  {vp.title}
                </h3>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {vp.desc}
                </p>
              </div>
            )
          })}
        </section>

        {/* Slot List */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight">
            Pilihan Slot Iklan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {allSlots.map((slot) => {
              const Icon = SLOT_ICONS[slot.id]
              return (
                <div key={slot.id} className="dash-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl">
                      <Icon size={18} />
                    </div>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">
                      {slot.tier}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
                    {slot.name}
                  </h3>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {slot.desc}
                  </p>
                  <p className="mt-3 text-[9px] font-mono text-gray-400">
                    {slot.publicSize}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA — Hubungi Kami */}
        <section className="dash-card p-8 bg-brand-red text-white border-brand-red text-center">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
            Tertarik Pasang Iklan?
          </h2>
          <p className="mt-3 text-sm text-white/85 max-w-xl mx-auto leading-relaxed">
            Hubungi redaksi untuk berkonsultasi tentang slot, materi iklan, dan penayangan.
            Tim kami siap membantu Anda.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-brand-red text-[10px] font-black uppercase tracking-[0.16em] rounded-xl hover:bg-red-50 transition-all"
              >
                <MessageCircle size={14} />
                WhatsApp Redaksi
              </a>
            )}
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-black/20 text-white text-[10px] font-black uppercase tracking-[0.16em] rounded-xl hover:bg-black/30 transition-all"
              >
                <Mail size={14} />
                {contactEmail}
              </a>
            )}
            {!contactEmail && !whatsappLink && (
              <Link
                href={`/${siteParam}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-brand-red text-[10px] font-black uppercase tracking-[0.16em] rounded-xl hover:bg-red-50 transition-all"
              >
                <ArrowRight size={14} />
                Kembali ke Portal
              </Link>
            )}
          </div>
        </section>

        {/* Terms */}
        {termsContent && (
          <section>
            <LegalDocumentBody
              pageTitle="Syarat & Ketentuan Iklan"
              content={termsContent}
              siteName={siteConfig.name}
              proseSize="default"
              emptyMessage={`Ketentuan umum periklanan tertulis belum diunggah oleh redaksi regional ${siteConfig.name}. Hubungi admin kami untuk detail syarat lengkap.`}
            />
          </section>
        )}
      </div>
    </PublicInfoShell>
  )
}