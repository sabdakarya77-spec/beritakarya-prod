'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { SmartImage } from './SmartImage';
import { cn } from '../../lib/utils';

interface PhotoArticle {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string | null;
  category?: { name?: string | null } | null;
  categories?: Array<{ category?: { name?: string | null } | null }> | null;
  blocks?: Array<{
    type?: string;
    url?: string;
    images?: { url: string; alt?: string; caption?: string }[];
  }>;
}

function getPhotoUrl(article: PhotoArticle): string {
  if (article.featuredImage) return article.featuredImage;
  if (Array.isArray(article.blocks)) {
    const gallery = article.blocks.find((b) => b.type === 'gallery');
    if (gallery?.images?.[0]?.url) return gallery.images[0].url;
    const img = article.blocks.find((b) => b.type === 'image');
    if (img?.url) return img.url;
    const grid = article.blocks.find((b) => b.type === 'imageGrid');
    if (grid?.images?.[0]?.url) return grid.images[0].url;
  }
  return '/placeholder.jpg';
}

export default function PhotoJournalWidget({
  articles,
  site,
}: {
  articles: PhotoArticle[];
  site: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const photos = articles?.slice(0, 5) || [];

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  // Auto-rotate setiap 5 detik, berhenti saat hover
  useEffect(() => {
    if (photos.length <= 1 || isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, photos.length, nextSlide]);

  if (photos.length === 0) return null;

  const current = photos[activeIndex];
  const categoryName =
    current.categories?.[0]?.category?.name ||
    current.category?.name ||
    'Foto Jurnalistik';

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Camera size={14} className="text-brand-red" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black dark:text-white">
          Foto Jurnalistik
        </span>
      </div>

      {/* Photo — clean, tanpa overlay judul */}
      <Link
        href={`/${site}/artikel/${current.slug}`}
        className="group relative block overflow-hidden rounded-xl"
      >
        <div className="relative aspect-[3/2] w-full bg-gray-100 dark:bg-white/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <SmartImage
                src={getPhotoUrl(current)}
                alt={current.title}
                fill
                context="card"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </Link>

      {/* Judul di bawah foto — bukan overlay */}
      <div className="mt-3">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-brand-red">
          {categoryName}
        </span>
        <Link href={`/${site}/artikel/${current.slug}`}>
          <h4 className="line-clamp-2 font-sans text-xs font-bold leading-snug tracking-tight text-brand-black transition-colors hover:text-brand-red dark:text-white md:text-[13px]">
            {current.title}
          </h4>
        </Link>
      </div>

      {/* Indicator dots */}
      {photos.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === activeIndex
                  ? 'w-5 bg-brand-red'
                  : 'w-1.5 bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/40'
              )}
              aria-label={`Foto ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
