import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { API_URL } from '../../lib/api'
import { constructMetadata } from '../../lib/metadata'
import { SiteHomePage } from '../../components/pages/home/SiteHomePage'
import { JsonLd } from '../../components/ui/JsonLd'
import { buildOrganization, buildWebsite } from '../../lib/structuredData'
import { SITE_MAP } from '@beritakarya/config'

export async function generateMetadata({ params, searchParams }: { params: { site: string }; searchParams: { cat?: string; q?: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawSiteParam = resolvedParams?.site || 'pusat';
  const siteParam = rawSiteParam.toLowerCase();

  if (!/^[a-z0-9-]+$/.test(siteParam)) {
    return { title: 'Halaman Tidak Ditemukan', robots: { index: false, follow: false } };
  }

  const hasCategoryFilter = Boolean(resolvedSearchParams?.cat);
  const hasSearchQuery = Boolean(resolvedSearchParams?.q);
  const shouldNoIndex = hasCategoryFilter || hasSearchQuery;

  let siteName = siteParam.charAt(0).toUpperCase() + siteParam.slice(1);
  let description = `Portal berita independen ${siteName} menyajikan analisis tajam, investigasi mendalam, dan informasi tepercaya dari seluruh pelosok Indonesia.`;
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
    title: hasSearchQuery
      ? `Hasil Pencarian: "${resolvedSearchParams.q}" - ${siteName}`
      : `${siteName} - Berita Terkini & Terpercaya`,
    description,
    image: ogImageUrl,
    icons: faviconUrl,
    siteParam,
    noIndex: shouldNoIndex,
    // Saat filter ?cat= atau pencarian ?q= aktif, arahkan canonical ke URL induk tanpa query string.
    // Ini mencegah duplikasi dan melarang Google mengindeks URL query pencarian internal.
    ...(shouldNoIndex && { canonicalPath: siteParam === 'pusat' ? '/' : `/${siteParam}` }),
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
  const rawSiteParam = resolvedParams?.site || 'pusat';
  const siteParam = rawSiteParam.toLowerCase();

  if (!/^[a-z0-9-]+$/.test(siteParam)) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;

  let siteName = siteParam.charAt(0).toUpperCase() + siteParam.slice(1);
  let socialLinks: Record<string, string | null | undefined> = {};
  let siteFound = false;

  try {
    const res = await fetch(`${API_URL}/api/v1/sites/settings?site=${siteParam}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        siteFound = true;
        siteName = json.data.name || siteName;
        socialLinks = json.data.socialLinks || {};
      }
    }
  } catch {}

  if (!siteFound && siteParam !== 'pusat' && !SITE_MAP[siteParam]) {
    notFound();
  }

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

