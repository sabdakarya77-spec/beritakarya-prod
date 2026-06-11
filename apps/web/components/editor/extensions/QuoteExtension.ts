import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { QuoteView } from './QuoteView'

/**
 * Custom Quote extension untuk Tiptap
 * Mendukung attribution/citation
 */
export const QuoteExtension = Node.create({
  name: 'quote',
  
  group: 'block',
  
  content: 'block+',
  
  defining: true,
  
  addAttributes() {
    return {
      attribution: {
        default: null,
        parseHTML: element => element.getAttribute('data-attribution'),
        renderHTML: attributes => {
          if (!attributes.attribution) return {}
          return { 'data-attribution': attributes.attribution }
        },
      },
      variant: {
        default: 'default',
        parseHTML: element => element.getAttribute('data-variant') || 'default',
        renderHTML: attributes => ({
          'data-variant': attributes.variant,
        }),
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'blockquote[data-quote]',
        getAttrs: (dom) => ({
          attribution: (dom as HTMLElement).getAttribute('data-attribution'),
          variant: (dom as HTMLElement).getAttribute('data-variant') || 'default',
        }),
      },
      {
        tag: 'blockquote',
        getAttrs: (dom) => {
          const element = dom as HTMLElement
          // Only match if it has our custom attributes or specific styling
          if (element.querySelector('cite') || element.classList.contains('pull-quote')) {
            return { attribution: element.querySelector('cite')?.textContent || null }
          }
          return false
        },
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'blockquote',
      mergeAttributes(HTMLAttributes, { 'data-quote': '', class: 'quote-block' }),
      0,
    ]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(QuoteView)
  },
})

export default QuoteExtension