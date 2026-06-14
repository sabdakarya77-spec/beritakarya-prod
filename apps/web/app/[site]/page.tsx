import { SITE_MAP } from '@beritakarya/config'
import { Metadata } from 'next'
import { API_URL } from '../../lib/api'
import { notFound } from 'next/navigation'
import { constructMetadata } from '../../lib/metadata'
import { SiteHomePage } from '../../components/pages/SiteHomePage'
import { JsonLd } from '../../components/ui/JsonLd'
import { buildOrganization, buildWebsite } from '../../lib/structuredData'

export async function generateMetadata({ params }: { params: { site: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  
  let siteName = siteParam.charAt(0).toUpperCase() + siteParam.slice(1);
  let description = `Portal berita resmi ${siteName}. Menyajikan informasi terbaru, investigasi, dan analisis tajam dari seluruh Nusantara.`;
  let faviconUrl = '/favicon.ico';
  let ogImageUrl = '/logo.png';
  
  try {
    const res = await fetch(`${API_URL}/api/v1/sites/settings?site=${siteParam}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        siteName = json.data.name || siteName;
        description = json.data.description || description;
        if (json.data.faviconUrl) faviconUrl = json.data.faviconUrl;
        if (json.data.ogImageUrl) ogImageUrl = json.data.ogImageUrl;
      }
    }
  } catch (e) {
    console.error('Error fetching metadata settings:', e);
  }

  return constructMetadata({
    title: `${siteName} - Berita Terkini & Terpercaya`,
    description,
    image: ogImageUrl,
    icons: faviconUrl,
    siteParam
  })
}

export default async function SitePage({
  params,
  searchParams,
}: {
  params: { site: string }
  searchParams: { cat?: string; q?: string }
}) {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const resolvedSearchParams = await searchParams;

  let siteName = siteParam.charAt(0).toUpperCase() + siteParam.slice(1);
  let socialLinks: Record<string, string | null | undefined> = {};
  try {
    const res = await fetch(`${API_URL}/api/v1/sites/settings?site=${siteParam}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        siteName = json.data.name || siteName;
        socialLinks = json.data.socialLinks || {};
      }
    }
  } catch {}

  return (
    <>
      <JsonLd
        id="ld-site-organization"
        data={buildOrganization({ name: siteName, socialLinks, siteParam })}
      />
      <JsonLd
        id="ld-site-website"
        data={buildWebsite({ siteParam, siteName })}
      />
      <SiteHomePage siteParam={siteParam} searchParams={resolvedSearchParams} />
    </>
  )
}

