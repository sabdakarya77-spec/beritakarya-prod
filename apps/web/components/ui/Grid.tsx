import { cn } from '@/lib/utils';
import type { ReactNode, CSSProperties } from 'react';

/* ─────────────────────────────────────────────
   Grid & Stack layout primitives — sesuai design-system.md

   Gap tokens:
   - regular: 24px (gap-6)
   - wide:    48px (gap-12)
   - wider:   80px (gap-20)
   ───────────────────────────────────────────── */

type GapSize = 'regular' | 'wide' | 'wider' | 'tight';

interface GridProps {
  children: ReactNode;
  className?: string;
  /** Jumlah kolom responsif. Bisa angka atau object per breakpoint. */
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  /** Jarak antar item */
  gap?: GapSize;
  /** Apakah item harus sama tinggi */
  align?: 'start' | 'center' | 'end' | 'stretch';
}

const GAP_CLASSES: Record<GapSize, string> = {
  tight: 'gap-3',
  regular: 'gap-6',
  wide: 'gap-12',
  wider: 'gap-20',
};

function resolveCols(cols: GridProps['cols']): string {
  if (typeof cols === 'number') {
    const map: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    };
    return map[cols] || `grid-cols-${cols}`;
  }

  if (typeof cols === 'object') {
    const classes: string[] = [];
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    return cn('grid-cols-1', ...classes);
  }

  return 'grid-cols-1';
}

/**
 * Grid — responsive grid layout.
 *
 * @param cols - Jumlah kolom. Bisa angka (auto-responsive) atau object per breakpoint.
 * @param gap - Jarak antar item: 'tight' (12px) | 'regular' (24px) | 'wide' (48px) | 'wider' (80px)
 * @param align - CSS align-items
 *
 * @example
 * // 3 kolom responsif, gap regular
 * <Grid cols={3} gap="regular">
 *   <Card /><Card /><Card />
 * </Grid>
 *
 * @example
 * // Custom breakpoints
 * <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap="wide">
 *   {items.map(item => <Card key={item.id} />)}
 * </Grid>
 */
export function Grid({ children, className, cols = 3, gap = 'regular', align = 'stretch' }: GridProps) {
  const alignMap: Record<string, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={cn(
        'grid',
        resolveCols(cols),
        GAP_CLASSES[gap],
        alignMap[align],
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stack — vertical / horizontal layout helper
   ───────────────────────────────────────────── */

interface StackProps {
  children: ReactNode;
  className?: string;
  /** Arah layout */
  direction?: 'vertical' | 'horizontal';
  /** Jarak antar item */
  gap?: GapSize;
  /** CSS align-items */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** CSS justify-content */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Wrap items */
  wrap?: boolean;
}

const JUSTIFY_CLASSES: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const ALIGN_CLASSES: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

/**
 * Stack — vertical atau horizontal layout helper.
 *
 * @param direction - 'vertical' (default) atau 'horizontal'
 * @param gap - Jarak antar item: 'tight' | 'regular' | 'wide' | 'wider'
 * @param align - CSS align-items
 * @param justify - CSS justify-content
 * @param wrap - Wrap items ke baris baru
 *
 * @example
 * // Vertical stack, gap regular
 * <Stack gap="regular">
 *   <Heading />
 *   <Content />
 *   <Footer />
 * </Stack>
 *
 * @example
 * // Horizontal center
 * <Stack direction="horizontal" gap="tight" align="center" justify="between">
 *   <Left />
 *   <Right />
 * </Stack>
 */
export function Stack({
  children,
  className,
  direction = 'vertical',
  gap = 'regular',
  align = 'stretch',
  justify = 'start',
  wrap = false,
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        GAP_CLASSES[gap],
        ALIGN_CLASSES[align],
        JUSTIFY_CLASSES[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Spacer — flexible space between items
   ───────────────────────────────────────────── */

interface SpacerProps {
  className?: string;
  /** Ukuran tetap. Tanpa size = flex-1 (auto-fill) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SPACER_CLASSES: Record<string, string> = {
  xs: 'h-2 w-2',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
  xl: 'h-16 w-16',
};

/**
 * Spacer — flexible space antara items dalam Stack.
 * Tanpa `size`, menjadi flex-1 (mengisi sisa ruang).
 *
 * @example
 * <Stack direction="horizontal">
 *   <Logo />
 *   <Spacer />
 *   <Nav />
 * </Stack>
 */
export function Spacer({ className, size }: SpacerProps) {
  if (size) {
    return <div className={cn(SPACER_CLASSES[size], className)} />;
  }
  return <div className={cn('flex-1', className)} />;
}
