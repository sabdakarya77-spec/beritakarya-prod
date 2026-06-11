import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CalloutView } from './CalloutView'

export type CalloutVariant = 'info' | 'warning' | 'error' | 'success' | 'tip'

const CALLOUT_ICONS: Record<CalloutVariant, string> = {
  info: '💡',
  warning: '⚠️',
  error: '🚫',
  success: '✅',
  tip: '💬',
}

const CALLOUT_COLORS: Record<CalloutVariant, { bg: string; border: string; text: string }> = {
  info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-200' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-800 dark:text-amber-200' },
  error: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-800 dark:text-red-200' },
  success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-800 dark:text-green-200' },
  tip: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-800 dark:text-purple-200' },
}

/**
 * Custom Callout extension untuk Tiptap
 * Box notifikasi/alert dengan berbagai variant
 */
export const CalloutExtension = Node.create({
  name: 'callout',
  
  group: 'block',
  
  content: 'block+',
  
  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-variant') || 'info',
        renderHTML: attributes => ({
          'data-variant': attributes.variant,
        }),
      },
      icon: {
        default: null,
        parseHTML: element => element.getAttribute('data-icon'),
        renderHTML: attributes => {
          if (!attributes.icon) return {}
          return { 'data-icon': attributes.icon }
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) return {}
          return { 'data-title': attributes.title }
        },
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const variant = (node.attrs.variant || 'info') as CalloutVariant
    const colors = CALLOUT_COLORS[variant]
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        class: `callout-block rounded-lg border p-4 my-4 ${colors.bg} ${colors.border}`,
      }),
      [
        'div',
        { class: 'flex items-start gap-3' },
        [
          'div',
          { class: 'text-xl flex-shrink-0' },
          node.attrs.icon || CALLOUT_ICONS[variant],
        ],
        [
          'div',
          { class: 'flex-1' },
          node.attrs.title ? ['div', { class: `font-semibold mb-1 ${colors.text}` }, node.attrs.title] : null,
          ['div', { class: colors.text }, 0],
        ],
      ],
    ]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },
})

export const CALLOUT_VARIANTS: CalloutVariant[] = ['info', 'warning', 'error', 'success', 'tip']

export default CalloutExtension
