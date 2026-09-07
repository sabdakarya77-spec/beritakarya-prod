import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { API_URL } from '../../lib/api'
import { constructMetadata } from '../../lib/metadata'
import { SiteHomePage } from '../../components/pages/home/SiteHomePage'
import { JsonLd } from '../../components/ui/JsonLd'
import { buildOrganization, buildWebsite } from '../../lib/structuredData'
import { SITE_MAP } from '@beritakarya/config'

function formatCategoryTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params, searchParams }: { params: { site: string }; searchParams: { cat?: string; q?: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawSiteParam = resolvedParams?.site || 'pusat';
  const siteParam = rawSiteParam.toLowerCase();

  if (!/^[a-z0-9-]+$/.test(siteParam)) {
    return { title: 'Halaman Tidak Ditemukan', robots: { index: false, follow: false } };
  }

  const rawCat = resolvedSearchParams?.cat?.trim();
  const rawQuery = resolvedSearchParams?.q?.trim();
  const hasSearchQuery = Boolean(rawQuery);
  const isSavedFilter = rawCat === 'tersimpan';
  const isDefaultFeed = rawCat === 'terbaru';
  const isRealCategory = Boolean(rawCat && !isSavedFilter && !isDefaultFeed);

  let siteName = siteParam.charAt(0).toUpperCase() + siteParam.slice(1);
  let description = `Portal berita independen ${siteName} menyajikan analisis tajam, investigasi mendalam, dan informasi tepercaya dari seluruh pelosok Indonesia.`;
  let faviconUrl = '/favicon.ico';
  let ogImageUrl = '/logo.png';

  try {
    const res = await fetch(`${API_URL}/api/v1/sites/settings?site=${siteParam}`, { next: { revalidate: 60 } });
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

  let pageTitle = `${siteName} - Berita Terkini & Terpercaya`;
  let pageDescription = description;
  let pageCanonicalPath: string | undefined = undefined;
  let pageNoIndex = false;

  if (hasSearchQuery) {
    pageTitle = `Hasil Pencarian: "${rawQuery}" - ${siteName}`;
    pageNoIndex = true;
    pageCanonicalPath = `/${siteParam}`;
  } else if (isSavedFilter) {
    pageTitle = `Artikel Tersimpan - ${siteName}`;
    pageNoIndex = true;
    pageCanonicalPath = `/${siteParam}`;
  } else if (isRealCategory && rawCat) {
    const formattedCat = formatCategoryTitle(rawCat);
    pageTitle = `Berita ${formattedCat} Terkini - ${siteName}`;
    pageDescription = `Kumpulan berita ${formattedCat} terkini, investigasi, dan analisis mendalam dari ${siteName}.`;
    pageNoIndex = false;
    pageCanonicalPath = `/${siteParam}?cat=${encodeURIComponent(rawCat)}`;
  } else if (isDefaultFeed) {
    // ?cat=terbaru sama dengan homepage, konsolidasikan canonical ke homepage
    pageCanonicalPath = `/${siteParam}`;
  }

  return constructMetadata({
    title: pageTitle,
    description: pageDescription,
    image: ogImageUrl,
    icons: faviconUrl,
    siteParam,
    noIndex: pageNoIndex,
    ...(pageCanonicalPath !== undefined && { canonicalPath: pageCanonicalPath }),
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
    const res = await fetch(`${API_URL}/api/v1/sites/settings?site=${siteParam}`, { next: { revalidate: 60 } });
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

