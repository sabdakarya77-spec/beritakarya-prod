'use client';

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  variant?: 'hero' | 'card' | 'minimal' | 'trending' | 'text' | 'stat' | 'list';
  className?: string;
}

export default function Skeleton({ variant = 'card', className }: SkeletonProps) {
  const a11yProps = {
    role: 'status' as const,
    'aria-label': 'Memuat konten',
  };
  const shimmer = {
    initial: { x: '-100%' },
    animate: { x: '100%' },
  };

  const shimmerTransition: any = {
    duration: 2,
    repeat: Infinity,
    ease: [0.4, 0, 0.2, 1], // Cubic-bezier for smoother feel
  };

  if (variant === 'hero') {
    return (
      <div {...a11yProps} className={cn("relative h-[400px] md:h-[600px] w-full bg-gray-100 dark:bg-slate-800 overflow-hidden rounded-sm", className)}>
        <motion.div
          initial="initial"
          animate="animate"
          variants={shimmer}
          transition={shimmerTransition}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
        />
        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-4xl">
          <div className="h-6 w-24 bg-gray-200 dark:bg-slate-700 mb-6" />
          <div className="h-12 w-full bg-gray-200 dark:bg-slate-700 mb-4" />
          <div className="h-12 w-2/3 bg-gray-200 dark:bg-slate-700 mb-8" />
          <div className="flex gap-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div {...a11yProps} className={cn("py-4 border-b border-gray-100 dark:border-white/10 last:border-0 relative overflow-hidden", className)}>
        <motion.div
          initial="initial"
          animate="animate"
          variants={shimmer}
          transition={shimmerTransition}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5"
        />
        <div className="h-3 w-16 bg-gray-100 dark:bg-slate-700 mb-2 rounded" />
        <div className="h-5 w-full bg-gray-100 dark:bg-slate-700 mb-2 rounded" />
        <div className="h-5 w-3/4 bg-gray-100 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div {...a11yProps} className={cn("relative overflow-hidden bg-gray-100 dark:bg-slate-800 rounded-sm", className)}>
        <motion.div
          initial="initial"
          animate="animate"
          variants={shimmer}
          transition={shimmerTransition}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
        />
      </div>
    );
  }

  return (
      <div {...a11yProps} className={cn("flex flex-col gap-4 relative overflow-hidden", className)}>
        <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-sm" />
        <motion.div
          initial="initial"
          animate="animate"
          variants={shimmer}
          transition={shimmerTransition}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none dark:via-white/10"
        />
        <div className="flex flex-col gap-2 p-1">
          <div className="h-3 w-20 bg-gray-100 dark:bg-slate-700 rounded" />
          <div className="h-6 w-full bg-gray-100 dark:bg-slate-700 rounded" />
          <div className="h-6 w-3/4 bg-gray-100 dark:bg-slate-700 rounded" />
        </div>
      </div>
  );
}
