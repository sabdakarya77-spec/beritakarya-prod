export function formatDate(
  date: Date | string,
  optionsOrLocale?: string | Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  let locale = 'id-ID'
  let options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  if (typeof optionsOrLocale === 'string') {
    locale = optionsOrLocale
  } else if (optionsOrLocale) {
    options = { ...options, ...optionsOrLocale }
  }
  return d.toLocaleDateString(locale, options)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return formatDate(d)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}