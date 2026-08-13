import { MetadataRoute } from 'next'
import { generateSiteSitemap } from '../../lib/sitemap-shared'

export default async function sitemap(props?: { params?: Promise<{ site: string }> | { site: string } }): Promise<MetadataRoute.Sitemap> {
  const resolvedParams = props?.params ? await props.params : undefined
  const site = resolvedParams?.site || 'pusat'
  return generateSiteSitemap(site)
}
