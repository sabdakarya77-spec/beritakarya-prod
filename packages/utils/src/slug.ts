export function generateSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    // Convert spaces to dashes first
    .replace(/\s+/g, '-')
    // Remove any character that is NOT: Unicode letter, number, or dash
    // \p{L} matches any Unicode letter (including é, ñ, ü, etc.)
    .replace(/[^\p{L}0-9-]/gu, '')
    // Remove duplicate dashes
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-|-$/g, '')
}

export function makeUniqueSlug(
  base: string,
  existingSlugs: string[]
): string {
  const slug = generateSlug(base)
  if (!existingSlugs.includes(slug)) return slug
  let counter = 2
  while (existingSlugs.includes(`${slug}-${counter}`)) {
    counter++
  }
  return `${slug}-${counter}`
}