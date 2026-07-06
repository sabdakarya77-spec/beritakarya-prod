/**
 * AdZone — wrapper untuk ad slots di homepage.
 * Konsisten di semua layout template.
 */

import AdSpace from '../../ui/AdSpace'

interface AdZoneProps {
  type: 'HOME_TOP' | 'HOME_FEED_1' | 'HOME_FEED_2'
  initialAds?: unknown[]
  className?: string
}

export function AdZone({ type, initialAds, className }: AdZoneProps) {
  return (
    <div className={className}>
      <AdSpace type={type} initialAds={initialAds as never} />
    </div>
  )
}
