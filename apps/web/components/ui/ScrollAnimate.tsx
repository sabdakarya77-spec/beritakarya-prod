'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ScrollAnimateProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function ScrollAnimate({ children, delay = 0, className = '' }: ScrollAnimateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
