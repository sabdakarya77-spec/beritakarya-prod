export type LegalAlignment = 'left' | 'center' | 'right' | 'justify'

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

export function plainTextToLegalHtml(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function stripEditorWrapper(value: string) {
  const match = value.match(/^\s*<div[^>]*align="(left|center|right|justify)"[^>]*>([\s\S]*)<\/div>\s*$/i)
  if (!match) {
    return { align: 'left' as LegalAlignment, html: value }
  }

  return {
    align: match[1].toLowerCase() as LegalAlignment,
    html: match[2],
  }
}

/**
 * Parse konten legal dari format penyimpanan ke HTML editor.
 * Backward-compat: jika data lama menggunakan wrapper <div align="center">,
 * alignment akan dimigrasi ke tiap elemen blok (per-paragraf).
 */
export function parseLegalContent(value: string) {
  if (!value) {
    return { html: '' }
  }

  const stripped = stripEditorWrapper(value)
  let normalizedHtml = looksLikeHtml(stripped.html)
    ? stripped.html
    : plainTextToLegalHtml(stripped.html)

  // Migrasi data lama: jika wrapper punya alignment non-left,
  // terapkan ke setiap elemen blok yang belum punya alignment eksplisit
  if (stripped.align !== 'left') {
    const temp = document.createElement('div')
    temp.innerHTML = normalizedHtml
    temp.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, ul, ol, li').forEach((el) => {
      const htmlEl = el as HTMLElement
      if (!htmlEl.style.textAlign) {
        htmlEl.style.textAlign = stripped.align
      }
    })
    normalizedHtml = temp.innerHTML
  }

  return { html: normalizedHtml }
}

/**
 * Serialize HTML editor ke format penyimpanan.
 * Alignment per-paragraf sudah embedded di dalam HTML masing-masing elemen.
 */
export function serializeLegalContent(html: string) {
  const normalized = html
    .replace(/<div><br><\/div>/gi, '')
    .replace(/<p><br><\/p>/gi, '')
    .trim()

  const plainText = normalized
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()

  if (!plainText) return ''

  // Wrapper netral agar kompatibel dengan parser yang mengharapkan <div align="...">
  return `<div align="left">${normalized}</div>`
}
