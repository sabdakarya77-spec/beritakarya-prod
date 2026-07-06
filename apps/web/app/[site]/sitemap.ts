import { MetadataRoute } from 'next'
import { generateSiteSitemap } from '../../lib/sitemap-shared'

export default async function sitemap({ params }: { params: { site: string } }): Promise<MetadataRoute.Sitemap> {
  const { site } = await params
  return generateSiteSitemap(site)
}
