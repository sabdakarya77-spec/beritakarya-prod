'use client';

import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * AdSenseUnit — komponen terpisah untuk Google AdSense (BUKAN via iframe/AdSpace).
 *
 * Unit `<ins class="adsbygoogle">` butuh akses same-origin (cookie, My Ad Center)
 * untuk berfungsi, jadi TIDAK boleh dirender di dalam sandboxed iframe.
 *
 * Dipasang di posisi fallback slot yang kosong (belum ada pengiklan mandiri),
 * dan otomatis mundur begitu ada pengiklan mandiri di slot yang sama.
 *
 * Menggunakan responsive/fluid ad unit (`data-ad-format="auto"`) agar otomatis
 * menyesuaikan ke ukuran container 300×250 (atau HOME_TOP yang lebih lebar).
 *
 * PENTING soal ID:
 * - Publisher ID (`pub-XXXXXXXXXXXXXXXX`) = 1 per akun AdSense → `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`
 * - Ad Unit ID (angka murni, mis. "1234567890") = 1 per unit iklan yang dibuat MANUAL
 *   di dashboard AdSense (Ads → By ad unit → Display ads → Responsive). BEDA dengan
 *   Publisher ID — jangan disamakan. Belum bisa dibuat kalau akun masih "menunggu review".
 *
 * Slot-to-env-var map di bawah ini adalah PLACEHOLDER — isi begitu 6 Ad Unit ID
 * asli sudah dibuat di dashboard AdSense. Selama env var belum diisi, komponen
 * ini render `null` (aman, tidak ada error, cuma ruang kosong).
 */
interface AdSenseUnitProps {
  /** Slot iklan kita (HOME_TOP, HOME_FEED_1, dst) — dipetakan ke Ad Unit ID lewat map di bawah */
  slot: string;
  className?: string;
}

/**
 * Peta slot kita → env var Ad Unit ID Google. Tambah/ubah di sini kalau nanti
 * ada slot baru — tidak perlu sentuh logic komponen.
 */
const AD_UNIT_ENV_MAP: Record<string, string | undefined> = {
  HOME_TOP: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP,
  HOME_FEED_1: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FEED_1,
  HOME_FEED_2: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FEED_2,
  ARTICLE_TOP: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_TOP,
  ARTICLE_MIDDLE: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_MIDDLE,
  ARTICLE_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM,
};

export function AdSenseUnit({ slot, className }: AdSenseUnitProps) {
  const pushedRef = useRef(false);

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const adUnitId = AD_UNIT_ENV_MAP[slot];

  // Daftarkan unit ke adsbygoogle — hanya sekali per instance, hanya di client
  useEffect(() => {
    if (!publisherId || !adUnitId) return;
    if (typeof window === 'undefined') return;

    try {
      const adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle;
      if (Array.isArray(adsbygoogle) && !pushedRef.current) {
        pushedRef.current = true;
        adsbygoogle.push({});
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AdSense] Gagal memuat unit:', err);
    }
  }, [publisherId, adUnitId]);

  // Belum ada Publisher ID ATAU Ad Unit ID untuk slot ini → placeholder kosong, tidak error
  if (!publisherId || !adUnitId) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center overflow-hidden bg-transparent',
        className
      )}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '300px' }}
        data-ad-client={`ca-${publisherId}`}
        data-ad-slot={adUnitId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}