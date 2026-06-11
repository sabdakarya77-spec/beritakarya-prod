/**
 * Stub file - akan diimplementasi nanti
 */
import type { Block } from '@beritakarya/types'

export function getActiveBlock(blocks: Block[], activeBlockId: string | null): Block | null {
  return blocks.find((block) => block.id === activeBlockId) ?? null
}

export function getTextBlocks(blocks: Block[]): Block[] {
  return blocks.filter((block) => 
    block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote'
  )
}

export function getNonTextBlocks(blocks: Block[]): Block[] {
  return blocks.filter((block) => 
    block.type !== 'paragraph' && block.type !== 'heading' && block.type !== 'quote'
  )
}

export function isDocumentEmpty(blocks: Block[]): boolean {
  return blocks.every((block) => {
    if ('content' in block && typeof block.content === 'string') {
      return !block.content.trim()
    }
    if ('items' in block && Array.isArray((block as any).items)) {
      return !(block as any).items.some((item: string) => item.trim())
    }
    if ('url' in block && typeof block.url === 'string') {
      return !block.url.trim()
    }
    return false
  })
}
