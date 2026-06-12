import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content for safe rendering via dangerouslySetInnerHTML.
 * Strips all script/event-handler vectors while preserving safe formatting tags.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
      'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'figure', 'figcaption', 'img', 'picture', 'source', 'video', 'audio',
      'iframe', 'embed', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'sub', 'sup', 'mark', 'small', 'hr', 'abbr', 'cite',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      'width', 'height', 'loading', 'decoding', 'srcset', 'sizes',
      'colspan', 'rowspan', 'style', 'allow', 'allowfullscreen', 'frameborder',
      'sandbox', 'type', 'data-*',
    ],
    ALLOW_DATA_ATTR: true,
  })
}
