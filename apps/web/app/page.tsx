import { SiteHomePage } from '../components/pages/SiteHomePage'
import type { Metadata } from 'next'
import { constructMetadata } from '../lib/metadata'

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: 'BeritaKarya — Portal Berita Terpercaya',
    description: 'BeritaKarya pusat: informasi terkini dari seluruh Nusantara tanpa perlu menambahkan /pusat di URL.',
    siteParam: '',
    canonicalPath: '/pusat',
  })
}

export default async function RootPage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string }
}) {
  return <SiteHomePage siteParam="pusat" searchParams={searchParams} />
}
