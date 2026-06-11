import type { PublicSiteConfig } from '../../lib/siteSettings'
import { PublicInfoShell } from '../layout/PublicInfoShell'
import { LegalPageHeader } from './LegalPageHeader'
import { LegalDocumentBody } from './LegalDocumentBody'

export type LegalStandardPageProps = {
  siteConfig: PublicSiteConfig
  title: string
  intro: string
  content: string | null | undefined
  emptyMessage?: string
}

/**
 * Shared layout for public legal/information pages (privacy, terms, about, etc.).
 */
export function LegalStandardPage({
  siteConfig,
  title,
  intro,
  content,
  emptyMessage,
}: LegalStandardPageProps) {
  return (
    <PublicInfoShell siteConfig={siteConfig}>
      <LegalPageHeader title={title} />
      <LegalDocumentBody
        pageTitle={title}
        intro={intro}
        content={content}
        siteName={siteConfig.name}
        emptyMessage={emptyMessage}
      />
    </PublicInfoShell>
  )
}
