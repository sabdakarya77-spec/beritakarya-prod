'use client';

import { cn } from '../../lib/utils';

type BadgeVariant = 'breaking' | 'exclusive' | 'analysis' | 'live' | 'photo' | 'video' | 'featured' | 'opinion';

interface EditorialBadgeProps {
  variant: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<BadgeVariant, { label: string; classes: string; pulse?: boolean; icon?: string }> = {
  breaking:  { label: 'BREAKING',   classes: 'bg-red-600 text-white',            pulse: true,  icon: '⚡' },
  exclusive: { label: 'EKSKLUSIF',  classes: 'bg-violet-700 text-white',          pulse: false, icon: '★' },
  analysis:  { label: 'ANALISIS',   classes: 'bg-sky-700 text-white',             pulse: false, icon: '◈' },
  live:      { label: 'LIVE',       classes: 'bg-emerald-600 text-white',         pulse: true,  icon: '●' },
  photo:     { label: 'FOTO',       classes: 'bg-amber-500 text-white',           pulse: false, icon: '◉' },
  video:     { label: 'VIDEO',      classes: 'bg-brand-black text-white',         pulse: false, icon: '▶' },
  featured:  { label: 'PILIHAN',    classes: 'bg-orange-500 text-white',          pulse: false, icon: '◆' },
  opinion:   { label: 'OPINI',      classes: 'bg-slate-600 text-white',           pulse: false, icon: '✍' },
};

export default function EditorialBadge({ variant, className, size = 'sm' }: EditorialBadgeProps) {
  const config = BADGE_CONFIG[variant];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-black uppercase tracking-widest',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        config.classes,
        className
      )}
    >
      {config.pulse && (
        <span className="relative flex h-1.5 w-1.5 mr-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
      )}
      {config.icon && !config.pulse && (
        <span className="text-[9px] opacity-80">{config.icon}</span>
      )}
      {config.label}
    </span>
  );
}

/** Helper: resolve badge variant dari data artikel */
export function resolveArticleBadge(article: {
  isBreaking?: boolean;
  isExclusive?: boolean;
  isFeatured?: boolean;
  status?: string;
}): BadgeVariant | null {
  if (article.isBreaking) return 'breaking';
  if (article.isExclusive) return 'exclusive';
  if (article.isFeatured) return 'featured';
  if (article.status === 'live') return 'live';
  return null;
}
