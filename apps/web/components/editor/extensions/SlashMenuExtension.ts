import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import MenuList, { defaultSlashMenuItems } from '../menus/SlashMenu'

export const SlashMenuExtension = Extension.create({
  name: 'slashMenu',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        items: ({ query }: { query: string }) => {
          return defaultSlashMenuItems.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
          )
        },
        command: ({ editor, range, props }: any) => {
          // IMPORTANT: Delete the "/" query text FIRST, then run item command.
          // If command runs first it changes document structure and invalidates the range.
          editor.chain().focus().deleteRange(range).run()
          props.command(editor)
        },
        render: () => {
          let component: ReactRenderer | null = null
          let popup: TippyInstance | null = null

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(MenuList, {
                props: {
                  ...props,
                  command: (item: any) => {
                    props.command(item)
                  },
                },
                editor: props.editor,
              })

              if (!props.clientRect) {
                return
              }

              popup = tippy(document.body, {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                maxWidth: 320,
                zIndex: 9999,
                popperOptions: {
                  modifiers: [
                    { name: 'flip', options: { fallbackPlacements: ['top-start'] } },
                  ],
                },
              }) as unknown as TippyInstance
            },

            onUpdate(props: any) {
              component?.updateProps({
                ...props,
                command: (item: any) => {
                  props.command(item)
                },
              })

              if (!props.clientRect) {
                return
              }

              ;(popup as any)?.setProps?.({
                getReferenceClientRect: props.clientRect,
              })
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                ;(popup as any)?.hide?.()
                return true
              }

              return (component as any)?.ref?.onKeyDown(props) || false
            },

            onExit() {
              ;(popup as any)?.destroy?.()
              component?.destroy()
              popup = null
              component = null
            },
          }
        },
      }),
    ]
  },
})

export default SlashMenuExtension
