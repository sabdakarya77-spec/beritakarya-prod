import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EmbedView } from './EmbedView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (options: { src: string }) => ReturnType
    }
  }
}

export type EmbedType = 'youtube' | 'twitter' | 'instagram' | 'other'

/**
 * Custom Embed extension untuk Tiptap
 * Mendukung YouTube, Twitter, Instagram, dan custom embeds
 */
export const EmbedExtension = Node.create({
  name: 'embed',
  
  group: 'block',
  
  atom: true,
  
  addAttributes() {
    return {
      url: {
        default: '',
        parseHTML: element => element.getAttribute('data-url'),
        renderHTML: attributes => ({
          'data-url': attributes.url,
        }),
      },
      embedType: {
        default: 'youtube',
        parseHTML: element => element.getAttribute('data-embed-type') || 'youtube',
        renderHTML: attributes => ({
          'data-embed-type': attributes.embedType,
        }),
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) return {}
          return { 'data-title': attributes.title }
        },
      },
      html: {
        default: null,
        parseHTML: element => element.getAttribute('data-html'),
        renderHTML: attributes => {
          if (!attributes.html) return {}
          return { 'data-html': attributes.html }
        },
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-embed]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-embed': '' }),
    ]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(EmbedView)
  },

  addCommands() {
    return {
      setEmbed: (options: { src: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            url: options.src,
            embedType: detectEmbedType(options.src)
          },
        })
      },
    }
  },
})

/**
 * Detect embed type dari URL
 */
export function detectEmbedType(url: string): EmbedType {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube'
  }
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return 'twitter'
  }
  if (url.includes('instagram.com')) {
    return 'instagram'
  }
  return 'other'
}

/**
 * Extract YouTube video ID dari URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Extract tweet ID dari URL
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
  return match ? match[1] : null
}

export default EmbedExtension