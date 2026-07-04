import type { Metadata } from 'next'
import { SiteNotFoundClient } from './not-found-client'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function SiteNotFound() {
  return <SiteNotFoundClient />
}
