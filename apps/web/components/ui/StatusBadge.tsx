'use client';

import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft:     { label: 'Draft',       bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500' },
  submitted: { label: 'Dikirim',     bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' },
  review:    { label: 'Review',      bg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  revision:  { label: 'Revisi',      bg: 'bg-orange-50 dark:bg-orange-900/20',  text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  approved:  { label: 'Disetujui',   bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  scheduled: { label: 'Terjadwal',   bg: 'bg-cyan-50 dark:bg-cyan-900/20',      text: 'text-cyan-700 dark:text-cyan-400',     dot: 'bg-cyan-500' },
  published: { label: 'Terbit',      bg: 'bg-green-50 dark:bg-green-900/20',    text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500' },
  archived:  { label: 'Arsip',       bg: 'bg-gray-50 dark:bg-gray-900/20',      text: 'text-gray-600 dark:text-brand-text-muted',     dot: 'bg-gray-500' },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || STATUS_MAP.draft;

  return (
    <span className={cn(
      'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent shadow-sm transition-all',
      config.bg,
      config.text,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full ring-2 ring-white/20', config.dot)} />
      {config.label}
    </span>
  );
}
