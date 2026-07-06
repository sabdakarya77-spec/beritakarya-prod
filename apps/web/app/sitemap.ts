import { MetadataRoute } from 'next'
import { generateSiteSitemap } from '../lib/sitemap-shared'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSiteSitemap('pusat')
}
