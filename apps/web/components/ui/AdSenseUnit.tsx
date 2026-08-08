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
 */
interface AdSenseUnitProps {
  /** Slot id untuk identifikasi — bukan untuk penargetan, hanya membedakan container */
  slot: string;
  className?: string;
}

export function AdSenseUnit({ slot, className }: AdSenseUnitProps) {
  const pushedRef = useRef(false);

  // Daftarkan unit ke adsbygoogle — hanya sekali per instance, hanya di client
  useEffect(() => {
    const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
    if (!publisherId) return;

    // Pastikan adsbygoogle sudah dimuat oleh script di <head>
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
  }, []);

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  // Jika belum ada Publisher ID — render placeholder kosong agar tidak ada error
  if (!publisherId) {
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
        data-ad-slot={`slot-${slot}`}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}