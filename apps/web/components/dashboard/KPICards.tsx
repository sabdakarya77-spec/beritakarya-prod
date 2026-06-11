'use client';

import { motion } from 'framer-motion';
import { 
  FileText, CheckCircle, AlertCircle, Calendar, 
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Mini Sparkline ──────────────────────────────────────────────
function Sparkline({ values, color = '#B91C1C' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - (v / max) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: string | number;
  sub?: string;
  trend?: number; 
  icon: React.ElementType;
  accent: string;
  sparkData?: number[];
  delay?: number;
}

function KPICard({ title, value, sub, trend, icon: Icon, accent, sparkData, delay = 0 }: KPICardProps) {
  const isUp = trend !== undefined && trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative h-full"
    >
      <div className={cn(
        "absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500",
        accent.includes('blue') ? 'bg-blue-500' : 
        accent.includes('emerald') ? 'bg-emerald-500' : 
        accent.includes('red') ? 'bg-red-500' : 'bg-brand-red'
      )} />
      
      <div className="relative dash-card p-5 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent -mr-16 -mt-16 rounded-full" />
        
        <div className="flex items-start justify-between mb-4 relative z-10 shrink-0">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-inner', accent)}>
            <Icon size={18} />
          </div>
          {trend !== undefined && (
            <span className={cn(
              'flex items-center gap-0.5 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md',
              isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                   : 'bg-red-500/10 text-red-600 dark:text-red-400'
            )}>
              {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        
        <div className="relative z-10 flex flex-col flex-1">
          <p className="dash-label mb-1 opacity-60">{title}</p>
          <p className="text-3xl font-black text-brand-black dark:text-white tabular-nums tracking-tighter">
            {value}
          </p>
          <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-100/50 dark:border-white/5 min-h-8">
            {sub && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{sub}</p>}
            {sparkData && <Sparkline values={sparkData} color={isUp ? '#10B981' : '#EF4444'} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface KPICardsProps {
  stats: {
    total: number;
    published: number;
    inReview: number;
    scheduled: number;
  };
  trafficSpark: number[];
  publishedSpark: number[];
}

export function KPICards({ stats, trafficSpark, publishedSpark }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard 
        title="Total Post" 
        value={stats.total} 
        icon={FileText}
        accent="bg-blue-50 text-blue-500 dark:bg-blue-900/20"
        sparkData={trafficSpark} 
        sub="Semua status" 
        delay={0} 
      />
      <KPICard 
        title="Sudah Terbit" 
        value={stats.published} 
        icon={CheckCircle}
        accent="bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20"
        sparkData={publishedSpark} 
        sub="Terbit publik" 
        delay={0.05} 
      />
      <KPICard 
        title="Antrian Review" 
        value={stats.inReview} 
        icon={AlertCircle}
        accent={stats.inReview > 5 ? "bg-red-50 text-red-500 dark:bg-red-900/20" : "bg-amber-50 text-amber-500 dark:bg-amber-900/20"}
        sub={stats.inReview > 0 ? "Perlu perhatian" : "Semua bersih"} 
        delay={0.1} 
      />
      <KPICard 
        title="Terjadwal" 
        value={stats.scheduled} 
        icon={Calendar}
        accent="bg-cyan-50 text-cyan-500 dark:bg-cyan-900/20"
        sub="Antri terbit" 
        delay={0.15} 
      />
    </div>
  );
}
