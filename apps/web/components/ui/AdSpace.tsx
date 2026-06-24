'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { cn } from '../../lib/utils';
import { API_URL } from '../../lib/api';
import BillboardShowcase from './BillboardShowcase';

interface AdSpaceProps {
  type: 'leaderboard' | 'rectangle' | 'rectangle_secondary' | 'in-feed';
  slot?: 'leaderboard' | 'rectangle' | 'rectangle_secondary' | 'in_feed';
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
  const isVideoFile = (url: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.toLowerCase().includes('video');
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
        <span className="absolute left-2 top-2 z-10 rounded-sm bg-brand-red px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg sm:left-3 sm:text-[10px] sm:tracking-[0.2em]">
          {label}
        </span>
        {isVideo ? (
          <video src={effectiveUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : _type === 'leaderboard' && (ad.imageUrlMobile || ad.imageUrlTablet || ad.imageUrlMobileAlt || ad.imageUrlTabletAlt) ? (
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
            _type === 'leaderboard' && ad.animationEffect && ANIM_CLASS_MAP[ad.animationEffect]
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
  label = "Advertisement",
  className = ""
}: AdSpaceProps) {
  const params = useParams();
  const site = params?.site as string | undefined;
  const [ads, setAds] = useState<AdItem[]>([]);
  // Fallback ads fetched from CMS when no ads are configured for the slot
  const [fallbackAds, setFallbackAds] = useState<any[]>([]);
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
  const slotName = slot || (type === 'in-feed' ? 'in_feed' : type);

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
          const matched = json.data
            .filter((a: AdItem) => a.slot === slotName)
            .sort((a: AdItem, b: AdItem) => a.order - b.order);
          setAds(matched);
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

  // Carousel: auto-rotate every 7s (only if multiple ads)
  const isCarousel = ads.length > 1;

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
    }, 7000);
  }, [isCarousel, ads.length, stopRotation]);

  useEffect(() => {
    startRotation();
    return stopRotation;
  }, [startRotation, stopRotation]);

  // Fetch CMS fallback ads when there are no ads for the slot (only for leaderboard)
  useEffect(() => {
    if (loading) return;
    if (ads.length === 0 && type === 'leaderboard') {
      const fetchFallback = async () => {
        try {
          const res = await fetch(`${API_URL}/api/v1/ads/fallback?slot=leaderboard`);
          if (!res.ok) return;
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setFallbackAds(json.data);
          }
        } catch (e) {
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

  // Show close button after 5s for sticky leaderboard
  useEffect(() => {
    if (type !== 'leaderboard' || ads.length === 0 || isStickyClosed) return;
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

  const styles = {
    // Multi-size IAB: mobile 320×50, tablet 728×90, desktop 970×250
    leaderboard: "w-full h-[50px] min-h-[50px] sm:h-[90px] sm:min-h-[90px] md:h-[250px] md:min-h-[250px] mb-6",
    rectangle: "w-full h-[250px] min-h-[250px] mb-8",
    rectangle_secondary: "w-full h-[250px] min-h-[250px] mb-8",
    'in-feed': "w-full h-40 min-h-[160px] mb-12"
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
    // Leaderboard: try to render CMS‑configured fallback ads
    if (type === 'leaderboard' && fallbackAds.length > 0) {
      const ad = fallbackAds[0];
      return (
        <div className={cn(
          "relative w-full h-[50px] min-h-[50px] sm:h-[90px] sm:min-h-[90px] md:h-[250px] md:min-h-[250px] overflow-hidden rounded-xl",
          className
        )}>
          {/* Media (image or video) */}
          {ad.mediaType === 'video' && ad.mediaUrl ? (
            <video src={ad.mediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
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

    // Default static fallback for leaderboard when no CMS data
    if (type === 'leaderboard') {
      return <BillboardShowcase site={site || 'pusat'} className={className} />;
    }

    // Other slots: keep existing placeholder
    return (
      <div
        className={cn(
          "border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-white/[0.02] text-center px-6",
          styles[type],
          className
        )}
      >
        <span className="absolute left-2 top-2 z-10 rounded-sm bg-brand-red px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg sm:left-3 sm:text-[10px] sm:tracking-[0.2em]">
          {label}
        </span>
        <div className="flex flex-col items-center justify-center gap-2 pt-7 sm:gap-3 sm:pt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-text-muted sm:text-[10px] sm:tracking-[0.24em]">
            Slot Iklan Mandiri
          </p>
          <div className="space-y-1">
            <h4 className="text-[13px] font-black text-brand-black dark:text-white tracking-tight sm:text-sm md:text-lg">
              Ruang promosi tersedia
            </h4>
            <p className="mx-auto max-w-[17rem] text-[10px] leading-5 text-brand-text-muted sm:max-w-sm md:text-xs">
              Slot ini disiapkan untuk banner atau script iklan mandiri dari dashboard ads.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sticky + close button wrapper for leaderboard on mobile
  const isSticky = type === 'leaderboard' && ads.length > 0 && !isStickyClosed;
  const stickyClasses = isSticky ? 'md:relative fixed bottom-0 left-0 right-0 z-30 md:z-auto' : '';
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

  // Wrap with sticky container for mobile leaderboard
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
