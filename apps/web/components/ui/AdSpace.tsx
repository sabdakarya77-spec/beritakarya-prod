'use client';

import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';
import { useParams } from 'next/navigation';
import { cn } from '../../lib/utils';
import { Volume2, VolumeX } from 'lucide-react';
import { API_URL } from '../../lib/api';
import type { AdSlotId } from '../../lib/constants';
import BillboardShowcase from './BillboardShowcase';
import InFeedShowcase from './InFeedShowcase';

interface AdSpaceProps {
  type: AdSlotId;
  slot?: AdSlotId;
  label?: string;
  className?: string;
}

interface AdItem {
  id: string;
  slot: string;
  code: string | null;
  imageUrl: string | null;
  imageUrlTablet?: string | null;
  imageUrlMobile?: string | null;
  // Multi‑size IAB alternative URLs
  imageUrlTabletAlt?: string | null;
  imageUrlMobileAlt?: string | null;
  // A/B testing URLs
  variantAUrl?: string | null;
  variantBUrl?: string | null;
  winnerVariant?: string | null;
  linkUrl: string | null;
  animationEffect?: string | null;
  isActive: boolean;
  order: number;
}

interface FallbackAd {
  mediaType?: string;
  mediaUrl?: string;
  headline?: string;
  [key: string]: unknown;
}

// Mapping of animation effect keys to CSS class names (defined in globals.css)
const ANIM_CLASS_MAP: Record<string, string> = {
  ken_burns: 'ad-ken-burns',
  fade_slide: 'ad-fade-slide',
  parallax: 'ad-parallax',
  pulse_scale: 'ad-pulse-scale',
};

/**
 * Sub‑component rendering a single ad slide.
 * Handles script ads, image/video, multi‑size IAB sources, and simple A/B testing.
 */
