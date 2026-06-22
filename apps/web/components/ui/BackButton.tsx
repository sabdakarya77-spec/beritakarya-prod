'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackHref: string;
  label?: string;
}

export default function BackButton({ fallbackHref, label = 'Kembali' }: BackButtonProps) {
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
      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted transition-colors hover:text-brand-red"
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  );
}
