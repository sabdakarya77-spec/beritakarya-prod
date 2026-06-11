'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ScrollResetInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, searchKey]);

  return null;
}

function ScrollResetStatic() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    window.addEventListener('pageshow', resetScroll);
    window.addEventListener('popstate', resetScroll);

    return () => {
      window.removeEventListener('pageshow', resetScroll);
      window.removeEventListener('popstate', resetScroll);
    };
  }, []);

  return null;
}

export default function ScrollReset() {
  return (
    <>
      <ScrollResetStatic />
      <Suspense fallback={null}>
        <ScrollResetInner />
      </Suspense>
    </>
  );
}
