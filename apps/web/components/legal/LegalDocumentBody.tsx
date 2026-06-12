import { prepareLegalDocumentContent } from '../../lib/legalPages'
import { legalProseClassName } from './legalStyles'
import { sanitizeHtml } from '../../lib/sanitize'

type LegalDocumentBodyProps = {
  /** Page H1 — used to strip duplicate headings from CMS HTML */
  pageTitle: string
  content: string | null | undefined
  siteName: string
  /** Static intro above — stripped from CMS if repeated */
  intro?: string
  emptyMessage?: string
  eyebrow?: string
  /** Optional subheading above the body when a page needs an extra section title */
  sectionTitle?: string | null
  /** Smaller prose for nested sections (e.g. ads terms footer) */
  proseSize?: 'default' | 'compact'
}

export function LegalDocumentBody({
  pageTitle,
  content,
  siteName,
  intro,
  emptyMessage,
  eyebrow = null,
  sectionTitle = null,
  proseSize = 'default',
}: LegalDocumentBodyProps) {
  const proseClass =
    proseSize === 'compact'
      ? 'prose prose-sm md:prose-base dark:prose-invert max-w-none'
      : legalProseClassName

  const preparedHtml = prepareLegalDocumentContent(content, {
    pageTitle,
    intro,
  })

  const fallbackEmpty =
    emptyMessage ??
    `Konten belum tersedia untuk halaman ini. Silakan hubungi redaksi ${siteName} untuk informasi lebih lanjut.`

  return (
    <section className="pt-2 md:pt-3">
      <div className="max-w-4xl mx-auto">
        {(eyebrow || sectionTitle) && (
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              {eyebrow ? (
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-brand-red" aria-hidden />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-red">
                    {eyebrow}
                  </span>
                </div>
              ) : null}
              {sectionTitle ? (
                <h2 className="text-2xl md:text-3xl font-serif font-black text-brand-black dark:text-white tracking-tight">
                  {sectionTitle}
                </h2>
              ) : null}
            </div>
          </div>
        )}

        {preparedHtml ? (
          <div className={proseClass}>
            <div
              className="text-brand-text-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(preparedHtml) }}
            />
          </div>
        ) : (
          <div className="bg-brand-surface dark:bg-white/[0.02] border border-dashed border-black/5 dark:border-white/10 p-12 text-center rounded-2xl">
            <p className="text-brand-text-muted italic text-sm">{fallbackEmpty}</p>
          </div>
        )}
      </div>
    </section>
  )
}
