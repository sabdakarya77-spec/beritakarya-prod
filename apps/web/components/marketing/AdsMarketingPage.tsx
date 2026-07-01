'use client';

import { useState, useEffect, useRef } from 'react'
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
  Play,
  Sparkles,
  Laptop,
  Smartphone,
  Info,
  type LucideIcon,
} from 'lucide-react'
import type { PublicSiteConfig } from '../../lib/siteSettings'
import { ADS_PUBLIC_PAGE } from '../../lib/marketingPages'
import { AD_SLOT_MAP, getAdSlotDefinition, type AdSlotId } from '../../lib/constants'
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
  // State for interactive simulator
  const [selectedPageType, setSelectedPageType] = useState<'homepage' | 'artikel'>('homepage')
  const [activeSlotId, setActiveSlotId] = useState<AdSlotId | null>(null)
  const [playingDemo, setPlayingDemo] = useState(false)
  const [demoProgress, setDemoProgress] = useState(0)

  // Map to store active duration per slot
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({})

  // Ref for auto scroll to slot card
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Group packages by slot ID
  const groupedPackages = adPackages.reduce(
    (acc, pkg) => {
      if (!acc[pkg.slot]) acc[pkg.slot] = []
      acc[pkg.slot].push(pkg)
      return acc
    },
    {} as Record<string, AdPackage[]>
  )

  // Initialize selected durations mapping (select the first duration available for each slot)
  useEffect(() => {
    const initialDurations: Record<string, number> = {}
    Object.entries(groupedPackages).forEach(([slot, packages]) => {
      if (packages.length > 0) {
        // sort by duration days ascending
        const sorted = [...packages].sort((a, b) => a.durationDays - b.durationDays)
        initialDurations[slot] = sorted[0].durationDays
      }
    })
    setSelectedDurations(initialDurations)
  }, [adPackages])

  // Simulated AI Video Player Progress Tracker
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (playingDemo) {
      setDemoProgress(0)
      timer = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) {
            setPlayingDemo(false)
            return 0
          }
          return prev + 1
        })
      }, 100)
    } else {
      setDemoProgress(0)
    }
    return () => clearInterval(timer)
  }, [playingDemo])

  const formatRupiah = (val: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(val));
  };

  // Helper to change duration for a slot
  const setSlotDuration = (slot: string, days: number) => {
    setSelectedDurations((prev) => ({
      ...prev,
      [slot]: days,
    }))
  }

  // Handle clicking slot in mock visualizer -> highlights package
  const handleSlotClick = (slotId: AdSlotId) => {
    setActiveSlotId(slotId)
    const pageType = slotId.startsWith('HOME') ? 'homepage' : 'artikel'
    setSelectedPageType(pageType)
    
    // Smooth scroll to the package card
    setTimeout(() => {
      const element = cardRefs.current[slotId]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  return (
    <PublicInfoShell siteConfig={siteConfig} width="wide">
      {/* Background Neon Glow Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-red/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <LegalPageHeader
        title={ADS_PUBLIC_PAGE.title}
        eyebrow={ADS_PUBLIC_PAGE.eyebrow}
        subtitle={`Skyrocket Bisnis Anda Melalui Jaringan Pembaca Lokal Terbesar dan Militan di Wilayah ${siteConfig.name}!`}
      />

      <div className="space-y-20 md:space-y-24">
        {/* Value Proposition Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {VALUE_PROPS.map((prop, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-gray-200 dark:border-white/5 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-brand-red/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-red/5 rounded-full blur-xl group-hover:bg-brand-red/10 transition-colors" />
              <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mb-5 border border-brand-red/20 group-hover:scale-110 transition-transform">
                <prop.icon size={22} className="text-brand-red" />
              </div>
              <h3 className="text-base font-black text-brand-black dark:text-white tracking-tight mb-2">
                {prop.title}
              </h3>
              <p className="text-sm text-brand-text-muted leading-relaxed relative z-10">{prop.desc}</p>
            </div>
          ))}
        </div>

        {/* Live Simulator & Interactive Visualization */}
        <div className="border-t border-black/5 dark:border-white/5 pt-16 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 bg-brand-red/10 text-brand-red text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-red/20">
              Interactive Layout Simulator
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight">
              Visualisasikan Iklan Anda
            </h2>
            <p className="text-sm text-brand-text-muted">
              Pilih tipe halaman dan lihat di mana materi iklan Anda akan ditayangkan di platform kami secara real-time.
            </p>

            {/* Layout Toggles */}
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => {
                  setSelectedPageType('homepage')
                  setActiveSlotId(null)
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedPageType === 'homepage'
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <Laptop size={14} />
                Beranda (Homepage)
              </button>
              <button
                onClick={() => {
                  setSelectedPageType('artikel')
                  setActiveSlotId(null)
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedPageType === 'artikel'
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <Smartphone size={14} />
                Halaman Artikel
              </button>
            </div>
          </div>

          {/* Simulated Browser Device */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Browser Header Bar */}
            <div className="bg-gray-50 dark:bg-slate-950 px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="bg-gray-200 dark:bg-white/5 text-[10px] text-gray-400 font-mono px-4 py-1.5 rounded-lg w-1/2 text-center select-none truncate">
                beritakarya.co/{siteParam}/{selectedPageType === 'homepage' ? '' : 'artikel/slug-berita'}
              </div>
              <div className="w-8" />
            </div>

            {/* Simulated Page Content */}
            <div className="p-6 md:p-8 space-y-6 max-h-[500px] overflow-y-auto select-none pointer-events-auto">
              {/* Mock Header Menu */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
                <div className="text-sm font-black tracking-tight text-brand-black dark:text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-brand-red rounded-full" />
                  BERITAKARYA
                </div>
                <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase">
                  <span>Terbaru</span>
                  <span>Nasional</span>
                  <span>Daerah</span>
                  <span>Ekonomi</span>
                </div>
              </div>

              {selectedPageType === 'homepage' ? (
                // ─────────────────────────────────────────────
                // HOMEPAGE VIEW SIMULATION
                // ─────────────────────────────────────────────
                <div className="space-y-6">
                  {/* HOME_TOP Slot */}
                  <div
                    onClick={() => handleSlotClick('HOME_TOP')}
                    onMouseEnter={() => setActiveSlotId('HOME_TOP')}
                    onMouseLeave={() => setActiveSlotId(null)}
                    className={`relative w-full aspect-[960/240] rounded-xl flex flex-col items-center justify-center border cursor-pointer overflow-hidden transition-all duration-300 ${
                      activeSlotId === 'HOME_TOP'
                        ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'border-dashed border-gray-300 dark:border-white/10 hover:border-amber-500/50 bg-gray-50 dark:bg-white/[0.02]'
                    }`}
                  >
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-900 text-[8px] font-black uppercase rounded-full">
                        ⭐ PREMIUM
                      </span>
                      <span className="px-2 py-0.5 bg-brand-red text-white text-[8px] font-black uppercase rounded-full flex items-center gap-1">
                        <Video size={8} /> VIDEO
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">
                      [HOME_TOP] Hero Banner Video (960 x 240)
                    </p>
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-1">
                      Tim kreatif kami produksikan video iklan Anda
                    </p>
                    {activeSlotId === 'HOME_TOP' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-500/20 to-amber-500/5 animate-pulse" />
                    )}
                  </div>

                  {/* Mock Hero Bento Section */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 bg-gray-100 dark:bg-white/[0.03] p-4 rounded-xl space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                      <div className="h-20 bg-gray-200 dark:bg-white/10 rounded" />
                    </div>
                    <div className="bg-gray-100 dark:bg-white/[0.03] p-4 rounded-xl space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                        <div className="h-10 bg-gray-200 dark:bg-white/10 rounded mt-2" />
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                    </div>
                  </div>

                  {/* HOME_FEED_1 Slot */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-2 space-y-3">
                      <div className="h-3 bg-gray-100 dark:bg-white/[0.03] rounded w-1/4" />
                      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-11/12" />
                      <div className="h-12 bg-gray-100 dark:bg-white/[0.03] rounded" />
                    </div>

                    <div
                      onClick={() => handleSlotClick('HOME_FEED_1')}
                      onMouseEnter={() => setActiveSlotId('HOME_FEED_1')}
                      onMouseLeave={() => setActiveSlotId(null)}
                      className={`relative aspect-[300/200] rounded-xl flex flex-col items-center justify-center border cursor-pointer transition-all duration-300 ${
                        activeSlotId === 'HOME_FEED_1'
                          ? 'border-brand-red bg-brand-red/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                          : 'border-dashed border-gray-300 dark:border-white/10 hover:border-brand-red/50 bg-gray-50 dark:bg-white/[0.02]'
                      }`}
                    >
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[6px] font-black uppercase rounded">
                        3:2 RATIO
                      </span>
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white text-center px-2">
                        [HOME_FEED_1] (300 x 200)
                      </p>
                      <p className="text-[6px] text-gray-400 uppercase mt-1">Banner Atas Feed</p>
                    </div>
                  </div>

                  {/* More mock content */}
                  <div className="border-t border-gray-100 dark:border-white/5 pt-4 grid grid-cols-3 gap-3">
                    <div className="h-20 bg-gray-100 dark:bg-white/[0.03] rounded-xl" />
                    <div className="h-20 bg-gray-100 dark:bg-white/[0.03] rounded-xl" />
                    <div className="h-20 bg-gray-100 dark:bg-white/[0.03] rounded-xl" />
                  </div>

                  {/* HOME_FEED_2 Slot */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div
                      onClick={() => handleSlotClick('HOME_FEED_2')}
                      onMouseEnter={() => setActiveSlotId('HOME_FEED_2')}
                      onMouseLeave={() => setActiveSlotId(null)}
                      className={`relative aspect-[300/150] rounded-xl flex flex-col items-center justify-center border cursor-pointer transition-all duration-300 ${
                        activeSlotId === 'HOME_FEED_2'
                          ? 'border-brand-red bg-brand-red/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                          : 'border-dashed border-gray-300 dark:border-white/10 hover:border-brand-red/50 bg-gray-50 dark:bg-white/[0.02]'
                      }`}
                    >
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[6px] font-black uppercase rounded">
                        2:1 RATIO
                      </span>
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white text-center px-2">
                        [HOME_FEED_2] (300 x 150)
                      </p>
                      <p className="text-[6px] text-gray-400 uppercase mt-1">Banner Bawah Feed</p>
                    </div>

                    <div className="col-span-2 space-y-3">
                      <div className="h-3 bg-gray-100 dark:bg-white/[0.03] rounded w-1/4" />
                      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-11/12" />
                      <div className="h-12 bg-gray-100 dark:bg-white/[0.03] rounded" />
                    </div>
                  </div>
                </div>
              ) : (
                // ─────────────────────────────────────────────
                // ARTICLE PAGE VIEW SIMULATION
                // ─────────────────────────────────────────────
                <div className="space-y-6">
                  {/* Article Title */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-brand-red uppercase tracking-wider">Energi Terbarukan</span>
                    <h1 className="text-sm md:text-base font-serif font-black text-brand-black dark:text-white">
                      Desa Karya Mandiri Sukses Kembangkan Pembangkit Listrik Tenaga Surya Skala Komunitas
                    </h1>
                    <div className="flex gap-2 text-[7px] text-gray-400 uppercase font-semibold">
                      <span>Oleh Penulis Karya</span>
                      <span>•</span>
                      <span>1 Juli 2026</span>
                    </div>
                  </div>

                  {/* Body paragraphs with inline ads */}
                  <div className="text-[10px] leading-relaxed text-brand-text-muted space-y-4">
                    <p className="h-8 bg-gray-100 dark:bg-white/[0.02] rounded" />
                    <p className="h-8 bg-gray-100 dark:bg-white/[0.02] rounded w-11/12" />

                    {/* ARTICLE_TOP Slot */}
                    <div
                      onClick={() => handleSlotClick('ARTICLE_TOP')}
                      onMouseEnter={() => setActiveSlotId('ARTICLE_TOP')}
                      onMouseLeave={() => setActiveSlotId(null)}
                      className={`relative w-full aspect-[300/100] md:aspect-[300/80] rounded-xl flex flex-col items-center justify-center border cursor-pointer transition-all duration-300 ${
                        activeSlotId === 'ARTICLE_TOP'
                          ? 'border-brand-red bg-brand-red/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                          : 'border-dashed border-gray-300 dark:border-white/10 hover:border-brand-red/50 bg-gray-50 dark:bg-white/[0.02]'
                      }`}
                    >
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white">
                        [ARTICLE_TOP] Banner Atas Artikel (300 x 200)
                      </p>
                      <p className="text-[6px] text-gray-400 uppercase mt-0.5">Setelah Paragraf ke-3</p>
                    </div>

                    <p className="h-8 bg-gray-100 dark:bg-white/[0.02] rounded w-10/12" />
                    <p className="h-8 bg-gray-100 dark:bg-white/[0.02] rounded" />

                    {/* ARTICLE_MIDDLE Slot */}
                    <div
                      onClick={() => handleSlotClick('ARTICLE_MIDDLE')}
                      onMouseEnter={() => setActiveSlotId('ARTICLE_MIDDLE')}
                      onMouseLeave={() => setActiveSlotId(null)}
                      className={`relative w-full aspect-[300/100] md:aspect-[300/80] rounded-xl flex flex-col items-center justify-center border cursor-pointer transition-all duration-300 ${
                        activeSlotId === 'ARTICLE_MIDDLE'
                          ? 'border-brand-red bg-brand-red/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                          : 'border-dashed border-gray-300 dark:border-white/10 hover:border-brand-red/50 bg-gray-50 dark:bg-white/[0.02]'
                      }`}
                    >
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white">
                        [ARTICLE_MIDDLE] Banner Tengah Artikel (300 x 150)
                      </p>
                      <p className="text-[6px] text-gray-400 uppercase mt-0.5">Setelah Paragraf ke-8</p>
                    </div>

                    <p className="h-8 bg-gray-100 dark:bg-white/[0.02] rounded" />

                    {/* ARTICLE_BOTTOM Slot */}
                    <div
                      onClick={() => handleSlotClick('ARTICLE_BOTTOM')}
                      onMouseEnter={() => setActiveSlotId('ARTICLE_BOTTOM')}
                      onMouseLeave={() => setActiveSlotId(null)}
                      className={`relative w-full aspect-[300/100] md:aspect-[300/80] rounded-xl flex flex-col items-center justify-center border cursor-pointer transition-all duration-300 ${
                        activeSlotId === 'ARTICLE_BOTTOM'
                          ? 'border-brand-red bg-brand-red/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                          : 'border-dashed border-gray-300 dark:border-white/10 hover:border-brand-red/50 bg-gray-50 dark:bg-white/[0.02]'
                      }`}
                    >
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white">
                        [ARTICLE_BOTTOM] Banner Bawah Artikel (300 x 150)
                      </p>
                      <p className="text-[6px] text-gray-400 uppercase mt-0.5">Sebelum Konten Artikel Terkait</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Interactive Tooltip Helper */}
            <div className="bg-amber-500/10 dark:bg-amber-500/5 px-4 py-3 border-t border-gray-200 dark:border-white/10 flex items-center gap-2.5">
              <Info size={14} className="text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700 dark:text-amber-500 font-semibold leading-relaxed">
                Tip: Sorot atau klik salah satu slot iklan bergaris putus-putus di atas untuk otomatis mencari paket harga slot tersebut di bawah.
              </p>
            </div>
          </div>
        </div>

        {/* AI Creative Video Service Showcase */}
        <div className="bg-[#020617] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-red/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Showcase Left: Copywriting */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                <Sparkles size={10} /> Exclusive Video Service
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-tight leading-none">
                KIRIM FOTO & LOGO,<br />
                KAMI BUATKAN VIDEO IKLANNYA
              </h2>
              <p className="text-sm text-brand-text-muted leading-relaxed">
                Tidak punya aset video promosi? Tenang saja. Khusus untuk slot <strong className="text-white">HOME_TOP</strong>, Anda cukup mengunggah foto produk utama dan logo bisnis Anda. Tim kreatif kami akan memproses dan merancang video iklan sinematik berkualitas tinggi berdurasi 10-15 detik.
              </p>
              
              <ul className="space-y-3.5 text-xs text-gray-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Eksklusif & Kualitas Terjamin:</strong> Diproduksi khusus agar pas dengan aspek rasio 4:1 tanpa terpotong di mobile.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Praktis & Instan:</strong> Cocok untuk UMKM, toko lokal, kuliner, properti, hingga dealer otomotif.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Proses Cepat:</strong> Iklan video siap ditayangkan dalam waktu 1-2 hari kerja sejak booking disetujui.</span>
                </li>
              </ul>
            </div>

            {/* Showcase Right: Interactive Simulation Video player */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Simulasi Pemutar Iklan Video (4:1)</span>

                <div className="relative w-full aspect-[4/1] rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center shadow-inner group">
                  {playingDemo ? (
                    // ─────────────────────────────────────────────
                    // CSS SIMULATED VIDEO MOVEMENT
                    // ─────────────────────────────────────────────
                    <div className="w-full h-full relative overflow-hidden">
                      {/* Panning background image to simulate video camera movement */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center animate-pulse scale-110"
                        style={{ 
                          backgroundImage: 'url("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop")',
                          animation: 'zoom-pan 10s linear infinite'
                        }}
                      />
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-black/40" />

                      {/* Moving logo watermark */}
                      <div className="absolute top-2 left-3 bg-white/95 text-[7px] text-slate-900 font-extrabold px-1.5 py-0.5 rounded shadow flex items-center gap-1 animate-bounce">
                        <Sparkles size={6} className="text-amber-500" />
                        Logo Anda
                      </div>

                      {/* Dynamic typography animation overlays */}
                      <div className="absolute inset-y-0 left-12 flex flex-col justify-center max-w-[50%] text-left space-y-0.5 z-10">
                        <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest animate-pulse">KULINER SPESIAL</span>
                        <h4 className="text-[10px] md:text-xs font-black text-white leading-tight drop-shadow-md">
                          Kelezatan Otentik Nusantara
                        </h4>
                        <p className="text-[6px] text-gray-200 drop-shadow">Diskon 20% khusus akhir pekan ini!</p>
                      </div>

                      {/* Playback progress bar at the bottom */}
                      <div className="absolute bottom-0 left-0 h-1 bg-brand-red transition-all duration-100" style={{ width: `${demoProgress}%` }} />
                    </div>
                  ) : (
                    // Default idle screen
                    <div className="text-center p-4 z-10 flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center cursor-pointer hover:bg-amber-500/20 transition-all hover:scale-105" onClick={() => setPlayingDemo(true)}>
                        <Play size={18} className="text-amber-500 ml-0.5 fill-amber-500" />
                      </div>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                        Klik Play Untuk Lihat Demo Hasil Video
                      </p>
                    </div>
                  )}

                  {/* Standard keyframe utility inside the component view */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes zoom-pan {
                      0% { transform: scale(1) translate(0px, 0px); }
                      50% { transform: scale(1.15) translate(-5px, 2px); }
                      100% { transform: scale(1) translate(0px, 0px); }
                    }
                  `}} />
                </div>

                {/* Workflow steps diagram */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                    <span className="text-[7px] font-bold text-gray-400 block mb-0.5">LANGKAH 1</span>
                    <span className="text-[9px] font-black text-white block uppercase">Unggah Bahan</span>
                    <span className="text-[6px] text-gray-400 block mt-0.5">Kirim Foto & Logo</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2 relative">
                    <span className="text-[7px] font-bold text-amber-500 block mb-0.5">LANGKAH 2</span>
                    <span className="text-[9px] font-black text-white block uppercase">Tim Kreatif</span>
                    <span className="text-[6px] text-gray-400 block mt-0.5">Produksi Video</span>
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">&rarr;</div>
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">&rarr;</div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                    <span className="text-[7px] font-bold text-gray-400 block mb-0.5">LANGKAH 3</span>
                    <span className="text-[9px] font-black text-white block uppercase">Siap Tayang</span>
                    <span className="text-[6px] text-gray-400 block mt-0.5">Dalam 24-48 Jam</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Package Grid Section */}
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-black/5 dark:border-white/5 pt-16">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-brand-red" aria-hidden />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-red">
                  Katalog Layanan
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight">
                PILIH TARIF & PENEMPATAN
              </h2>
              <p className="text-[11px] text-brand-text-muted font-semibold uppercase tracking-widest mt-2">
                PILIHAN DURASI DAN LAYANAN SESUAI KEBUTUHAN PROMOSI BISNIS ANDA
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

                // Sort packages inside the slot by duration days
                const sortedPkgs = [...packages].sort((a, b) => a.durationDays - b.durationDays)

                // Get selected duration for this slot
                const currentDuration = selectedDurations[slot] || (sortedPkgs[0]?.durationDays ?? 7)

                // Find currently active package based on duration select
                const activePkg = sortedPkgs.find((p) => p.durationDays === currentDuration) || sortedPkgs[0]

                if (!activePkg) return null

                const isHighlighted = activeSlotId === slot

                return (
                  <div
                    key={slot}
                    ref={(el) => { cardRefs.current[slot] = el }}
                    className={`bg-white dark:bg-slate-900/40 backdrop-blur-sm border p-6 md:p-8 rounded-3xl flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 relative overflow-hidden ${
                      isHighlighted
                        ? 'border-brand-red dark:border-brand-red/50 shadow-[0_20px_40px_rgba(239,68,68,0.08)] bg-brand-red/[0.01]'
                        : 'border-gray-200 dark:border-white/5'
                    }`}
                  >
                    {/* Visual Glow Effect for Highlight */}
                    {isHighlighted && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/5 rounded-full blur-xl pointer-events-none" />
                    )}

                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                          isHighlighted 
                            ? 'bg-brand-red/20 border-brand-red/30' 
                            : 'bg-brand-red/10 border-brand-red/10'
                        }`}>
                          <IconComponent size={22} className="text-brand-red" />
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const slotDef = getAdSlotDefinition(activePkg.slot);
                            return slotDef?.tier ? (
                              <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${
                                slotDef.tier === 'PREMIUM' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                slotDef.tier === 'TINGGI' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                                slotDef.tier === 'MENENGAH' ? 'bg-gray-100 dark:bg-white/10 text-gray-500 border border-gray-200 dark:border-white/5' :
                                'bg-gray-50 dark:bg-white/5 text-gray-400 border border-gray-100 dark:border-white/5'
                              }`}>
                                {slotDef.tier}
                              </span>
                            ) : null;
                          })()}
                          <span className="px-3 py-1 bg-brand-red/10 border border-brand-red/10 text-brand-red text-[9px] font-black uppercase tracking-wider rounded-full">
                            {activePkg.allowedFormat === 'VIDEO' ? '🎥 Video' : '🖼️ Banner'}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-brand-black dark:text-white tracking-tight mb-2 flex items-center gap-2">
                        {activePkg.name}
                        {activePkg.slot === 'HOME_TOP' && (
                          <span className="text-amber-500 text-xs animate-pulse">★</span>
                        )}
                      </h3>
                      
                      <p className="text-sm text-brand-text-muted leading-relaxed mb-5">
                        {activePkg.description || slotDesc}
                      </p>

                      {/* Dynamic Duration Toggle Tabs */}
                      {sortedPkgs.length > 1 && (
                        <div className="mb-5 space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Pilih Durasi Tayang:</label>
                          <div className="flex gap-1.5 p-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5">
                            {sortedPkgs.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSlotDuration(slot, p.durationDays)}
                                className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                  currentDuration === p.durationDays
                                    ? 'bg-white dark:bg-slate-800 text-brand-red shadow-sm border border-gray-200/50 dark:border-white/10'
                                    : 'text-gray-500 hover:text-brand-black dark:hover:text-white'
                                }`}
                              >
                                {p.durationDays} Hari
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <ul className="space-y-2.5 mb-6 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider border-t border-black/5 dark:border-white/5 pt-4">
                        <li className="flex items-center gap-2">
                          <ChevronRight size={14} className="text-brand-red shrink-0" />
                          <span>Ukuran Layar:</span>
                          <span className="text-brand-black dark:text-white ml-auto">{slotSize}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ChevronRight size={14} className="text-brand-red shrink-0" />
                          <span>Format Materi:</span>
                          <span className="text-brand-black dark:text-white ml-auto">
                            {activePkg.allowedFormat === 'VIDEO' ? '🎥 Video (Kami Buatkan)' : activePkg.allowedFormat === 'IMAGE' ? '🖼️ Gambar (JPG/PNG)' : '🎥+🖼️ Semua Format'}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock size={14} className="text-brand-red shrink-0" />
                          <span>Masa Penayangan:</span>
                          <span className="text-brand-black dark:text-white ml-auto">{activePkg.durationDays} Hari Kalender</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">
                            Tarif Sewa
                          </span>
                          <p className="text-xl font-black text-brand-red leading-none mt-1">
                            {formatRupiah(activePkg.price)}
                          </p>
                        </div>
                        <Link
                          href={`/${siteParam}/ads/order?package=${activePkg.id}`}
                          className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-red text-white text-[10px] font-black uppercase tracking-[0.16em] rounded-xl hover:bg-brand-red/90 transition-all hover:translate-x-1 shadow-lg shadow-brand-red/25"
                        >
                          Pesan Paket
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-12 text-center">
              <p className="text-brand-text-muted italic">
                Paket iklan belum tersedia. Silakan hubungi redaksi {siteConfig.name} untuk informasi
                mereka lebih lanjut.
              </p>
            </div>
          )}
        </div>

        {/* Premium CTA Bottom Card */}
        <div className="bg-[#020617] border border-white/5 p-10 md:p-14 text-center rounded-3xl relative overflow-hidden shadow-[0_28px_56px_rgba(2,6,23,0.3)]">
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-brand-red/10 to-transparent pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <h3 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-tight mb-4">
            Siap Meluncurkan Kampanye Iklan Anda?
          </h3>
          <p className="text-sm text-brand-text-muted max-w-xl mx-auto leading-relaxed mb-8">
            Bergabunglah bersama ribuan mitra pengiklan regional BeritaKarya. Proses pendaftaran
            instan dan pantau hasil secara transparan langsung dari dashboard Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register?role=advertiser"
              className="px-8 py-4 bg-brand-red border border-transparent text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-brand-black transition-all rounded-xl flex items-center gap-2 group shadow-lg shadow-brand-red/20 w-full sm:w-auto justify-center"
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

        {/* Legal Terms section */}
        <LegalDocumentBody
          pageTitle="Syarat & Ketentuan Umum Periklanan"
          sectionTitle="Syarat & Ketentuan Umum Periklanan"
          content={termsContent}
          siteName={siteConfig.name}
          eyebrow="Dokumen Portal"
          proseSize="default"
          emptyMessage={`Ketentuan umum periklanan tertulis belum diunggah oleh redaksi regional ${siteConfig.name}. Hubungi admin kami untuk detail syarat lengkap.`}
        />
      </div>
    </PublicInfoShell>
  )
}
