'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { cn } from '../../lib/utils';
import { API_URL } from '../../lib/api';
import type { AdSlotId } from '../../lib/constants';
import { SmartImage } from './SmartImage';
import { AdSenseUnit } from './AdSenseUnit';
import { Container } from '../layout/Container';

export interface AdSpaceProps {
  type: AdSlotId;
  slot?: AdSlotId;
  label?: string;
  className?: string;
  /** Pre-fetched ads from server (SSR) — skips client-side fetch for LCP optimization */
  initialAds?: AdItem[];
}

export interface AdItem {
  id: string;
  slot: string;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order: number;
}

interface FallbackAd {
  mediaType?: string;
  mediaUrl?: string;
  headline?: string;
  [key: string]: unknown;
}

/**
 * Sub‑component rendering a single ad slide (full image only — SIMPLIFIKASI-IKLAN.md).
 */
function AdSlide({
  ad,
  label,
  onAdClick,
}: {
  ad: AdItem;
  label: string;
  onAdClick: (ad: AdItem) => void;
}) {
  if (!ad.imageUrl) return null;

  return (
    <a
      href={ad.linkUrl || '#'}
      onClick={() => onAdClick(ad)}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative w-full h-full overflow-hidden group border border-gray-200 dark:border-white/10 bg-white dark:bg-black"
    >
      <span className="absolute right-1.5 top-1.5 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/70">
        {label}
      </span>
      <SmartImage
        src={ad.imageUrl}
        context="card"
        alt={label}
        fill
        sizes="(max-width: 640px) 100vw, 360px"
        className="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
    </a>
  );
}

