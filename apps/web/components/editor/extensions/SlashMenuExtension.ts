import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import MenuList, { defaultSlashMenuItems, type SlashMenuItem, type SlashMenuRef, type SlashMenuProps } from '../menus/SlashMenu'

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
        command: ({ editor, range, props }: { editor: import('@tiptap/core').Editor; range: import('@tiptap/core').Range; props: SlashMenuItem }) => {
          // IMPORTANT: Delete the "/" query text FIRST, then run item command.
          // If command runs first it changes document structure and invalidates the range.
          editor.chain().focus().deleteRange(range).run()
          props.command(editor)
        },
        render: () => {
          let component: ReactRenderer<SlashMenuRef, SlashMenuProps> | null = null
          let popup: TippyInstance | null = null

          return {
            onStart: (props: SuggestionProps<SlashMenuItem, SlashMenuItem>) => {
              component = new ReactRenderer(MenuList, {
                props: {
                  ...props,
                  command: (item: SlashMenuItem) => {
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

            onUpdate(props: SuggestionProps<SlashMenuItem, SlashMenuItem>) {
              component?.updateProps({
                ...props,
                command: (item: SlashMenuItem) => {
                  props.command(item)
                },
              })

              if (!props.clientRect) {
                return
              }

              popup?.setProps({
                getReferenceClientRect: () => props.clientRect?.() as DOMRect,
              })
            },

            onKeyDown(props: SuggestionKeyDownProps) {
              if (props.event.key === 'Escape') {
                popup?.hide()
                return true
              }

              return component?.ref?.onKeyDown(props) || false
            },

            onExit() {
              popup?.destroy()
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
