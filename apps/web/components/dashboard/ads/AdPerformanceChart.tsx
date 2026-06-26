'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../../../lib/utils';

interface DataPoint {
  date: string;
  value: number;
}

interface AdStats {
  impressions: DataPoint[];
  clicks: DataPoint[];
  total: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
}

interface AdPerformanceChartProps {
  stats: AdStats;
  bookingName?: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-black dark:bg-slate-900 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-2">
        {label ? format(parseISO(label), 'EEEE, dd MMM yyyy', { locale: id }) : label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs font-bold">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-400">{entry.dataKey === 'impressions' ? 'Impresi' : 'Klik'}:</span>
          <span className="text-white">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function AdPerformanceChart({ stats, bookingName }: AdPerformanceChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !stats || !stats.impressions || stats.impressions.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest font-bold">
        Belum ada data performa
      </div>
    );
  }

  // Merge impressions + clicks into single array for Recharts
  const mergedData = stats.impressions.map((imp, i) => ({
    date: imp.date,
    impressions: imp.value,
    clicks: stats.clicks[i]?.value ?? 0,
  }));

  return (
    <div className="space-y-4">
      {/* Header with totals */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {bookingName && (
            <span className="text-[10px] font-black text-brand-black dark:text-white uppercase tracking-widest">
              {bookingName}
            </span>
          )}
          <div className="flex items-center gap-4 text-[9px] font-mono text-gray-400">
            <span>Impresi: <strong className="text-blue-500">{stats.total.impressions.toLocaleString()}</strong></span>
            <span>Klik: <strong className="text-emerald-500">{stats.total.clicks.toLocaleString()}</strong></span>
            <span>CTR: <strong className={cn(
              "font-bold",
              stats.total.ctr >= 2 ? "text-emerald-500" : stats.total.ctr >= 1 ? "text-amber-500" : "text-gray-400"
            )}>{stats.total.ctr.toFixed(2)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart
            data={mergedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
              className="dark:stroke-white/5"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              tickFormatter={(str) => {
                try {
                  return format(parseISO(str), 'dd MMM', { locale: id });
                } catch {
                  return str;
                }
              }}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={32}
              formatter={(value) => (
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  {value === 'impressions' ? 'Impresi' : 'Klik'}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="impressions"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorImpressions)"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClicks)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