/** Lazy‑loading video wrapper for fallback ads. Only loads src when near viewport. */
function FallbackVideo({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [inView]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <video
        ref={videoRef}
        src={inView ? src : undefined}
        loop
        muted
        playsInline
        preload="none"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function AdSpace({
  type,
  slot,
  label = "Ad",
  className = "",
  initialAds,
}: AdSpaceProps) {
  const params = useParams();
  const site = params?.site as string | undefined;
  const [ads, setAds] = useState<AdItem[]>([]);
  // Fallback ads fetched from CMS when no ads are configured for the slot
  const [fallbackAds, setFallbackAds] = useState<FallbackAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackedRef = useRef<Set<string>>(new Set());

  // Allow UI to reuse the same visual format while targeting a different backend slot.
  const slotName = slot || type;

  // Fetch ads — skip if pre-fetched data is provided (SSR)
  useEffect(() => {
    if (initialAds && initialAds.length > 0) {
      setAds(initialAds);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchAds = async () => {
      try {
        const siteParam = site || 'pusat';
        const res = await fetch(`${API_URL}/api/v1/ads/public?site=${siteParam}`);
        if (!res.ok) return;
        const json = await res.json();

        if (json.success && json.data && active) {
          const matched = json.data.filter((a: AdItem) => a.slot === slotName);
          // Randomize urutan (bukan berdasarkan order) — setiap page load urutan berbeda
          const shuffled = matched.sort(() => Math.random() - 0.5);
          setAds(shuffled);
        }
      } catch (error) {
        console.error('Gagal memuat iklan', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAds();
    return () => { active = false; };
  }, [site, slotName, initialAds]);

  // Carousel: auto-rotate (only if multiple ads)
  const isCarousel = ads.length > 1;
  const CAROUSEL_INTERVAL = 7000;

  const stopRotation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRotation = useCallback(() => {
    if (!isCarousel) return;
    stopRotation();
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length);
    }, CAROUSEL_INTERVAL);
  }, [isCarousel, ads.length, stopRotation, CAROUSEL_INTERVAL]);

  useEffect(() => {
    startRotation();
    return stopRotation;
  }, [startRotation, stopRotation]);

  // Fetch CMS fallback ads when there are no ads for the slot (only for HOME_TOP)
  useEffect(() => {
    if (loading) return;
    if (ads.length === 0 && type === 'HOME_TOP') {
      const fetchFallback = async () => {
        try {
          const res = await fetch(`${API_URL}/api/v1/ads/fallback?slot=HOME_TOP`);
          if (!res.ok) return;
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setFallbackAds(json.data);
          }
        } catch {
          // ignore errors – fallback will remain empty
        }
      };
      fetchFallback();
    }
  }, [ads, loading, type]);

  // Track impression for each displayed ad (one‑time per ad ID)
  useEffect(() => {
    const ad = ads[currentIndex];
    if (!ad || trackedRef.current.has(ad.id)) return;
    trackedRef.current.add(ad.id);
    fetch(`${API_URL}/api/v1/ads/track/${ad.id}?action=impression`, {
      method: 'POST'
    }).catch(() => {});
  }, [ads, currentIndex]);

  const handleAdClick = (ad: AdItem) => {
    const url = `${API_URL}/api/v1/ads/track/${ad.id}?action=click`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  };

  const styles: Record<AdSlotId, string> = {
    HOME_TOP:       "w-full max-w-[970px] aspect-[970/250] mx-auto rounded-xl overflow-hidden",
    HOME_FEED_1:    "w-full max-w-[360px] aspect-[300/250] mx-auto rounded-lg overflow-hidden",
    HOME_FEED_2:    "w-full max-w-[360px] aspect-[300/250] mx-auto rounded-lg overflow-hidden",
    ARTICLE_TOP:    "w-full max-w-[360px] aspect-[300/250] mx-auto rounded-lg overflow-hidden mb-8",
    ARTICLE_MIDDLE: "w-full max-w-[360px] aspect-[300/250] mx-auto rounded-lg overflow-hidden mb-12",
    ARTICLE_BOTTOM: "w-full max-w-[360px] aspect-[300/250] mx-auto rounded-lg overflow-hidden mb-6",
  };

  // Loading state
  if (loading) {
    if (type === 'HOME_TOP') {
      return (
        <section className="py-8 md:py-12">
          <Container>
            <div className={cn(
              "bg-gray-50/50 dark:bg-white/[0.02] animate-pulse border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden",
              styles[type],
              className
            )}>
              <span className="text-[10px] font-black tracking-widest text-brand-text-muted uppercase">MEMUAT IKLAN...</span>
            </div>
          </Container>
        </section>
      );
    }
    return (
      <div className={cn(
        "bg-gray-50/50 dark:bg-white/[0.02] animate-pulse border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden",
        styles[type],
        className
      )}>
        <span className="text-[10px] font-black tracking-widest text-brand-text-muted uppercase">MEMUAT IKLAN...</span>
      </div>
    );
  }

  // No ads at all — render fallback handling
  if (ads.length === 0) {
    // HOME_TOP: try to render CMS‑configured fallback ads
    if (type === 'HOME_TOP' && fallbackAds.length > 0) {
      const ad = fallbackAds[0];
      return (
        <section className="py-8 md:py-12">
          <Container>
            <div className={cn(
              "relative overflow-hidden",
              styles[type],
              className
            )}>
              {/* Media (image or video) */}
              {ad.mediaType === 'video' && ad.mediaUrl ? (
                <FallbackVideo src={ad.mediaUrl} />
              ) : ad.mediaUrl ? (
                <SmartImage
                  src={ad.mediaUrl}
                  context="hero_lead"
                  alt={ad.headline || 'Iklan'}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 970px"
                />
              ) : null}
              {/* Simple overlay with headline */}
              {ad.headline && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <h3 className="text-white text-center text-lg md:text-2xl font-black">{ad.headline}</h3>
                </div>
              )}
            </div>
          </Container>
        </section>
      );
    }

    // HOME_TOP: fallback ke Google AdSense (slot kosong → AdSense)
    if (type === 'HOME_TOP') {
      return (
        <section className="py-8 md:py-12">
          <Container>
            <AdSenseUnit slot="HOME_TOP" className={className} />
          </Container>
        </section>
      );
    }

    // In-feed style slots: Google AdSense fallback (slot kosong → AdSense)
    if (type === 'HOME_FEED_1' || type === 'HOME_FEED_2' || type === 'ARTICLE_MIDDLE' || type === 'ARTICLE_TOP' || type === 'ARTICLE_BOTTOM') {
      return <AdSenseUnit slot={type} className={className} />;
    }

    // Generic fallback for any other type
    return (
      <div
        className={cn(
          "border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-white/[0.02] text-center px-6",
          styles[type],
          className
        )}
      >
        <span className="absolute right-1.5 top-1.5 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/70">
          {label}
        </span>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-text-muted">
          Slot Iklan Tersedia
        </p>
      </div>
    );
  }

  // HOME_TOP active ad — wrap in section with balanced padding and Container
  if (type === 'HOME_TOP') {
    return (
      <section className="py-8 md:py-12">
        <Container>
          {/* Single ad — render directly (no carousel) */}
          {!isCarousel ? (
            <div
              className={cn("relative overflow-hidden", styles[type], className)}
              onMouseEnter={stopRotation}
              onMouseLeave={startRotation}
            >
              <AdSlide ad={ads[0]} label={label} onAdClick={handleAdClick} />
            </div>
          ) : (
            /* Multiple ads — carousel */
            <div
              className={cn("relative overflow-hidden", styles[type], className)}
              onMouseEnter={stopRotation}
              onMouseLeave={startRotation}
            >
              {ads.map((ad, index) => (
                <div
                  key={ad.id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-700 ease-in-out",
                    index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  )}
                >
                  <AdSlide ad={ad} label={label} onAdClick={handleAdClick} />
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    );
  }

  // Non‑HOME_TOP: render ad content directly (no sticky wrapper)
  return (
    <>
      {/* Single ad — render directly (no carousel) */}
      {!isCarousel ? (
        <div
          className={cn("relative overflow-hidden", styles[type], className)}
          onMouseEnter={stopRotation}
          onMouseLeave={startRotation}
        >
          <AdSlide ad={ads[0]} label={label} onAdClick={handleAdClick} />
        </div>
      ) : (
        /* Multiple ads — carousel */
        <div
          className={cn("relative overflow-hidden", styles[type], className)}
          onMouseEnter={stopRotation}
          onMouseLeave={startRotation}
        >
          {ads.map((ad, index) => (
            <div
              key={ad.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              <AdSlide ad={ad} label={label} onAdClick={handleAdClick} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}