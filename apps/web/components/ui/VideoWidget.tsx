'use client';

import { Play, Tv } from 'lucide-react';
import { SmartImage } from './SmartImage';
import { motion } from 'framer-motion';

interface VideoWidgetProps {
  title: string;
  thumbnail: string;
  duration?: string;
  isLive?: boolean;
}

export default function VideoWidget({ 
  title = "Laporan Eksklusif: Dinamika Politik Nasional Menuju 2029", 
  thumbnail = "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800",
  duration = "05:24",
  isLive = false 
}: VideoWidgetProps) {
  return (
    <div className="group rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02] p-5 shadow-sm">
      <div className="flex items-center mb-4 border-b border-gray-100 dark:border-white/5 pb-3">
        <h4 className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-black dark:text-white flex items-center gap-2">
          <Tv size={14} className="text-brand-red" />
          BeritaKarya TV
        </h4>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-xl bg-brand-black">
        <SmartImage 
          src={thumbnail} 
          alt={title} 
          fill
          context="card"
          className="object-cover opacity-80 group-hover:scale-[1.03] transition-all duration-500"
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center shadow-lg shadow-brand-red/25 relative z-10"
          >
            <Play size={18} className="text-white fill-white ml-0.5" />
          </motion.div>
        </div>

        <div className="absolute bottom-3 left-3 flex gap-2">
          {isLive ? (
            <span className="bg-red-600 text-white text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-sm flex items-center gap-1">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
              Live
            </span>
          ) : (
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">
              {duration}
            </span>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>

      <h5 className="mt-4 font-serif text-lg font-black leading-snug text-brand-black dark:text-white group-hover:text-brand-red transition-colors line-clamp-2 tracking-tight">
        {title}
      </h5>
      
      <div className="mt-3 flex items-center gap-2">
        <div className="w-6 h-0.5 bg-brand-red" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">Tonton Sekarang</span>
      </div>
    </div>
  );
}
