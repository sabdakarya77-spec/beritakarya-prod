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

export type AdSlotId = 'leaderboard' | 'rectangle' | 'rectangle_secondary' | 'in_feed'

export type AdPlacementPage = 'homepage' | 'artikel'

export interface AdSlotDefinition {
  id: AdSlotId;
  name: string;
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
    id: 'leaderboard',
    name: 'Leaderboard Atas',
    size: '970 x 250 px',
    desc: 'Muncul di bagian atas homepage sebagai billboard utama.',
    placementPages: ['homepage'],
    publicSize: '970 x 250 px / Tablet: 728 x 90 px / Mobile: 320 x 50 px',
    publicBadge: 'Slot Premium',
    publicTitle: 'Billboard Atas',
    publicDescription: 'Slot billboard premium yang muncul di bagian atas homepage. Menjadi titik impresi pertama dengan ruang visual besar, cocok untuk kampanye branding dan awareness dengan visibilitas paling tinggi.',
    publicHighlights: [
      'Ukuran: 970 x 250 px (Desktop) / 728 x 90 px (Tablet) / 320 x 50 px (Mobile)',
      'Format: Gambar statis, GIF, Video klip, HTML kreatif',
      'Penempatan: Homepage bagian atas (posisi paling premium)',
    ],
    publicMockup: '970 x 250 px',
  },
  {
    id: 'rectangle',
    name: 'Sidebar Rectangle Utama',
    size: '300 x 250 px',
    desc: 'Muncul di sidebar homepage dan sidebar artikel sebagai slot promosi utama.',
    placementPages: ['homepage', 'artikel'],
    publicSize: '300 x 250 px',
    publicBadge: 'Slot Utama',
    publicTitle: 'Sidebar Rectangle Utama',
    publicDescription: 'Slot promosi utama berukuran rectangle yang muncul di sidebar homepage dan sidebar artikel. Cocok untuk kampanye yang ingin selalu terlihat di area pendamping konten.',
    publicHighlights: [
      'Ukuran: 300 x 250 px (Rectangle)',
      'Format: Gambar statis, GIF, Video ringkas',
      'Penempatan: Sidebar homepage dan artikel',
    ],
    publicMockup: '300 x 250 px',
  },
  {
    id: 'rectangle_secondary',
    name: 'Sidebar Rectangle Sekunder',
    size: '300 x 250 px',
    desc: 'Muncul sebagai slot iklan tambahan di sidebar halaman detail artikel.',
    placementPages: ['artikel'],
    publicSize: '300 x 250 px',
    publicBadge: 'Slot Tambahan',
    publicTitle: 'Sidebar Rectangle Sekunder',
    publicDescription: 'Slot iklan tambahan di sidebar halaman detail artikel. Ideal untuk kampanye pendamping, retargeting, atau promosi kedua tanpa mengambil posisi utama.',
    publicHighlights: [
      'Ukuran: 300 x 250 px (Rectangle)',
      'Format: Gambar statis, GIF, Video ringkas',
      'Penempatan: Sidebar artikel posisi kedua',
    ],
    publicMockup: '300 x 250 px',
  },
  {
    id: 'in_feed',
    name: 'In-Feed',
    size: '300 x 250 px',
    desc: 'Disisipkan secara otomatis di area feed homepage dan di tengah konten artikel.',
    placementPages: ['homepage', 'artikel'],
    publicSize: '300 x 250 px',
    publicBadge: 'Slot Feed',
    publicTitle: 'In-Feed',
    publicDescription: 'Slot sponsor yang disisipkan di area feed homepage dan di tengah konten artikel. Cocok untuk promosi native-style karena tampil di sela alur jelajah konten utama pembaca.',
    publicHighlights: [
      'Ukuran: 300 x 250 px (Rectangle)',
      'Format: Gambar statis, GIF, Video ringkas',
      'Penempatan: Area feed homepage dan konten artikel',
    ],
    publicMockup: '300 x 250 px',
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

/**
 * @deprecated Hanya untuk fallback/seed. Frontend harus fetch dari API.
 * @see PublicSiteLayout.tsx — fetch `/categories/tree` dan gunakan ini sebagai fallback awal.
 */
export const CATEGORIES_CONFIG: CategoryItem[] = CATEGORY_NAV_CONFIG
