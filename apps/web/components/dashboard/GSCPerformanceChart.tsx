'use client'

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parse } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useMounted } from '../../hooks/useMounted'
import { EmptyChartState } from './shared/EmptyChartState'

interface GSCPerformanceData {
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  avgPosition: number
  overTime: {
    date: string
    impressions: number
    clicks: number
    ctr: number
    position: number
  }[]
}

interface GSCPerformanceChartProps {
  data: GSCPerformanceData
}

export function GSCPerformanceChart({ data }: GSCPerformanceChartProps) {
  const mounted = useMounted()

  if (!mounted || !data?.overTime || data.overTime.length === 0) {
    return <EmptyChartState message="Data GSC tidak tersedia" />
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = parse(dateStr, 'yyyy-MM-dd', new Date())
      return format(d, 'dd MMM', { locale: idLocale })
    } catch {
      return dateStr
    }
  }

  const formatTooltipDate = (dateStr: string) => {
    try {
      const d = parse(dateStr, 'yyyy-MM-dd', new Date())
      return format(d, 'EEEE, dd MMMM yyyy', { locale: idLocale })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-text-muted">Impressions</p>
          <p className="mt-1 text-xl font-black text-brand-black dark:text-white">
            {data.totalImpressions.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-text-muted">Clicks</p>
          <p className="mt-1 text-xl font-black text-brand-black dark:text-white">
            {data.totalClicks.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-text-muted">Avg. CTR</p>
          <p className="mt-1 text-xl font-black text-brand-black dark:text-white">
            {data.avgCtr}%
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-text-muted">Avg. Position</p>
          <p className="mt-1 text-xl font-black text-brand-black dark:text-white">
            {data.avgPosition}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-white/5 dark:bg-white/[0.02]">
        <h3 className="mb-4 text-sm font-bold text-brand-black dark:text-white">
          Performance Search Console
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.overTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gscImpressionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              labelFormatter={(label) => formatTooltipDate(String(label ?? ''))}
              contentStyle={{
                background: '#0f172a',
                border: 'none',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
                padding: '0.75rem 1rem',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="impressions"
              name="Impressions"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#gscImpressionGrad)"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#B91C1C"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
