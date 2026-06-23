'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parse } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface GA4TrafficData {
  date: string
  sessions: number
  pageviews: number
}

interface GA4TrafficChartProps {
  data: GA4TrafficData[]
}

export function GA4TrafficChart({ data }: GA4TrafficChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/10">
        <p className="text-sm text-brand-text-muted">Data GA4 tidak tersedia</p>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = parse(dateStr, 'yyyyMMdd', new Date())
      return format(d, 'dd MMM', { locale: idLocale })
    } catch {
      return dateStr
    }
  }

  const formatTooltipDate = (dateStr: string) => {
    try {
      const d = parse(dateStr, 'yyyyMMdd', new Date())
      return format(d, 'EEEE, dd MMMM yyyy', { locale: idLocale })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-white/5 dark:bg-white/[0.02]">
      <h3 className="mb-4 text-sm font-bold text-brand-black dark:text-white">
        Traffic Google Analytics
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="ga4SessionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B91C1C" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#B91C1C" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ga4PageviewGrad" x1="0" y1="0" x2="0" y2="1">
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
            itemStyle={{ color: '#f8fafc' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            iconType="circle"
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            name="Sessions"
            stroke="#B91C1C"
            strokeWidth={2}
            fill="url(#ga4SessionGrad)"
          />
          <Area
            type="monotone"
            dataKey="pageviews"
            name="Page Views"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#ga4PageviewGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
