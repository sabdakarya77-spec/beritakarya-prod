import Paragraph from '@tiptap/extension-paragraph'
import type { RawCommands, Editor, SingleCommands } from '@tiptap/core'

/**
 * Custom Paragraph extension with dropCap support.
 *
 * When `dropCap` is true, the first letter of the paragraph is rendered
 * as a large decorative initial (typographic drop cap). This is a common
 * stylistic device in news/magazine articles.
 *
 * Storage compatibility:
 * - Persisted as `data-drop-cap` attribute on <p> elements
 * - Mirrored into the editor block model as `dropCap: boolean`
 */
export const DropCapParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      dropCap: {
        default: false,
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute('data-drop-cap')
          return value === 'true' || value === ''
        },
        renderHTML: (attributes) => {
          if (!attributes.dropCap) return {}
          return { 'data-drop-cap': 'true' }
        },
      },
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      toggleDropCap:
        () =>
        ({ commands, editor }: { commands: SingleCommands; editor: Editor }) => {
          if (!editor.isActive('paragraph')) return false
          return commands.updateAttributes('paragraph', {
            dropCap: !editor.getAttributes('paragraph').dropCap,
          })
        },
      setDropCap:
        (value: boolean) =>
        ({ commands }: { commands: SingleCommands }) => {
          return commands.updateAttributes('paragraph', { dropCap: value })
        },
    } as Partial<RawCommands>
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dropCap: {
      toggleDropCap: () => ReturnType
      setDropCap: (value: boolean) => ReturnType
    }
  }
}

export default DropCapParagraph
