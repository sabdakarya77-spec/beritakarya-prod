/**
 * Konfigurasi Slot Iklan — BeritaKarya
 *
 * Ukuran dan format slot iklan DIDEFINISIKAN DI SINI, bukan di database.
 * Database hanya menyimpan slot ID (misal: 'HOME_TOP'), ukuran diambil dari sini.
 *
 * Keuntungan:
 * - Ubah ukuran tanpa migrasi database
 * - Satu sumber kebenaran untuk semua slot
 * - Developer langsung tahu format (VIDEO/IMAGE) dari config ini
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type SlotId =
  | 'HOME_TOP'
  | 'HOME_FEED_1'
  | 'HOME_FEED_2'
  | 'ARTICLE_TOP'
  | 'ARTICLE_MIDDLE'
  | 'ARTICLE_BOTTOM'

export type SlotFormat = 'VIDEO' | 'IMAGE'

export type SlotTier = 'PREMIUM' | 'TINGGI' | 'MENENGAH' | 'EKONOMI'

export type DeviceVariant = 'desktop' | 'tablet' | 'mobile'

export interface SlotDimensions {
  width: number
  height: number
  minWidth: number
  minHeight: number
}

export interface SlotConfig {
  id: SlotId
  name: string
  tier: SlotTier
  format: SlotFormat
  dimensions: Record<DeviceVariant, SlotDimensions>
}

// ─── Slot Configurations ─────────────────────────────────────────────────────

export const AD_SLOT_CONFIG: Record<SlotId, SlotConfig> = {
  HOME_TOP: {
    id: 'HOME_TOP',
    name: 'Hero Banner',
    tier: 'PREMIUM',
    format: 'VIDEO',
    dimensions: {
      desktop: { width: 800, height: 200, minWidth: 400, minHeight: 100 },
      tablet:  { width: 800, height: 200, minWidth: 300, minHeight: 75 },
      mobile:  { width: 320, height: 80,  minWidth: 200, minHeight: 50 },
    },
  },
  HOME_FEED_1: {
    id: 'HOME_FEED_1',
    name: 'Feed Atas',
    tier: 'TINGGI',
    format: 'IMAGE',
    dimensions: {
      desktop: { width: 300, height: 100, minWidth: 150, minHeight: 50 },
      tablet:  { width: 300, height: 100, minWidth: 150, minHeight: 50 },
      mobile:  { width: 210, height: 70,  minWidth: 105, minHeight: 35 },
    },
  },
  HOME_FEED_2: {
    id: 'HOME_FEED_2',
    name: 'Feed Bawah',
    tier: 'MENENGAH',
    format: 'IMAGE',
    dimensions: {
      desktop: { width: 210, height: 70, minWidth: 105, minHeight: 35 },
      tablet:  { width: 210, height: 70, minWidth: 105, minHeight: 35 },
      mobile:  { width: 180, height: 60, minWidth: 90,  minHeight: 30 },
    },
  },
  ARTICLE_TOP: {
    id: 'ARTICLE_TOP',
    name: 'Artikel Atas',
    tier: 'TINGGI',
    format: 'IMAGE',
    dimensions: {
      desktop: { width: 300, height: 100, minWidth: 150, minHeight: 50 },
      tablet:  { width: 300, height: 100, minWidth: 150, minHeight: 50 },
      mobile:  { width: 210, height: 70,  minWidth: 105, minHeight: 35 },
    },
  },
  ARTICLE_MIDDLE: {
    id: 'ARTICLE_MIDDLE',
    name: 'Artikel Tengah',
    tier: 'MENENGAH',
    format: 'IMAGE',
    dimensions: {
      desktop: { width: 210, height: 70, minWidth: 105, minHeight: 35 },
      tablet:  { width: 210, height: 70, minWidth: 105, minHeight: 35 },
      mobile:  { width: 180, height: 60, minWidth: 90,  minHeight: 30 },
    },
  },
  ARTICLE_BOTTOM: {
    id: 'ARTICLE_BOTTOM',
    name: 'Artikel Bawah',
    tier: 'EKONOMI',
    format: 'IMAGE',
    dimensions: {
      desktop: { width: 210, height: 70, minWidth: 105, minHeight: 35 },
      tablet:  { width: 210, height: 70, minWidth: 105, minHeight: 35 },
      mobile:  { width: 180, height: 60, minWidth: 90,  minHeight: 30 },
    },
  },
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Ambil config slot berdasarkan ID */
export function getSlotConfig(slotId: string): SlotConfig | null {
  return AD_SLOT_CONFIG[slotId as SlotId] || null
}

/** Ambil dimensi untuk slot + device tertentu */
export function getSlotDimensions(slotId: string, device: DeviceVariant): SlotDimensions | null {
  const config = getSlotConfig(slotId)
  return config?.dimensions[device] || null
}

/** Ambil format slot (VIDEO/IMAGE) */
export function getSlotFormat(slotId: string): SlotFormat | null {
  return getSlotConfig(slotId)?.format || null
}

/** Ambil tier slot */
export function getSlotTier(slotId: string): SlotTier | null {
  return getSlotConfig(slotId)?.tier || null
}

/** Daftar semua slot ID */
export const ALL_SLOT_IDS: SlotId[] = Object.keys(AD_SLOT_CONFIG) as SlotId[]

/** Slot yang menggunakan VIDEO */
export const VIDEO_SLOTS: SlotId[] = ALL_SLOT_IDS.filter(
  id => AD_SLOT_CONFIG[id].format === 'VIDEO'
)

/** Slot yang menggunakan IMAGE */
export const IMAGE_SLOTS: SlotId[] = ALL_SLOT_IDS.filter(
  id => AD_SLOT_CONFIG[id].format === 'IMAGE'
)
