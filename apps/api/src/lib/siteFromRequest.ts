import { Request } from 'express'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - workspace package import issues
import { getSiteFromHostname, KNOWN_SITE_IDS } from '@beritakarya/config'

const ROOT_DOMAINS = ['beritakarya.co', 'beritakarya.com', 'www.beritakarya.co', 'www.beritakarya.com']
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1']
const VIRTUAL_SITE_IDS = ['pusat', 'all']

function isKnownSiteId(site: string | undefined | null): site is string {
  return !!site && (KNOWN_SITE_IDS as readonly string[]).includes(site)
}

function extractSiteIdFromUrl(urlOrHost: string): string | null {
  if (!urlOrHost) return null

  let host = urlOrHost.replace(/^https?:\/\//, '')
  host = host.split('/')[0]

  const site = getSiteFromHostname(host)
  if (site) return site.id

  const hostnameOnly = host.split(':')[0]

  if (LOCAL_HOSTNAMES.includes(hostnameOnly)) {
    return 'pusat'
  }

  if (ROOT_DOMAINS.includes(hostnameOnly)) {
    return 'pusat'
  }

  return null
}

export function extractSiteIdFromRequest(req: Request): string | null {
  if (typeof req.query.site === 'string' && isKnownSiteId(req.query.site)) {
    return req.query.site
  }

  const headerSite = req.headers['x-site-id']
  if (typeof headerSite === 'string' && isKnownSiteId(headerSite)) {
    return headerSite
  }

  const candidates = [req.headers.origin, req.headers.referer, req.headers.host].filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  )

  for (const candidate of candidates) {
    const site = extractSiteIdFromUrl(candidate)
    if (site) return site
  }

  return null
}

export function isVirtualSiteId(site: string | null | undefined): boolean {
  return !!site && VIRTUAL_SITE_IDS.includes(site)
}
