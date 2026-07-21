/**
 * EmptyChartState — komponen UI reusable untuk menampilkan pesan
 * ketika data chart kosong atau belum ter-mount.
 *
 * Dipakai oleh: GA4TrafficChart, GSCPerformanceChart, TrafficChart.
 */

interface EmptyChartStateProps {
  message?: string
  heightClass?: string
}

export function EmptyChartState({
  message = 'Data tidak tersedia',
  heightClass = 'h-[300px]',
}: EmptyChartStateProps) {
  return (
    <div
      className={`flex ${heightClass} items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/10`}
    >
      <p className="text-sm text-brand-text-muted">{message}</p>
    </div>
  )
}
