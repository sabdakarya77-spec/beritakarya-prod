'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import FadeInOnScroll from './FadeInOnScroll';

/* ─────────────────────────────────────────────
   AnimateGrid — staggered entrance animation
   untuk card grids dan list items.

   Menggunakan FadeInOnScroll dengan delay terincrement
   agar muncul satu per satu saat scroll.
   ───────────────────────────────────────────── */

interface AnimateGridProps {
  children: ReactNode;
  className?: string;
  /** Delay awal sebelum item pertama muncul (ms) */
  baseDelay?: number;
  /** Increment delay per item (ms) */
  stagger?: number;
  /** Maksimal item yang dianimasikan (sisanya tanpa delay) */
  maxAnimated?: number;
}

/**
 * AnimateGrid — wrapper untuk card grids dengan staggered fade-in.
 *
 * Setiap child akan muncul dengan delay bertambah secara bertahap.
 * Mendukung prefers-reduced-motion (via FadeInOnScroll).
 *
 * @param baseDelay - Delay awal (default: 0ms)
 * @param stagger - Increment per item (default: 80ms)
 * @param maxAnimated - Maksimal item dianimasikan (default: 12)
 *
 * @example
 * <AnimateGrid stagger={100}>
 *   <Grid cols={3}>
 *     {articles.map(a => <NewsCard key={a.id} article={a} />)}
 *   </Grid>
 * </AnimateGrid>
 */
export default function AnimateGrid({
  children,
  className,
  baseDelay = 0,
  stagger = 80,
  maxAnimated = 12,
}: AnimateGridProps) {
  // Jika children adalah array, wrap setiap item dengan FadeInOnScroll
  if (Array.isArray(children)) {
    return (
      <div className={cn('contents', className)}>
        {children.map((child, index) => (
          <FadeInOnScroll
            key={index}
            delay={index < maxAnimated ? baseDelay + index * stagger : 0}
          >
            {child}
          </FadeInOnScroll>
        ))}
      </div>
    );
  }

  // Single child — wrap langsung
  return (
    <FadeInOnScroll delay={baseDelay} className={className}>
      {children}
    </FadeInOnScroll>
  );
}

/* ─────────────────────────────────────────────
   AnimateItem — single item entrance wrapper
   Untuk item individual di luar grid context.
   ───────────────────────────────────────────── */

interface AnimateItemProps {
  children: ReactNode;
  className?: string;
  /** Delay sebelum muncul (ms) */
  delay?: number;
}

/**
 * AnimateItem — single item fade-in wrapper.
 *
 * @example
 * <AnimateItem delay={200}>
 *   <HeroSection />
 * </AnimateItem>
 */
export function AnimateItem({ children, className, delay = 0 }: AnimateItemProps) {
  return (
    <FadeInOnScroll delay={delay} className={className}>
      {children}
    </FadeInOnScroll>
  );
}
