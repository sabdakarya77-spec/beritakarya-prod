'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BackButtonProps {
  fallbackHref: string;
  label?: string;
  className?: string;
  iconSize?: number;
}

const DEFAULT_CLASS = 'inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted transition-colors hover:text-brand-red';

export default function BackButton({
  fallbackHref,
  label = 'Kembali',
  className,
  iconSize = 14,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(DEFAULT_CLASS, className)}
    >
      <ArrowLeft size={iconSize} />
      {label}
    </button>
  );
}
