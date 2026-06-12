'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { cn } from '../../lib/utils';

interface AdSpaceProps {
  type: 'leaderboard' | 'rectangle' | 'in-feed';
  slot?: 'leaderboard' | 'rectangle' | 'rectangle_secondary' | 'in_feed';
  label?: string;
  className?: string;
}

interface AdItem {
  id: string;
  slot: string;
  code: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order: number;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/v1/ads/public?site=${siteParam}`);
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

  // Track impression for current ad
  useEffect(() => {
    const ad = ads[currentIndex];
    if (!ad || trackedRef.current.has(ad.id)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;

        trackedRef.current.add(ad.id);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        fetch(`${apiUrl}/api/v1/ads/track/${ad.id}?action=impression`, {
          method: 'POST'
        }).catch(() => {});
        observer.disconnect();
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [ads, currentIndex]);

  const handleAdClick = (ad: AdItem) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/api/v1/ads/track/${ad.id}?action=click`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  };

  const styles = {
    leaderboard: "w-full h-24 md:h-[250px] mb-6",
    rectangle: "w-full h-[250px] mb-8",
    'in-feed': "w-full h-40 mb-12"
  };

  const isVideoFile = (url: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.toLowerCase().includes('video');
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

  // No ads at all — fallback placeholder
  if (ads.length === 0) {
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

  // Single ad — render directly (no carousel)
  if (!isCarousel) {
    return (
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden", styles[type], className)}
        onMouseEnter={stopRotation}
        onMouseLeave={startRotation}
      >
        <AdSlide ad={ads[0]} type={type} label={label} onAdClick={handleAdClick} />
      </div>
    );
  }

  // Multiple ads — carousel
  return (
    <div
      ref={containerRef}
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
          <AdSlide ad={ad} type={type} label={label} onAdClick={handleAdClick} />
        </div>
      ))}
    </div>
  );
}

// ─── Ad Slide Sub-Component ───────────────────────────────────────────────

function AdSlide({
  ad,
  type,
  label,
  onAdClick
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

  // Script ad — render in sandboxed iframe for XSS isolation
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

  // Image/video banner
  if (ad.imageUrl) {
    const isVideo = isVideoFile(ad.imageUrl);
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
          <video
            src={ad.imageUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <img
            src={ad.imageUrl}
            alt={label}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </a>
    );
  }

  // Empty ad (no code, no image)
  return null;
}
