'use client'

import { Users, Globe, Clock, MousePointerClick } from 'lucide-react'

interface GA4AudienceData {
  totalUsers: number
  totalSessions: number
  avgSessionDuration: number
  bounceRate: number
  realtimeUsers?: number
}

interface GA4AudienceCardsProps {
  data: GA4AudienceData
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function GA4AudienceCards({ data }: GA4AudienceCardsProps) {
  const cards = [
    {
      label: 'Pengunjung Aktif',
      value: data.realtimeUsers ?? 0,
      icon: Users,
      accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Total Sessions',
      value: data.totalSessions.toLocaleString('id-ID'),
      icon: Globe,
      accent: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Avg. Durasi',
      value: formatDuration(data.avgSessionDuration),
      icon: Clock,
      accent: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
    },
    {
      label: 'Bounce Rate',
      value: `${data.bounceRate}%`,
      icon: MousePointerClick,
      accent: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-100 bg-white p-4 dark:border-white/5 dark:bg-white/[0.02]"
        >
          <div className={`mb-3 inline-flex rounded-lg p-2 ${card.accent}`}>
            <card.icon size={16} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-text-muted">
            {card.label}
          </p>
          <p className="mt-1 text-xl font-black text-brand-black dark:text-white">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
