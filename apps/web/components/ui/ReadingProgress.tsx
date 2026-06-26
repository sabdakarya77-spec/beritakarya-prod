'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/useReducedMotion';

export default function ReadingProgress() {
  const shouldReduceMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: shouldReduceMotion ? 1000 : 100,
    damping: shouldReduceMotion ? 100 : 30,
    restDelta: 0.001
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-brand-red z-[60] origin-left"
      style={{ scaleX }}
    />
  );
}
