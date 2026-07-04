// Shared CSS class constants for homepage sections
export const sectionEyebrowClass = 'text-[10px] font-black uppercase tracking-[0.16em]'
export const sectionEyebrowMutedClass = `${sectionEyebrowClass} text-brand-text-muted`
export const sectionMetaClass = 'text-[10px] font-semibold text-brand-text-muted'
export const sectionTitleClass = 'text-base md:text-xl font-sans font-extrabold tracking-tight text-brand-black dark:text-white'

export function formatSidebarDate(dateValue?: string | Date) {
  if (!dateValue) return ''
  return new Date(dateValue).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}
