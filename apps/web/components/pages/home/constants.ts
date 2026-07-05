// Shared CSS class constants for homepage sections
// NOTE: sectionEyebrowClass dan sectionTitleClass sudah diganti oleh Typography components
// (SectionEyebrow, SectionTitle) di components/ui/Typography.tsx

export const sectionMetaClass = 'text-[10px] font-semibold text-brand-text-muted'

export function formatSidebarDate(dateValue?: string | Date) {
  if (!dateValue) return ''
  return new Date(dateValue).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}
