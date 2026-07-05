import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/* ─────────────────────────────────────────────
   Typography primitives — sesuai design-system.md
   Semua component mendukung className override
   ───────────────────────────────────────────── */

interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Section title — judul section di homepage / halaman publik.
 * Default: `text-base md:text-xl font-extrabold tracking-tight`
 */
export function SectionTitle({ children, className, as: Tag = 'h2' }: TypographyProps) {
  return (
    <Tag className={cn('font-sans text-base font-extrabold leading-tight tracking-tight text-brand-black dark:text-white md:text-xl', className)}>
      {children}
    </Tag>
  );
}

/**
 * Section eyebrow — label kecil di atas section title.
 * Default: `text-[10px] font-black uppercase tracking-[0.16em]`
 */
export function SectionEyebrow({ children, className, as: Tag = 'span' }: TypographyProps) {
  return (
    <Tag className={cn('text-[10px] font-black uppercase tracking-[0.16em] text-brand-text-muted', className)}>
      {children}
    </Tag>
  );
}

/**
 * Badge label — label kecil untuk badge / tag.
 * Default: `text-[10px] font-black uppercase tracking-widest`
 */
export function BadgeLabel({ children, className, as: Tag = 'span' }: TypographyProps) {
  return (
    <Tag className={cn('text-[10px] font-black uppercase tracking-widest', className)}>
      {children}
    </Tag>
  );
}

/**
 * Dashboard label — label kecil di dashboard cards.
 * Default: `text-[10px] font-black uppercase tracking-[0.2em]`
 */
export function DashLabel({ children, className, as: Tag = 'span' }: TypographyProps) {
  return (
    <Tag className={cn('text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-muted', className)}>
      {children}
    </Tag>
  );
}

/**
 * Dashboard value — angka besar di dashboard cards.
 * Default: `text-3xl font-black tabular-nums`
 */
export function DashValue({ children, className, as: Tag = 'span' }: TypographyProps) {
  return (
    <Tag className={cn('text-3xl font-black tabular-nums text-brand-black dark:text-white', className)}>
      {children}
    </Tag>
  );
}

/**
 * Card title — judul card di feed / grid.
 * Default: `text-sm md:text-base font-extrabold tracking-tight`
 */
export function CardTitle({ children, className, as: Tag = 'h3' }: TypographyProps) {
  return (
    <Tag className={cn('font-sans text-sm font-extrabold leading-[1.2] tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-base', className)}>
      {children}
    </Tag>
  );
}

/**
 * Card meta — info kecil di card (author, date, read time).
 * Default: `text-[11px] font-medium text-brand-text-muted`
 */
export function CardMeta({ children, className, as: Tag = 'span' }: TypographyProps) {
  return (
    <Tag className={cn('text-[11px] font-medium text-brand-text-muted', className)}>
      {children}
    </Tag>
  );
}

/**
 * Nav link label — label navigasi.
 * Default: `text-[10px] font-bold tracking-[0.12em]`
 */
export function NavLink({ children, className, as: Tag = 'span' }: TypographyProps) {
  return (
    <Tag className={cn('text-[10px] font-bold tracking-[0.12em] uppercase', className)}>
      {children}
    </Tag>
  );
}
