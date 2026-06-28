import type { CategoryConfigItem } from '@beritakarya/config'
import { CATEGORY_NAV_CONFIG, ROLE_LABELS, ROLE_COLORS } from '@beritakarya/config'

export { ROLE_LABELS, ROLE_COLORS }

export const CATEGORY_COLORS: Record<string, string> = {
  nasional: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30',
  daerah: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  politik: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30',
  pilkada: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30',
  pemilu: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30',
  'dpr-dprd': 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30',
  'hukum-keadilan': 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/30',
  hukum: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/30',
  pendidikan: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30',
  peristiwa: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30',
  ekonomi: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30',
  'makro-keuangan': 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30',
  'bisnis-saham': 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30',
  umkm: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30',
  industrial: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30',
  teknologi: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30',
  'gadget-review': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30',
  smartphone: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30',
  'laptop-pc': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30',
  aksesoris: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30',
  'ai-inovasi': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30',
  'startups-digital': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30',
  'game-esports': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30',
  olahraga: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'piala-dunia': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'timnas-garuda': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'sepak-bola': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'liga-indonesia': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'liga-eropa': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'transfer-pemain': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'ragam-olahraga': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  opini: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30',
  'kolom-esai': 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30',
  'tajuk-rencana': 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30',
  wawancara: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30',
  investigasi: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30',
  'laporan-investigasi': 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30',
  'sorotan-khusus': 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30',
  'gaya-hidup': 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30',
  'wisata-kuliner': 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30',
  'kesehatan-wellness': 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30',
  'seni-film-fesyen': 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30',
  otomotif: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30',
  advertorial: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30',
  'info-bisnis': 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30',
  'rilis-pers': 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30',
  video: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30',
  'dokumenter-reportase': 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30',
  'foto-jurnalistik': 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30',
  'podcast-audio': 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30',
  tersimpan: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-900/30',
  terbaru: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-900/30',
  'dki-jakarta-banten': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'jawa-barat-tengah': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'jawa-timur-bali': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'sumatera-kalimantan': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'sulawesi-papua': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  'kabar-desa': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
  gaya_hidup: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30',
}

export function getCategoryColor(categoryName: string = 'umum'): string {
  const key = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/^-|-$/g, '').trim()
  return CATEGORY_COLORS[key] || CATEGORY_COLORS[categoryName.toLowerCase().replace(/\s+/g, '_').replace(/^-|-$/g, '').trim()] || 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30'
}

export type SubCategory = CategoryConfigItem
export type CategoryItem = CategoryConfigItem

export type AdSlotId = 'HOME_TOP' | 'HOME_FEED_1' | 'HOME_FEED_2' | 'ARTICLE_TOP' | 'ARTICLE_MIDDLE' | 'ARTICLE_BOTTOM'

export type AdPlacementPage = 'homepage' | 'artikel'

export type AdSlotFormat = 'VIDEO' | 'IMAGE'
export type AdSlotTier = 'PREMIUM' | 'TINGGI' | 'MENENGAH' | 'EKONOMI'

export interface AdSlotDefinition {
  id: AdSlotId;
  name: string;
  tier: AdSlotTier;
  format: AdSlotFormat;
  size: string;
  desc: string;
  placementPages: AdPlacementPage[];
  publicSize: string;
  publicBadge: string;
  publicTitle: string;
  publicDescription: string;
  publicHighlights: string[];
  publicMockup: string;
}

export interface SiteConfig {
  id: string;
  name: string;
  domain?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  footerText?: string | null;
  trendingTopics?: unknown[];
  socialLinks?: Record<string, string | null | undefined>;
  appearance?: {
    primaryColor?: string | null;
  };
  [key: string]: unknown;
}

