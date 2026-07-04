interface InfoPasarProps {
  data: Record<string, unknown> | null
}

export function InfoPasar({ data }: InfoPasarProps) {
  if (!data) return null

  const items = [
    { label: 'IHSG', value: data.ihsg, change: data.ihsgChange },
    { label: 'USD/IDR', value: data.usdIdr, change: data.usdIdrChange },
    { label: 'Emas', value: data.gold, change: data.goldChange },
    { label: 'Minyak', value: data.oil, change: data.oilChange },
  ].filter(item => item.value != null)

  if (items.length === 0) return null

  return (
    <section className="my-8 rounded-2xl bg-brand-grey/10 px-6 py-5 dark:bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {items.map((item) => {
          const isUp = typeof item.change === 'number' ? item.change >= 0 : String(item.change).startsWith('+')
          return (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-brand-black dark:text-white">{item.label}</span>
              <span className="text-brand-text-muted">{String(item.value)}</span>
              {item.change != null && (
                <span className={isUp ? 'text-emerald-600' : 'text-red-500'}>
                  {isUp ? '▲' : '▼'} {String(item.change)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