function AdSlide({
  ad,
  type: _type,
  label,
  onAdClick,
}: {
  ad: AdItem;
  type: string;
  label: string;
  onAdClick: (ad: AdItem) => void;
}) {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideoFile = (url: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.toLowerCase().includes('video');
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  // A/B testing – use winner if set, otherwise persist a random pick per ad ID
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  useEffect(() => {
    if (ad.winnerVariant) {
      setSelectedVariant(ad.winnerVariant);
    } else if (ad.variantAUrl && ad.variantBUrl) {
      const storageKey = `ad-ab-${ad.id}`;
      const stored = sessionStorage.getItem(storageKey);
      if (stored === 'A' || stored === 'B') {
        setSelectedVariant(stored);
      } else {
        const pick: string = Math.random() < 0.5 ? 'A' : 'B';
        sessionStorage.setItem(storageKey, pick);
        setSelectedVariant(pick);
      }
    }
  }, [ad.id, ad.winnerVariant, ad.variantAUrl, ad.variantBUrl]);

  // Resolve the URL to use (variant or primary image)
  const resolveUrl = () => {
    if (selectedVariant === 'A' && ad.variantAUrl) return ad.variantAUrl;
    if (selectedVariant === 'B' && ad.variantBUrl) return ad.variantBUrl;
    return ad.imageUrl;
  };

  // Script ad – sandboxed iframe
  if (ad.code) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-transparent">
        <iframe
          srcDoc={`<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;}</style></head><body>${ad.code}</body></html>`}
          sandbox="allow-scripts allow-popups"
          className="w-full h-full border-0"
          title={label}
          scrolling="no"
        />
      </div>
    );
  }

  const effectiveUrl = resolveUrl();
  if (effectiveUrl) {
    const isVideo = isVideoFile(effectiveUrl);
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
        {isVideo ? (
          <>
            <video ref={videoRef} src={effectiveUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={toggleMute}
              className="absolute bottom-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </>
        ) : (ad.imageUrlMobile || ad.imageUrlTablet || ad.imageUrlMobileAlt || ad.imageUrlTabletAlt) ? (
          (() => {
            // Pick responsive sources: use alt variants when A/B selected 'B', otherwise primary
            const useAlt = selectedVariant === 'B';
            const mobileSrc = useAlt ? (ad.imageUrlMobileAlt || ad.imageUrlMobile) : ad.imageUrlMobile;
            const tabletSrc = useAlt ? (ad.imageUrlTabletAlt || ad.imageUrlTablet) : ad.imageUrlTablet;
            return (
              <picture>
                {mobileSrc && <source media="(max-width: 639px)" srcSet={mobileSrc} />}
                {tabletSrc && <source media="(max-width: 767px)" srcSet={tabletSrc} />}
                <img src={effectiveUrl} alt={label} className={cn(
                  "w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105",
                  ad.animationEffect && ANIM_CLASS_MAP[ad.animationEffect]
                )} />
              </picture>
            );
          })()
        ) : (
          <img src={effectiveUrl} alt={label} className={cn(
            "w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105",
            ad.animationEffect && ANIM_CLASS_MAP[ad.animationEffect]
          )} />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </a>
    );
  }
  return null;
}

export default function AdSpace({
  type,
  slot,
  label = "Ad",
  className = ""
}: AdSpaceProps) {
  const params = useParams();
  const site = params?.site as string | undefined;
  const [ads, setAds] = useState<AdItem[]>([]);
  // Fallback ads fetched from CMS when no ads are configured for the slot
  const [fallbackAds, setFallbackAds] = useState<FallbackAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const [isStickyClosed, setIsStickyClosed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(`ad-sticky-closed-${type}`) === '1';
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackedRef = useRef<Set<string>>(new Set());

  // Allow UI to reuse the same visual format while targeting a different backend slot.
  const slotName = slot || type;

  // Fetch ads
  useEffect(() => {
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
  }, [site, slotName]);

  // Carousel: auto-rotate (only if multiple ads)
  // HOME_TOP (video): 12 detik (video kita produksi, durasi 10-15 detik)
  // Slot banner lainnya: 7 detik
  const isCarousel = ads.length > 1;
  const CAROUSEL_INTERVAL = type === 'HOME_TOP' ? 12000 : 7000;

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
    // Since the ad element is always in view when its slide is active, we can record the impression directly.
    trackedRef.current.add(ad.id);
    fetch(`${API_URL}/api/v1/ads/track/${ad.id}?action=impression`, {
      method: 'POST'
    }).catch(() => {});
  }, [ads, currentIndex]);

  // Show close button after 5s for sticky HOME_TOP
  useEffect(() => {
    if (type !== 'HOME_TOP' || ads.length === 0 || isStickyClosed) return;
    const timer = setTimeout(() => setShowCloseBtn(true), 5000);
    return () => clearTimeout(timer);
  }, [type, ads.length, isStickyClosed]);

  const handleStickyClose = () => {
    setIsStickyClosed(true);
    sessionStorage.setItem(`ad-sticky-closed-${type}`, '1');
  };

  const handleAdClick = (ad: AdItem) => {
    const url = `${API_URL}/api/v1/ads/track/${ad.id}?action=click`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  };

  const styles: Record<AdSlotId, string> = {
    HOME_TOP:       "w-full h-[90px] min-h-[90px] md:h-[182px] md:min-h-[182px] lg:h-[240px] lg:min-h-[240px] mb-6",
    HOME_FEED_1:    "w-full max-w-[360px] aspect-[3/2] mx-auto rounded-lg overflow-hidden mb-8",
    HOME_FEED_2:    "w-full max-w-[360px] aspect-[2/1] mx-auto rounded-lg overflow-hidden mb-8",
    ARTICLE_TOP:    "w-full max-w-[360px] aspect-[3/2] mx-auto rounded-lg overflow-hidden mb-8",
    ARTICLE_MIDDLE: "w-full max-w-[360px] aspect-[2/1] mx-auto rounded-lg overflow-hidden mb-12",
    ARTICLE_BOTTOM: "w-full max-w-[360px] aspect-[2/1] mx-auto rounded-lg overflow-hidden mb-6",
  };

  // Loading state
  if (loading) {
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
        <div className={cn(
          "relative w-full h-[90px] min-h-[90px] md:h-[182px] md:min-h-[182px] lg:h-[240px] lg:min-h-[240px] overflow-hidden rounded-xl",
          className
        )}>
          {/* Media (image or video) */}
          {ad.mediaType === 'video' && ad.mediaUrl ? (
            <video src={ad.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : ad.mediaUrl ? (
            <img src={ad.mediaUrl} alt={ad.headline || 'Iklan'} className="w-full h-full object-cover" />
          ) : null}
          {/* Simple overlay with headline */}
          {ad.headline && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <h3 className="text-white text-center text-lg md:text-2xl font-black">{ad.headline}</h3>
            </div>
          )}
        </div>
      );
    }

    // Default static fallback for HOME_TOP when no CMS data
    if (type === 'HOME_TOP') {
      return <BillboardShowcase site={site || 'pusat'} className={className} />;
    }

    // In-feed style slots: native content-style showcase
    if (type === 'HOME_FEED_1' || type === 'HOME_FEED_2' || type === 'ARTICLE_MIDDLE' || type === 'ARTICLE_TOP' || type === 'ARTICLE_BOTTOM') {
      return <InFeedShowcase site={site || 'pusat'} className={className} slot={type} />;
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

  // Sticky + close button wrapper for HOME_TOP on mobile
  const isSticky = type === 'HOME_TOP' && ads.length > 0 && !isStickyClosed;
  const stickyClasses = isSticky ? 'md:relative fixed bottom-[72px] left-0 right-0 z-30 md:z-auto' : '';
  const stickyBg = isSticky ? 'bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:border-0 md:shadow-none md:bg-transparent' : '';

  const adContent = (
    <>
      {/* Single ad — render directly (no carousel) */}
      {!isCarousel ? (
        <div
          ref={containerRef}
          className={cn("relative overflow-hidden", styles[type], isSticky && 'mb-0', className)}
          onMouseEnter={stopRotation}
          onMouseLeave={startRotation}
        >
          <AdSlide ad={ads[0]} type={type} label={label} onAdClick={handleAdClick} />
        </div>
      ) : (
        /* Multiple ads — carousel */
        <div
          ref={containerRef}
          className={cn("relative overflow-hidden", styles[type], isSticky && 'mb-0', className)}
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
              <AdSlide ad={ad} type={type} label={label} onAdClick={handleAdClick} />
            </div>
          ))}
        </div>
      )}
    </>
  );

  // Wrap with sticky container for mobile HOME_TOP
  if (isSticky) {
    return (
      <div className={cn(stickyClasses, stickyBg)}>
        <div className="relative">
          {adContent}
          {/* Close button — appears after 5s */}
          {showCloseBtn && (
            <button
              type="button"
              onClick={handleStickyClose}
              className="absolute top-1 right-1 z-20 md:hidden w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              aria-label="Tutup iklan"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }
  // Non‑sticky rendering
  return adContent;
}