export const AD_SLOT_DEFINITIONS: AdSlotDefinition[] = [
  {
    id: 'HOME_TOP',
    name: 'HOME TOP',
    tier: 'PREMIUM',
    format: 'VIDEO',
    size: '960 x 240 px',
    desc: 'Video premium di homepage atas. Advertiser kirim logo & foto, tim kreatif produksi video.',
    placementPages: ['homepage'],
    publicSize: '960 x 240 px / Tablet: 728 x 182 px / Mobile: 360 x 90 px',
    publicBadge: 'Slot Premium',
    publicTitle: 'Hero Banner',
    publicDescription: 'Slot video premium di bagian atas homepage. Tim kreatif kami produksikan video iklan dari logo & foto Anda. Durasi 10-15 detik, visibilitas paling tinggi.',
    publicHighlights: [
      'Ukuran: 960 x 240 px (Desktop) / 728 x 182 px (Tablet) / 360 x 90 px (Mobile)',
      'Format: Video (kami produksikan — cukup kirim logo & foto)',
      'Penempatan: Homepage bagian atas (posisi paling premium)',
    ],
    publicMockup: '960 x 240 px',
  },
  {
    id: 'HOME_FEED_1',
    name: 'Feed Atas',
    tier: 'TINGGI',
    format: 'IMAGE',
    size: '300 x 200 px',
    desc: 'Muncul di tengah feed homepage setelah 6-8 berita.',
    placementPages: ['homepage'],
    publicSize: '300 x 200 px (Desktop / Tablet / Mobile)',
    publicBadge: 'Slot Feed Utama',
    publicTitle: 'Feed Atas',
    publicDescription: 'Slot iklan yang muncul di tengah feed homepage setelah 6-8 berita. Posisi strategis di alur konten pembaca, cocok untuk promosi native-style.',
    publicHighlights: [
      'Ukuran: 300 x 200 px (semua device)',
      'Format: Gambar statis, GIF',
      'Penempatan: Feed homepage posisi atas',
    ],
    publicMockup: '300 x 200 px',
  },
  {
    id: 'HOME_FEED_2',
    name: 'Feed Bawah',
    tier: 'MENENGAH',
    format: 'IMAGE',
    size: '300 x 150 px',
    desc: 'Muncul di bawah feed homepage setelah 12-15 berita.',
    placementPages: ['homepage'],
    publicSize: '300 x 150 px (Desktop / Tablet / Mobile)',
    publicBadge: 'Slot Feed Kedua',
    publicTitle: 'Feed Bawah',
    publicDescription: 'Slot iklan yang muncul di bawah feed homepage setelah 12-15 berita. Ideal untuk kampanye pendamping atau retargeting pembaca yang sudah melihat konten lebih dalam.',
    publicHighlights: [
      'Ukuran: 300 x 150 px (semua device)',
      'Format: Gambar statis, GIF',
      'Penempatan: Feed homepage posisi bawah',
    ],
    publicMockup: '300 x 150 px',
  },
  {
    id: 'ARTICLE_TOP',
    name: 'Artikel Atas',
    tier: 'TINGGI',
    format: 'IMAGE',
    size: '300 x 200 px',
    desc: 'Muncul di halaman artikel setelah paragraf ke-3.',
    placementPages: ['artikel'],
    publicSize: '300 x 200 px (semua device)',
    publicBadge: 'Slot Artikel',
    publicTitle: 'Artikel Atas',
    publicDescription: 'Slot iklan yang muncul di awal artikel setelah paragraf ke-3. Pembaca sudah mulai tertarik dengan konten, sehingga iklan di posisi ini memiliki engagement tinggi.',
    publicHighlights: [
      'Ukuran: 300 x 200 px (semua device)',
      'Format: Gambar statis, GIF',
      'Penempatan: Halaman artikel, setelah paragraf ke-3',
    ],
    publicMockup: '300 x 200 px',
  },
  {
    id: 'ARTICLE_MIDDLE',
    name: 'Artikel Tengah',
    tier: 'MENENGAH',
    format: 'IMAGE',
    size: '300 x 150 px',
    desc: 'Muncul di tengah konten artikel setelah paragraf ke-8.',
    placementPages: ['artikel'],
    publicSize: '300 x 150 px (semua device)',
    publicBadge: 'Slot In-Artikel',
    publicTitle: 'Artikel Tengah',
    publicDescription: 'Slot iklan native yang muncul di tengah konten artikel setelah paragraf ke-8. Posisi ini menangkap pembaca yang sudah berkomitmen membaca, cocok untuk promosi yang relevan.',
    publicHighlights: [
      'Ukuran: 300 x 150 px (semua device)',
      'Format: Gambar statis, GIF',
      'Penempatan: Tengah konten artikel',
    ],
    publicMockup: '300 x 150 px',
  },
  {
    id: 'ARTICLE_BOTTOM',
    name: 'Artikel Bawah',
    tier: 'EKONOMI',
    format: 'IMAGE',
    size: '300 x 150 px',
    desc: 'Muncul di bawah artikel, sebelum artikel terkait.',
    placementPages: ['artikel'],
    publicSize: '300 x 150 px (semua device)',
    publicBadge: 'Slot Penutup',
    publicTitle: 'Artikel Bawah',
    publicDescription: 'Slot iklan yang muncul di bawah artikel sebelum artikel terkait. Pembaca sudah selesai membaca, cocok untuk CTA atau kampanye awareness sebelum mereka beralih ke konten lain.',
    publicHighlights: [
      'Ukuran: 300 x 150 px (semua device)',
      'Format: Gambar statis, GIF',
      'Penempatan: Bawah artikel, sebelum artikel terkait',
    ],
    publicMockup: '300 x 150 px',
  },
]

export const AD_SLOT_MAP: Record<AdSlotId, AdSlotDefinition> = AD_SLOT_DEFINITIONS.reduce(
  (acc, slot) => {
    acc[slot.id] = slot
    return acc
  },
  {} as Record<AdSlotId, AdSlotDefinition>
)

export function getAdSlotDefinition(slot: string): AdSlotDefinition | null {
  return AD_SLOT_MAP[slot as AdSlotId] || null
}

/** Ambil format slot (VIDEO/IMAGE) — developer langsung tahu render method */
export function getAdSlotFormat(slot: string): AdSlotFormat | null {
  return AD_SLOT_MAP[slot as AdSlotId]?.format || null
}

/** Ambil tier slot (PREMIUM/TINGGI/MENENGAH/EKONOMI) */
export function getAdSlotTier(slot: string): AdSlotTier | null {
  return AD_SLOT_MAP[slot as AdSlotId]?.tier || null
}

/** Slot yang menggunakan VIDEO */
export const VIDEO_AD_SLOTS: AdSlotId[] = AD_SLOT_DEFINITIONS
  .filter(s => s.format === 'VIDEO')
  .map(s => s.id)

/** Slot yang menggunakan IMAGE */
export const IMAGE_AD_SLOTS: AdSlotId[] = AD_SLOT_DEFINITIONS
  .filter(s => s.format === 'IMAGE')
  .map(s => s.id)

/**
 * @deprecated Hanya untuk fallback/seed. Frontend harus fetch dari API.
 * @see PublicSiteLayout.tsx — fetch `/categories/tree` dan gunakan ini sebagai fallback awal.
 */
export const CATEGORIES_CONFIG: CategoryItem[] = CATEGORY_NAV_CONFIG
