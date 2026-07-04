'use client';

import { useEffect, useState, useCallback } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    setIsVisible(scrollTop > 100);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      setProgress(Math.min(scrollTop / docHeight, 1));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-brand-red z-[60] origin-left transition-transform duration-100 ease-out"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}
