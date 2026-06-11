'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';

interface CategoryBarProps {
  name: string;
  value: number;
  max: number;
}

function CategoryBar({ name, value, max }: CategoryBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-gray-400">{name}</span>
        <span className="text-brand-red">{value} post</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-brand-red to-red-400 rounded-full"
        />
      </div>
    </div>
  );
}

interface CategoryPerformanceProps {
  catEntries: [string, number][];
  catMax: number;
}

export function CategoryPerformance({ catEntries, catMax }: CategoryPerformanceProps) {
  return (
    <div className="dash-card bg-slate-900 dark:bg-black/50 text-white border-0">
      <div className="dash-card-header border-white/5">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-brand-red" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Performa Rubrik</h3>
        </div>
        <TrendingUp size={14} className="text-brand-red" />
      </div>
      <div className="p-6 space-y-5">
        {catEntries.length > 0 ? (
          catEntries.map(([name, count]) => (
            <CategoryBar key={name} name={name} value={count} max={catMax} />
          ))
        ) : (
          <p className="text-xs text-gray-500 text-center py-4">Belum ada data kategori</p>
        )}
      </div>
    </div>
  );
}
