'use client';

import Link from 'next/link';
import { Mail, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ROLE_LABELS } from '../../lib/constants';

interface AuthorCardProps {
  author: {
    id: string;
    name: string;
    role?: string;
    email?: string;
    articleCount?: number;
    avatarUrl?: string;
  };
  site: string;
  variant?: 'inline' | 'card';
  className?: string;
}



export default function AuthorCard({ author, site, variant = 'card', className }: AuthorCardProps) {
  const initials = author.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-white text-[11px] font-semibold">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-brand-black dark:text-white truncate">{author.name}</span>
          <span className="text-[10px] text-brand-text-muted font-medium">
            {ROLE_LABELS[author.role || 'reporter'] || author.role}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('dash-card p-6', className)}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-white text-lg font-black font-serif flex-shrink-0 shadow-lg shadow-brand-red/20">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">{author.name}</h4>
          <p className="text-[10px] font-semibold text-brand-red tracking-wide mt-0.5">
            {ROLE_LABELS[author.role || 'reporter'] || author.role}
          </p>
          {author.email && (
            <p className="text-[11px] text-brand-text-muted mt-2 flex items-center gap-1">
              <Mail size={10} /> {author.email}
            </p>
          )}
          {typeof author.articleCount === 'number' && (
            <p className="text-[11px] text-brand-text-muted mt-1 flex items-center gap-1">
              <FileText size={10} /> {author.articleCount} post ditulis
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
        <Link
          href={`/${site}/dashboard/users`}
          className="text-[10px] font-semibold tracking-wide text-brand-red hover:underline"
        >
          Lihat Profil →
        </Link>
      </div>
    </div>
  );
}